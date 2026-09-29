import { describe, expect, it } from 'vitest';
import { createDefaultState, createStorageAdapter, isLocalState, STORAGE_KEY, type CompletedAttempt, type StorageLike } from '../src/storage';

const now = Date.parse('2026-09-30T10:00:00Z');
class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  readFails = false;
  writeFails = false;
  deleteFails = false;
  getItem(key: string) { if (this.readFails) throw new Error('denied'); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.writeFails) throw new Error('quota'); this.values.set(key, value); }
  removeItem(key: string) { if (this.deleteFails) throw new Error('denied'); this.values.delete(key); }
}
const attempt = (extra: Partial<CompletedAttempt> = {}): CompletedAttempt => ({ attemptId: 'attempt-1', completedAt: new Date(now).toISOString(), attemptKind: 'first', practiceMode: 'learning', contentId: 'MH-C005', contentVersion: 1, variantLanguage: 'ko', scoringVersion: 'scoring-v1', accuracy: 75, cpm: 30, typingCorrect: false, meaningCorrect: false, hintExposed: true, assisted: false, interrupted: false, comparisonEligible: true, environmentGroup: 'ko|two-set|PC|Windows|Chrome', ...extra });

describe('local progress storage', () => {
  it('reloads completed aggregates, versions and first/retry without recounting the same ID', () => {
    const storage = new MemoryStorage();
    const adapter = createStorageAdapter(storage, () => now);
    expect(adapter.load().ok).toBe(true);
    adapter.recordAttempt(attempt());
    adapter.recordAttempt(attempt());
    adapter.recordAttempt(attempt({ attemptId: 'retry-1', attemptKind: 'retry', typingCorrect: true, meaningCorrect: true, accuracy: 100 }));
    const reloaded = createStorageAdapter(storage, () => now).load().state;
    expect(reloaded.progress[0].completionCount).toBe(2);
    expect(reloaded.progress[0].firstAttemptCount).toBe(1);
    expect(reloaded.progress[0].firstMeaningCorrectCount).toBe(0);
    expect(reloaded.recentAttempts.map((a) => a.attemptKind)).toEqual(['first', 'retry']);
    expect(reloaded.reviewQueue[0]).toMatchObject({ typingWrong: true, meaningWrong: true });
  });

  it.each([['{broken', 'corrupt'], ['{"schemaVersion":2}', 'future-version'], ['{"schemaVersion":0}', 'unsupported-version']] as const)('preserves %s without overwriting it while allowing in-tab progress', (raw, reason) => {
    const storage = new MemoryStorage(); storage.values.set(STORAGE_KEY, raw);
    const adapter = createStorageAdapter(storage, () => now);
    expect(adapter.load()).toMatchObject({ ok: false, status: 'blocked', reason });
    const saved = adapter.recordAttempt(attempt());
    expect(saved.state.progress).toHaveLength(1);
    expect(saved.ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('reports failed writes, keeps in-tab work and retries without recounting', () => {
    const storage = new MemoryStorage(); storage.writeFails = true;
    const adapter = createStorageAdapter(storage, () => now); adapter.load();
    expect(adapter.recordAttempt(attempt())).toMatchObject({ ok: false, status: 'memory', reason: 'write-failed' });
    expect(adapter.getState().recentAttempts).toHaveLength(1);
    storage.writeFails = false;
    expect(adapter.save(adapter.getState()).ok).toBe(true);
    expect(createStorageAdapter(storage, () => now).load().state.progress[0].completionCount).toBe(1);
  });

  it('blocks automatic storage after a read failure rather than guessing the original state', () => {
    const storage = new MemoryStorage(); storage.readFails = true;
    const adapter = createStorageAdapter(storage, () => now);
    expect(adapter.load()).toMatchObject({ reason: 'read-failed', status: 'blocked' });
    storage.readFails = false;
    expect(adapter.recordAttempt(attempt()).ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('detects another tab both before writing and by storage notification', () => {
    const storage = new MemoryStorage();
    const a = createStorageAdapter(storage, () => now); const b = createStorageAdapter(storage, () => now);
    a.load(); b.load(); a.recordAttempt(attempt());
    const original = storage.getItem(STORAGE_KEY);
    expect(b.recordAttempt(attempt({ attemptId: 'other' }))).toMatchObject({ ok: false, status: 'conflict', reason: 'external-change' });
    expect(storage.getItem(STORAGE_KEY)).toBe(original);
    expect(b.load().state.recentAttempts[0].attemptId).toBe('attempt-1');
    b.notifyExternalChange();
    expect(b.updateSettings({ uiLocale: 'en', practiceLanguage: 'vi' }).ok).toBe(false);
  });

  it('deletes learning records but preserves settings, and all deletes only the app key', () => {
    const storage = new MemoryStorage(); storage.setItem('other-app', 'safe');
    const adapter = createStorageAdapter(storage, () => now); adapter.load();
    adapter.updateSettings({ uiLocale: 'en', practiceLanguage: 'vi' }); adapter.recordAttempt(attempt());
    const stale = adapter.getState();
    expect(adapter.reset('learning').state).toMatchObject({ settings: { uiLocale: 'en', practiceLanguage: 'vi' }, progress: [], recentAttempts: [] });
    expect(adapter.save(stale).ok).toBe(false);
    expect(adapter.reset('all').ok).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem('other-app')).toBe('safe');
  });

  it('never reports failed deletion as success or clears the visible records', () => {
    const storage = new MemoryStorage(); const adapter = createStorageAdapter(storage, () => now); adapter.load(); adapter.recordAttempt(attempt());
    storage.deleteFails = true;
    expect(adapter.reset('all')).toMatchObject({ ok: false, reason: 'delete-failed' });
    expect(adapter.getState().progress).toHaveLength(1);
    storage.writeFails = true;
    expect(adapter.reset('learning').ok).toBe(false);
    expect(adapter.getState().progress).toHaveLength(1);
  });

  it('clears memory-only learning records while retaining language settings and invalidating stale snapshots', () => {
    const adapter = createStorageAdapter(null, () => now);
    adapter.load();
    adapter.updateSettings({ uiLocale: 'en', practiceLanguage: 'vi' });
    adapter.recordAttempt(attempt());
    const stale = adapter.getState();
    const reset = adapter.reset('learning');
    expect(reset).toMatchObject({ ok: true, status: 'memory', state: { settings: { uiLocale: 'en', practiceLanguage: 'vi' }, progress: [], reviewQueue: [], recentAttempts: [], resume: null } });
    expect(adapter.save(stale).ok).toBe(false);
    expect(adapter.getState().progress).toEqual([]);
  });

  it('records retry errors separately without creating or mutating the first-answer review queue', () => {
    const adapter = createStorageAdapter(new MemoryStorage(), () => now);
    adapter.load();
    adapter.recordAttempt(attempt({ typingCorrect: true, meaningCorrect: true }));
    adapter.recordAttempt(attempt({ attemptId: 'wrong-retry', attemptKind: 'retry' }));
    expect(adapter.getState().reviewQueue).toEqual([]);
    expect(adapter.getState().recentAttempts[1]).toMatchObject({ attemptKind: 'retry', typingCorrect: false, meaningCorrect: false });
    adapter.recordAttempt(attempt({ attemptId: 'new-first-error' }));
    const initialQueue = adapter.getState().reviewQueue;
    adapter.recordAttempt(attempt({ attemptId: 'another-retry', attemptKind: 'retry', typingCorrect: true, meaningCorrect: true }));
    expect(adapter.getState().reviewQueue).toEqual(initialQueue);
    expect(adapter.getState().progress[0].firstAttemptCount).toBe(2);
  });

  it('rejects recent history whose content identity or comparison group conflicts with its aggregate', () => {
    const adapter = createStorageAdapter(new MemoryStorage(), () => now);
    adapter.load(); adapter.recordAttempt(attempt());
    const mismatches: Partial<CompletedAttempt>[] = [
      { contentId: 'MH-C006' }, { contentVersion: 2 }, { variantLanguage: 'vi' },
      { scoringVersion: 'scoring-v2' }, { practiceMode: 'review' }, { environmentGroup: 'different-browser' },
      { hintExposed: false }, { assisted: true }, { interrupted: true }, { comparisonEligible: false },
      { accuracy: 99 },
    ];
    for (const mismatch of mismatches) {
      const corrupt = adapter.getState();
      Object.assign(corrupt.recentAttempts[0], mismatch);
      expect(isLocalState(corrupt)).toBe(false);
    }
    expect(isLocalState(adapter.getState())).toBe(true);
  });

  it('requires review queue event references to match content, revision and language', () => {
    const adapter = createStorageAdapter(new MemoryStorage(), () => now);
    adapter.load(); adapter.recordAttempt(attempt());
    adapter.recordAttempt(attempt({ attemptId: 'another-concept', contentId: 'MH-C006' }));
    for (const mismatch of [{ contentId: 'MH-C007' }, { contentVersion: 2 }, { variantLanguage: 'vi' }, { lastAttemptId: 'another-concept' }]) {
      const corrupt = adapter.getState();
      Object.assign(corrupt.reviewQueue[0], mismatch);
      expect(isLocalState(corrupt)).toBe(false);
    }
    const duplicate = adapter.getState();
    duplicate.reviewQueue.push({ ...duplicate.reviewQueue[0] });
    expect(isLocalState(duplicate)).toBe(false);
  });

  it('retains at most 200 recent attempts and removes by each completedAt after 90 days', () => {
    const storage = new MemoryStorage(); const adapter = createStorageAdapter(storage, () => now); adapter.load();
    for (let i = 0; i < 201; i++) adapter.recordAttempt(attempt({ attemptId: `attempt-${i}`, completedAt: new Date(now - (201 - i) * 1000).toISOString() }));
    adapter.recordAttempt(attempt({ attemptId: 'expired', completedAt: new Date(now - 91 * 86400000).toISOString() }));
    const state = createStorageAdapter(storage, () => now).load().state;
    expect(state.recentAttempts).toHaveLength(200);
    expect(state.recentAttempts.find((a) => a.attemptId === 'attempt-0' || a.attemptId === 'expired')).toBeUndefined();
    expect(state.progress[0].completionCount).toBe(202);
    // Aggregate opaque IDs prevent an evicted event from incrementing again.
    adapter.recordAttempt(attempt({ attemptId: 'attempt-0' }));
    expect(adapter.getState().progress[0].completionCount).toBe(202);
  });

  it('keeps different content/scoring versions and hint groups separate', () => {
    const adapter = createStorageAdapter(new MemoryStorage(), () => now); adapter.load();
    adapter.recordAttempt(attempt());
    adapter.recordAttempt(attempt({ attemptId: 'content-v2', contentVersion: 2 }));
    adapter.recordAttempt(attempt({ attemptId: 'scoring-v2', scoringVersion: 'scoring-v2' }));
    adapter.recordAttempt(attempt({ attemptId: 'hidden', hintExposed: false }));
    expect(adapter.getState().progress).toHaveLength(4);
  });

  it('resolves meaning review only on an unhinted first answer in a fresh review attempt', () => {
    const adapter = createStorageAdapter(new MemoryStorage(), () => now); adapter.load(); adapter.recordAttempt(attempt());
    adapter.recordAttempt(attempt({ attemptId: 'review-hint', practiceMode: 'review', typingCorrect: true, meaningCorrect: true }));
    expect(adapter.getState().reviewQueue[0]).toMatchObject({ typingWrong: false, meaningWrong: true });
    adapter.recordAttempt(attempt({ attemptId: 'review-retry', practiceMode: 'review', attemptKind: 'retry', hintExposed: false, typingCorrect: true, meaningCorrect: true }));
    expect(adapter.getState().reviewQueue[0].meaningWrong).toBe(true);
    adapter.recordAttempt(attempt({ attemptId: 'review-fresh', practiceMode: 'review', hintExposed: false, typingCorrect: true, meaningCorrect: true }));
    expect(adapter.getState().reviewQueue).toEqual([]);
    expect(adapter.getState().progress.find((p) => p.practiceMode === 'learning')?.firstMeaningCorrectCount).toBe(0);
  });

  it('rejects input text or extra fields instead of persisting them', () => {
    const storage = new MemoryStorage(); const adapter = createStorageAdapter(storage, () => now); adapter.load();
    expect(adapter.recordAttempt({ ...attempt(), rawInput: 'secret' } as CompletedAttempt).ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    const corrupt = { ...createDefaultState(now), rawInput: 'secret' };
    storage.setItem(STORAGE_KEY, JSON.stringify(corrupt));
    expect(createStorageAdapter(storage, () => now).load()).toMatchObject({ status: 'blocked', reason: 'corrupt' });
  });

  it('returns detached snapshots so UI mutations cannot alter state silently', () => {
    const adapter = createStorageAdapter(new MemoryStorage(), () => now); adapter.load();
    const snapshot = adapter.getState(); snapshot.settings.uiLocale = 'ko';
    expect(adapter.getState().settings.uiLocale).toBe('vi');
  });
});
