// Sound audit tool: plays every phonogram sound through the app's own audio
// engine (same text, voice, rate and pitch) so a Spalding-trained listener can
// mark each one. Testing only — not part of the app build or offline cache.
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';
import { audioEngine } from '../audio-engine.js';
import { buildAuditRows, findCollisions, toCsv, summarise } from './audit-core.js';
import { CLIP_FILE_PATTERN } from '../clip-library.js';
import { initRecordView } from './record-view.js';

const STORAGE_KEY = 'phonoland.audit.v1';
const rows = buildAuditRows(SPALDING_PHONOGRAMS);
const phonoById = new Map(SPALDING_PHONOGRAMS.map(p => [p.id, p]));

const el = id => document.getElementById(id);
const ui = {
  tbody: el('rows'), stats: el('stats'), voiceSelect: el('voiceSelect'), voiceNote: el('voiceNote'),
  filter: el('filterSelect'), download: el('downloadBtn'), clear: el('clearBtn'), collisions: el('collisionBox'),
  refInput: el('refInput'), refOpen: el('refOpenBtn'), clipNote: el('clipNote')
};
const REF_KEY = 'phonoland.audit.reference';
const CLIP_BASE = '/audio/sounds/';
let clipManifest = {};

// ---------------- storage (marks are kept per voice) ----------------
function loadAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
const allMarks = loadAll();
function saveAll() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMarks));
  } catch {
    ui.voiceNote.textContent = '⚠️ Could not save marks in this browser — download the CSV before closing.';
  }
}

const state = { voiceName: '', current: 0, visible: rows };
const marksForVoice = () => (allMarks[state.voiceName] ??= {});
const markOf = key => (marksForVoice()[key] ??= { expected: '', heard: '', heardAs: '', suggestion: '', notes: '', clip: '' });

