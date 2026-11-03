// Persists stars and per-phonogram mastery. Storage is injected so the store
// is testable and degrades gracefully when localStorage is unavailable.

export const STORAGE_KEY = 'phonoland.progress.v1';
export const MAX_LEVEL = 3;
const LEVEL_THRESHOLDS = [1, 3, 6]; // correct answers needed for level 1, 2, 3

const emptyState = () => ({ stars: 0, mastery: {} });

function isNonNegInt(n) {
  return Number.isInteger(n) && n >= 0;
}

function sanitise(raw) {
  const state = emptyState();
  if (!raw || typeof raw !== 'object') return state;
  if (isNonNegInt(raw.stars)) state.stars = raw.stars;
  if (raw.mastery && typeof raw.mastery === 'object') {
    for (const [id, rec] of Object.entries(raw.mastery)) {
      if (rec && isNonNegInt(rec.correct) && isNonNegInt(rec.attempts) && rec.correct <= rec.attempts) {
        state.mastery[id] = { correct: rec.correct, attempts: rec.attempts };
      }
    }
  }
  return state;
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // access can throw in private mode / sandboxed frames
  }
}

export class ProgressStore {
  constructor(storage = defaultStorage()) {
    this.storage = storage;
    this.state = this.#load();
    this.listeners = new Set();
  }

  #load() {
    if (!this.storage) return emptyState();
    try {
      const text = this.storage.getItem(STORAGE_KEY);
      return text ? sanitise(JSON.parse(text)) : emptyState();
    } catch {
      return emptyState();
    }
  }

  #save() {
    if (this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Quota or access error: keep in-memory progress for this session.
      }
    }
    this.listeners.forEach(fn => fn(this.state));
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get stars() {
    return this.state.stars;
  }

  addStars(points) {
    if (!isNonNegInt(points)) throw new Error('addStars: points must be a non-negative integer');
    this.state.stars += points;
    this.#save();
    return this.state.stars;
  }

  recordAttempt(phonogramId, correct) {
    if (typeof phonogramId !== 'string' || !phonogramId) {
      throw new Error('recordAttempt: phonogramId must be a non-empty string');
    }
    const rec = this.state.mastery[phonogramId] ?? { correct: 0, attempts: 0 };
    rec.attempts += 1;
    if (correct) rec.correct += 1;
    this.state.mastery[phonogramId] = rec;
    this.#save();
  }

  /** 0 (new) … MAX_LEVEL (mastered). */
  level(phonogramId) {
    const rec = this.state.mastery[phonogramId];
    if (!rec) return 0;
    return LEVEL_THRESHOLDS.filter(t => rec.correct >= t).length;
  }

  /** Selection weight: unmastered phonograms come up more often, but mastered ones still appear. */
  weight(phonogramId) {
    return MAX_LEVEL + 1 - this.level(phonogramId);
  }

  reset() {
    this.state = emptyState();
    this.#save();
  }
}
