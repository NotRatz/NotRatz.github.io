import { getAnnouncements, formatAnnouncementDate } from './announcements.js';
import { animate, inView } from './motion.js';

const feed = document.getElementById('announcement-feed');
const heroSection = document.querySelector('[data-hero]');
const heroElements = heroSection ? heroSection.querySelectorAll('[data-animate]') : null;
const productCards = document.querySelectorAll('.pillar-card');

async function renderAnnouncements() {
  if (!feed) return;
  feed.innerHTML = '<div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400" data-shimmer>Syncing updates...</div>';
  const announcements = await getAnnouncements();
  if (!announcements.length) {
    feed.innerHTML = '<div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">No announcements yet. Check back soon.</div>';
    return;
  }
  feed.innerHTML = announcements
    .map((announcement) => {
      const tagColor = announcement.type === 'release' ? 'data-tag-cyan' : announcement.type === 'egl' ? 'data-tag-lime' : announcement.type === 'narakatweaks' ? 'data-tag-pink' : '';
      const cta = announcement.cta
        ? `<a class="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:text-white" href="${announcement.cta.href}">${announcement.cta.label}</a>`
        : '';
      return `
        <article data-surface class="flex flex-col gap-4 p-6">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <span data-chip ${tagColor}>${announcement.type.toUpperCase()}</span>
            <span class="text-xs uppercase tracking-[0.3em] text-slate-500">${formatAnnouncementDate(announcement.date)}</span>
          </header>
          <div>
            <h3 class="font-display text-2xl text-white">${announcement.title}</h3>
            <p class="mt-2 text-sm text-slate-300">${announcement.body}</p>
          </div>
          <footer class="flex flex-wrap gap-3">${cta}</footer>
        </article>
      `;
    })
    .join('');
}

function animateHero() {
  if (!heroElements || heroElements.length === 0) return;
  animate(heroElements, { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }, { delay: 0.08, duration: 0.5, easing: 'cubic-bezier(.2,.8,.2,1)', stagger: 0.06 });
}

function animateProductCards() {
  if (!productCards.length) return;
  inView(productCards, ({ target }) => {
    animate(target, { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] }, { duration: 0.4, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }, { margin: '-10% 0px -10% 0px' });
}

renderAnnouncements();
animateHero();
animateProductCards();
