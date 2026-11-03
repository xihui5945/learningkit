import { describe, it, expect } from 'vitest';
import { buildAuditRows, riskOf, findCollisions, toCsv, summarise } from '../tools/audit-core.js';
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';

const rows = buildAuditRows(SPALDING_PHONOGRAMS);
const row = (letters, n) => rows.find(r => r.letters === letters && r.soundNo === n);

describe('buildAuditRows', () => {
  it('has one row per sound (111) with unique keys', () => {
    expect(rows).toHaveLength(SPALDING_PHONOGRAMS.reduce((n, p) => n + p.sounds.length, 0));
    expect(new Set(rows.map(r => r.key)).size).toBe(rows.length);
  });

  it('records the exact text the app sends to speech', () => {
    expect(row('ee', 1)).toMatchObject({ tts: 'ee', ttsFull: 'ee! tree.', ipa: 'iː', risk: 'double letter' });
    expect(row('b', 1)).toMatchObject({ tts: 'b', risk: 'letter name' });
  });
});

describe('riskOf', () => {
  it.each([['b', 'letter name'], ['sh', 'spelled out'], ['ks', 'spelled out'], ['ee', 'double letter'], ['eye', 'verify']])(
    '%s → %s', (text, risk) => expect(riskOf(text)).toBe(risk)
  );
});

describe('findCollisions', () => {
  it('flags speech text shared by different IPA sounds (e.g. th voiced/unvoiced)', () => {
    const th = findCollisions(rows).find(c => c.tts === 'th');
    expect(th?.ipas.sort()).toEqual(['θ', 'ð'].sort());
  });
});

describe('toCsv', () => {
  it('quotes cells, escapes quotes and neutralises formulas', () => {
    const csv = toCsv([row('ee', 1)], { [row('ee', 1).key]: { heard: 'N', heardAs: 'E "E"', notes: '=HYPERLINK("x")' } }, { voice: 'Samantha', browser: 'Safari on macOS' });
    const [header, line] = csv.trim().split('\r\n');
    expect(header.split(',')).toHaveLength(14);
    expect(line).toContain('"E ""E"""');
    expect(line).toContain(`"'=HYPERLINK(""x"")"`);
    expect(line).toContain('"Samantha"');
  });
});

describe('summarise', () => {
  it('counts marked, heard-wrong and expected-wrong rows', () => {
    const marks = { [rows[0].key]: { heard: 'Y' }, [rows[1].key]: { heard: 'N', expected: 'N' } };
    expect(summarise(rows, marks)).toEqual({ total: rows.length, marked: 2, heardWrong: 1, expectedWrong: 1 });
  });
});
