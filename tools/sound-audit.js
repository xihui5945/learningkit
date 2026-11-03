// Sound audit tool: plays every phonogram sound through the app's own audio
// engine (same text, voice, rate and pitch) so a Spalding-trained listener can
// mark each one. Testing only — not part of the app build or offline cache.
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';
import { audioEngine } from '../audio-engine.js';
import { buildAuditRows, findCollisions, toCsv, summarise } from './audit-core.js';

const STORAGE_KEY = 'phonoland.audit.v1';
const rows = buildAuditRows(SPALDING_PHONOGRAMS);
const phonoById = new Map(SPALDING_PHONOGRAMS.map(p => [p.id, p]));

const el = id => document.getElementById(id);
const ui = {
  tbody: el('rows'), stats: el('stats'), voiceSelect: el('voiceSelect'), voiceNote: el('voiceNote'),
  filter: el('filterSelect'), download: el('downloadBtn'), clear: el('clearBtn'), collisions: el('collisionBox')
};

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
const markOf = key => (marksForVoice()[key] ??= { expected: '', heard: '', heardAs: '', suggestion: '', notes: '' });

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
  tr.className = `heard-${m.heard || 'none'}${idx === state.current ? ' current' : ''}`;
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
    if (f === 'unmarked') return !m?.heard;
    if (f === 'wrong') return m?.heard === 'N' || m?.expected === 'N';
    if (f === 'risky') return r.risk !== 'verify';
    return true;
  });
  state.current = Math.min(state.current, Math.max(0, state.visible.length - 1));
}

function render() {
  applyFilter();
  ui.tbody.replaceChildren(...state.visible.map(renderRow));
  const s = summarise(rows, marksForVoice());
  ui.stats.textContent = `— ${s.marked}/${s.total} marked · ${s.heardWrong} heard wrong · ${s.expectedWrong} expected wrong`;
}

function setCurrent(idx, scroll = true) {
  if (idx < 0 || idx >= state.visible.length) return;
  state.current = idx;
  [...ui.tbody.children].forEach((tr, i) => tr.classList.toggle('current', i === idx));
  if (scroll) ui.tbody.children[idx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function setMark(row, field, value) {
  markOf(row.key)[field] = value;
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

showCollisions();
populateVoices();
render();
