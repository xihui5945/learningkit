// "Record sounds" view of the audit tool: one row per distinct sound, so a
// single take fixes every phonogram row that uses it. Testing tool only.
import { toAzureIpa } from './azure-ipa.js';
import { findAudibleRange } from '../clip-library.js';
import { toMono, normalisePeak, encodeWav } from './wav.js';

const MAX_SECONDS = 3;
const OUTPUT_RATE = 24000;
const ENDPOINT = '/__recordings';
const HEADERS = { 'x-phonoland-audit': '1' };

/** Groups audit rows by base sound and summarises the listener's clip marks. */
export function groupBySound(rows, marks) {
  const groups = new Map();
  for (const row of rows) {
    const base = toAzureIpa(row.ipa);
    if (!groups.has(base)) groups.set(base, { base, rows: [] });
    groups.get(base).rows.push(row);
  }
  return [...groups.values()].map(g => {
    const verdicts = g.rows.map(r => marks[r.key]?.clip || '');
    const count = v => verdicts.filter(x => x === v).length;
    const n = count('N'), q = count('?'), y = count('Y');
    const status = n && n === g.rows.length ? 'all-wrong' : n ? 'mixed' : q ? 'unsure' : y === g.rows.length ? 'ok' : 'unmarked';
    return { ...g, y, n, q, status };
  });
}

const ORDER = { 'all-wrong': 0, mixed: 1, unsure: 2, unmarked: 3, ok: 4 };

