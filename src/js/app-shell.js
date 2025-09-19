import { getSession, onSessionChanged, mockLogin, logout } from './auth.js';
import { getSettings, updateSettings, onSettingsChanged } from './storage.js';
import { enableSmoothScroll, destroySmoothScroll } from './motion.js';
import { emit } from './event-bus.js';

const featureFlags = {
  FEATURE_SERVERLESS: false,
  FEATURE_SMOOTH_SCROLL: true,
  FEATURE_VIEW_TRANSITIONS: true,
  ...(window.__FEATURE_FLAGS || {})
};

const basePath = normaliseBasePath(window.__APP_BASE_PATH || document.documentElement.getAttribute('data-base') || '/');
const baseUrl = new URL(basePath, window.location.origin);
const NAVIGATION = [
  { label: 'Home', href: '/', page: 'landing' },
  { label: 'NarakaTweaks', href: '/naraka-tweaks/', page: 'naraka-tweaks' },
  { label: 'EGL Planner', href: '/egl/', page: 'egl' },
  { label: 'Tournaments', href: '/tournaments/', page: 'tournaments' }
];

let navElement;
let footerElement;
let shellRoot;
let modalRoot;
let toastRoot;
let currentSettings = getSettings();
let viewTransitionHandlerBound = false;

onSettingsChanged((settings) => {
  updateSettingsState(settings);
});

function normaliseBasePath(input) {
  if (!input || input === '.') return '/';
  let value = input;
  if (!value.startsWith('/')) {
    value = '/' + value;
  }
  if (!value.endsWith('/')) {
    value = value + '/';
  }
  return value;
}

function resolveUrl(path) {
  if (!path) {
    return baseUrl.pathname;
  }
  if (/^https?:/i.test(path)) {
    return path;
  }
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return new URL(trimmed, baseUrl).pathname;
}

function normaliseHref(href) {
  const url = new URL(href, window.location.href);
  return url.pathname.replace(/\/index\.html$/, '/');
}

function createNav() {
  navElement = document.createElement('nav');
  navElement.setAttribute('data-app-nav', '');
  navElement.className = 'border-b border-white/10';
  const currentPage = document.body.dataset.page;
  const navLinks = NAVIGATION.map((item) => {
    const href = resolveUrl(item.href);
    const isActive = currentPage === item.page || normaliseHref(window.location.href) === href;
    return `
      <a
        href="${href}"
        class="text-sm font-medium text-slate-300 transition hover:text-white ${isActive ? 'active' : ''}"
        data-nav-link
        data-page="${item.page}"
      >${item.label}</a>
    `;
  }).join('');

  const motionLabel = currentSettings.motionPreference === 'minimal' ? 'Motion: Minimal' : 'Motion: Full';
  const smoothChecked = currentSettings.smoothScroll ? 'checked' : '';
  const vtChecked = currentSettings.viewTransitions ? 'checked' : '';

  navElement.innerHTML = `
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
      <div class="flex items-center gap-6">
        <a href="${resolveUrl('/')}" class="font-display text-lg uppercase tracking-[0.4em] text-white">Team Strive</a>
        <div class="hidden items-center gap-5 md:flex">
          ${navLinks}
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          data-motion-toggle
          class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:text-white"
        >${motionLabel}</button>
        <label class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-300 md:inline-flex">
          <input type="checkbox" data-smooth-toggle class="h-3 w-3 rounded border-white/20 bg-base-900" ${smoothChecked} />
          Smooth
        </label>
        <label class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-300 lg:inline-flex">
          <input type="checkbox" data-view-toggle class="h-3 w-3 rounded border-white/20 bg-base-900" ${vtChecked} />
          View transitions
        </label>
        <button
          type="button"
          data-auth-trigger
          class="rounded-full border border-brand-cyan-500/40 bg-brand-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-cyan-200 transition hover:bg-brand-cyan-500 hover:text-base-950"
        >${renderAuthLabel(getSession())}</button>
      </div>
    </div>
  `;

  navElement.addEventListener('click', handleNavClick);
  navElement.querySelector('[data-motion-toggle]').addEventListener('click', toggleMotionPreference);
  navElement.querySelector('[data-auth-trigger]').addEventListener('click', openAuthModal);
  navElement.querySelector('[data-smooth-toggle]')?.addEventListener('change', toggleSmoothScroll);
  navElement.querySelector('[data-view-toggle]')?.addEventListener('change', toggleViewTransitions);
  shellRoot.prepend(navElement);
}

function renderAuthLabel(session) {
  if (!session) return 'Dev login';
  if (session.username) return session.username;
  if (session.discordId) return `discord:${session.discordId}`;
  return 'Dev login';
}

