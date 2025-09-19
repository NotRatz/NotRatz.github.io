const DATA_URL = new URL('../../assets/data/announcements.json', import.meta.url);
let cache = null;
let cacheAt = 0;
const CACHE_TTL = 1000 * 60 * 5;

function parseAnnouncements(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      id: item.id || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `announcement-${Math.random().toString(36).slice(2)}`),
      title: item.title || 'Untitled',
      body: item.body || '',
      type: item.type || 'update',
      date: item.date || new Date().toISOString(),
      cta: item.cta || null
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAnnouncements(force = false) {
  const now = Date.now();
  if (!force && cache && now - cacheAt < CACHE_TTL) {
    return cache;
  }
  try {
    const response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load announcements (${response.status})`);
    const data = await response.json();
    cache = parseAnnouncements(data);
    cacheAt = now;
    return cache;
  } catch (error) {
    console.warn('[announcements] fallback to cache', error);
    return cache || [];
  }
}

export function formatAnnouncementDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
