import { emit, on } from './event-bus.js';
import { getActiveIdentity } from './auth.js';

const STORAGE_KEY = 'strive::state.v1';
const CHANNEL_KEY = 'strive::state.channel';

let state = readState();
let broadcastChannel = null;
let initialised = false;

function readState() {
  if (typeof localStorage === 'undefined') {
    return createDefaultState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createDefaultState();
    }
    parsed.settings = { ...createDefaultState().settings, ...(parsed.settings || {}) };
    parsed.users = parsed.users || {};
    return parsed;
  } catch (error) {
    console.warn('[storage] failed to parse state', error);
    return createDefaultState();
  }
}

function createDefaultState() {
  return {
    version: 1,
    settings: {
      motionPreference: 'full',
      smoothScroll: true,
      viewTransitions: true
    },
    users: {}
  };
}

function createDefaultUserState() {
  return {
    narakaTweaks: {
      lastCategory: 'gpu',
      selections: [],
      presets: {},
      lastExportAt: null
    },
    planner: {
      events: [],
      squads: [],
      notes: '',
      lastSharedHash: null
    },
    tournaments: {},
    csvMappings: {}
  };
}

function ensureBroadcast() {
  if (broadcastChannel || typeof BroadcastChannel === 'undefined') return;
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_KEY);
    broadcastChannel.addEventListener('message', (event) => {
      if (!event || !event.data) return;
      if (event.data.type === 'state:update' && typeof event.data.payload !== 'undefined') {
        state = event.data.payload;
        emit('storage:state', clone(state));
      }
      if (event.data.type === 'user:update' && event.data.userId) {
        emit('storage:user', { userId: event.data.userId, state: clone(getUserState(event.data.userId)) });
      }
    });
  } catch (error) {
    console.warn('[storage] broadcast channel unavailable', error);
  }
}

function persistState() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  ensureBroadcast();
  try {
    broadcastChannel?.postMessage({ type: 'state:update', payload: clone(state) });
  } catch (error) {
    console.warn('[storage] broadcast failed', error);
  }
  emit('storage:state', clone(state));
}

function ensureUser(userId) {
  if (!state.users[userId]) {
    state.users[userId] = createDefaultUserState();
  } else {
    const defaults = createDefaultUserState();
    state.users[userId] = {
      ...defaults,
      ...state.users[userId],
      narakaTweaks: { ...defaults.narakaTweaks, ...(state.users[userId].narakaTweaks || {}) },
      planner: { ...defaults.planner, ...(state.users[userId].planner || {}) },
      tournaments: { ...(state.users[userId].tournaments || {}) },
      csvMappings: { ...(state.users[userId].csvMappings || {}) }
    };
  }
  return state.users[userId];
}

function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function ensureListeners() {
  if (initialised) return;
  initialised = true;
  ensureBroadcast();
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = readState();
    emit('storage:state', clone(state));
  });
}

export function getSettings() {
  ensureListeners();
  return { ...state.settings };
}

export function updateSettings(partial) {
  ensureListeners();
  state.settings = { ...state.settings, ...partial };
  persistState();
  emit('storage:settings', { ...state.settings });
}

export function onSettingsChanged(callback) {
  ensureListeners();
  callback({ ...state.settings });
  return on('storage:settings', callback);
}

export function getUserState(userId = getActiveIdentity()) {
  ensureListeners();
  return clone(ensureUser(userId));
}

export function updateUserState(updater, userId = getActiveIdentity()) {
  ensureListeners();
  const current = ensureUser(userId);
  const next = updater(clone(current)) || current;
  state.users[userId] = next;
  persistState();
  ensureBroadcast();
  try {
    broadcastChannel?.postMessage({ type: 'user:update', userId });
  } catch (error) {
    console.warn('[storage] broadcast user update failed', error);
  }
  emit('storage:user', { userId, state: clone(next) });
  return clone(next);
}

export function withUserSection(section, updater, userId = getActiveIdentity()) {
  return updateUserState((current) => {
    const next = { ...current };
    const sectionValue = clone(current[section]);
    const updatedSection = updater(sectionValue, current) || sectionValue;
    next[section] = updatedSection;
    return next;
  }, userId);
}

export function subscribeUser(callback, userId = getActiveIdentity()) {
  ensureListeners();
  callback({ userId, state: getUserState(userId) });
  return on('storage:user', (payload) => {
    if (payload.userId === userId) {
      callback({ userId, state: clone(payload.state) });
    }
  });
}

export function exportUserState(userId = getActiveIdentity()) {
  return JSON.stringify(getUserState(userId), null, 2);
}

export function importUserState(raw, userId = getActiveIdentity()) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid data');
    }
    updateUserState(() => ({ ...createDefaultUserState(), ...parsed }), userId);
  } catch (error) {
    throw new Error(`Failed to import data: ${error.message}`);
  }
}

ensureListeners();
