/* ── Spectra frontend — vanilla JS SPA ─────────────────────────────────── */

const API = '';   // same origin

// ── Router ────────────────────────────────────────────────────────────────
let currentPage = 'dashboard';

function navigate(page) {
  // stop breathing animation when leaving safe mode
  if (currentPage === 'safemode' && page !== 'safemode') {
    breathingActive = false;
    clearTimeout(breathTick);
  }
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    const pages = ['dashboard', 'diary', 'meltdown', 'scripts', 'safemode'];
    btn.classList.toggle('active', pages[i] === page);
  });
  render();
}

function render() {
  const main = document.getElementById('main-content');
  if (currentPage === 'dashboard') renderDashboard(main);
  else if (currentPage === 'diary')  renderDiary(main);
  else if (currentPage === 'meltdown') renderMeltdown(main);
  else if (currentPage === 'scripts')  renderScripts(main);
  else if (currentPage === 'safemode') renderSafeMode(main);
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ── API helpers ────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ── Constants ──────────────────────────────────────────────────────────────
const SENSORY_TYPES = [
  { id: 'sound',          label: 'Sound',       emoji: '🔊' },
  { id: 'light',          label: 'Light',       emoji: '💡' },
  { id: 'smell',          label: 'Smell',       emoji: '👃' },
  { id: 'touch',          label: 'Touch',       emoji: '🤚' },
  { id: 'temperature',    label: 'Temp',        emoji: '🌡️' },
  { id: 'taste',          label: 'Taste',       emoji: '👅' },
  { id: 'vestibular',     label: 'Movement',    emoji: '🌀' },
  { id: 'proprioception', label: 'Body Sense',  emoji: '🦴' },
];

const MELTDOWN_TYPES = [
  { id: 'meltdown',  label: 'Meltdown',       emoji: '🌋' },
  { id: 'shutdown',  label: 'Shutdown',        emoji: '🌑' },
  { id: 'overload',  label: 'Sensory Overload',emoji: '⚡' },
];

const SITUATION_TYPES = [
  { id: 'workplace_accommodation', label: '🏢 Workplace Accommodation' },
  { id: 'medical_appointment',     label: '🏥 Medical Appointment' },
  { id: 'family_conversation',     label: '👨‍👩‍👧 Family Conversation' },
  { id: 'social_situation',        label: '👥 Social Situation' },
  { id: 'school_accommodation',    label: '🎓 School / University' },
  { id: 'service_provider',        label: '📞 Service Provider' },
  { id: 'healthcare_provider',     label: '💊 Healthcare Provider' },
  { id: 'other',                   label: '✏️ Other' },
];

function sensoryEmoji(type) {
  return (SENSORY_TYPES.find(t => t.id === type) || {}).emoji || '❓';
}
function meltdownEmoji(type) {
  return (MELTDOWN_TYPES.find(t => t.id === type) || {}).emoji || '❓';
}

function intensityBadge(n) {
  if (n <= 3) return `<span class="badge badge-low">Low ${n}/10</span>`;
  if (n <= 6) return `<span class="badge badge-mid">Moderate ${n}/10</span>`;
  return `<span class="badge badge-high">High ${n}/10</span>`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function barColor(val, max = 10) {
  const pct = val / max;
  if (pct < .4) return '#10B981';
  if (pct < .7) return '#F59E0B';
  return '#EF4444';
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
async function renderDashboard(el) {
  el.innerHTML = `
    <p class="dashboard-greeting">👋 Welcome back to Spectra</p>
    <p class="dashboard-sub">Here's a snapshot of your sensory patterns and recent activity.</p>
    <div id="dash-body"><p class="text-muted">Loading insights…</p></div>
  `;
  try {
    const data = await api('/api/insights');
    const { totals, sensory_summary, meltdown_summary } = data;

    const topSensory = sensory_summary[0];
    const topMeltdown = meltdown_summary.sort((a,b) => b.count - a.count)[0];

    document.getElementById('dash-body').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num">${totals.diary}</div>
          <div class="stat-label">Sensory Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${totals.meltdown}</div>
          <div class="stat-label">Meltdown Events</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${totals.scripts}</div>
          <div class="stat-label">Scripts Generated</div>
        </div>
      </div>

      <div class="insight-row">
        <div class="card">
          <div class="card-title">📊 Top Sensory Triggers</div>
          ${sensory_summary.length === 0
            ? `<p class="text-muted">No diary entries yet.</p>`
            : sensory_summary.map(s => `
              <div class="sensory-bar-wrap">
                <div class="sensory-bar-label">
                  <span>${sensoryEmoji(s.sensory_type)} ${s.sensory_type}</span>
                  <span style="font-weight:600">${s.avg_intensity}/10</span>
                </div>
                <div class="sensory-bar-track">
                  <div class="sensory-bar-fill" style="width:${s.avg_intensity*10}%;background:${barColor(s.avg_intensity)}"></div>
                </div>
              </div>`).join('')
          }
        </div>

        <div class="card">
          <div class="card-title">🌊 Meltdown Patterns</div>
          ${meltdown_summary.length === 0
            ? `<p class="text-muted">No meltdown events logged yet.</p>`
            : meltdown_summary.map(m => `
              <div class="sensory-bar-wrap">
                <div class="sensory-bar-label">
                  <span>${meltdownEmoji(m.event_type)} ${m.event_type}</span>
                  <span style="font-weight:600">${m.count} event${m.count !== 1 ? 's' : ''} · avg ${m.avg_severity}/10</span>
                </div>
                <div class="sensory-bar-track">
                  <div class="sensory-bar-fill" style="width:${m.avg_severity*10}%;background:${barColor(m.avg_severity)}"></div>
                </div>
              </div>`).join('')
          }

          ${totals.meltdown === 0 ? '' : `
          <div class="divider"></div>
          <div class="flex-between">
            <span class="text-muted">Total logged events</span>
            <strong>${totals.meltdown}</strong>
          </div>`}
        </div>
      </div>

      ${topSensory ? `
      <div class="card mt-4" style="border-left:4px solid var(--primary)">
        <div class="card-title">✦ Spectra Insight</div>
        <p style="font-size:14px;line-height:1.7">
          Your most intense sensory experience is <strong>${sensoryEmoji(topSensory.sensory_type)} ${topSensory.sensory_type}</strong>
          with an average intensity of <strong>${topSensory.avg_intensity}/10</strong>.
          ${totals.meltdown > 0 ? `You've logged <strong>${totals.meltdown}</strong> meltdown events. ` : ''}
          Use the <strong>Script Generator</strong> to communicate your needs to others. ✦
        </p>
      </div>` : ''}
    `;
  } catch (e) {
    document.getElementById('dash-body').innerHTML = `<p class="text-danger">Failed to load insights: ${e.message}</p>`;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SENSORY DIARY
// ════════════════════════════════════════════════════════════════════════════
let diaryTab = 'log';
let diaryEntries = [];
let selectedType = 'sound';
let diaryIntensity = 5;

async function renderDiary(el) {
  el.innerHTML = `
    <div class="inner-tabs">
      <button class="inner-tab ${diaryTab==='log'?'active':''}" onclick="switchDiaryTab('log')">📝 Log Entry</button>
      <button class="inner-tab ${diaryTab==='history'?'active':''}" onclick="switchDiaryTab('history')">📋 History</button>
    </div>
    <div id="diary-content"></div>
  `;
  renderDiaryContent();
  loadDiaryEntries();
}

function switchDiaryTab(tab) {
  diaryTab = tab;
  document.querySelectorAll('.inner-tab').forEach((b, i) => b.classList.toggle('active', ['log','history'][i] === tab));
  renderDiaryContent();
}

function renderDiaryContent() {
  const el = document.getElementById('diary-content');
  if (!el) return;
  if (diaryTab === 'log') renderDiaryForm(el);
  else renderDiaryHistory(el);
}

function renderDiaryForm(el) {
  el.innerHTML = `
    <div class="card">
      <div class="card-title">📓 Log a Sensory Experience</div>
      <div class="form-section">

        <div class="form-group">
          <label class="form-label">What sensory type?</label>
          <div class="type-grid" id="type-grid">
            ${SENSORY_TYPES.map(t => `
              <button class="type-btn ${t.id===selectedType?'active':''}" onclick="selectType('${t.id}')">
                <span class="type-emoji">${t.emoji}</span>
                ${t.label}
              </button>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Intensity: <span id="intensity-display">${diaryIntensity}</span>/10</label>
          <div class="slider-wrap">
            <span style="font-size:18px">🟢</span>
            <input type="range" class="slider" min="1" max="10" value="${diaryIntensity}"
              id="intensity-slider" oninput="updateIntensity(this.value)" />
            <span style="font-size:18px">🔴</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Location (optional)</label>
          <input type="text" class="form-input" id="d-location" placeholder="e.g. Office desk, grocery store…" />
        </div>

        <div class="form-group">
          <label class="form-label">Description (optional)</label>
          <textarea class="form-textarea" id="d-description" placeholder="Describe what you experienced…"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">How did it affect your functioning? (optional)</label>
          <input type="text" class="form-input" id="d-impact" placeholder="e.g. Couldn't concentrate, had to leave…" />
        </div>

        <div class="form-group">
          <label class="form-label">Duration (minutes, optional)</label>
          <input type="number" class="form-input" id="d-duration" placeholder="e.g. 30" min="1" style="max-width:160px" />
        </div>

        <button class="btn btn-primary" onclick="submitDiaryEntry()" id="diary-submit-btn">
          ✦ Log Entry
        </button>
      </div>
    </div>
  `;
}

function selectType(id) {
  selectedType = id;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().startsWith(SENSORY_TYPES.find(t=>t.id===id).emoji));
  });
  // re-render grid cleanly
  document.getElementById('type-grid').querySelectorAll('.type-btn').forEach((b, i) => {
    b.classList.toggle('active', SENSORY_TYPES[i].id === id);
  });
}

function updateIntensity(val) {
  diaryIntensity = +val;
  document.getElementById('intensity-display').textContent = val;
}

async function submitDiaryEntry() {
  const btn = document.getElementById('diary-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Logging…';

  const payload = {
    sensory_type: selectedType,
    intensity: diaryIntensity,
    location: document.getElementById('d-location').value.trim() || null,
    description: document.getElementById('d-description').value.trim() || null,
    functional_impact: document.getElementById('d-impact').value.trim() || null,
    duration_minutes: +document.getElementById('d-duration').value || null,
  };

  try {
    await api('/api/diary', { method: 'POST', body: JSON.stringify(payload) });
    toast('✦ Sensory entry logged!');
    await loadDiaryEntries();
    switchDiaryTab('history');
  } catch (e) {
    toast('Error: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '✦ Log Entry';
  }
}

async function loadDiaryEntries() {
  try { diaryEntries = await api('/api/diary'); }
  catch (e) { diaryEntries = []; }
  if (diaryTab === 'history') renderDiaryHistory(document.getElementById('diary-content'));
}

function renderDiaryHistory(el) {
  if (!el) return;
  el.innerHTML = `
    <div class="card">
      <div class="card-title flex-between">
        <span>📋 Sensory Diary — ${diaryEntries.length} entries</span>
        <button class="btn btn-ghost btn-sm" onclick="switchDiaryTab('log')">+ New Entry</button>
      </div>
      ${diaryEntries.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📓</div>No entries yet. Log your first sensory experience!</div>`
        : `<div class="entry-list">${diaryEntries.map(e => `
          <div class="entry-item">
            <span class="entry-icon">${sensoryEmoji(e.sensory_type)}</span>
            <div class="entry-body">
              <div class="entry-title flex-between">
                <span>${e.sensory_type.charAt(0).toUpperCase()+e.sensory_type.slice(1)} ${e.location ? '· '+e.location : ''}</span>
                ${intensityBadge(e.intensity)}
              </div>
              <div class="entry-meta">
                <span>🕐 ${fmtDate(e.created_at)}</span>
                ${e.duration_minutes ? `<span>⏱ ${e.duration_minutes} min</span>` : ''}
              </div>
              ${e.description ? `<div class="entry-desc">${e.description}</div>` : ''}
              ${e.functional_impact ? `<div class="entry-desc" style="color:var(--warning);margin-top:3px">⚠️ ${e.functional_impact}</div>` : ''}
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteDiary(${e.id})">✕</button>
          </div>`).join('')}
        </div>`
      }
    </div>
  `;
}

async function deleteDiary(id) {
  await api(`/api/diary/${id}`, { method: 'DELETE' });
  toast('Entry removed');
  await loadDiaryEntries();
}

// ════════════════════════════════════════════════════════════════════════════
// MELTDOWN LOG
// ════════════════════════════════════════════════════════════════════════════
let meltdownTab = 'log';
let meltdownEntries = [];
let selectedEventType = 'meltdown';
let meltdownSeverity = 5;

async function renderMeltdown(el) {
  el.innerHTML = `
    <div class="inner-tabs">
      <button class="inner-tab ${meltdownTab==='log'?'active':''}" onclick="switchMeltdownTab('log')">📝 Log Event</button>
      <button class="inner-tab ${meltdownTab==='history'?'active':''}" onclick="switchMeltdownTab('history')">📋 History</button>
    </div>
    <div id="meltdown-content"></div>
  `;
  renderMeltdownContent();
  loadMeltdownEntries();
}

function switchMeltdownTab(tab) {
  meltdownTab = tab;
  document.querySelectorAll('.inner-tab').forEach((b, i) => b.classList.toggle('active', ['log','history'][i] === tab));
  renderMeltdownContent();
}

function renderMeltdownContent() {
  const el = document.getElementById('meltdown-content');
  if (!el) return;
  if (meltdownTab === 'log') renderMeltdownForm(el);
  else renderMeltdownHistory(el);
}

function renderMeltdownForm(el) {
  el.innerHTML = `
    <div class="card">
      <div class="card-title">🌊 Log a Meltdown / Shutdown Event</div>
      <p class="text-muted mb-4" style="font-size:13px">This is a safe space. Logging this helps identify patterns and triggers over time.</p>
      <div class="form-section">

        <div class="form-group">
          <label class="form-label">Type of event</label>
          <div class="type-grid" id="event-type-grid" style="grid-template-columns:repeat(3,1fr)">
            ${MELTDOWN_TYPES.map(t => `
              <button class="type-btn ${t.id===selectedEventType?'active':''}" onclick="selectEventType('${t.id}')">
                <span class="type-emoji">${t.emoji}</span>
                ${t.label}
              </button>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Severity: <span id="severity-display">${meltdownSeverity}</span>/10</label>
          <div class="slider-wrap">
            <span style="font-size:18px">🟢</span>
            <input type="range" class="slider" min="1" max="10" value="${meltdownSeverity}"
              id="severity-slider" oninput="updateSeverity(this.value)" />
            <span style="font-size:18px">🔴</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Duration (minutes, optional)</label>
          <input type="number" class="form-input" id="m-duration" placeholder="e.g. 45" min="1" style="max-width:160px" />
        </div>

        <div class="form-group">
          <label class="form-label">What triggered this? (optional)</label>
          <textarea class="form-textarea" id="m-triggers" placeholder="e.g. Fluorescent lights + unexpected loud noise + difficult meeting…"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Description of what happened (optional)</label>
          <textarea class="form-textarea" id="m-description" placeholder="Describe what you experienced during the event…"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">What helped you recover? (optional)</label>
          <input type="text" class="form-input" id="m-helped" placeholder="e.g. Quiet dark room, noise-cancelling headphones, weighted blanket…" />
        </div>

        <div class="form-group">
          <label class="form-label">Recovery time (minutes, optional)</label>
          <input type="number" class="form-input" id="m-recovery" placeholder="e.g. 120" min="1" style="max-width:160px" />
        </div>

        <button class="btn btn-primary" onclick="submitMeltdownEntry()" id="meltdown-submit-btn">
          ✦ Log Event
        </button>
      </div>
    </div>
  `;
}

function selectEventType(id) {
  selectedEventType = id;
  document.getElementById('event-type-grid').querySelectorAll('.type-btn').forEach((b, i) => {
    b.classList.toggle('active', MELTDOWN_TYPES[i].id === id);
  });
}

function updateSeverity(val) {
  meltdownSeverity = +val;
  document.getElementById('severity-display').textContent = val;
}

async function submitMeltdownEntry() {
  const btn = document.getElementById('meltdown-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Logging…';

  const payload = {
    event_type: selectedEventType,
    severity: meltdownSeverity,
    duration_minutes: +document.getElementById('m-duration').value || null,
    triggers: document.getElementById('m-triggers').value.trim() || null,
    description: document.getElementById('m-description').value.trim() || null,
    what_helped: document.getElementById('m-helped').value.trim() || null,
    recovery_time_minutes: +document.getElementById('m-recovery').value || null,
  };

  try {
    await api('/api/meltdown', { method: 'POST', body: JSON.stringify(payload) });
    toast('✦ Event logged');
    await loadMeltdownEntries();
    switchMeltdownTab('history');
  } catch (e) {
    toast('Error: ' + e.message);
    btn.disabled = false;
    btn.innerHTML = '✦ Log Event';
  }
}

async function loadMeltdownEntries() {
  try { meltdownEntries = await api('/api/meltdown'); }
  catch (e) { meltdownEntries = []; }
  if (meltdownTab === 'history') renderMeltdownHistory(document.getElementById('meltdown-content'));
}

function renderMeltdownHistory(el) {
  if (!el) return;
  el.innerHTML = `
    <div class="card">
      <div class="card-title flex-between">
        <span>📋 Meltdown Log — ${meltdownEntries.length} events</span>
        <button class="btn btn-ghost btn-sm" onclick="switchMeltdownTab('log')">+ Log Event</button>
      </div>
      ${meltdownEntries.length === 0
        ? `<div class="empty-state"><div class="empty-icon">🌊</div>No events logged yet. This is a safe space to track your experiences.</div>`
        : `<div class="entry-list">${meltdownEntries.map(e => `
          <div class="entry-item">
            <span class="entry-icon">${meltdownEmoji(e.event_type)}</span>
            <div class="entry-body">
              <div class="entry-title flex-between">
                <span>${e.event_type.charAt(0).toUpperCase()+e.event_type.slice(1)}</span>
                ${intensityBadge(e.severity)}
              </div>
              <div class="entry-meta">
                <span>🕐 ${fmtDate(e.created_at)}</span>
                ${e.duration_minutes ? `<span>⏱ ${e.duration_minutes} min</span>` : ''}
                ${e.recovery_time_minutes ? `<span>💚 Recovered in ${e.recovery_time_minutes} min</span>` : ''}
              </div>
              ${e.triggers ? `<div class="entry-desc">⚡ <strong>Triggers:</strong> ${e.triggers}</div>` : ''}
              ${e.description ? `<div class="entry-desc">${e.description}</div>` : ''}
              ${e.what_helped ? `<div class="entry-desc" style="color:var(--success)">✅ <strong>Helped:</strong> ${e.what_helped}</div>` : ''}
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteMeltdown(${e.id})">✕</button>
          </div>`).join('')}
        </div>`
      }
    </div>
  `;
}

async function deleteMeltdown(id) {
  await api(`/api/meltdown/${id}`, { method: 'DELETE' });
  toast('Entry removed');
  await loadMeltdownEntries();
}

// ════════════════════════════════════════════════════════════════════════════
// SCRIPT GENERATOR
// ════════════════════════════════════════════════════════════════════════════
let selectedSituation = 'workplace_accommodation';
let scriptResult = null;
let scriptTab = 'generate';

async function renderScripts(el) {
  el.innerHTML = `
    <div class="inner-tabs">
      <button class="inner-tab ${scriptTab==='generate'?'active':''}" onclick="switchScriptTab('generate')">✨ Generate</button>
      <button class="inner-tab ${scriptTab==='history'?'active':''}" onclick="switchScriptTab('history')">📋 History</button>
    </div>
    <div id="script-content"></div>
  `;
  renderScriptContent();
}

function switchScriptTab(tab) {
  scriptTab = tab;
  document.querySelectorAll('.inner-tab').forEach((b, i) => b.classList.toggle('active', ['generate','history'][i] === tab));
  renderScriptContent();
  if (tab === 'history') loadScriptHistory();
}

function renderScriptContent() {
  const el = document.getElementById('script-content');
  if (!el) return;
  if (scriptTab === 'generate') renderScriptForm(el);
  else renderScriptHistoryView(el);
}

function renderScriptForm(el) {
  el.innerHTML = `
    <div class="card">
      <div class="card-title">✍️ AI Script Generator</div>
      <p class="text-muted mb-4" style="font-size:13px">
        Tell Spectra what you need to communicate — in your own words, as messy as needed.
        Claude will transform it into a clear, professional script tailored to your situation.
      </p>

      <div class="form-section">
        <div class="form-group">
          <label class="form-label">What kind of situation is this?</label>
          <div class="situation-grid">
            ${SITUATION_TYPES.map(s => `
              <button class="situation-btn ${s.id===selectedSituation?'active':''}" onclick="selectSituation('${s.id}')">
                ${s.label}
              </button>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Describe what you need to say — no filter needed</label>
          <textarea class="form-textarea" id="script-prompt" rows="5"
            placeholder="e.g. I need to ask my manager Sarah to move my desk. The lights and breakroom noise are giving me migraines and causing shutdowns. I'm scared she'll think I'm not a team player."
            style="min-height:130px"></textarea>
        </div>

        <button class="btn btn-primary" onclick="generateScript()" id="gen-btn" style="align-self:flex-start">
          ✦ Generate Script with Claude
        </button>
      </div>

      <div id="script-output-area"></div>
    </div>
  `;

  if (scriptResult) displayScriptResult(scriptResult);
}

function selectSituation(id) {
  selectedSituation = id;
  document.querySelectorAll('.situation-btn').forEach((b, i) => {
    b.classList.toggle('active', SITUATION_TYPES[i].id === id);
  });
}

async function generateScript() {
  const prompt = document.getElementById('script-prompt').value.trim();
  if (!prompt) { toast('Please describe your situation first.'); return; }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Claude is writing your script…';
  document.getElementById('script-output-area').innerHTML = '';

  try {
    const result = await api('/api/generate-script', {
      method: 'POST',
      body: JSON.stringify({ situation_type: selectedSituation, user_prompt: prompt }),
    });
    scriptResult = result;
    displayScriptResult(result);
    toast('✦ Script generated!');
  } catch (e) {
    document.getElementById('script-output-area').innerHTML =
      `<p class="text-danger mt-4">Error: ${e.message}</p>`;
    toast('Generation failed: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✦ Generate Script with Claude';
  }
}

function displayScriptResult(result) {
  const area = document.getElementById('script-output-area');
  if (!area) return;

  area.innerHTML = `
    <div class="script-output">
      ${result.subject ? `
        <div class="script-subject">Email Subject</div>
        <div class="script-subject-val">${result.subject}</div>
      ` : ''}
      <div class="script-body">${result.script}</div>

      ${result.tips && result.tips.length ? `
        <div class="tips-section">
          <div class="tips-label">💡 Tips for delivering this</div>
          ${result.tips.map(t => `
            <div class="tip-item"><span class="tip-dot">•</span> ${t}</div>`).join('')}
        </div>` : ''}

      <div class="copy-row">
        <button class="btn btn-ghost btn-copy" onclick="copyScript()">📋 Copy Script</button>
        ${result.subject ? `<button class="btn btn-ghost btn-copy" onclick="copyAll()">📧 Copy Email</button>` : ''}
      </div>
    </div>
  `;
}

function copyScript() {
  if (!scriptResult) return;
  navigator.clipboard.writeText(scriptResult.script).then(() => toast('Copied to clipboard!'));
}

function copyAll() {
  if (!scriptResult) return;
  const text = `Subject: ${scriptResult.subject}\n\n${scriptResult.script}`;
  navigator.clipboard.writeText(text).then(() => toast('Full email copied!'));
}

async function loadScriptHistory() {
  const el = document.getElementById('script-content');
  if (!el) return;
  el.innerHTML = `<div class="card"><p class="text-muted">Loading history…</p></div>`;
  try {
    const items = await api('/api/scripts');
    el.innerHTML = `
      <div class="card">
        <div class="card-title flex-between">
          <span>📋 Script History — ${items.length} generated</span>
          <button class="btn btn-ghost btn-sm" onclick="switchScriptTab('generate')">+ New Script</button>
        </div>
        ${items.length === 0
          ? `<div class="empty-state"><div class="empty-icon">✍️</div>No scripts generated yet.</div>`
          : `<div class="entry-list">${items.map(item => {
              const s = typeof item.generated_script === 'object' ? item.generated_script : {};
              const situation = SITUATION_TYPES.find(t => t.id === item.situation_type);
              return `
                <div class="entry-item" style="flex-direction:column;gap:8px">
                  <div class="flex-between" style="width:100%">
                    <div>
                      <div class="entry-title">${situation ? situation.label : item.situation_type}</div>
                      <div class="text-muted">🕐 ${fmtDate(item.created_at)}</div>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="expandScript(${item.id})">View</button>
                  </div>
                  <div class="entry-desc">"${item.user_prompt.slice(0, 120)}${item.user_prompt.length > 120 ? '…' : ''}"</div>
                  <div id="expand-${item.id}"></div>
                </div>`;}).join('')}
            </div>`
        }
      </div>
    `;
    // store items for expansion
    window._scriptItems = items;
  } catch (e) {
    el.innerHTML = `<p class="text-danger">Failed: ${e.message}</p>`;
  }
}

function expandScript(id) {
  const items = window._scriptItems || [];
  const item = items.find(i => i.id === id);
  if (!item) return;
  const s = typeof item.generated_script === 'object' ? item.generated_script : {};
  const el = document.getElementById(`expand-${id}`);
  if (el.innerHTML) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="script-output" style="margin-top:8px">
      ${s.subject ? `<div class="script-subject-val" style="border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:12px">Subject: ${s.subject}</div>` : ''}
      <div class="script-body">${s.script || JSON.stringify(s)}</div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════════════════
// SAFE MODE
// ════════════════════════════════════════════════════════════════════════════
let breathingActive = false;
let breathInterval = null;
let breathPhaseIndex = 0;
let breathSecondsLeft = 4;
let breathTick = null;
let copingStrategies = [];
let selectedCard = 0;

const COMM_CARDS = [
  "I am overwhelmed right now and need a quiet space. I am not ignoring you. I need time to regulate before I can respond clearly.",
  "I need a few minutes by myself. Please don't ask me questions right now. I will be okay.",
  "I am having a hard time with sensory input right now. It would help if you could lower your voice and give me some space.",
  "I cannot talk right now. I will come find you when I am ready.",
];

const BREATH_PHASES = [
  { label: 'Breathe In',  duration: 4, cls: 'inhale' },
  { label: 'Hold',        duration: 4, cls: 'hold'   },
  { label: 'Breathe Out', duration: 4, cls: 'exhale' },
  { label: 'Hold',        duration: 4, cls: 'hold'   },
];

const GROUND_STEPS = [
  { n: 5, sense: 'SEE',   emoji: '👁️',  prompt: 'Name 5 things you can see right now.' },
  { n: 4, sense: 'TOUCH', emoji: '🤚',  prompt: 'Feel 4 things. Notice their texture.' },
  { n: 3, sense: 'HEAR',  emoji: '👂',  prompt: 'Listen for 3 sounds around you.' },
  { n: 2, sense: 'SMELL', emoji: '👃',  prompt: 'Find 2 things you can smell.' },
  { n: 1, sense: 'TASTE', emoji: '👅',  prompt: 'Notice 1 thing you can taste.' },
];

async function renderSafeMode(el) {
  try { copingStrategies = await api('/api/coping'); } catch { copingStrategies = []; }

  el.innerHTML = `
    <div class="safe-page">

      <!-- Banner -->
      <div class="safe-banner">
        <div class="safe-banner-icon">🛡️</div>
        <div>
          <div class="safe-banner-title">You are in Safe Mode</div>
          <div class="safe-banner-sub">Everything here is simple and quiet. Take your time.</div>
        </div>
      </div>

      <!-- AI anxiety input -->
      <div class="safe-ai-box" id="safe-ai-box">
        <div class="safe-ai-label">💬 What are you feeling right now?</div>
        <p style="font-size:13px;color:#065F46;margin-bottom:12px;opacity:.8">
          Describe what is overwhelming you. Spectra will give you a personal plan to help you through it.
        </p>
        <textarea class="safe-ai-input" id="anxiety-input"
          placeholder="e.g. The office is too loud and I can't think. I feel like I'm about to shut down and I don't know how to tell anyone..."
          rows="4"></textarea>
        <button class="btn-safe" id="safe-ai-btn" onclick="getAIHelp()" style="margin-top:12px">
          ✦ Get my plan
        </button>
      </div>

      <!-- AI response area -->
      <div id="safe-ai-response"></div>

      <!-- Communication Cards -->
      <div style="margin-bottom:16px">
        <div class="grounding-title" style="margin-bottom:12px;color:#065F46">📋 Show this to someone nearby</div>
        ${COMM_CARDS.map((text, i) => `
          <div class="comm-card-wrap ${i === selectedCard ? 'selected' : ''}" onclick="selectCommCard(${i})">
            <div class="comm-card-text">"${text}"</div>
            ${i === selectedCard ? `
              <div class="comm-card-copy-row">
                <button class="btn-safe" onclick="copyCommCard(event)">📋 Copy</button>
                <button class="btn-safe-ghost" onclick="showCommCard(event)">👁️ Show</button>
              </div>` : ''}
          </div>`).join('')}

        <div style="margin-top:10px">
          <textarea class="grounding-input" id="custom-card-text" placeholder="Or type your own message here…" rows="3" style="border-radius:var(--radius);padding:14px;font-size:15px;border-color:#6EE7B7"></textarea>
          <div style="margin-top:8px;display:flex;gap:8px">
            <button class="btn-safe" onclick="copyCustomCard()">📋 Copy my message</button>
          </div>
        </div>
      </div>

      <!-- Box Breathing -->
      <div class="breathing-section">
        <div class="breathing-title">🌬️ Box Breathing — 4 · 4 · 4 · 4</div>
        <div class="breath-circle-wrap">
          <div class="breath-circle" id="breath-circle">
            <span id="breath-phase-text">Ready</span>
            <span id="breath-count-text" style="font-size:11px;opacity:.7"></span>
          </div>
        </div>
        <div class="breath-controls">
          <button class="btn-safe" id="breath-btn" onclick="toggleBreathing()">▶ Start</button>
          <button class="btn-safe-ghost" onclick="resetBreathing()">↺ Reset</button>
        </div>
      </div>

      <!-- 5-4-3-2-1 Grounding -->
      <div class="grounding-section">
        <div class="grounding-title">🌿 5-4-3-2-1 Grounding</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">
          Work through each sense slowly. There is no rush.
        </p>
        ${GROUND_STEPS.map((s, i) => `
          <div class="grounding-step" id="gstep-${i}">
            <div class="grounding-num" id="gnum-${i}">${s.n}</div>
            <div class="grounding-body">
              <div class="grounding-label">${s.emoji} ${s.n} things you can <strong>${s.sense}</strong></div>
              <div class="grounding-prompt">${s.prompt}</div>
              <input type="text" class="grounding-input" id="ginput-${i}"
                placeholder="Write them here…"
                oninput="checkGrounding(${i})" />
            </div>
          </div>`).join('')}
      </div>

      <!-- Coping Strategies -->
      <div class="coping-section">
        <div class="coping-title">💚 Your Coping Strategies</div>
        <div class="coping-chips" id="coping-chips">
          ${renderCopingChips()}
        </div>
        <div class="coping-add-row">
          <input type="text" class="coping-add-input" id="coping-input"
            placeholder="Add a strategy that helps you…"
            onkeydown="if(event.key==='Enter') addCoping()" />
          <button class="btn-safe" onclick="addCoping()">+ Add</button>
        </div>
        ${copingStrategies.length === 0
          ? `<p class="text-muted" style="margin-top:10px;font-size:13px">
              Try: noise-cancelling headphones, weighted blanket, cold water on wrists, quiet dark room…
             </p>`
          : ''}
      </div>

    </div>
  `;
}

async function getAIHelp() {
  const input = document.getElementById('anxiety-input');
  const text = input ? input.value.trim() : '';
  if (!text) { toast('Please describe what you are feeling first.'); return; }

  const btn = document.getElementById('safe-ai-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.3)"></span> Spectra is preparing your plan…';

  const responseArea = document.getElementById('safe-ai-response');
  responseArea.innerHTML = '';

  try {
    const result = await api('/api/safe-mode', {
      method: 'POST',
      body: JSON.stringify({ anxiety_description: text }),
    });
    renderAIResponse(result);
  } catch (e) {
    responseArea.innerHTML = `<p class="text-danger" style="margin-top:12px">Something went wrong: ${e.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✦ Get my plan';
  }
}

function renderAIResponse(r) {
  const area = document.getElementById('safe-ai-response');

  // update breathing phases for animation
  if (r.breathing && r.breathing.phases) {
    window._breathPhases = r.breathing.phases;
  } else {
    window._breathPhases = null;
  }

  const breathName = r.breathing ? r.breathing.name : 'Box Breathing';
  const phases = r.breathing ? r.breathing.phases : BREATH_PHASES;
  const patternLabel = phases.map(p => p.duration).join(' · ');

  area.innerHTML = `
    <!-- Validation -->
    <div class="safe-response-card safe-response-validation">
      <div class="safe-response-icon">💙</div>
      <p class="safe-response-text">${r.validation}</p>
    </div>

    <!-- Breathing -->
    <div class="breathing-section" style="margin-top:16px">
      <div class="breathing-title">🌬️ ${breathName} &mdash; ${patternLabel}</div>
      <div class="breath-circle-wrap">
        <div class="breath-circle" id="breath-circle">
          <span id="breath-phase-text">Ready</span>
          <span id="breath-count-text" style="font-size:11px;opacity:.7"></span>
        </div>
      </div>
      <div class="breath-controls">
        <button class="btn-safe" id="breath-btn" onclick="toggleBreathing()">▶ Start</button>
        <button class="btn-safe-ghost" onclick="resetBreathing()">↺ Reset</button>
      </div>
    </div>

    <!-- Steps -->
    <div class="safe-steps-section">
      <div class="safe-steps-title">🧭 Your grounding steps</div>
      ${r.steps.map((s, i) => `
        <div class="safe-step" id="safe-step-${i}">
          <div class="safe-step-left">
            <div class="safe-step-emoji">${s.emoji}</div>
            <div class="safe-step-done" id="step-check-${i}"></div>
          </div>
          <div class="safe-step-body">
            <div class="safe-step-title">${s.title}</div>
            <div class="safe-step-body-text">${s.body}</div>
          </div>
          <button class="safe-step-btn" onclick="markStep(${i})" id="step-btn-${i}">Done</button>
        </div>`).join('')}
    </div>

    <!-- Affirmation -->
    <div class="safe-affirmation">
      <span style="font-size:20px">🌿</span>
      <p>${r.affirmation}</p>
    </div>

    <!-- Try again -->
    <div style="text-align:center;margin-top:16px">
      <button class="btn-safe-ghost" onclick="clearAIResponse()">↺ Describe something different</button>
    </div>
  `;

  // scroll to response
  area.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // reset breathing state for new phases
  breathingActive = false;
  clearTimeout(breathTick);
  breathPhaseIndex = 0;
  breathSecondsLeft = phases[0].duration;
}

function markStep(i) {
  const btn = document.getElementById(`step-btn-${i}`);
  const step = document.getElementById(`safe-step-${i}`);
  const check = document.getElementById(`step-check-${i}`);
  if (btn.textContent === 'Done') {
    btn.textContent = '✓';
    btn.style.background = '#059669';
    btn.style.color = '#fff';
    step.style.opacity = '.6';
    check.textContent = '✓';
  } else {
    btn.textContent = 'Done';
    btn.style.background = '';
    btn.style.color = '';
    step.style.opacity = '1';
    check.textContent = '';
  }
}

function clearAIResponse() {
  breathingActive = false;
  clearTimeout(breathTick);
  window._breathPhases = null;
  document.getElementById('safe-ai-response').innerHTML = '';
  document.getElementById('anxiety-input').value = '';
  document.getElementById('safe-ai-box').scrollIntoView({ behavior: 'smooth' });
}

function renderCopingChips() {
  if (copingStrategies.length === 0) return '';
  return copingStrategies.map(s => `
    <div class="coping-chip">
      ${s.label}
      <button class="coping-chip-del" onclick="deleteCoping(${s.id})" title="Remove">✕</button>
    </div>`).join('');
}

function selectCommCard(i) {
  selectedCard = i;
  // re-render just the cards section without rebuilding the whole page
  const cards = document.querySelectorAll('.comm-card-wrap');
  COMM_CARDS.forEach((text, j) => {
    if (!cards[j]) return;
    cards[j].className = `comm-card-wrap ${j === i ? 'selected' : ''}`;
    cards[j].onclick = () => selectCommCard(j);
    cards[j].querySelector('.comm-card-text').textContent = `"${text}"`;
    const existing = cards[j].querySelector('.comm-card-copy-row');
    if (j === i && !existing) {
      const row = document.createElement('div');
      row.className = 'comm-card-copy-row';
      row.innerHTML = `<button class="btn-safe" onclick="copyCommCard(event)">📋 Copy</button>
                       <button class="btn-safe-ghost" onclick="showCommCard(event)">👁️ Show</button>`;
      cards[j].appendChild(row);
    } else if (j !== i && existing) {
      existing.remove();
    }
  });
}

function copyCommCard(e) {
  e.stopPropagation();
  navigator.clipboard.writeText(COMM_CARDS[selectedCard]).then(() => toast('Copied to clipboard'));
}

function showCommCard(e) {
  e.stopPropagation();
  const msg = COMM_CARDS[selectedCard];
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:2000;
    display:flex;align-items:center;justify-content:center;padding:24px;cursor:pointer`;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:36px;max-width:500px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="font-size:40px;margin-bottom:16px">🛡️</div>
      <p style="font-size:22px;line-height:1.6;font-weight:600;color:#1F2937">${msg}</p>
      <p style="margin-top:20px;font-size:13px;color:#6B7280">Tap anywhere to close</p>
    </div>`;
  overlay.onclick = () => document.body.removeChild(overlay);
  document.body.appendChild(overlay);
}

function copyCustomCard() {
  const text = document.getElementById('custom-card-text').value.trim();
  if (!text) { toast('Please type a message first.'); return; }
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'));
}

// ── Breathing ──────────────────────────────────────────────────────────────
function toggleBreathing() {
  if (breathingActive) stopBreathing();
  else startBreathing();
}

function startBreathing() {
  breathingActive = true;
  document.getElementById('breath-btn').textContent = '⏸ Pause';
  runBreathPhase();
}

function stopBreathing() {
  breathingActive = false;
  clearTimeout(breathTick);
  document.getElementById('breath-btn').textContent = '▶ Resume';
}

function resetBreathing() {
  breathingActive = false;
  clearTimeout(breathTick);
  breathPhaseIndex = 0;
  breathSecondsLeft = 4;
  const circle = document.getElementById('breath-circle');
  if (circle) {
    circle.className = 'breath-circle';
    document.getElementById('breath-phase-text').textContent = 'Ready';
    document.getElementById('breath-count-text').textContent = '';
  }
  document.getElementById('breath-btn').textContent = '▶ Start';
}

function runBreathPhase() {
  if (!breathingActive) return;
  const phases = window._breathPhases || BREATH_PHASES;
  const phase = phases[breathPhaseIndex % phases.length];
  breathSecondsLeft = phase.duration;

  const circle = document.getElementById('breath-circle');
  if (!circle) { breathingActive = false; return; }

  circle.className = `breath-circle ${phase.cls}`;
  document.getElementById('breath-phase-text').textContent = phase.label;

  tickBreath();
}

function tickBreath() {
  if (!breathingActive) return;
  const countEl = document.getElementById('breath-count-text');
  if (countEl) countEl.textContent = breathSecondsLeft + 's';

  if (breathSecondsLeft <= 0) {
    const phases = window._breathPhases || BREATH_PHASES;
    breathPhaseIndex = (breathPhaseIndex + 1) % phases.length;
    breathTick = setTimeout(runBreathPhase, 100);
    return;
  }
  breathSecondsLeft--;
  breathTick = setTimeout(tickBreath, 1000);
}

// ── Grounding ──────────────────────────────────────────────────────────────
function checkGrounding(i) {
  const val = document.getElementById(`ginput-${i}`).value.trim();
  const numEl = document.getElementById(`gnum-${i}`);
  if (val) numEl.classList.add('done');
  else numEl.classList.remove('done');
}

// ── Coping strategies ──────────────────────────────────────────────────────
async function addCoping() {
  const input = document.getElementById('coping-input');
  const label = input.value.trim();
  if (!label) return;
  try {
    await api('/api/coping', { method: 'POST', body: JSON.stringify({ label }) });
    input.value = '';
    copingStrategies = await api('/api/coping');
    document.getElementById('coping-chips').innerHTML = renderCopingChips();
    toast('Strategy saved');
  } catch (e) { toast('Error: ' + e.message); }
}

async function deleteCoping(id) {
  await api(`/api/coping/${id}`, { method: 'DELETE' });
  copingStrategies = await api('/api/coping');
  document.getElementById('coping-chips').innerHTML = renderCopingChips();
}

// ── Boot ──────────────────────────────────────────────────────────────────
render();
