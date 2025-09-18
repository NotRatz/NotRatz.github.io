import { initSiteChrome } from '../assets/js/site.js';
import { getSession, onSessionChanged } from '../assets/js/auth.js';
import {
  listTournaments,
  upsertTournament,
  createTournamentTemplate,
  removeTournament,
  subscribe
} from './js/db.js';
import { computeStandings } from './js/compute.js';

const STORAGE_EVENT_KEY = 'strive.scoring.v1';

const elements = {};
let defaultEmptyMessage = '';
let currentSession = null;
let tournaments = [];
let unsubscribeStore = null;
let unsubscribeSession = null;
let toastTimer = null;
let highlightSlug = null;
let lastAutoSlug = '';
let slugManuallyEdited = false;

function cacheElements() {
  elements.list = document.getElementById('tournamentList');
  elements.empty = document.querySelector('[data-empty]');
  if (elements.empty) {
    defaultEmptyMessage = elements.empty.textContent ? elements.empty.textContent.trim() : '';
  }
  elements.createForm = document.querySelector('[data-create-form]');
  elements.createSlug = document.querySelector('[data-create-slug]');
  elements.createName = document.querySelector('[data-create-name]');
  elements.sessionStatus = document.querySelector('[data-session-status]');
  elements.sessionOwner = document.querySelector('[data-session-owner]');
}

function bindEvents() {
  elements.createForm?.addEventListener('submit', handleCreateTournament);
  elements.createName?.addEventListener('input', handleNameInput);
  elements.createSlug?.addEventListener('input', handleSlugInput);
  elements.list?.addEventListener('click', handleCardAction);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const ESCAPE_LOOKUP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (char) => ESCAPE_LOOKUP[char]);
}

function normaliseOwnerId(ownerId) {
  if (!ownerId || typeof ownerId !== 'string') return 'local';
  const trimmed = ownerId.trim();
  return trimmed.length ? trimmed : 'local';
}

function getActiveOwnerId() {
  if (currentSession?.discordId) {
    return `discord:${currentSession.discordId}`;
  }
  return 'local';
}

function describeOwner(tournament) {
  const ownerId = normaliseOwnerId(tournament.ownerId);
  const active = getActiveOwnerId();
  if (ownerId === 'local') {
    return active === 'local' ? 'You (Guest)' : 'Guest storage';
  }
  if (ownerId === active) {
    if (currentSession?.username) {
      return `${currentSession.username} (You)`;
    }
    if (currentSession?.discordId) {
      return `discord:${currentSession.discordId} (You)`;
    }
    return 'You';
  }
  if (ownerId.startsWith('discord:')) {
    return ownerId;
  }
  return ownerId || 'Unknown';
}

function formatDateValue(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return 'Not saved';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not saved';
  return date.toLocaleString();
}

function getRoundProgress(tournament) {
  const rounds = Array.isArray(tournament.rounds) ? tournament.rounds : [];
  const total = rounds.length;
  const recorded = new Set();
  if (Array.isArray(tournament.roundResults)) {
    tournament.roundResults.forEach((entry) => {
      if (!entry) return;
      if (entry.round !== undefined && entry.round !== null) {
        recorded.add(entry.round);
      }
    });
  }
  return { total, completed: recorded.size };
}

function getTeamCount(tournament) {
  const teams = tournament.registration?.teams;
  if (!Array.isArray(teams)) return 0;
  return teams.length;
}

const STATUS_META = {
  draft: { label: 'Draft', className: 'border-white/10 bg-white/5 text-slate-300' },
  live: { label: 'Live', className: 'border-brand-cyan-500/40 bg-brand-cyan-500/10 text-brand-cyan-200' },
  final: { label: 'Final', className: 'border-brand-pink-500/40 bg-brand-pink-500/10 text-brand-pink-300' }
};

function getStatusMeta(status) {
  const key = typeof status === 'string' ? status.toLowerCase() : 'draft';
  return STATUS_META[key] || STATUS_META.draft;
}

function getVisibilityMeta(visibility) {
  const value = typeof visibility === 'string' ? visibility.toLowerCase() : 'private';
  if (value === 'public') {
    return { label: 'Public', className: 'border-brand-lime-500/40 bg-brand-lime-500/10 text-brand-lime-200' };
  }
  return { label: 'Private', className: 'border-white/10 bg-white/5 text-slate-300' };
}