function updateAuthLabel(session) {
  const button = navElement?.querySelector('[data-auth-trigger]');
  if (button) {
    button.textContent = renderAuthLabel(session);
  }
}

function handleNavClick(event) {
  const link = event.target.closest('a[data-nav-link]');
  if (!link) return;
  if (!featureFlags.FEATURE_VIEW_TRANSITIONS || !currentSettings.viewTransitions || typeof document.startViewTransition !== 'function') {
    return;
  }
  const url = link.getAttribute('href');
  if (!url || url.startsWith('http')) return;
  event.preventDefault();
  document.startViewTransition(() => {
    window.location.href = url;
  });
}

function toggleMotionPreference() {
  const next = currentSettings.motionPreference === 'minimal' ? 'full' : 'minimal';
  currentSettings = { ...currentSettings, motionPreference: next };
  updateSettings({ motionPreference: next });
  const label = navElement?.querySelector('[data-motion-toggle]');
  if (label) {
    label.textContent = next === 'minimal' ? 'Motion: Minimal' : 'Motion: Full';
  }
  showToast(`Motion set to ${next === 'minimal' ? 'Minimal' : 'Full'}.`);
}

function toggleSmoothScroll(event) {
  const checked = Boolean(event.target.checked);
  currentSettings = { ...currentSettings, smoothScroll: checked };
  updateSettings({ smoothScroll: checked });
  if (checked) {
    enableSmoothScroll();
  } else {
    destroySmoothScroll();
  }
}

function toggleViewTransitions(event) {
  const checked = Boolean(event.target.checked);
  currentSettings = { ...currentSettings, viewTransitions: checked };
  updateSettings({ viewTransitions: checked });
  showToast(`View transitions ${checked ? 'enabled' : 'disabled'}.`);
}

function syncUIWithSettings() {
  const motionButton = navElement?.querySelector('[data-motion-toggle]');
  if (motionButton) {
    motionButton.textContent = currentSettings.motionPreference === 'minimal' ? 'Motion: Minimal' : 'Motion: Full';
  }
  const smoothToggle = navElement?.querySelector('[data-smooth-toggle]');
  if (smoothToggle) {
    smoothToggle.checked = Boolean(currentSettings.smoothScroll);
  }
  const viewToggle = navElement?.querySelector('[data-view-toggle]');
  if (viewToggle) {
    viewToggle.checked = Boolean(currentSettings.viewTransitions);
  }
  document.body.dataset.motion = currentSettings.motionPreference;
}

function createFooter() {
  footerElement = document.createElement('footer');
  footerElement.setAttribute('data-app-footer', '');
  footerElement.innerHTML = `
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="font-display text-lg uppercase tracking-[0.3em] text-white">Strive Ops</p>
        <p class="mt-2 max-w-xl text-slate-400">
          Built for Naraka: Bladepoint staffers by Team Strive. Static-first, serverless-ready. Feedback? Ping us in Discord.
        </p>
      </div>
      <div class="flex flex-wrap gap-4 text-xs uppercase tracking-[0.35em]">
        <a class="hover:text-white" href="https://github.com/notratz/Strive" target="_blank" rel="noopener">Source</a>
        <a class="hover:text-white" href="https://discord.gg/teamstrive" target="_blank" rel="noopener">Discord</a>
        <a class="hover:text-white" href="mailto:ops@teamstrive.gg">Contact</a>
        <span class="text-slate-500">© ${new Date().getFullYear()} Team Strive</span>
      </div>
    </div>
  `;
  document.body.appendChild(footerElement);
}

function ensureShellRoots() {
  shellRoot = document.getElementById('app-shell');
  if (!shellRoot) {
    shellRoot = document.createElement('div');
    shellRoot.id = 'app-shell';
    document.body.prepend(shellRoot);
  }
  modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.append(modalRoot);
  }
  toastRoot = document.querySelector('[data-toast]');
  if (!toastRoot) {
    toastRoot = document.createElement('div');
    toastRoot.setAttribute('data-toast', '');
    document.body.appendChild(toastRoot);
  }
}

