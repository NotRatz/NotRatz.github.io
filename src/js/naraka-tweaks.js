import { getUserState, withUserSection, subscribeUser } from './storage.js';
import { showToast } from './app-shell.js';
import { animate } from './motion.js';

// Use absolute path to the assets folder so this module loads correctly from any page
const DATA_URL = new URL('/assets/data/tweaks.json', import.meta.url);

const searchForm = document.querySelector('[data-search-form]');
const categoryContainer = searchForm?.querySelector('[role="tablist"]');
const resultsContainer = document.getElementById('tweak-results');
const selectionSummary = document.getElementById('selection-summary');
const presetList = document.getElementById('preset-list');
const clearSelectionButton = document.querySelector('[data-clear-selection]');
const savePresetButton = document.querySelector('[data-save-preset]');
const exportPresetsButton = document.querySelector('[data-export-presets]');
const importPresetsInput = document.querySelector('[data-import-presets]');

let categories = [];
let tweaks = [];
let tweakIndex = new Map();
let selectedCategory = 'all';
let searchQuery = '';
let selectedIds = new Set();
let presets = {};
let ready = false;

async function loadTweaks() {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load tweaks data');
  const data = await response.json();
  categories = data.map((category) => ({ id: category.id, label: category.label, description: category.description }));
  tweaks = data.flatMap((category) => {
    return category.items.map((item) => {
      const payload = {
        ...item,
        categoryId: category.id,
        categoryLabel: category.label,
        description: category.description
      };
      tweakIndex.set(item.id, payload);
      return payload;
    });
  });
}

function renderCategoryPills() {
  if (!categoryContainer) return;
  const buttons = [
    '<button type="button" class="category-pill" data-category="all" aria-selected="false">All</button>',
    ...categories.map((category) => `
      <button type="button" class="category-pill" data-category="${category.id}" aria-selected="false">
        ${category.label}
      </button>
    `)
  ];
  categoryContainer.innerHTML = buttons.join('');
  categoryContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.category-pill');
    if (!button) return;
    const categoryId = button.getAttribute('data-category');
    if (!categoryId) return;
    selectedCategory = categoryId;
    persistState();
    updateCategorySelection();
    renderTweaks();
  });
  updateCategorySelection();
}

function updateCategorySelection() {
  const buttons = categoryContainer?.querySelectorAll('.category-pill');
  if (!buttons) return;
  buttons.forEach((button) => {
    const categoryId = button.getAttribute('data-category');
    const isActive = categoryId === selectedCategory;
    button.setAttribute('aria-selected', String(isActive));
    button.classList.toggle('active', isActive);
  });
}