function formatLeaderSummary(tournament) {
  const standings = computeStandings(tournament);
  if (!standings || !Array.isArray(standings.totals) || standings.totals.length === 0) {
    return 'No scores imported yet. Use the Admin Room to ingest CSVs and publish standings.';
  }
  const leader = standings.totals[0];
  const leaderName = escapeHTML(leader.teamName || leader.teamId || 'Leader');
  const leaderScore = Number.isFinite(leader.total) ? leader.total : Number(leader.total) || 0;
  let summary = `Leader: <span class="font-semibold text-white">${leaderName}</span> · ${leaderScore} pts`;
  const runner = standings.totals[1];
  if (runner) {
    const runnerScore = Number.isFinite(runner.total) ? runner.total : Number(runner.total) || 0;
    const diff = leaderScore - runnerScore;
    const prefix = diff >= 0 ? '+' : '';
    summary += ` <span class="text-slate-500">(${prefix}${diff} vs next)</span>`;
  }
  const lastRound = Array.isArray(standings.rounds) ? standings.rounds[standings.rounds.length - 1] : null;
  if (lastRound && lastRound.round !== undefined && lastRound.round !== null) {
    summary += `<span class="mt-1 block text-xs text-slate-400">Last update · Round ${escapeHTML(lastRound.round)}</span>`;
  }
  return summary;
}

function renderActions(slug) {
  if (!slug) {
    return `
      <span class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        Add a slug to unlock actions
      </span>
    `;
  }
  const slugParam = encodeURIComponent(slug);
  return [
    `<a href="./admin/?slug=${slugParam}" class="rounded-2xl border border-brand-cyan-500/40 bg-brand-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan-200 transition hover:bg-brand-cyan-500 hover:text-base-950">Admin console</a>`,
    `<a href="./t/?slug=${slugParam}" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:text-white">Public view</a>`,
    `<a href="./t/admin/?slug=${slugParam}" class="rounded-2xl border border-brand-lime-500/40 bg-brand-lime-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-lime-200 transition hover:bg-brand-lime-500 hover:text-base-950">Admin room</a>`,
    `<button type="button" data-action="export" class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:text-white">Export JSON</button>`,
    `<button type="button" data-action="delete" class="rounded-2xl border border-brand-pink-500/40 bg-brand-pink-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-pink-300 transition hover:bg-brand-pink-500 hover:text-base-950">Delete</button>`
  ].join('');
}

function renderTournamentCard(tournament, index) {
  const slug = String(tournament.slug || '').trim();
  const datasetSlug = slug || `pending-${index}`;
  const statusMeta = getStatusMeta(tournament.status);
  const visibilityMeta = getVisibilityMeta(tournament.visibility);
  const progress = getRoundProgress(tournament);
  const teamCount = getTeamCount(tournament);
  const progressLabel = progress.total
    ? `${progress.completed}/${progress.total} rounds scored`
    : 'Rounds not configured';
  const region = escapeHTML(tournament.region || 'NA');
  const ownerLabel = escapeHTML(describeOwner(tournament));
  const startDate = escapeHTML(formatDateValue(tournament.startDate));
  const updatedAt = escapeHTML(formatDateTime(tournament.updatedAt));
  const safeSlug = escapeHTML(slug || '—');
  const name = escapeHTML(tournament.name || slug || 'Untitled tournament');
  const standingsSummary = formatLeaderSummary(tournament);

  return `
    <article class="rounded-3xl border border-white/10 bg-base-900/70 p-6 space-y-6" data-tournament="${escapeHTML(datasetSlug)}">
      <div class="space-y-4">
        <div class="space-y-3">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-500">${region}</p>
          <h3 class="font-display text-2xl text-white">${name}</h3>
          <div class="flex flex-wrap gap-2 text-xs text-slate-400">
            <span class="rounded-2xl border ${statusMeta.className} px-3 py-1 font-semibold uppercase tracking-[0.2em]">${statusMeta.label}</span>
            <span class="rounded-2xl border ${visibilityMeta.className} px-3 py-1 font-semibold uppercase tracking-[0.2em]">Visibility · ${visibilityMeta.label}</span>
            <span class="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.2em]">${teamCount} team${teamCount === 1 ? '' : 's'}</span>
            <span class="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.2em]">${escapeHTML(progressLabel)}</span>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-4 text-xs text-slate-400">
          <div>
            <span class="uppercase tracking-[0.2em] text-slate-500">Owner</span>
            <p class="font-medium text-slate-200">${ownerLabel}</p>
          </div>
          <div>
            <span class="uppercase tracking-[0.2em] text-slate-500">Slug</span>
            <p class="font-medium text-slate-200">${safeSlug}</p>
          </div>
          <div>
            <span class="uppercase tracking-[0.2em] text-slate-500">Start</span>
            <p class="font-medium text-slate-200">${startDate}</p>
          </div>
          <div>
            <span class="uppercase tracking-[0.2em] text-slate-500">Updated</span>
            <p class="font-medium text-slate-200">${updatedAt}</p>
          </div>
        </div>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        ${standingsSummary}
      </div>
      <div class="flex flex-wrap gap-2 text-xs">
        ${renderActions(slug)}
      </div>
    </article>
  `;
}

