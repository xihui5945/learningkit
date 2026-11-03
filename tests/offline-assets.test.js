import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

describe('offline readiness', () => {
  it('loads no fonts or styles from external CDNs', () => {
    const sources = [read('styles.css'), read('index.html')].join('\n');
    expect(sources).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(sources).not.toMatch(/<(link|script)[^>]+(href|src)="https?:\/\//);
  });

  it('ships every icon the manifest and head reference', () => {
    const config = read('vite.config.js');
    const html = read('index.html');
    const refs = [
      ...config.matchAll(/src: '([^']+\.png)'/g),
      ...html.matchAll(/href="([^"]+\.(?:png|ico|svg))"/g)
    ].map(m => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(existsSync(new URL(`../public/${ref}`, import.meta.url)), ref).toBe(true);
  });
});
