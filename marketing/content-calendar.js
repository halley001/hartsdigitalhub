/* ============================================================
   HARTS — content-calendar.js
   Internal Instagram content planner (web dev + automation)
   Persistence: localStorage, same pattern as training.js
   ============================================================ */

const STORAGE_KEY = 'hdh_content_calendar';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' }
];

const PILLARS = ['Tutorial', 'Case Study', 'Myth-Bust', 'Behind-the-Scenes', 'Business Education', 'Tool Comparison'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DEFAULT_SLOTS = [
  { day: 'mon', title: 'Automation Tip', format: 'Carousel', pillar: 'Tutorial' },
  { day: 'wed', title: 'Case Study', format: 'Reel', pillar: 'Case Study' },
  { day: 'thu', title: 'Myth Busted', format: 'Reel', pillar: 'Myth-Bust' },
  { day: 'fri', title: 'Behind the Scenes Build', format: 'Reel', pillar: 'Behind-the-Scenes' }
];

let state = { weeks: {} };
let currentView = 'week';
let currentWeekMonday = mondayOf(new Date());
let currentMonthMonday = mondayOf(new Date());
let modalMode = 'add';
let modalWeekISO = null;
let modalDay = null;
let modalItemId = null;

/* ── Persistence ──────────────────────────────────────────── */
function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return (parsed && parsed.weeks) ? parsed : { weeks: {} };
  } catch {
    return { weeks: {} };
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ── Date helpers ─────────────────────────────────────────── */
function pad2(n) { return String(n).padStart(2, '0'); }
function toISODate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function addWeeks(date, n) { return addDays(date, n * 7); }
function genId() {
  return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
}
function formatWeekLabel(monday) {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const y = sunday.getFullYear();
  return sameMonth
    ? `${MONTHS[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()}, ${y}`
    : `${MONTHS[monday.getMonth()]} ${monday.getDate()} – ${MONTHS[sunday.getMonth()]} ${sunday.getDate()}, ${y}`;
}
function formatMonthLabel(blockStart) {
  const blockEnd = addDays(blockStart, 27);
  return `${MONTHS[blockStart.getMonth()]} ${blockStart.getDate()} – ${MONTHS[blockEnd.getMonth()]} ${blockEnd.getDate()}, ${blockEnd.getFullYear()}`;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ── Week data ────────────────────────────────────────────── */
function ensureWeek(mondayISO) {
  if (!state.weeks[mondayISO]) {
    const stories = {};
    DAYS.forEach(d => stories[d.key] = '');
    const items = DEFAULT_SLOTS.map(s => ({
      id: genId(), day: s.day, title: s.title, format: s.format, pillar: s.pillar,
      status: 'Idea', caption: '', notes: ''
    }));
    state.weeks[mondayISO] = { stories, items };
    saveState();
  }
  return state.weeks[mondayISO];
}

/* ── Rendering: week view ─────────────────────────────────── */
function renderWeekView() {
  const monday = currentWeekMonday;
  const iso = toISODate(monday);
  const week = ensureWeek(iso);
  document.getElementById('cc-week-label').textContent = formatWeekLabel(monday);

  const grid = document.getElementById('cc-week-grid');
  grid.innerHTML = '';
  const realToday = new Date();
  realToday.setHours(0, 0, 0, 0);

  DAYS.forEach((d, idx) => {
    const dateObj = addDays(monday, idx);
    const col = document.createElement('div');
    col.className = 'cc-day-col';
    col.dataset.day = d.key;
    if (dateObj.getTime() === realToday.getTime()) col.classList.add('cc-today');

    col.innerHTML = `
      <div class="cc-day-head">
        <span class="cc-day-name">${d.label}</span>
        <span class="cc-day-date">${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}</span>
      </div>
      <div class="cc-story-field">
        <label for="story-${d.key}">Story idea</label>
        <input type="text" class="cc-story-input" id="story-${d.key}" data-day="${d.key}" placeholder="Quick story idea…" value="${escapeHtml(week.stories[d.key] || '')}">
      </div>
      <div class="cc-day-cards" data-day="${d.key}"></div>
      <button type="button" class="cc-add-card-btn" data-day="${d.key}">+ Add content</button>
    `;
    grid.appendChild(col);

    const cardsWrap = col.querySelector('.cc-day-cards');
    week.items.filter(it => it.day === d.key).forEach(item => cardsWrap.appendChild(renderCard(item)));

    cardsWrap.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('cc-drag-over'); });
    cardsWrap.addEventListener('dragleave', () => col.classList.remove('cc-drag-over'));
    cardsWrap.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('cc-drag-over');
      const id = e.dataTransfer.getData('text/plain');
      moveItemToDay(iso, id, d.key);
    });
  });
}

