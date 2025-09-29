// Naraka themed backdrops served from high resolution community wallpapers.
// Remote hosting keeps the repository binary-free while still rotating imagery.
const WALLPAPERS = [
  'https://images.alphacoders.com/130/1304109.jpg',
  'https://images.alphacoders.com/129/1290771.jpg',
  'https://images.alphacoders.com/130/1301954.jpg',
  'https://images.alphacoders.com/131/1310132.jpg'
];

const STORAGE_KEY = 'strive:wallpaper-index';
const FALLBACK_WALLPAPER =
  'radial-gradient(135deg, rgba(30, 48, 85, 0.65), rgba(5, 6, 10, 0.92) 65%, rgba(5, 6, 10, 0.98))';

function readPreviousIndex() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const parsed = Number.parseInt(stored ?? '-1', 10);
    return Number.isFinite(parsed) ? parsed : -1;
  } catch (error) {
    return -1;
  }
}

function rememberIndex(index) {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(index));
  } catch (error) {
    // Ignore sessionStorage write failures (private browsing, etc.)
  }
}

function computeNextIndex(previous) {
  if (WALLPAPERS.length === 0) return -1;
  if (!Number.isFinite(previous) || previous < 0) return 0;
  return (previous + 1) % WALLPAPERS.length;
}

function shouldDeferHeavyWallpapers() {
  if (typeof navigator === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return false;
  const slowTypes = new Set(['slow-2g', '2g']);
  return Boolean(connection.saveData) || slowTypes.has(connection.effectiveType);
}

function markWallpaperReady() {
  const addReadyClass = () => document.body.classList.add('wallpaper-ready');
  if (document.body) {
    addReadyClass();
  } else {
    window.addEventListener('DOMContentLoaded', addReadyClass, { once: true });
  }
}

function applyWallpaper(url, index) {
  const root = document.documentElement;
  root.style.setProperty('--page-wallpaper', `url("${url}")`);
  root.style.setProperty('--page-wallpaper-source', url);
  rememberIndex(index);
  markWallpaperReady();
}

function applyFallbackWallpaper() {
  const root = document.documentElement;
  root.style.setProperty('--page-wallpaper', FALLBACK_WALLPAPER);
  root.style.removeProperty('--page-wallpaper-source');
  markWallpaperReady();
}

function preloadWallpaper(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing wallpaper URL.'));
      return;
    }
    const image = new Image();
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.onload = () => resolve(url);
    image.onerror = (event) => {
      const hasErrorEvent = typeof ErrorEvent !== 'undefined' && event instanceof ErrorEvent;
      reject(hasErrorEvent && event.error ? event.error : new Error('Failed to load wallpaper.'));
    };
    image.src = url;
  });
}

if (typeof window !== 'undefined') {
  if (shouldDeferHeavyWallpapers()) {
    applyFallbackWallpaper();
  } else {
    const nextIndex = computeNextIndex(readPreviousIndex());
    const selected = WALLPAPERS[nextIndex];

    if (!selected) {
      applyFallbackWallpaper();
    } else {
      preloadWallpaper(selected)
        .then((readyUrl) => applyWallpaper(readyUrl, nextIndex))
        .catch(() => {
          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch (error) {
            // Ignore storage errors when clearing the index.
          }
          applyFallbackWallpaper();
        });
    }
  }
}