function updateEmptyState(relevant) {
  if (!elements.empty) return;
  const hasItems = relevant.length > 0;
  elements.empty.classList.toggle('hidden', hasItems);
  if (!hasItems) {
    const activeOwner = getActiveOwnerId();
    const hasOtherOwners = tournaments.some((item) => normaliseOwnerId(item.ownerId) !== activeOwner);
    elements.empty.textContent = hasOtherOwners
      ? 'No tournaments for this account. Switch accounts to manage other drafts stored on this device.'
      : defaultEmptyMessage;
  }
}

function updateList() {
  if (!elements.list) return;
  const activeOwner = getActiveOwnerId();
  const relevant = tournaments
    .filter((item) => normaliseOwnerId(item.ownerId) === activeOwner)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  elements.list.innerHTML = relevant.map((tournament, index) => renderTournamentCard(tournament, index)).join('');
  updateEmptyState(relevant);

  if (highlightSlug) {
    requestAnimationFrame(() => highlightCard(highlightSlug));
    highlightSlug = null;
  }
}

function handleCreateTournament(event) {
  event.preventDefault();
  if (!elements.createSlug) return;
  const slug = slugify(elements.createSlug.value);
  const name = String(elements.createName?.value || '').trim();

  elements.createSlug.value = slug;

  if (!slug) {
    showToast('Provide a slug to create a tournament.', 'error');
    elements.createSlug.focus();
    return;
  }

  if (tournaments.some((item) => String(item.slug) === slug)) {
    showToast('Slug already exists. Choose another.', 'error');
    return;
  }

  const template = createTournamentTemplate(currentSession);
  template.slug = slug;
  template.name = name || slug;

  highlightSlug = slug;
  upsertTournament(template);
  showToast(`Tournament "${template.name}" created.`, 'success');

  event.currentTarget.reset();
  lastAutoSlug = '';
  slugManuallyEdited = false;
}

function handleCardAction(event) {
  const trigger = event.target.closest('button[data-action]');
  if (!trigger) return;
  const card = trigger.closest('[data-tournament]');
  if (!card) return;
  const slug = card.dataset.tournament || '';
  let tournament = tournaments.find((item) => String(item.slug) === slug);
  if (!tournament && slug.startsWith('pending-')) {
    const index = Number.parseInt(slug.split('-')[1], 10);
    if (!Number.isNaN(index)) {
      const activeOwner = getActiveOwnerId();
      const relevant = tournaments
        .filter((item) => normaliseOwnerId(item.ownerId) === activeOwner)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      tournament = relevant[index];
    }
  }
  if (!tournament) return;
  const resolvedSlug = String(tournament.slug || '');

  if (trigger.dataset.action === 'delete') {
    const label = tournament.name || resolvedSlug || 'this tournament';
    if (!window.confirm(`Delete tournament "${label}"? This cannot be undone.`)) return;
    removeTournament(resolvedSlug);
    showToast('Tournament deleted.', 'success');
    return;
  }

  if (trigger.dataset.action === 'export') {
    exportTournament(tournament);
  }
}