function renderCard(item) {
  const card = document.createElement('article');
  card.className = 'cc-card';
  card.draggable = true;
  card.dataset.id = item.id;
  card.innerHTML = `
    <div class="cc-card-top">
      <span class="cc-pillar-tag">${escapeHtml(item.pillar)}</span>
      <span class="cc-status-dot" data-status="${item.status}" title="${escapeHtml(item.status)}"></span>
    </div>
    <h3 class="cc-card-title">${escapeHtml(item.title || 'Untitled')}</h3>
    <span class="cc-format-tag">${escapeHtml(item.format)}</span>
  `;
  card.addEventListener('dragstart', e => {
    card.classList.add('cc-dragging');
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', () => card.classList.remove('cc-dragging'));
  card.addEventListener('click', () => openModal('edit', item.day, item.id));
  return card;
}

function moveItemToDay(weekISO, itemId, newDay) {
  const week = state.weeks[weekISO];
  if (!week) return;
  const item = week.items.find(i => i.id === itemId);
  if (!item || item.day === newDay) return;
  item.day = newDay;
  saveState();
  renderWeekView();
}

/* ── Rendering: 4-week rotation view ──────────────────────── */
function renderMonthView() {
  document.getElementById('cc-month-label').textContent = formatMonthLabel(currentMonthMonday);
  const weeksData = [];
  for (let i = 0; i < 4; i++) {
    const monday = addWeeks(currentMonthMonday, i);
    const iso = toISODate(monday);
    weeksData.push({ monday, iso, week: ensureWeek(iso) });
  }
  renderPillarBalance(weeksData);
  renderMonthWeeks(weeksData);
}

function renderPillarBalance(weeksData) {
  const counts = {};
  PILLARS.forEach(p => counts[p] = 0);
  let total = 0;
  weeksData.forEach(w => w.week.items.forEach(it => {
    if (counts[it.pillar] !== undefined) { counts[it.pillar]++; total++; }
  }));
  const nonZero = PILLARS.map(p => counts[p]).filter(c => c > 0);
  const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
  const maxCount = Math.max(1, ...PILLARS.map(p => counts[p]));

  const wrap = document.getElementById('cc-pillar-bars');
  wrap.innerHTML = '';
  PILLARS.forEach(p => {
    const count = counts[p];
    let flagClass = '', flagText = '';
    if (total > 0) {
      if (count === 0) { flagClass = 'cc-flag-under'; flagText = 'none scheduled'; }
      else if (avg > 0 && count > avg * 1.5) { flagClass = 'cc-flag-over'; flagText = 'heavy'; }
    }
    const row = document.createElement('div');
    row.className = 'cc-pillar-bar-row' + (flagClass ? ' ' + flagClass : '');
    row.innerHTML = `
      <span class="cc-pillar-bar-label">${escapeHtml(p)}${flagText ? `<span class="cc-flag-note">${flagText}</span>` : ''}</span>
      <span class="cc-pillar-bar-track"><span class="cc-pillar-bar-fill" style="width:${Math.round(count / maxCount * 100)}%"></span></span>
      <span class="cc-pillar-bar-count">${count}</span>
    `;
    wrap.appendChild(row);
  });
}

function renderMonthWeeks(weeksData) {
  const wrap = document.getElementById('cc-month-weeks');
  wrap.innerHTML = '';
  weeksData.forEach(({ monday, week }) => {
    const row = document.createElement('div');
    row.className = 'cc-mini-week';
    const itemsHtml = week.items.length
      ? week.items.map(it => `<span class="cc-mini-item"><span class="cc-status-dot" data-status="${it.status}"></span>${escapeHtml(it.title || 'Untitled')}</span>`).join('')
      : '<span class="cc-mini-item">No content yet</span>';
    row.innerHTML = `
      <div class="cc-mini-week-head">
        <span class="cc-mini-week-label">${formatWeekLabel(monday)}</span>
        <span class="cc-mini-week-count">${week.items.length} item${week.items.length === 1 ? '' : 's'}</span>
      </div>
      <div class="cc-mini-week-items">${itemsHtml}</div>
    `;
    row.addEventListener('click', () => {
      currentWeekMonday = monday;
      switchView('week');
    });
    wrap.appendChild(row);
  });
}

/* ── View switching / navigation ──────────────────────────── */
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.cc-view-btn').forEach(b => {
    const active = b.dataset.view === view;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  document.getElementById('cc-week-view').style.display = view === 'week' ? '' : 'none';
  document.getElementById('cc-month-view').style.display = view === 'month' ? '' : 'none';
  document.getElementById('cc-week-controls').style.display = view === 'week' ? '' : 'none';
  document.getElementById('cc-month-controls').style.display = view === 'month' ? '' : 'none';
  renderCurrentView();
}
function renderCurrentView() {
  if (currentView === 'week') renderWeekView(); else renderMonthView();
}

/* ── Modal (add / edit / delete) ──────────────────────────── */
function openModal(mode, day, itemId) {
  modalMode = mode;
  modalWeekISO = toISODate(currentWeekMonday);
  modalDay = day;
  modalItemId = itemId || null;

  const form = document.getElementById('cc-item-form');
  form.reset();
  document.getElementById('cc-delete-btn').style.display = mode === 'edit' ? '' : 'none';
  document.getElementById('cc-modal-title').textContent = mode === 'edit' ? 'Edit Content' : 'Add Content';
  document.getElementById('cc-f-day').value = day;

  if (mode === 'edit') {
    const week = ensureWeek(modalWeekISO);
    const item = week.items.find(i => i.id === itemId);
    if (item) {
      document.getElementById('cc-f-title').value = item.title;
      document.getElementById('cc-f-format').value = item.format;
      document.getElementById('cc-f-pillar').value = item.pillar;
      document.getElementById('cc-f-status').value = item.status;
      document.getElementById('cc-f-caption').value = item.caption;
      document.getElementById('cc-f-notes').value = item.notes;
    }
  } else {
    document.getElementById('cc-f-status').value = 'Idea';
  }

  const backdrop = document.getElementById('cc-modal-backdrop');
  backdrop.classList.add('active');
  document.getElementById('cc-f-title').focus();
}
function closeModal() {
  document.getElementById('cc-modal-backdrop').classList.remove('active');
}

function handleFormSubmit(e) {
  e.preventDefault();
  const week = ensureWeek(modalWeekISO);
  const data = {
    title: document.getElementById('cc-f-title').value.trim() || 'Untitled',
    format: document.getElementById('cc-f-format').value,
    pillar: document.getElementById('cc-f-pillar').value,
    status: document.getElementById('cc-f-status').value,
    day: document.getElementById('cc-f-day').value,
    caption: document.getElementById('cc-f-caption').value,
    notes: document.getElementById('cc-f-notes').value
  };
  if (modalMode === 'edit' && modalItemId) {
    const item = week.items.find(i => i.id === modalItemId);
    if (item) Object.assign(item, data);
  } else {
    week.items.push({ id: genId(), ...data });
  }
  saveState();
  closeModal();
  renderCurrentView();
}

function handleDelete() {
  if (!modalItemId) return;
  const week = state.weeks[modalWeekISO];
  if (week) week.items = week.items.filter(i => i.id !== modalItemId);
  saveState();
  closeModal();
  renderCurrentView();
}

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  state = loadState();

  document.querySelectorAll('.cc-view-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('cc-prev-week').addEventListener('click', () => {
    currentWeekMonday = addWeeks(currentWeekMonday, -1);
    renderWeekView();
  });
  document.getElementById('cc-next-week').addEventListener('click', () => {
    currentWeekMonday = addWeeks(currentWeekMonday, 1);
    renderWeekView();
  });
  document.getElementById('cc-today-btn').addEventListener('click', () => {
    currentWeekMonday = mondayOf(new Date());
    renderWeekView();
  });
  document.getElementById('cc-prev-month').addEventListener('click', () => {
    currentMonthMonday = addWeeks(currentMonthMonday, -4);
    renderMonthView();
  });
  document.getElementById('cc-next-month').addEventListener('click', () => {
    currentMonthMonday = addWeeks(currentMonthMonday, 4);
    renderMonthView();
  });

  const grid = document.getElementById('cc-week-grid');
  grid.addEventListener('input', e => {
    if (e.target.classList.contains('cc-story-input')) {
      const week = ensureWeek(toISODate(currentWeekMonday));
      week.stories[e.target.dataset.day] = e.target.value;
      saveState();
    }
  });
  grid.addEventListener('click', e => {
    const addBtn = e.target.closest('.cc-add-card-btn');
    if (addBtn) openModal('add', addBtn.dataset.day, null);
  });

  const backdrop = document.getElementById('cc-modal-backdrop');
  document.getElementById('cc-modal-close').addEventListener('click', closeModal);
  document.getElementById('cc-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('cc-delete-btn').addEventListener('click', handleDelete);
  document.getElementById('cc-item-form').addEventListener('submit', handleFormSubmit);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.classList.contains('active')) closeModal();
  });

  switchView('week');
});
