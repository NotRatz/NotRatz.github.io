import { getUserState, withUserSection, subscribeUser } from './storage.js';
import { showToast } from './app-shell.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const SHARE_PARAM = 'share';

const plannerGrid = document.getElementById('planner-grid');
const squadList = document.getElementById('squad-list');
const eventDetail = document.getElementById('event-detail');
const eventDetailLabel = document.getElementById('event-detail-label');
const notesInput = document.getElementById('planner-notes');
const notesPreview = document.getElementById('notes-preview');
const metricTotalEvents = document.getElementById('metric-total-events');
const metricAttendance = document.getElementById('metric-attendance');
const metricLastSaved = document.getElementById('metric-last-saved');
const shareLinkInput = document.getElementById('share-link');
const shareStatus = document.getElementById('share-status');

const addEventButton = document.querySelector('[data-add-event]');
const clearWeekButton = document.querySelector('[data-clear-week]');
const addSquadButton = document.querySelector('[data-add-squad]');
const exportJsonButton = document.querySelector('[data-export-json]');
const exportCsvButton = document.querySelector('[data-export-csv]');
const generateShareButton = document.querySelector('[data-generate-share]');
const generateDiscordButton = document.querySelector('[data-generate-discord]');

let planner = createDefaultPlanner();
let selectedEventId = null;
let readOnlyMode = false;
let ignoreNextSync = false;

const plannerChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('strive-egl-planner') : null;

plannerChannel?.addEventListener('message', (event) => {
  if (!event?.data) return;
  if (event.data.type === 'select' && !readOnlyMode) {
    selectedEventId = event.data.eventId;
    renderGrid();
    renderEventDetail();
  }
});

function createDefaultPlanner() {
  return {
    weekStart: getWeekStartISO(new Date()),
    events: [],
    squads: [],
    notes: '',
    lastSaved: null,
    lastSharedHash: null
  };
}

