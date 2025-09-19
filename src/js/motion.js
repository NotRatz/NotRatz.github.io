import { getSettings, onSettingsChanged } from './storage.js';

let motionModulePromise = null;
let motionEnabled = shouldEnableMotion(getSettings());
let lenisInstance = null;
let lenisEnabled = false;

function shouldEnableMotion(settings) {
  const preference = settings?.motionPreference || 'full';
  if (preference === 'minimal') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return preference === 'full' ? false : preference !== 'force';
  }
  return preference !== 'minimal';
}

async function loadMotionModule() {
  if (!motionModulePromise) {
    motionModulePromise = import('https://cdn.jsdelivr.net/npm/@motionone/dom/+esm').catch((error) => {
      console.warn('[motion] failed to load Motion One', error);
      return null;
    });
  }
  return motionModulePromise;
}

export async function animate(targets, keyframes, options = {}) {
  if (!motionEnabled) return null;
  const mod = await loadMotionModule();
  if (!mod?.animate) return null;
  return mod.animate(targets, keyframes, options);
}

export async function inView(target, callback, options = {}) {
  const mod = await loadMotionModule();
  if (!mod?.inView) return () => {};
  return mod.inView(target, callback, options);
}

export async function timeline(definition, options = {}) {
  if (!motionEnabled) return null;
  const mod = await loadMotionModule();
  if (!mod?.timeline) return null;
  return mod.timeline(definition, options);
}

export function isMotionEnabled() {
  return motionEnabled;
}

async function ensureLenis() {
  if (lenisInstance || lenisEnabled === false) return lenisInstance;
  try {
    const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.6/dist/lenis.esm.min.js');
    lenisInstance = new Lenis({
      duration: 1.2,
      smoothTouch: false,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
    function raf(time) {
      lenisInstance?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    lenisEnabled = true;
  } catch (error) {
    console.warn('[motion] failed to load Lenis', error);
    lenisEnabled = false;
  }
  return lenisInstance;
}

export async function enableSmoothScroll() {
  const settings = getSettings();
  if (!settings.smoothScroll) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  await ensureLenis();
}

export function destroySmoothScroll() {
  lenisInstance?.destroy();
  lenisInstance = null;
  lenisEnabled = false;
}

onSettingsChanged((settings) => {
  const nextMotion = shouldEnableMotion(settings);
  if (nextMotion !== motionEnabled) {
    motionEnabled = nextMotion;
    document.documentElement.classList.toggle('motion-minimal', !motionEnabled);
    document.documentElement.classList.toggle('motion-full', motionEnabled);
  }
  if (!settings.smoothScroll && lenisInstance) {
    destroySmoothScroll();
  }
});

document.documentElement.classList.toggle('motion-minimal', !motionEnabled);
document.documentElement.classList.toggle('motion-full', motionEnabled);