function openAuthModal() {
  const session = getSession();
  const backdrop = document.createElement('div');
  backdrop.setAttribute('data-modal-backdrop', '');
  backdrop.innerHTML = `
    <div data-modal-panel>
      <header class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-brand-cyan-200">Authentication</p>
          <h2 class="mt-2 font-display text-2xl text-white">${featureFlags.FEATURE_SERVERLESS ? 'Discord sign-in' : 'Developer login'}</h2>
        </div>
        <button type="button" data-close class="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400 transition hover:text-white">Close</button>
      </header>
      <div data-divider></div>
      <form class="space-y-5" data-auth-form>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Discord ID</label>
          <input
            type="text"
            name="discordId"
            class="mt-2 w-full rounded-2xl border border-white/10 bg-base-800/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan-500"
            placeholder="1234567890123456"
            value="${session?.discordId || ''}"
          />
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Display name</label>
          <input
            type="text"
            name="username"
            class="mt-2 w-full rounded-2xl border border-white/10 bg-base-800/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan-500"
            placeholder="MatariMain"
            value="${session?.username || ''}"
          />
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Avatar URL (optional)</label>
          <input
            type="url"
            name="avatar"
            class="mt-2 w-full rounded-2xl border border-white/10 bg-base-800/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan-500"
            placeholder="https://cdn.discordapp.com/..."
            value="${session?.avatar || ''}"
          />
        </div>
        <div class="flex flex-wrap gap-3">
          <button type="submit" class="rounded-2xl border border-brand-cyan-500/40 bg-brand-cyan-500/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-cyan-200 transition hover:bg-brand-cyan-500 hover:text-base-950">
            ${featureFlags.FEATURE_SERVERLESS ? 'Sign in with Discord' : 'Save mock login'}
          </button>
          ${session ? '<button type="button" data-signout class="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:text-white">Sign out</button>' : ''}
        </div>
        <p class="text-xs uppercase tracking-[0.3em] text-slate-500">
          ${featureFlags.FEATURE_SERVERLESS ? 'Serverless mode ready — this demo uses PKCE when deployed with Workers.' : 'Static mode uses a mock Discord login stored locally.'}
        </p>
      </form>
    </div>
  `;
  const close = () => {
    backdrop.remove();
    modalRoot?.removeChild(backdrop);
  };
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      close();
    }
  });
  backdrop.querySelector('[data-close]')?.addEventListener('click', close);
  const form = backdrop.querySelector('[data-auth-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const discordId = formData.get('discordId');
    const username = formData.get('username');
    const avatar = formData.get('avatar');
    const payload = mockLogin({ discordId, username, avatar });
    updateAuthLabel(payload);
    showToast(`Signed in as ${payload.username || payload.discordId || 'Guest'}`);
    close();
  });
  backdrop.querySelector('[data-signout]')?.addEventListener('click', () => {
    logout();
    updateAuthLabel(null);
    showToast('Signed out.');
    close();
  });
  modalRoot?.appendChild(backdrop);
}

function createToastElement(message, variant = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  const icon = variant === 'error'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/><path d="M10.2 3.6 2.6 17.4A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.8-2.6L13.8 3.6a2 2 0 0 0-3.6 0Z" stroke="currentColor" stroke-width="1.5"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 11.5 11 13.5 15 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/></svg>';
  toast.innerHTML = `${icon}<span>${message}</span>`;
  return toast;
}

let toastTimer;
function showToast(message, variant = 'info') {
  if (!toastRoot) return;
  const toast = createToastElement(message, variant);
  toastRoot.appendChild(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.remove();
  }, 4000);
}

function handleSessionChange(session) {
  updateAuthLabel(session);
  emit('auth:ready', session);
}

function initViewTransitions() {
  if (!featureFlags.FEATURE_VIEW_TRANSITIONS) return;
  if (typeof document.startViewTransition !== 'function') return;
  if (!currentSettings.viewTransitions) return;
  if (viewTransitionHandlerBound) return;
  viewTransitionHandlerBound = true;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    const target = link.getAttribute('target');
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || target === '_blank' || href.startsWith('#')) return;
    if (link.hasAttribute('download')) return;
    event.preventDefault();
    document.startViewTransition(() => {
      window.location.href = href;
    });
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const swUrl = new URL('../../service-worker.js', import.meta.url);
    await navigator.serviceWorker.register(swUrl, { scope: basePath });
  } catch (error) {
    console.warn('[app-shell] service worker registration failed', error);
  }
}

function applyShell() {
  ensureShellRoots();
  createNav();
  createFooter();
  initViewTransitions();
  if (featureFlags.FEATURE_SMOOTH_SCROLL && currentSettings.smoothScroll) {
    enableSmoothScroll();
  }
  registerServiceWorker();
}

function updateSettingsState(nextSettings) {
  currentSettings = { ...currentSettings, ...nextSettings };
  if (currentSettings.smoothScroll) {
    enableSmoothScroll();
  } else {
    destroySmoothScroll();
  }
  if (currentSettings.viewTransitions) {
    initViewTransitions();
  }
  syncUIWithSettings();
}

document.addEventListener('DOMContentLoaded', () => {
  applyShell();
  onSessionChanged(handleSessionChange);
});

window.addEventListener('pageshow', () => {
  currentSettings = getSettings();
  updateSettingsState(currentSettings);
});

emit('shell:ready');

export { showToast };