function getWeekStartISO(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

function clonePlanner(value) {
  return JSON.parse(JSON.stringify(value));
}

function renderGrid() {
  if (!plannerGrid) return;
  const headerCells = DAYS.map((day) => `<th class="px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-400">${day}</th>`).join('');
  const bodyRows = TIME_SLOTS.map((slot) => {
    const cells = DAYS.map((day) => renderGridCell(day, slot)).join('');
    return `
      <tr class="border-t border-white/5">
        <th class="border-r border-white/5 px-3 py-4 text-xs uppercase tracking-[0.3em] text-slate-500">${slot}</th>
        ${cells}
      </tr>
    `;
  }).join('');
  plannerGrid.innerHTML = `
    <table class="w-full border-collapse text-left">
      <thead>
        <tr>
          <th class="px-3 py-3 text-xs uppercase tracking-[0.3em] text-slate-500">Time</th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `;
}

function renderGridCell(day, slot) {
  const events = planner.events
    .filter((event) => event.day === day && event.startSlot === slot)
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  const content = events.length
    ? events
        .map((event) => {
          const isSelected = event.id === selectedEventId;
          const duration = event.durationSlots || 1;
          const squad = planner.squads.find((s) => s.id === event.squadId);
          const squadName = squad?.name || 'Unassigned';
          return `
            <button
              type="button"
              data-event-id="${event.id}"
              class="event-card ${isSelected ? 'event-card--active' : ''}"
            >
              <span class="event-card__title">${event.title || 'Scrim'}</span>
              <span class="event-card__meta">${squadName} · ${slot} — ${duration}h</span>
            </button>
          `;
        })
        .join('')
    : '<div class="event-slot">Add</div>';
  return `<td data-day="${day}" data-slot="${slot}" class="align-top border-r border-white/5 px-2 py-3">${content}</td>`;
}

function renderSquads() {
  if (!squadList) return;
  if (!planner.squads.length) {
    squadList.innerHTML = '<div data-empty-state>No squads yet. Add one to manage roster assignments.</div>';
    return;
  }
  squadList.innerHTML = planner.squads
    .map((squad) => {
      const members = (squad.members || []).map((member) => {
        const subTag = member.isSub ? '<span data-chip data-tag-pink>Sub</span>' : '';
        return `
          <li class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <span>${member.name}${member.role ? ` · ${member.role}` : ''}</span>
            <div class="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">
              ${subTag}
              ${readOnlyMode ? '' : `<button type="button" data-toggle-sub data-squad="${squad.id}" data-member="${member.id}" class="text-brand-cyan-200 hover:text-brand-cyan-100">Toggle sub</button>`}
              ${readOnlyMode ? '' : `<button type="button" data-remove-member data-squad="${squad.id}" data-member="${member.id}" class="text-brand-pink-300 hover:text-brand-pink-200">Remove</button>`}
            </div>
          </li>
        `;
      }).join('');
      return `
        <article class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <header class="flex items-center justify-between">
            <h4 class="font-display text-lg text-white">${squad.name}</h4>
            ${readOnlyMode ? '' : `<button type="button" data-remove-squad="${squad.id}" class="text-xs uppercase tracking-[0.3em] text-brand-pink-300 hover:text-brand-pink-200">Delete</button>`}
          </header>
          <ul class="space-y-2 text-sm text-slate-300">${members || '<li class="text-xs text-slate-500">No members yet.</li>'}</ul>
          ${readOnlyMode ? '' : `<button type="button" data-add-member="${squad.id}" class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-200 hover:text-white">Add member</button>`}
        </article>
      `;
    })
    .join('');
}

function renderEventDetail() {
  if (!eventDetail || !eventDetailLabel) return;
  const event = planner.events.find((entry) => entry.id === selectedEventId);
  if (!event) {
    eventDetail.innerHTML = '<p>No scrim selected.</p>';
    eventDetailLabel.textContent = 'Select a scrim';
    return;
  }
  eventDetailLabel.textContent = `${event.day} · ${event.startSlot}`;
  const squadOptions = planner.squads
    .map((squad) => `<option value="${squad.id}" ${event.squadId === squad.id ? 'selected' : ''}>${squad.name}</option>`)
    .join('');
  const durationOptions = [1, 2, 3, 4].map((value) => `<option value="${value}" ${event.durationSlots === value ? 'selected' : ''}>${value} hour${value === 1 ? '' : 's'}</option>`).join('');
  const attendanceMarkup = renderAttendance(event);
  eventDetail.innerHTML = `
    <form data-event-editor class="space-y-4">
      <div>
        <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Title</label>
        <input type="text" name="title" value="${event.title || ''}" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" ${readOnlyMode ? 'disabled' : ''} />
      </div>
      <div class="grid gap-3 md:grid-cols-3">
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Day</label>
          <select name="day" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" ${readOnlyMode ? 'disabled' : ''}>
            ${DAYS.map((day) => `<option value="${day}" ${day === event.day ? 'selected' : ''}>${day}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Start</label>
          <select name="start" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" ${readOnlyMode ? 'disabled' : ''}>
            ${TIME_SLOTS.map((slot) => `<option value="${slot}" ${slot === event.startSlot ? 'selected' : ''}>${slot}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Duration</label>
          <select name="duration" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" ${readOnlyMode ? 'disabled' : ''}>
            ${durationOptions}
          </select>
        </div>
      </div>
      <div class="grid gap-3 md:grid-cols-2">
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Squad</label>
          <select name="squad" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" ${readOnlyMode ? 'disabled' : ''}>
            <option value="">Unassigned</option>
            ${squadOptions}
          </select>
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Opponent / Notes</label>
          <input type="text" name="opponent" value="${event.opponent || ''}" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" ${readOnlyMode ? 'disabled' : ''} />
        </div>
      </div>
      <div>
        <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Event notes</label>
        <textarea name="notes" class="mt-1 min-h-[120px] w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" ${readOnlyMode ? 'disabled' : ''}>${event.notes || ''}</textarea>
      </div>
      ${attendanceMarkup}
      <div class="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em]">
        ${readOnlyMode ? '' : '<button type="submit" class="rounded-2xl border border-brand-cyan-500/40 bg-brand-cyan-500/10 px-4 py-2 text-brand-cyan-200 hover:bg-brand-cyan-500 hover:text-base-950">Update event</button>'}
        ${readOnlyMode ? '' : `<button type="button" data-delete-event="${event.id}" class="rounded-2xl border border-brand-pink-500/40 bg-brand-pink-500/10 px-4 py-2 text-brand-pink-200 hover:bg-brand-pink-500 hover:text-base-950">Delete</button>`}
      </div>
    </form>
  `;
}

function renderAttendance(event) {
  const squad = planner.squads.find((entry) => entry.id === event.squadId);
  const members = squad?.members || [];
  if (!members.length) {
    return '<p class="text-xs text-slate-500">Assign a squad to manage attendance.</p>';
  }
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' }
  ];
  return `
    <div class="space-y-3">
      <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Attendance</p>
      <div class="space-y-2">
        ${members
          .map((member) => {
            const status = event.attendance?.[member.id] || 'pending';
            const options = statusOptions
              .map((option) => `<option value="${option.value}" ${status === option.value ? 'selected' : ''}>${option.label}</option>`)
              .join('');
            return `
              <label class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span>${member.name}${member.role ? ` · ${member.role}` : ''}</span>
                <select data-attendance="${member.id}" class="rounded-xl border border-white/10 bg-base-800/70 px-2 py-1 text-xs text-white" ${readOnlyMode ? 'disabled' : ''}>${options}</select>
              </label>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function updateNotesPreview() {
  if (!notesPreview) return;
  const content = (planner.notes || '').trim();
  if (!content) {
    notesPreview.textContent = 'No notes yet.';
    return;
  }
  notesPreview.innerHTML = content
    .split(/\n+/)
    .map((line) => `<div>${line || '&nbsp;'}</div>`)
    .join('');
}

function updateMetrics() {
  if (metricTotalEvents) {
    metricTotalEvents.textContent = String(planner.events.length);
  }
  if (metricAttendance) {
    const total = planner.events.reduce((acc, event) => {
      const attendance = event.attendance || {};
      const present = Object.values(attendance).filter((status) => status === 'present').length;
      return acc + present;
    }, 0);
    metricAttendance.textContent = String(total);
  }
  if (metricLastSaved) {
    if (!planner.lastSaved) {
      metricLastSaved.textContent = 'Not saved';
    } else {
      metricLastSaved.textContent = new Date(planner.lastSaved).toLocaleString();
    }
  }
}

function persistPlanner(mutator) {
  if (readOnlyMode) return;
  ignoreNextSync = true;
  withUserSection('planner', (section) => {
    const base = { ...createDefaultPlanner(), ...(section || {}), ...planner };
    const next = typeof mutator === 'function' ? mutator(base) : { ...base, ...mutator };
    next.lastSaved = Date.now();
    planner = clonePlanner(next);
    return next;
  });
  updateMetrics();
  setTimeout(() => {
    ignoreNextSync = false;
  }, 0);
}

function addEvent({ day, startSlot }) {
  const id = generateId('event');
  planner.events.push({
    id,
    day,
    startSlot,
    durationSlots: 1,
    title: 'Scrim vs ?',
    notes: '',
    attendance: {},
    createdAt: Date.now()
  });
  selectedEventId = id;
  persistPlanner((state) => ({ ...state, events: planner.events }));
  renderAll();
  showToast('Scrim created.');
}

function updateEvent(eventId, updates) {
  const index = planner.events.findIndex((event) => event.id === eventId);
  if (index === -1) return;
  planner.events[index] = { ...planner.events[index], ...updates, updatedAt: Date.now() };
  persistPlanner((state) => ({ ...state, events: planner.events }));
  renderAll();
  showToast('Event updated.');
}

function deleteEvent(eventId) {
  planner.events = planner.events.filter((event) => event.id !== eventId);
  if (selectedEventId === eventId) {
    selectedEventId = null;
  }
  persistPlanner((state) => ({ ...state, events: planner.events }));
  renderAll();
  showToast('Event removed.');
}

function addSquad(name) {
  const squad = { id: generateId('squad'), name, members: [] };
  planner.squads.push(squad);
  persistPlanner((state) => ({ ...state, squads: planner.squads }));
  renderAll();
  showToast(`Squad "${name}" added.`);
}

function removeSquad(id) {
  planner.squads = planner.squads.filter((squad) => squad.id !== id);
  persistPlanner((state) => ({ ...state, squads: planner.squads }));
  renderAll();
}

function addMember(squadId, member) {
  const squad = planner.squads.find((entry) => entry.id === squadId);
  if (!squad) return;
  squad.members = [...(squad.members || []), member];
  persistPlanner((state) => ({ ...state, squads: planner.squads }));
  renderAll();
}

function removeMember(squadId, memberId) {
  const squad = planner.squads.find((entry) => entry.id === squadId);
  if (!squad) return;
  squad.members = (squad.members || []).filter((member) => member.id !== memberId);
  persistPlanner((state) => ({ ...state, squads: planner.squads }));
  renderAll();
}

function toggleSubStatus(squadId, memberId) {
  const squad = planner.squads.find((entry) => entry.id === squadId);
  if (!squad) return;
  squad.members = (squad.members || []).map((member) =>
    member.id === memberId ? { ...member, isSub: !member.isSub } : member
  );
  persistPlanner((state) => ({ ...state, squads: planner.squads }));
  renderAll();
}

function handleGridClick(event) {
  const eventButton = event.target.closest('[data-event-id]');
  if (eventButton) {
    selectedEventId = eventButton.getAttribute('data-event-id');
    plannerChannel?.postMessage({ type: 'select', eventId: selectedEventId });
    renderGrid();
    renderEventDetail();
    return;
  }
  if (readOnlyMode) return;
  const cell = event.target.closest('td[data-day]');
  if (!cell) return;
  const day = cell.getAttribute('data-day');
  const slot = cell.getAttribute('data-slot');
  openEventDialog({ day, slot });
}

function openEventDialog({ day, slot, event }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;
  const backdrop = document.createElement('div');
  backdrop.setAttribute('data-modal-backdrop', '');
  const isEdit = Boolean(event);
  const squadOptions = planner.squads
    .map((squad) => `<option value="${squad.id}" ${event?.squadId === squad.id ? 'selected' : ''}>${squad.name}</option>`)
    .join('');
  const durationOptions = [1, 2, 3, 4]
    .map((value) => `<option value="${value}" ${value === (event?.durationSlots || 1) ? 'selected' : ''}>${value} hour${value === 1 ? '' : 's'}</option>`)
    .join('');
  backdrop.innerHTML = `
    <div data-modal-panel class="space-y-5">
      <header class="flex items-center justify-between">
        <h2 class="font-display text-2xl text-white">${isEdit ? 'Edit scrim' : 'New scrim'}</h2>
        <button type="button" data-close class="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white">Close</button>
      </header>
      <form class="space-y-4" data-event-form>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Title</label>
          <input type="text" name="title" value="${event?.title || ''}" required class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" />
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <div>
            <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Day</label>
            <select name="day" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500">
              ${DAYS.map((value) => `<option value="${value}" ${value === (event?.day || day) ? 'selected' : ''}>${value}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Start</label>
            <select name="start" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500">
              ${TIME_SLOTS.map((value) => `<option value="${value}" ${value === (event?.startSlot || slot) ? 'selected' : ''}>${value}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Duration</label>
            <select name="duration" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500">${durationOptions}</select>
          </div>
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Squad</label>
          <select name="squad" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500">
            <option value="">Unassigned</option>
            ${squadOptions}
          </select>
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Opponent / Notes</label>
          <input type="text" name="opponent" value="${event?.opponent || ''}" class="mt-1 w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500" />
        </div>
        <div>
          <label class="text-xs uppercase tracking-[0.3em] text-slate-400">Event notes</label>
          <textarea name="notes" class="mt-1 min-h-[120px] w-full rounded-2xl border border-white/10 bg-base-800/70 px-3 py-2 text-sm text-white focus:border-brand-cyan-500">${event?.notes || ''}</textarea>
        </div>
        <button type="submit" class="rounded-2xl border border-brand-cyan-500/40 bg-brand-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-cyan-200 hover:bg-brand-cyan-500 hover:text-base-950">${isEdit ? 'Update scrim' : 'Create scrim'}</button>
      </form>
    </div>
  `;
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelector('[data-close]')?.addEventListener('click', close);
  const form = backdrop.querySelector('[data-event-form]');
  form?.addEventListener('submit', (eventSubmit) => {
    eventSubmit.preventDefault();
    const formData = new FormData(form);
    const payload = {
      title: formData.get('title')?.toString() || 'Scrim',
      day: formData.get('day')?.toString() || day,
      startSlot: formData.get('start')?.toString() || slot,
      durationSlots: Number(formData.get('duration')) || 1,
      squadId: formData.get('squad')?.toString() || '',
      opponent: formData.get('opponent')?.toString() || '',
      notes: formData.get('notes')?.toString() || ''
    };
    if (isEdit) {
      updateEvent(event.id, payload);
    } else {
      const newEvent = {
        id: generateId('event'),
        day: payload.day,
        startSlot: payload.startSlot,
        durationSlots: payload.durationSlots,
        title: payload.title,
        squadId: payload.squadId,
        opponent: payload.opponent,
        notes: payload.notes,
        attendance: {},
        createdAt: Date.now()
      };
      planner.events.push(newEvent);
      selectedEventId = newEvent.id;
      persistPlanner((state) => ({ ...state, events: planner.events }));
      renderAll();
      showToast('Scrim created.');
    }
    close();
  });
  modalRoot.appendChild(backdrop);
}

function handleEventDetailSubmit(event) {
  event.preventDefault();
  const form = event.target.closest('form[data-event-editor]');
  if (!form || readOnlyMode) return;
  const formData = new FormData(form);
  const payload = {
    title: formData.get('title')?.toString() || 'Scrim',
    day: formData.get('day')?.toString() || DAYS[0],
    startSlot: formData.get('start')?.toString() || TIME_SLOTS[0],
    durationSlots: Number(formData.get('duration')) || 1,
    squadId: formData.get('squad')?.toString() || '',
    opponent: formData.get('opponent')?.toString() || '',
    notes: formData.get('notes')?.toString() || ''
  };
  updateEvent(selectedEventId, payload);
}

function handleAttendanceChange(event) {
  if (readOnlyMode) return;
  const select = event.target.closest('select[data-attendance]');
  if (!select || !selectedEventId) return;
  const memberId = select.getAttribute('data-attendance');
  const value = select.value;
  const eventIndex = planner.events.findIndex((entry) => entry.id === selectedEventId);
  if (eventIndex === -1) return;
  const attendance = { ...(planner.events[eventIndex].attendance || {}) };
  attendance[memberId] = value;
  planner.events[eventIndex].attendance = attendance;
  persistPlanner((state) => ({ ...state, events: planner.events }));
  updateMetrics();
}

function handleDeleteEvent(event) {
  if (readOnlyMode) return;
  const button = event.target.closest('[data-delete-event]');
  if (!button) return;
  const id = button.getAttribute('data-delete-event');
  deleteEvent(id);
}

let notesTimeout = null;
function handleNotesInput(event) {
  if (readOnlyMode) return;
  const value = event.target.value;
  planner.notes = value;
  updateNotesPreview();
  clearTimeout(notesTimeout);
  notesTimeout = setTimeout(() => {
    persistPlanner((state) => ({ ...state, notes: planner.notes }));
  }, 400);
}

function exportJson() {
  const payload = JSON.stringify({ version: 1, planner }, null, 2);
  downloadFile(`egl-planner-${Date.now()}.json`, payload, 'application/json');
  showToast('JSON export ready.');
}

function exportCsv() {
  const headers = ['Day', 'Start', 'DurationHours', 'Squad', 'Opponent', 'AttendancePresent', 'AttendanceAbsent'];
  const rows = planner.events.map((event) => {
    const squad = planner.squads.find((entry) => entry.id === event.squadId);
    const attendance = event.attendance || {};
    const present = Object.entries(attendance)
      .filter(([, status]) => status === 'present')
      .map(([memberId]) => getMemberName(memberId))
      .join(' | ');
    const absent = Object.entries(attendance)
      .filter(([, status]) => status === 'absent')
      .map(([memberId]) => getMemberName(memberId))
      .join(' | ');
    return [
      event.day,
      event.startSlot,
      event.durationSlots || 1,
      squad?.name || '',
      event.opponent || '',
      present,
      absent
    ];
  });
  const csv = [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
  downloadFile(`egl-planner-${Date.now()}.csv`, csv, 'text/csv');
  showToast('CSV export ready.');
}

function escapeCsv(value) {
  const stringValue = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
}

function downloadFile(filename, contents, mimeType) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getMemberName(memberId) {
  for (const squad of planner.squads) {
    const member = (squad.members || []).find((entry) => entry.id === memberId);
    if (member) return member.name;
  }
  return memberId;
}

function generateShareLink() {
  const payload = {
    version: 1,
    planner: {
      ...planner,
      lastSharedHash: Date.now()
    }
  };
  const encoded = encodeShare(payload);
  planner.lastSharedHash = payload.planner.lastSharedHash;
  persistPlanner((state) => ({ ...state, lastSharedHash: planner.lastSharedHash }));
  const url = new URL(window.location.href);
  url.hash = `${SHARE_PARAM}=${encoded}`;
  shareLinkInput.value = url.toString();
  shareStatus.textContent = 'Read-only share link generated. Anyone with the link sees this snapshot.';
  showToast('Share link generated.');
}

function encodeShare(payload) {
  const json = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeShare(value) {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(padded)));
    const data = JSON.parse(json);
    return data?.planner ? data.planner : null;
  } catch (error) {
    console.warn('[egl] failed to decode share link', error);
    return null;
  }
}

function applyShareFromHash() {
  const hash = window.location.hash;
  if (!hash.includes(`${SHARE_PARAM}=`)) return false;
  const value = hash.split(`${SHARE_PARAM}=`)[1];
  if (!value) return false;
  const sharedPlanner = decodeShare(value);
  if (!sharedPlanner) return false;
  planner = { ...createDefaultPlanner(), ...sharedPlanner };
  readOnlyMode = true;
  document.body.dataset.readonly = 'true';
  shareStatus.textContent = 'Viewing read-only snapshot.';
  disableInteractiveControls();
  return true;
}

function disableInteractiveControls() {
  const controls = [addEventButton, clearWeekButton, addSquadButton, exportJsonButton, exportCsvButton, generateShareButton, generateDiscordButton, notesInput];
  controls.forEach((control) => {
    if (control) control.disabled = true;
  });
}

function enableInteractiveControls() {
  const controls = [addEventButton, clearWeekButton, addSquadButton, exportJsonButton, exportCsvButton, generateShareButton, generateDiscordButton, notesInput];
  controls.forEach((control) => {
    if (control) control.disabled = false;
  });
}

function generateDiscordSummary() {
  if (!planner.events.length) {
    showToast('No scrims scheduled.', 'error');
    return;
  }
  const sorted = [...planner.events].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return TIME_SLOTS.indexOf(a.startSlot) - TIME_SLOTS.indexOf(b.startSlot);
  });
  const lines = sorted.map((event) => {
    const squad = planner.squads.find((entry) => entry.id === event.squadId);
    const attendance = event.attendance || {};
    const present = Object.entries(attendance)
      .filter(([, status]) => status === 'present')
      .map(([memberId]) => getMemberName(memberId));
    const absent = Object.entries(attendance)
      .filter(([, status]) => status === 'absent')
      .map(([memberId]) => getMemberName(memberId));
    const attendanceLine = [
      present.length ? `✅ ${present.join(', ')}` : null,
      absent.length ? `❌ ${absent.join(', ')}` : null
    ]
      .filter(Boolean)
      .join(' · ');
    return `- **${event.day} ${event.startSlot}** · ${event.title || 'Scrim'}${event.opponent ? ` vs ${event.opponent}` : ''} · ${squad?.name || 'Unassigned'}${attendanceLine ? ` (${attendanceLine})` : ''}`;
  });
  const summary = `**Team Strive Scrim Schedule**\n${lines.join('\n')}`;
  navigator.clipboard
    ?.writeText(summary)
    .then(() => showToast('Discord summary copied.'))
    .catch(() => {
      showToast('Failed to copy. Summary logged to console.', 'error');
      console.log(summary);
    });
}

function clearWeek() {
  planner.events = [];
  selectedEventId = null;
  persistPlanner((state) => ({ ...state, events: planner.events }));
  renderAll();
  showToast('Week cleared.');
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function renderAll() {
  renderGrid();
  renderSquads();
  renderEventDetail();
  updateMetrics();
  if (notesInput) {
    notesInput.value = planner.notes || '';
  }
  updateNotesPreview();
}

function restoreFromStorage(state) {
  if (!state) return;
  const next = { ...createDefaultPlanner(), ...state };
  planner = next;
  renderAll();
}

function init() {
  const shared = applyShareFromHash();
  if (!shared) {
    const userState = getUserState();
    planner = { ...createDefaultPlanner(), ...(userState.planner || {}) };
    enableInteractiveControls();
  }
  renderAll();
}

plannerGrid?.addEventListener('click', handleGridClick);
addEventButton?.addEventListener('click', () => {
  if (readOnlyMode) return;
  openEventDialog({ day: DAYS[0], slot: TIME_SLOTS[2] });
});
clearWeekButton?.addEventListener('click', () => {
  if (readOnlyMode) return;
  if (confirm('Clear all scrims for this week?')) {
    clearWeek();
  }
});
addSquadButton?.addEventListener('click', () => {
  if (readOnlyMode) return;
  const name = prompt('Squad name');
  if (!name) return;
  addSquad(name.trim());
});
exportJsonButton?.addEventListener('click', exportJson);
exportCsvButton?.addEventListener('click', exportCsv);
generateShareButton?.addEventListener('click', generateShareLink);
generateDiscordButton?.addEventListener('click', generateDiscordSummary);
notesInput?.addEventListener('input', handleNotesInput);

squadList?.addEventListener('click', (event) => {
  if (readOnlyMode) return;
  const removeSquadId = event.target.getAttribute('data-remove-squad');
  if (removeSquadId) {
    if (confirm('Delete this squad?')) {
      removeSquad(removeSquadId);
    }
    return;
  }
  const addMemberId = event.target.getAttribute('data-add-member');
  if (addMemberId) {
    const name = prompt('Member name');
    if (!name) return;
    const role = prompt('Role (optional)') || '';
    addMember(addMemberId, { id: generateId('member'), name: name.trim(), role: role.trim(), isSub: false });
    return;
  }
  const removeMemberSquad = event.target.getAttribute('data-remove-member');
  if (removeMemberSquad) {
    const squadId = event.target.getAttribute('data-squad');
    const memberId = event.target.getAttribute('data-member');
    removeMember(squadId, memberId);
    return;
  }
  const toggleSubId = event.target.getAttribute('data-toggle-sub');
  if (toggleSubId) {
    const squadId = event.target.getAttribute('data-squad');
    const memberId = event.target.getAttribute('data-member');
    toggleSubStatus(squadId, memberId);
  }
});

eventDetail?.addEventListener('submit', handleEventDetailSubmit);
eventDetail?.addEventListener('change', handleAttendanceChange);
eventDetail?.addEventListener('click', handleDeleteEvent);

window.addEventListener('hashchange', () => {
  if (applyShareFromHash()) {
    renderAll();
  }
});

subscribeUser(({ state }) => {
  if (readOnlyMode) return;
  if (ignoreNextSync) return;
  restoreFromStorage(state.planner);
});

init();
