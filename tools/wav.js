// Pure audio helpers for recordings made in the audit tool (browser + Node).

/** Mixes channels down to mono. */
export function toMono(channels) {
  if (!channels.length) throw new Error('toMono: no channels');
  if (channels.length === 1) return Float32Array.from(channels[0]);
  const out = new Float32Array(channels[0].length);
  for (const ch of channels) for (let i = 0; i < out.length; i++) out[i] += ch[i] / channels.length;
  return out;
}

/** Scales so the loudest sample reaches `peak` (never amplifies near-silence more than maxGain). */
export function normalisePeak(samples, { peak = 0.9, maxGain = 8 } = {}) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max === 0) return Float32Array.from(samples);
  const gain = Math.min(peak / max, maxGain);
  return samples.map(s => s * gain);
}

/** 16-bit PCM mono WAV. */
export function encodeWav(samples, sampleRate) {
  if (!(sampleRate > 0) || !Number.isInteger(sampleRate)) throw new Error('encodeWav: invalid sample rate');
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const ascii = (offset, text) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);        // PCM chunk size
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, 1, true);         // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);         // block align
  view.setUint16(34, 16, true);        // bits per sample
  ascii(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/** Minimal check that bytes are a PCM WAV file. */
export function looksLikeWav(bytes) {
  if (!bytes || bytes.length < 44) return false;
  const tag = (o) => String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
  return tag(0) === 'RIFF' && tag(8) === 'WAVE' && tag(12) === 'fmt ';
}
