import { describe, it, expect, vi } from 'vitest';
import { ProgressStore, STORAGE_KEY, MAX_LEVEL } from '../progress-store.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data
  };
}

describe('ProgressStore', () => {
  it('starts empty and persists stars across instances', () => {
    const storage = memoryStorage();
    const a = new ProgressStore(storage);
    expect(a.stars).toBe(0);
    a.addStars(3);
    expect(new ProgressStore(storage).stars).toBe(3);
  });

  it('levels up with correct answers and caps at MAX_LEVEL', () => {
    const store = new ProgressStore(memoryStorage());
    expect(store.level('sh')).toBe(0);
    store.recordAttempt('sh', true);
    expect(store.level('sh')).toBe(1);
    store.recordAttempt('sh', false);
    expect(store.level('sh')).toBe(1);
    for (let i = 0; i < 10; i++) store.recordAttempt('sh', true);
    expect(store.level('sh')).toBe(MAX_LEVEL);
  });

  it('weights unmastered phonograms above mastered ones (but never zero)', () => {
    const store = new ProgressStore(memoryStorage());
    for (let i = 0; i < 10; i++) store.recordAttempt('a', true);
    expect(store.weight('b')).toBeGreaterThan(store.weight('a'));
    expect(store.weight('a')).toBeGreaterThan(0);
  });

  it('recovers from corrupt or tampered storage', () => {
    expect(new ProgressStore(memoryStorage({ [STORAGE_KEY]: '{not json' })).stars).toBe(0);
    const tampered = JSON.stringify({ stars: -5, mastery: { a: { correct: 9, attempts: 1 }, b: { correct: 1, attempts: 2 } } });
    const store = new ProgressStore(memoryStorage({ [STORAGE_KEY]: tampered }));
    expect(store.stars).toBe(0);
    expect(store.level('a')).toBe(0);
    expect(store.level('b')).toBe(1);
  });

  it('keeps working in memory when storage throws', () => {
    const storage = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
    const store = new ProgressStore(storage);
    expect(() => store.addStars(2)).not.toThrow();
    expect(store.stars).toBe(2);
  });

  it('works with no storage at all', () => {
    const store = new ProgressStore(null);
    store.addStars(1);
    expect(store.stars).toBe(1);
  });

  it('notifies listeners and supports reset', () => {
    const store = new ProgressStore(memoryStorage());
    const fn = vi.fn();
    const off = store.onChange(fn);
    store.addStars(1);
    store.recordAttempt('a', true);
    store.reset();
    expect(fn).toHaveBeenCalledTimes(3);
    expect(store.stars).toBe(0);
    expect(store.level('a')).toBe(0);
    off();
    store.addStars(1);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('validates input', () => {
    const store = new ProgressStore(memoryStorage());
    expect(() => store.addStars(-1)).toThrow();
    expect(() => store.addStars(1.5)).toThrow();
    expect(() => store.recordAttempt('', true)).toThrow();
  });
});
