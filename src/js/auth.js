import { emit, on } from './event-bus.js';

const SESSION_KEY = 'strive::session.v1';
let session = readSession();
let initialised = false;

function readSession() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      discordId: parsed.discordId || null,
      username: parsed.username || null,
      avatar: parsed.avatar || null,
      isMock: Boolean(parsed.isMock)
    };
  } catch (error) {
    console.warn('[auth] failed to read session', error);
    return null;
  }
}

function persistSession(nextSession) {
  session = nextSession;
  if (typeof localStorage !== 'undefined') {
    if (nextSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }
  emit('auth:changed', session);
}

function ensureListeners() {
  if (initialised) return;
  initialised = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== SESSION_KEY) return;
    session = readSession();
    emit('auth:changed', session);
  });
}

export function getSession() {
  ensureListeners();
  return session;
}

export function onSessionChanged(callback) {
  ensureListeners();
  callback(session);
  return on('auth:changed', callback);
}

export function mockLogin({ discordId, username, avatar } = {}) {
  const trimmedId = (discordId || '').toString().trim();
  const trimmedUsername = (username || '').toString().trim();
  const payload = {
    discordId: trimmedId || null,
    username: trimmedUsername || (trimmedId ? `discord:${trimmedId}` : 'Local Guest'),
    avatar: (avatar || '').toString().trim() || null,
    isMock: true
  };
  persistSession(payload);
  return payload;
}

export function logout() {
  persistSession(null);
}

export function getActiveIdentity() {
  const current = getSession();
  if (current?.discordId) {
    return `discord:${current.discordId}`;
  }
  return 'local';
}

export function describeCurrentUser() {
  const current = getSession();
  if (!current) {
    return 'Guest';
  }
  if (current.username) return current.username;
  if (current.discordId) return `discord:${current.discordId}`;
  return 'Guest';
}

ensureListeners();