// ---------------- generated clips ----------------
async function loadClipManifest() {
  try {
    const res = await fetch(`${CLIP_BASE}manifest.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    clipManifest = data && typeof data === 'object' ? data : {};
  } catch {
    clipManifest = {};
  }
  const n = Object.keys(clipManifest).length;
  const files = new Set(Object.values(clipManifest).map(e => e.file)).size;
  ui.clipNote.textContent = n ? `${files} clips for ${n} sounds` : 'No clips yet — run npm run clips';
  render();
}

let clipAudio = null;
function playClip(row) {
  const entry = clipManifest[row.key];
  if (!entry || !CLIP_FILE_PATTERN.test(entry.file)) return;
  window.speechSynthesis?.cancel();
  clipAudio?.pause();
  clipAudio = new Audio(CLIP_BASE + entry.file);
  clipAudio.play().catch(() => { ui.clipNote.textContent = `⚠️ Could not play ${entry.file}`; });
}

// ---------------- voices ----------------
let overrideVoice = null;
function populateVoices() {
  const synth = window.speechSynthesis;
  if (!synth) {
    ui.voiceNote.textContent = '⚠️ This browser has no speech synthesis.';
    return;
  }
  const appDefault = audioEngine.voice;
  const voices = synth.getVoices().filter(v => v.lang?.toLowerCase().startsWith('en'));
  const previous = ui.voiceSelect.value;
  ui.voiceSelect.replaceChildren();
  for (const v of voices) {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang}${v.localService ? '' : ', cloud'})${v === appDefault ? ' — app default' : ''}`;
    ui.voiceSelect.appendChild(opt);
  }
  ui.voiceSelect.value = previous || appDefault?.name || voices[0]?.name || '';
  applyVoice();
}

function applyVoice() {
  const name = ui.voiceSelect.value;
  overrideVoice = window.speechSynthesis?.getVoices().find(v => v.name === name) ?? null;
  if (overrideVoice) audioEngine.voice = overrideVoice;
  state.voiceName = name || 'unknown voice';
  ui.voiceNote.textContent = overrideVoice && !overrideVoice.localService
    ? '⚠️ Cloud voice: needs internet, so the app will not choose it offline.'
    : '';
  render();
}

if (window.speechSynthesis) {
  // Registered after the engine's own listener, so a chosen voice survives list refreshes.
  window.speechSynthesis.addEventListener?.('voiceschanged', populateVoices);
}

// ---------------- playback ----------------
function playRow(row, how) {
  audioEngine.init();
  if (overrideVoice) audioEngine.voice = overrideVoice;
  const phono = phonoById.get(row.phonogramId);
  if (how === 'word') {
    audioEngine.speakPhrase(row.word);
    return;
  }
  const previousMode = audioEngine.mode;
  audioEngine.mode = how === 'sound' ? 'sound_only' : 'word';
  audioEngine.speakSound(phono, row.soundNo - 1);
  audioEngine.mode = previousMode;
}

/** Speaks a candidate spelling with the same voice, rate and pitch the app uses for sounds. */
function trySpelling(row) {
  const text = markOf(row.key).suggestion.trim();
  const synth = window.speechSynthesis;
  if (!text || !synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.82;
  u.pitch = 1.15;
  if (overrideVoice) {
    u.voice = overrideVoice;
    u.lang = overrideVoice.lang;
  }
  synth.speak(u);
}

// ---------------- rendering ----------------
function button(label, title, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.title = title;
  b.addEventListener('click', e => { e.stopPropagation(); onClick(); });
  return b;
}

function cell(text, className) {
  const td = document.createElement('td');
  if (className) td.className = className;
  td.textContent = text;
  return td;
}

function verdictGroup(row, field, labels) {
  const wrap = document.createElement('span');
  wrap.className = 'verdict';
  for (const v of ['Y', 'N', '?']) {
    const b = button(labels[v], labels[v], () => setMark(row, field, markOf(row.key)[field] === v ? '' : v));
    b.dataset.v = v;
    b.classList.toggle('on', markOf(row.key)[field] === v);
    wrap.appendChild(b);
  }
  return wrap;
}

function textInput(row, field, placeholder) {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.value = markOf(row.key)[field];
  input.dataset.field = field;
  input.addEventListener('input', () => { markOf(row.key)[field] = input.value; saveAll(); });
  input.addEventListener('focus', () => setCurrent(state.visible.indexOf(row), false));
  const td = document.createElement('td');
  td.appendChild(input);
  return td;
}

function renderRow(row, idx) {
  const m = markOf(row.key);
  const tr = document.createElement('tr');
  const verdictClass = m.clip ? `clip-${m.clip}` : `heard-${m.heard || 'none'}`;
  tr.className = `${verdictClass}${idx === state.current ? ' current' : ''}`;
  tr.addEventListener('click', () => setCurrent(idx, false));

  tr.append(
    cell(row.letters, 'letters'),
    cell(`${row.soundNo}/${row.soundCount}`),
    cell(row.sound),
    cell(`/${row.ipa}/`),
    cell(row.word),
    cell(`"${row.tts}"`, 'tts')
  );

  const riskTd = document.createElement('td');
  const pill = document.createElement('span');
  pill.className = `risk risk-${row.risk.replace(/\s+/g, '-')}`;
  pill.textContent = row.risk;
  riskTd.appendChild(pill);
  tr.appendChild(riskTd);

  const clipTd = document.createElement('td');
  if (clipStale(row)) {
    const badge = document.createElement('span');
    badge.className = 'risk risk-letter-name';
    badge.textContent = 'clip changed';
    badge.title = 'This row now plays a different clip than the one you marked';
    clipTd.appendChild(badge);
  }
  const clipBtn = button('▶ C', clipManifest[row.key] ? `Generated clip /${clipManifest[row.key].azureIpa}/ (C)` : 'No clip yet', () => playClip(row));
  clipBtn.disabled = !clipManifest[row.key];
  clipTd.appendChild(clipBtn);
  const clipVerdictTd = document.createElement('td');
  clipVerdictTd.appendChild(verdictGroup(row, 'clip', { Y: 'Y', N: 'N', '?': '?' }));
  tr.append(clipTd, clipVerdictTd);

  const playTd = document.createElement('td');
  playTd.className = 'play';
  playTd.append(
    button('▶ S', 'Sound only (S)', () => playRow(row, 'sound')),
    button('▶ W', 'Sound + word, as the app plays it (W)', () => playRow(row, 'full')),
    button('▶ R', 'Word only (R)', () => playRow(row, 'word'))
  );
  tr.appendChild(playTd);

  const heardTd = document.createElement('td');
  heardTd.appendChild(verdictGroup(row, 'heard', { Y: 'Y', N: 'N', '?': '?' }));
  const expTd = document.createElement('td');
  expTd.appendChild(verdictGroup(row, 'expected', { Y: 'Y', N: 'N', '?': '?' }));
  tr.append(heardTd, expTd, textInput(row, 'heardAs', 'e.g. "E E"'));

  const sugTd = textInput(row, 'suggestion', 'e.g. eee');
  sugTd.appendChild(button('▶', 'Try this spelling (T)', () => trySpelling(row)));
  sugTd.style.display = 'flex';
  sugTd.style.gap = '4px';
  tr.append(sugTd, textInput(row, 'notes', ''));
  return tr;
}

function applyFilter() {
  const f = ui.filter.value;
  const marks = marksForVoice();
  state.visible = rows.filter(r => {
    const m = marks[r.key];
    if (f === 'unmarked') return clipManifest[r.key] ? !m?.clip : !m?.heard;
    if (f === 'recheck') return needsClipCheck(r);
    if (f === 'wrong') return m?.heard === 'N' || m?.expected === 'N' || m?.clip === 'N';
    if (f === 'risky') return r.risk !== 'verify';
    return true;
  });
  state.current = Math.min(state.current, Math.max(0, state.visible.length - 1));
}

function render() {
  applyFilter();
  ui.tbody.replaceChildren(...state.visible.map(renderRow));
  const s = summarise(rows, marksForVoice());
  ui.stats.textContent = `— clips: ${s.clipMarked}/${s.total} checked, ${s.clipWrong} wrong · speech: ${s.marked}/${s.total} marked, ${s.heardWrong} wrong · ${s.expectedWrong} expected wrong`;
}

function setCurrent(idx, scroll = true) {
  if (idx < 0 || idx >= state.visible.length) return;
  state.current = idx;
  [...ui.tbody.children].forEach((tr, i) => tr.classList.toggle('current', i === idx));
  if (scroll) ui.tbody.children[idx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/** A clip verdict is stale when it was given for a different clip file than the one now in use. */
function clipStale(row) {
  const m = marksForVoice()[row.key];
  const current = clipManifest[row.key]?.file;
  return Boolean(m?.clip && m.clipFile && current && m.clipFile !== current);
}

const needsClipCheck = row => Boolean(clipManifest[row.key]) && (marksForVoice()[row.key]?.clip !== 'Y' || clipStale(row));

function setMark(row, field, value) {
  markOf(row.key)[field] = value;
  if (field === 'clip') markOf(row.key).clipFile = value ? clipManifest[row.key]?.file ?? '' : '';
  saveAll();
  const idx = state.visible.indexOf(row);
  render();
  setCurrent(Math.min(idx, state.visible.length - 1), false);
}

// ---------------- collisions (same speech text, different sounds) ----------------
function showCollisions() {
  const list = findCollisions(rows);
  if (!list.length) return;
  ui.collisions.hidden = false;
  ui.collisions.textContent = 'The app sends identical text for different sounds, so these can never sound different: ' +
    list.map(c => `"${c.tts}" → /${c.ipas.join('/, /')}/`).join(' · ');
}

// ---------------- keyboard ----------------
window.addEventListener('keydown', e => {
  const typing = e.target.closest?.('input, select, textarea');
  if (typing) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  const row = state.visible[state.current];
  if (!row) return;
  const key = e.key.toLowerCase();
  const actions = {
    c: () => playClip(row),
    1: () => { setMark(row, 'clip', 'Y'); setCurrent(Math.min(state.visible.indexOf(row) + 1, state.visible.length - 1)); },
    2: () => setMark(row, 'clip', 'N'),
    s: () => playRow(row, 'sound'),
    w: () => playRow(row, 'full'),
    r: () => playRow(row, 'word'),
    t: () => trySpelling(row),
    y: () => { setMark(row, 'heard', 'Y'); setCurrent(Math.min(state.visible.indexOf(row) + 1, state.visible.length - 1)); },
    n: () => { setMark(row, 'heard', 'N'); ui.tbody.children[state.current]?.querySelector('input[data-field=heardAs]')?.focus(); },
    '?': () => setMark(row, 'heard', '?'),
    e: () => setMark(row, 'expected', markOf(row.key).expected === 'N' ? '' : 'N'),
    arrowdown: () => setCurrent(state.current + 1),
    arrowup: () => setCurrent(state.current - 1)
  };
  const action = actions[key];
  if (action) {
    e.preventDefault();
    action();
  }
});

// ---------------- export ----------------
function browserLabel() {
  const ua = navigator.userAgent;
  const name = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Browser';
  const os = /iPad|iPhone/.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(ua)) ? 'iPadOS/iOS' : /Mac/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : 'other';
  return `${name} on ${os}`;
}

ui.download.addEventListener('click', () => {
  const csv = toCsv(rows, marksForVoice(), { voice: state.voiceName, browser: browserLabel() });
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }); // BOM so Excel reads diacritics
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `phonoland-sound-audit-${state.voiceName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

ui.clear.addEventListener('click', () => {
  if (window.confirm(`Clear all marks for "${state.voiceName}"?`)) {
    delete allMarks[state.voiceName];
    saveAll();
    render();
  }
});

ui.voiceSelect.addEventListener('change', applyVoice);
ui.filter.addEventListener('change', () => { state.current = 0; render(); });

// ---------------- reference link ----------------
function safeHttpsUrl(text) {
  try {
    const u = new URL(text.trim());
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}
try { ui.refInput.value = localStorage.getItem(REF_KEY) || ''; } catch { /* storage unavailable */ }
ui.refInput.addEventListener('input', () => { try { localStorage.setItem(REF_KEY, ui.refInput.value); } catch { /* ignore */ } });
ui.refOpen.addEventListener('click', () => {
  const href = safeHttpsUrl(ui.refInput.value);
  if (!href) { ui.clipNote.textContent = '⚠️ Enter a full https:// link'; return; }
  window.open(href, '_blank', 'noopener,noreferrer');
});

showCollisions();
populateVoices();
render();
loadClipManifest();

// ---------------- mode: review rows / record sounds ----------------
const recordView = initRecordView({
  rows,
  marks: () => marksForVoice(),
  manifest: () => clipManifest,
  reloadManifest: loadClipManifest,
  clipUrl: file => (CLIP_FILE_PATTERN.test(file) ? CLIP_BASE + file : null)
});
for (const btn of document.querySelectorAll('[data-mode]')) {
  btn.addEventListener('click', () => {
    const recording = btn.dataset.mode === 'record';
    document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('primary', b === btn));
    document.getElementById('reviewView').hidden = recording;
    document.getElementById('recordView').hidden = !recording;
    if (recording) recordView.render();
  });
}