function renderTweaks() {
  if (!resultsContainer) return;
  const query = searchQuery.trim().toLowerCase();
  const filtered = tweaks.filter((tweak) => {
    const matchesCategory = selectedCategory === 'all' || tweak.categoryId === selectedCategory;
    const haystack = [tweak.title, tweak.summary, ...(tweak.tags || []), tweak.categoryLabel].join(' ').toLowerCase();
    const matchesSearch = query.length === 0 || haystack.includes(query);
    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    resultsContainer.innerHTML = '<div data-empty-state>No tweaks match your filters. Try another keyword or category.</div>';
    return;
  }

  resultsContainer.innerHTML = filtered
    .map((tweak) => {
      const isSelected = selectedIds.has(tweak.id);
      const tags = (tweak.tags || []).map((tag) => `<span data-chip class="text-[0.6rem]">${tag}</span>`).join('');
      const revertDisabled = !tweak.revert || tweak.revert.toLowerCase().includes('no revert');
      return `
        <article data-surface data-tweak="${tweak.id}" class="flex flex-col gap-4 p-6">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="font-display text-xl text-white">${tweak.title}</h3>
              <p class="text-xs uppercase tracking-[0.3em] text-slate-500">${tweak.categoryLabel}</p>
            </div>
            <button type="button" class="category-pill ${isSelected ? 'active' : ''}" data-action="toggle" data-id="${tweak.id}">
              ${isSelected ? 'Selected' : 'Queue preset'}
            </button>
          </header>
          <p class="text-sm text-slate-300">${tweak.summary}</p>
          <div class="flex flex-wrap gap-2">${tags}</div>
          <div class="grid gap-3 md:grid-cols-3">
            <button type="button" data-action="copy-script" data-id="${tweak.id}"
              class="rounded-2xl border border-brand-cyan-500/40 bg-brand-cyan-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-cyan-200 transition hover:bg-brand-cyan-500 hover:text-base-950">
              Copy script
            </button>
            <button type="button" data-action="copy-revert" data-id="${tweak.id}"
              class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:text-white" ${revertDisabled ? 'disabled' : ''}>
              Copy revert
            </button>
            <button type="button" data-action="details" data-id="${tweak.id}"
              class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:text-white">
              Details
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function updateSelectionSummary() {
  if (!selectionSummary) return;
  if (!selectedIds.size) {
    selectionSummary.innerHTML = '<li>No tweaks selected yet. Pick entries below to build your preset.</li>';
    return;
  }
  const items = Array.from(selectedIds).map((id) => tweakIndex.get(id)).filter(Boolean);
  selectionSummary.innerHTML = items
    .map((item) => `
      <li class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
        <span>${item.title}</span>
        <button type="button" class="text-xs uppercase tracking-[0.3em] text-brand-pink-200 hover:text-brand-pink-100" data-remove-selection data-id="${item.id}">
          Remove
        </button>
      </li>
    `)
    .join('');
}

function persistState() {
  if (!ready) return;
  const snapshot = {
    lastCategory: selectedCategory,
    selections: Array.from(selectedIds),
    presets,
    lastExportAt: Date.now()
  };
  withUserSection('narakaTweaks', (section) => ({ ...section, ...snapshot }));
}

function restoreFromState(state) {
  presets = { ...(state.presets || {}) };
  selectedIds = new Set(state.selections || []);
  selectedCategory = state.lastCategory || 'all';
  updateCategorySelection();
  renderTweaks();
  renderPresetList();
  updateSelectionSummary();
}

function renderPresetList() {
  if (!presetList) return;
  const entries = Object.values(presets);
  if (!entries.length) {
    presetList.innerHTML = '<div data-empty-state>No presets saved yet. Build a selection and save it.</div>';
    return;
  }
  presetList.innerHTML = entries
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .map((preset) => {
      const count = preset.items?.length || 0;
      return `
        <article class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <header class="flex items-center justify-between gap-3">
            <h3 class="font-display text-lg text-white">${preset.name}</h3>
            <div class="flex gap-2 text-[0.65rem] uppercase tracking-[0.3em]">
              <button type="button" data-action="apply" data-id="${preset.id}" class="text-brand-cyan-200 hover:text-brand-cyan-100">Apply</button>
              <button type="button" data-action="export" data-id="${preset.id}" class="text-slate-300 hover:text-white">Export</button>
              <button type="button" data-action="delete" data-id="${preset.id}" class="text-brand-pink-300 hover:text-brand-pink-100">Delete</button>
            </div>
          </header>
          <p class="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">${count} tweak${count === 1 ? '' : 's'} · Updated ${preset.updatedAt ? new Date(preset.updatedAt).toLocaleString() : 'now'}</p>
        </article>
      `;
    })
    .join('');
}

function toggleSelection(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  updateSelectionSummary();
  renderTweaks();
  persistState();
}

function copyToClipboard(text, label) {
  if (!text) {
    showToast('Nothing to copy', 'error');
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`${label} copied to clipboard`))
      .catch((error) => {
        console.warn('[naraka-tweaks] clipboard failed', error);
        fallbackCopy(text, label);
      });
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast(`${label} copied to clipboard`);
  } catch (error) {
    showToast('Unable to copy to clipboard', 'error');
  }
  document.body.removeChild(textarea);
}

function handleResultsClick(event) {
  const actionButton = event.target.closest('button[data-action]');
  if (!actionButton) return;
  const id = actionButton.getAttribute('data-id');
  const action = actionButton.getAttribute('data-action');
  if (!id || !action) return;
  const tweak = tweakIndex.get(id);
  if (!tweak) return;
  switch (action) {
    case 'toggle':
      toggleSelection(id);
      break;
    case 'copy-script':
      copyToClipboard(tweak.script, tweak.title + ' script');
      break;
    case 'copy-revert':
      copyToClipboard(tweak.revert, tweak.title + ' revert');
      break;
    case 'details':
      openDetailsModal(tweak);
      break;
    default:
      break;
  }
}

function openDetailsModal(tweak) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;
  const backdrop = document.createElement('div');
  backdrop.setAttribute('data-modal-backdrop', '');
  backdrop.innerHTML = `
    <div data-modal-panel class="space-y-5">
      <header class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-brand-cyan-200">${tweak.categoryLabel}</p>
          <h2 class="mt-1 font-display text-2xl text-white">${tweak.title}</h2>
        </div>
        <button type="button" data-close class="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400 transition hover:text-white">Close</button>
      </header>
      <p class="text-sm text-slate-300">${tweak.summary}</p>
      <div class="space-y-3">
        <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500">Apply</h3>
        <pre class="rounded-2xl border border-white/10 bg-base-800/70 p-4 text-xs whitespace-pre-wrap">${tweak.script}</pre>
      </div>
      <div class="space-y-3">
        <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500">Revert</h3>
        <pre class="rounded-2xl border border-white/10 bg-base-800/70 p-4 text-xs whitespace-pre-wrap">${tweak.revert || 'No revert necessary.'}</pre>
      </div>
    </div>
  `;
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelector('[data-close]')?.addEventListener('click', close);
  modalRoot.appendChild(backdrop);
}

function handleSelectionSummaryClick(event) {
  const button = event.target.closest('[data-remove-selection]');
  if (!button) return;
  const id = button.getAttribute('data-id');
  if (!id) return;
  selectedIds.delete(id);
  updateSelectionSummary();
  renderTweaks();
  persistState();
}

function handleSearch(event) {
  searchQuery = event.target.value;
  renderTweaks();
}

function handleClearSelection() {
  selectedIds.clear();
  updateSelectionSummary();
  renderTweaks();
  persistState();
}

function handleSavePreset() {
  if (!selectedIds.size) {
    showToast('Select tweaks before saving a preset', 'error');
    return;
  }
  const name = prompt('Preset name');
  if (!name) return;
  const id = presets[name]?.id || `preset-${Math.random().toString(36).slice(2)}`;
  presets[name] = {
    id,
    name,
    items: Array.from(selectedIds),
    createdAt: presets[name]?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  renderPresetList();
  persistState();
  showToast(`Preset "${name}" saved.`);
}

function handlePresetClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');
  const preset = Object.values(presets).find((entry) => entry.id === id);
  if (!preset) return;
  if (action === 'apply') {
    selectedIds = new Set(preset.items || []);
    renderTweaks();
    updateSelectionSummary();
    persistState();
    showToast(`Preset "${preset.name}" applied.`);
  }
  if (action === 'export') {
    exportPreset(preset);
  }
  if (action === 'delete') {
    delete presets[preset.name];
    renderPresetList();
    persistState();
    showToast(`Preset "${preset.name}" removed.`);
  }
}

function exportPreset(preset) {
  const payload = JSON.stringify({
    version: 1,
    name: preset.name,
    items: preset.items
  }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${preset.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-naraka-preset.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Preset "${preset.name}" exported.`);
}

function handleExportAll() {
  if (!Object.keys(presets).length) {
    showToast('No presets to export', 'error');
    return;
  }
  const payload = JSON.stringify({ version: 1, presets }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `naraka-presets-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('All presets exported.');
}

function handleImportPresets(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data?.presets && typeof data.presets === 'object') {
        Object.entries(data.presets).forEach(([name, value]) => {
          const id = value.id || `preset-${Math.random().toString(36).slice(2)}`;
          presets[name] = {
            id,
            name,
            items: Array.isArray(value.items) ? value.items : [],
            createdAt: value.createdAt || Date.now(),
            updatedAt: Date.now()
          };
        });
      } else if (data?.items) {
        const name = data.name || `Imported-${Object.keys(presets).length + 1}`;
        presets[name] = {
          id: `preset-${Math.random().toString(36).slice(2)}`,
          name,
          items: Array.isArray(data.items) ? data.items : [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      } else {
        throw new Error('Invalid preset format');
      }
      renderPresetList();
      persistState();
      showToast('Presets imported.');
    } catch (error) {
      console.error('[naraka-tweaks] import failed', error);
      showToast('Failed to import presets', 'error');
    }
    event.target.value = '';
  };
  reader.onerror = () => {
    showToast('Failed to read file', 'error');
    event.target.value = '';
  };
  reader.readAsText(file);
}

async function init() {
  try {
    await loadTweaks();
    renderCategoryPills();
    renderTweaks();
    const userState = getUserState();
    ready = true;
    restoreFromState(userState.narakaTweaks || {});
    animate(document.querySelectorAll('[data-surface]'), { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] }, { duration: 0.4, delay: 0.05, stagger: 0.04 });
  } catch (error) {
    console.error('[naraka-tweaks] failed to initialise', error);
    resultsContainer.innerHTML = '<div data-empty-state>Failed to load tweaks. Refresh the page to try again.</div>';
  }
}

if (searchForm) {
  searchForm.querySelector('input[name="query"]')?.addEventListener('input', handleSearch);
}
resultsContainer?.addEventListener('click', handleResultsClick);
selectionSummary?.addEventListener('click', handleSelectionSummaryClick);
clearSelectionButton?.addEventListener('click', handleClearSelection);
savePresetButton?.addEventListener('click', handleSavePreset);
presetList?.addEventListener('click', handlePresetClick);
exportPresetsButton?.addEventListener('click', handleExportAll);
importPresetsInput?.addEventListener('change', handleImportPresets);

subscribeUser(({ state }) => {
  if (!ready) return;
  restoreFromState(state.narakaTweaks || {});
});

init();
