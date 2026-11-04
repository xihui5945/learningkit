// Recordings made in the audit tool override generated clips. They are keyed
// by the sound's base IPA (not its voice/rate tuning), so retuning never
// orphans a recording. Pure helpers; file I/O lives in recording-server.js.
import { createHash } from 'node:crypto';

export const RECORDING_FILE_PATTERN = /^rec-[0-9a-f]{10}\.m4a$/;

export function recordingFileName(baseIpa) {
  if (typeof baseIpa !== 'string' || !baseIpa) throw new Error('recordingFileName: baseIpa required');
  return `rec-${createHash('sha256').update(baseIpa).digest('hex').slice(0, 10)}.m4a`;
}

/**
 * Points manifest rows at recordings where one exists for their sound, and
 * back at the generated clip where a recording was removed.
 * @param manifest   clip manifest (row key → entry), not mutated
 * @param rows       from buildRows(): { key, base, file (generated) }
 * @param recordings base IPA → { file }
 */
export function applyRecordings(manifest, rows, recordings) {
  const out = { ...manifest };
  for (const row of rows) {
    const entry = out[row.key];
    if (!entry) continue;
    const rec = recordings[row.base];
    if (rec && RECORDING_FILE_PATTERN.test(rec.file)) {
      out[row.key] = { ...entry, file: rec.file, recorded: true, generatedFile: entry.generatedFile ?? row.file };
    } else if (entry.recorded) {
      const { recorded, generatedFile, ...rest } = entry;
      out[row.key] = { ...rest, file: generatedFile ?? row.file };
    }
  }
  return out;
}
