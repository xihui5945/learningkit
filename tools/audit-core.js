// Pure helpers for the sound audit tool (no DOM), so they can be unit-tested.
import { speakableSound } from '../phonetics.js';

export const VERDICTS = Object.freeze(['', 'Y', 'N', '?']);

/** Why a speech-engine string is likely to be misread. */
export function riskOf(ttsText) {
  if (/^[a-z]$/i.test(ttsText)) return 'letter name';
  if (/^[^aeiouy]+$/i.test(ttsText)) return 'spelled out';
  if (/^(.)\1$/i.test(ttsText)) return 'double letter';
  return 'verify';
}

/** One row per phonogram sound, with the exact text the app sends to speech synthesis. */
export function buildAuditRows(phonograms) {
  return phonograms.flatMap(p =>
    p.sounds.map((s, i) => {
      const tts = speakableSound(s.sound);
      return {
        key: `${p.id}#${i + 1}`,
        phonogramId: p.id,
        letters: p.letters,
        soundNo: i + 1,
        soundCount: p.sounds.length,
        sound: s.sound,
        ipa: s.ipa ?? '',
        word: s.example,
        tts,
        ttsFull: `${tts}! ${s.example}.`,
        risk: riskOf(tts)
      };
    })
  );
}

/** Groups rows whose speech text is identical but whose IPA differs — the app cannot tell them apart. */
export function findCollisions(rows) {
  const byText = new Map();
  for (const r of rows) {
    if (!byText.has(r.tts)) byText.set(r.tts, new Set());
    byText.get(r.tts).add(r.ipa);
  }
  return [...byText].filter(([, ipas]) => ipas.size > 1).map(([tts, ipas]) => ({ tts, ipas: [...ipas] }));
}

function csvCell(value) {
  const text = String(value ?? '');
  // Neutralise spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const CSV_COLUMNS = [
  ['phonogram', r => r.letters],
  ['sound_no', r => r.soundNo],
  ['spalding_sound', r => r.sound],
  ['expected_ipa', r => r.ipa],
  ['example_word', r => r.word],
  ['tts_text', r => r.tts],
  ['risk', r => r.risk],
  ['clip_matches_reference', (r, m) => m.clip],
  ['expected_correct', (r, m) => m.expected],
  ['heard_correct', (r, m) => m.heard],
  ['heard_as', (r, m) => m.heardAs],
  ['better_spelling', (r, m) => m.suggestion],
  ['notes', (r, m) => m.notes]
];

/** @param marks Record<rowKey, {expected, heard, heardAs, suggestion, notes}> */
export function toCsv(rows, marks, meta = {}) {
  const header = [...CSV_COLUMNS.map(([name]) => name), 'voice', 'browser'];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    const m = marks[r.key] ?? {};
    lines.push([...CSV_COLUMNS.map(([, get]) => get(r, m)), meta.voice, meta.browser].map(csvCell).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

export function summarise(rows, marks) {
  const s = { total: rows.length, marked: 0, heardWrong: 0, expectedWrong: 0, clipMarked: 0, clipWrong: 0 };
  for (const r of rows) {
    const m = marks[r.key];
    if (!m) continue;
    if (m.heard) s.marked++;
    if (m.heard === 'N') s.heardWrong++;
    if (m.expected === 'N') s.expectedWrong++;
    if (m.clip) s.clipMarked++;
    if (m.clip === 'N') s.clipWrong++;
  }
  return s;
}