function exportTournament(tournament) {
  try {
    const payload = JSON.stringify(tournament, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${tournament.slug || 'tournament'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Tournament exported.', 'success');
  } catch (error) {
    console.warn('[scoring] failed to export tournament', error);
    showToast('Unable to export tournament.', 'error');
  }
}

function handleNameInput(event) {
  if (!elements.createSlug) return;
  const candidate = slugify(event.target.value);
  if (!candidate) {
    if (!slugManuallyEdited) {
      elements.createSlug.value = '';
      lastAutoSlug = '';
    }
    return;
  }
  if (!slugManuallyEdited || !elements.createSlug.value.trim()) {
    elements.createSlug.value = candidate;
    lastAutoSlug = candidate;
    slugManuallyEdited = false;
  }
}

function handleSlugInput() {
  if (!elements.createSlug) return;
  const current = slugify(elements.createSlug.value);
  if (!current) {
    slugManuallyEdited = false;
    lastAutoSlug = '';
    elements.createSlug.value = '';
    return;
  }
  elements.createSlug.value = current;
  slugManuallyEdited = current !== lastAutoSlug;
}

function highlightCard(slug) {
  if (!slug || !elements.list) return;
  const safe = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(slug) : slug;
  const card = elements.list.querySelector(`[data-tournament="${safe}"]`);
  if (!card) return;
  card.classList.add('ring-1', 'ring-brand-cyan-500/40');
  setTimeout(() => {
    card.classList.remove('ring-1', 'ring-brand-cyan-500/40');
  }, 2000);
}

function showToast(message, tone = 'neutral') {
  let toast = document.querySelector('[data-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.dataset.toast = 'true';
    toast.className =
      'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/10 bg-base-900/95 px-4 py-2 text-sm shadow-xl transition-opacity';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('text-brand-cyan-200', 'text-brand-pink-300', 'text-slate-300');
  if (tone === 'success') {
    toast.classList.add('text-brand-cyan-200');
  } else if (tone === 'error') {
    toast.classList.add('text-brand-pink-300');
  } else {
    toast.classList.add('text-slate-300');
  }
  toast.classList.remove('opacity-0');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('opacity-0'), 2400);
}

function updateSessionInfo(nextSession) {
  currentSession = nextSession || null;
  if (elements.sessionStatus) {
    elements.sessionStatus.classList.remove('text-brand-cyan-200');
    if (currentSession) {
      elements.sessionStatus.textContent = 'Signed in';
      elements.sessionStatus.classList.remove('text-slate-400');
      elements.sessionStatus.classList.add('text-brand-cyan-200');
    } else {
      elements.sessionStatus.textContent = 'Guest (Dev login)';
      elements.sessionStatus.classList.add('text-slate-400');
    }
  }
  if (elements.sessionOwner) {
    if (currentSession) {
      elements.sessionOwner.textContent = currentSession.username || `discord:${currentSession.discordId}`;
    } else {
      elements.sessionOwner.textContent = 'Guest';
    }
  }
}

function handleStorage(event) {
  if (event.key && event.key !== STORAGE_EVENT_KEY) return;
  tournaments = listTournaments();
  updateList();
}

function initialise() {
  initSiteChrome({ activeNav: 'scoring' });
  cacheElements();
  bindEvents();

  updateSessionInfo(getSession());
  tournaments = listTournaments();
  updateList();

  unsubscribeStore = subscribe((next) => {
    tournaments = Array.isArray(next) ? next : [];
    updateList();
  });

  unsubscribeSession = onSessionChanged((next) => {
    updateSessionInfo(next);
    updateList();
  });

  window.addEventListener('storage', handleStorage);
}

function teardown() {
  window.removeEventListener('storage', handleStorage);
  if (typeof unsubscribeStore === 'function') {
    unsubscribeStore();
    unsubscribeStore = null;
  }
  if (typeof unsubscribeSession === 'function') {
    unsubscribeSession();
    unsubscribeSession = null;
  }
}

document.addEventListener('DOMContentLoaded', initialise);
window.addEventListener('beforeunload', teardown);