export function initRecordView({ rows, marks, manifest, reloadManifest, clipUrl }) {
  const tbody = document.getElementById('recRows');
  const statusEl = document.getElementById('recStatus');
  const filterEl = document.getElementById('recFilter');
  let recordings = {};
  let stream = null;
  let audioCtx = null;
  let player = null;
  const takes = new Map(); // base → { wav: ArrayBuffer, url, seconds }
  let active = null;       // { base, recorder, timer }

  const say = text => { statusEl.textContent = text; };
  const ctx = () => (audioCtx ??= new (window.AudioContext || window.webkitAudioContext)());

  async function loadRecordings() {
    try {
      const res = await fetch(ENDPOINT, { headers: HEADERS, cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      recordings = (await res.json()).recordings ?? {};
    } catch {
      recordings = {};
      say('⚠️ Saving needs the dev server: run npm run audit (not npm run preview).');
    }
  }

  function play(url) {
    if (!url) return;
    player?.pause();
    player = new Audio(url);
    player.play().catch(() => say('⚠️ Could not play audio'));
  }

  async function startRecording(base) {
    if (active) return;
    try {
      stream ??= await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
    } catch {
      say('⚠️ Microphone permission was refused. Allow it in the address bar, then try again.');
      return;
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.onstop = () => finishTake(base, new Blob(chunks, { type: recorder.mimeType }));
    recorder.start();
    active = { base, recorder, timer: setTimeout(() => stopRecording(), MAX_SECONDS * 1000) };
    say(`● Recording /${base}/ … say the sound now`);
    render();
  }

  function stopRecording() {
    if (!active) return;
    clearTimeout(active.timer);
    if (active.recorder.state !== 'inactive') active.recorder.stop();
  }

  async function finishTake(base, blob) {
    active = null;
    try {
      const decoded = await ctx().decodeAudioData(await blob.arrayBuffer());
      const mono = toMono(Array.from({ length: decoded.numberOfChannels }, (_, c) => decoded.getChannelData(c)));
      const range = findAudibleRange([mono], decoded.sampleRate, { threshold: 0.02, padStart: 0.05, padEnd: 0.12 });
      const from = Math.floor(range.start * decoded.sampleRate);
      const trimmed = mono.slice(from, from + Math.floor(range.duration * decoded.sampleRate));
      const peak = trimmed.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
      if (peak < 0.02) { say('⚠️ That take was nearly silent. Move closer to the microphone and try again.'); render(); return; }

      // Resample to 24 kHz mono for a small, consistent file.
      const frames = Math.max(1, Math.round(trimmed.length * OUTPUT_RATE / decoded.sampleRate));
      const offline = new OfflineAudioContext(1, frames, OUTPUT_RATE);
      const src = offline.createBufferSource();
      const buf = offline.createBuffer(1, trimmed.length, decoded.sampleRate);
      buf.copyToChannel(normalisePeak(trimmed), 0);
      src.buffer = buf;
      src.connect(offline.destination);
      src.start();
      const rendered = await offline.startRendering();
      const wav = encodeWav(rendered.getChannelData(0), OUTPUT_RATE);

      const old = takes.get(base);
      if (old) URL.revokeObjectURL(old.url);
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
      takes.set(base, { wav, url, seconds: rendered.duration });
      say(`Take ready for /${base}/ (${rendered.duration.toFixed(2)} s). Play it, then Save or record again.`);
      play(url);
    } catch (err) {
      say(`⚠️ Could not process the take: ${err.message}`);
    }
    render();
  }

  async function save(base) {
    const take = takes.get(base);
    if (!take) return;
    say(`Saving /${base}/ …`);
    try {
      const res = await fetch(`${ENDPOINT}?sound=${encodeURIComponent(base)}`, {
        method: 'POST', headers: { ...HEADERS, 'Content-Type': 'audio/wav' }, body: take.wav
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      recordings = body.recordings ?? recordings;
      URL.revokeObjectURL(take.url);
      takes.delete(base);
      await reloadManifest();
      say(`✓ Saved /${base}/. Every row using this sound now plays your recording.`);
    } catch (err) {
      say(`⚠️ Save failed: ${err.message}`);
    }
    render();
  }

  async function revert(base) {
    if (!window.confirm(`Delete your recording of /${base}/ and use the generated clip again?`)) return;
    try {
      const res = await fetch(`${ENDPOINT}?sound=${encodeURIComponent(base)}`, { method: 'DELETE', headers: HEADERS });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      recordings = body.recordings ?? {};
      await reloadManifest();
      say(`Removed recording of /${base}/.`);
    } catch (err) {
      say(`⚠️ Could not remove: ${err.message}`);
    }
    render();
  }

  // ---------------- rendering ----------------
  const cell = (text, cls) => {
    const td = document.createElement('td');
    if (cls) td.className = cls;
    td.textContent = text;
    return td;
  };
  const button = (label, title, onClick, { primary = false, disabled = false } = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.disabled = disabled;
    if (primary) b.classList.add('primary');
    b.addEventListener('click', onClick);
    return b;
  };

  function render() {
    const groups = groupBySound(rows, marks()).sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.base.localeCompare(b.base));
    const f = filterEl.value;
    const visible = groups.filter(g =>
      f === 'all' ? true : f === 'recorded' ? Boolean(recordings[g.base]) : (g.n > 0 || g.q > 0) && !recordings[g.base]
    );
    document.getElementById('recCount').textContent = `${groups.filter(g => recordings[g.base]).length} of ${groups.length} sounds recorded`;

    tbody.replaceChildren(...visible.map(g => {
      const tr = document.createElement('tr');
      tr.append(
        cell(`/${g.base}/`, 'letters'),
        cell(g.rows.map(r => `${r.letters} (${r.word})`).join(', ')),
        cell(`${g.y} Y · ${g.n} N · ${g.q} ?${g.status === 'mixed' ? '  (mixed)' : ''}`)
      );

      const entry = manifest()[g.rows[0].key];
      const nowTd = document.createElement('td');
      nowTd.append(
        button('▶', entry ? `Play what the app uses now (${entry.recorded ? 'your recording' : 'generated'})` : 'No clip', () => play(entry && clipUrl(entry.file)), { disabled: !entry }),
        document.createTextNode(recordings[g.base] ? ' your recording' : ' generated')
      );
      tr.appendChild(nowTd);

      const recTd = document.createElement('td');
      const isActive = active?.base === g.base;
      recTd.appendChild(isActive
        ? button('■ Stop', 'Stop recording', stopRecording, { primary: true })
        : button('● Record', `Record /${g.base}/ (up to ${MAX_SECONDS} s)`, () => startRecording(g.base), { disabled: Boolean(active) }));
      tr.appendChild(recTd);

      const take = takes.get(g.base);
      const takeTd = document.createElement('td');
      if (take) takeTd.append(button('▶ Take', 'Play your new take', () => play(take.url)), document.createTextNode(` ${take.seconds.toFixed(2)} s`));
      tr.appendChild(takeTd);

      const saveTd = document.createElement('td');
      saveTd.appendChild(button('✓ Save', 'Save this take into the project', () => save(g.base), { primary: true, disabled: !take }));
      if (recordings[g.base]) saveTd.appendChild(button('↺ Use generated', 'Delete your recording', () => revert(g.base)));
      tr.appendChild(saveTd);
      return tr;
    }));
  }

  filterEl.addEventListener('change', render);
  loadRecordings().then(render);
  return { render };
}
