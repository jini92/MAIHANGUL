import { locales, type Locale, type Stage } from '../content/types';

export const STORAGE_KEY = 'maihangul.state';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface Settings { uiLocale: Locale; practiceLanguage: Locale }
export interface CompletedAttempt {
  attemptId: string;
  completedAt: string;
  attemptKind: 'first' | 'retry';
  practiceMode: 'learning' | 'review';
  contentId: string;
  contentVersion: number;
  variantLanguage: Locale;
  scoringVersion: string;
  accuracy: number;
  cpm: number | null;
  typingCorrect: boolean;
  meaningCorrect: boolean | null;
  hintExposed: boolean;
  assisted: boolean;
  interrupted: boolean;
  comparisonEligible: boolean;
  environmentGroup: string;
}
export interface ProgressEntry {
  practiceMode: 'learning' | 'review';
  contentId: string;
  contentVersion: number;
  variantLanguage: Locale;
  scoringVersion: string;
  environmentGroup: string;
  hintExposed: boolean;
  assisted: boolean;
  interrupted: boolean;
  comparisonEligible: boolean;
  completionCount: number;
  firstAttemptCount: number;
  firstTypingCorrectCount: number;
  firstMeaningSubmitted: number;
  firstMeaningCorrectCount: number;
  /** Opaque IDs, retained with the aggregate so eviction cannot recount an old event. */
  attemptIds: string[];
  latestAttempt: CompletedAttempt;
}
export interface ReviewEntry { contentId: string; contentVersion: number; variantLanguage: Locale; typingWrong: boolean; meaningWrong: boolean; lastAttemptId: string }
export interface Resume { stage: Stage; nextContentId: string; nextContentVersion: number }
export interface LocalState {
  schemaVersion: 1;
  revision: number;
  savedAt: string;
  contentPackVersion: string | null;
  scoringVersion: string;
  settings: Settings;
  progress: ProgressEntry[];
  reviewQueue: ReviewEntry[];
  resume: Resume | null;
  recentAttempts: CompletedAttempt[];
}
export type StorageStatus = 'persistent' | 'memory' | 'blocked' | 'conflict';
export type StorageReason = 'corrupt' | 'future-version' | 'unsupported-version' | 'read-failed' | 'write-failed' | 'delete-failed' | 'external-change' | 'invalid-state';
export interface StorageResult { ok: boolean; state: LocalState; status: StorageStatus; reason?: StorageReason }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const integer = (v: unknown, minimum = 0) => Number.isSafeInteger(v) && Number(v) >= minimum;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const date = (v: unknown): v is string => nonempty(v) && Number.isFinite(Date.parse(v));
const locale = (v: unknown): v is Locale => locales.includes(v as Locale);
const contentId = (v: unknown): v is string => nonempty(v) && /^MH-C\d{3}$/.test(v);
const exactKeys = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every((key) => Object.hasOwn(v, key));

const attemptKeys = ['attemptId', 'completedAt', 'attemptKind', 'practiceMode', 'contentId', 'contentVersion', 'variantLanguage', 'scoringVersion', 'accuracy', 'cpm', 'typingCorrect', 'meaningCorrect', 'hintExposed', 'assisted', 'interrupted', 'comparisonEligible', 'environmentGroup'];
export function isCompletedAttempt(v: unknown): v is CompletedAttempt {
  return object(v) && exactKeys(v, attemptKeys) && nonempty(v.attemptId) && v.attemptId.length <= 200 && date(v.completedAt)
    && ['first', 'retry'].includes(String(v.attemptKind)) && ['learning', 'review'].includes(String(v.practiceMode)) && contentId(v.contentId) && integer(v.contentVersion, 1) && locale(v.variantLanguage)
    && nonempty(v.scoringVersion) && finite(v.accuracy) && v.accuracy >= 0 && v.accuracy <= 100
    && (v.cpm === null || (finite(v.cpm) && v.cpm >= 0)) && typeof v.typingCorrect === 'boolean'
    && (v.meaningCorrect === null || typeof v.meaningCorrect === 'boolean')
    && ['hintExposed', 'assisted', 'interrupted', 'comparisonEligible'].every((key) => typeof v[key] === 'boolean')
    && nonempty(v.environmentGroup) && v.environmentGroup.length <= 200;
}

const groupFields = ['contentId', 'contentVersion', 'variantLanguage', 'scoringVersion', 'practiceMode', 'environmentGroup', 'hintExposed', 'assisted', 'interrupted', 'comparisonEligible'] as const;
const sameGroup = (a: CompletedAttempt | ProgressEntry, b: CompletedAttempt | ProgressEntry) => groupFields.every((field) => a[field] === b[field]);
const sameContent = (a: Pick<CompletedAttempt, 'contentId' | 'contentVersion' | 'variantLanguage'>, b: Pick<CompletedAttempt, 'contentId' | 'contentVersion' | 'variantLanguage'>) => a.contentId === b.contentId && a.contentVersion === b.contentVersion && a.variantLanguage === b.variantLanguage;
const progressKeys = [...groupFields, 'completionCount', 'firstAttemptCount', 'firstTypingCorrectCount', 'firstMeaningSubmitted', 'firstMeaningCorrectCount', 'attemptIds', 'latestAttempt'];
function isProgress(v: unknown): v is ProgressEntry {
  if (!object(v) || !exactKeys(v, progressKeys) || !isCompletedAttempt(v.latestAttempt) || !Array.isArray(v.attemptIds)) return false;
  if (!groupFields.every((key) => v[key] === (v.latestAttempt as CompletedAttempt)[key])) return false;
  if (!['completionCount', 'firstAttemptCount', 'firstTypingCorrectCount', 'firstMeaningSubmitted', 'firstMeaningCorrectCount'].every((key) => integer(v[key]))) return false;
  return v.attemptIds.every((id) => nonempty(id) && id.length <= 200) && new Set(v.attemptIds).size === v.attemptIds.length
    && v.attemptIds.includes(v.latestAttempt.attemptId) && v.completionCount === v.attemptIds.length
    && Number(v.firstAttemptCount) <= Number(v.completionCount) && Number(v.firstTypingCorrectCount) <= Number(v.firstAttemptCount)
    && Number(v.firstMeaningCorrectCount) <= Number(v.firstMeaningSubmitted) && Number(v.firstMeaningSubmitted) <= Number(v.firstAttemptCount);
}

export function isLocalState(v: unknown): v is LocalState {
  if (!object(v) || !exactKeys(v, ['schemaVersion', 'revision', 'savedAt', 'contentPackVersion', 'scoringVersion', 'settings', 'progress', 'reviewQueue', 'resume', 'recentAttempts'])) return false;
  if (v.schemaVersion !== 1 || !integer(v.revision) || !date(v.savedAt) || !(v.contentPackVersion === null || nonempty(v.contentPackVersion)) || !nonempty(v.scoringVersion)) return false;
  if (!object(v.settings) || !exactKeys(v.settings, ['uiLocale', 'practiceLanguage']) || !locale(v.settings.uiLocale) || !locale(v.settings.practiceLanguage)) return false;
  if (!Array.isArray(v.progress) || !v.progress.every(isProgress) || !Array.isArray(v.recentAttempts) || !v.recentAttempts.every(isCompletedAttempt)) return false;
  const allIds = v.progress.flatMap((entry) => entry.attemptIds);
  if (new Set(allIds).size !== allIds.length || new Set(v.recentAttempts.map((a) => a.attemptId)).size !== v.recentAttempts.length) return false;
  const eventGroups = new Map(v.progress.flatMap((entry) => entry.attemptIds.map((id) => [id, entry] as const)));
  if (v.recentAttempts.some((a) => {
    const group = eventGroups.get(a.attemptId);
    if (!group || !sameGroup(a, group)) return true;
    return a.attemptId === group.latestAttempt.attemptId && attemptKeys.some((key) => a[key as keyof CompletedAttempt] !== group.latestAttempt[key as keyof CompletedAttempt]);
  })) return false;
  if (v.progress.some((entry, index) => (v.progress as ProgressEntry[]).slice(index + 1).some((other) => sameGroup(entry, other)))) return false;
  if (!Array.isArray(v.reviewQueue) || !v.reviewQueue.every((entry) => {
    if (!object(entry) || !exactKeys(entry, ['contentId', 'contentVersion', 'variantLanguage', 'typingWrong', 'meaningWrong', 'lastAttemptId']) || !contentId(entry.contentId) || !integer(entry.contentVersion, 1) || !locale(entry.variantLanguage) || typeof entry.typingWrong !== 'boolean' || typeof entry.meaningWrong !== 'boolean' || !nonempty(entry.lastAttemptId)) return false;
    const group = eventGroups.get(entry.lastAttemptId);
    return !!group && sameContent(group, entry as unknown as ReviewEntry) && (entry.typingWrong || entry.meaningWrong);
  })) return false;
  const reviewKeys = v.reviewQueue.map((entry) => `${entry.contentId}:${entry.contentVersion}:${entry.variantLanguage}`);
  if (new Set(reviewKeys).size !== reviewKeys.length) return false;
  return v.resume === null || (object(v.resume) && exactKeys(v.resume, ['stage', 'nextContentId', 'nextContentVersion']) && ['jamo', 'word', 'daily', 'cafe'].includes(String(v.resume.stage)) && contentId(v.resume.nextContentId) && integer(v.resume.nextContentVersion, 1));
}

export function createDefaultState(now = Date.now()): LocalState {
  return { schemaVersion: 1, revision: 0, savedAt: new Date(now).toISOString(), contentPackVersion: null, scoringVersion: 'scoring-v1', settings: { uiLocale: 'vi', practiceLanguage: 'ko' }, progress: [], reviewQueue: [], resume: null, recentAttempts: [] };
}

function retain(state: LocalState, now: number): LocalState {
  const next = clone(state);
  const threshold = now - 90 * 24 * 60 * 60 * 1000;
  next.recentAttempts = next.recentAttempts.filter((a) => Date.parse(a.completedAt) >= threshold && Date.parse(a.completedAt) <= now)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)).slice(-200);
  return next;
}

export function createStorageAdapter(storage: StorageLike | null = null, now: () => number = Date.now) {
  let state = createDefaultState(now());
  let status: StorageStatus = storage ? 'persistent' : 'memory';
  let reason: StorageReason | undefined;
  let observedRaw: string | null = null;
  let loaded = false;
  const result = (ok: boolean): StorageResult => ({ ok, state: clone(state), status, ...(reason ? { reason } : {}) });
  const fail = (nextStatus: StorageStatus, nextReason: StorageReason) => { status = nextStatus; reason = nextReason; return result(false); };

  function load(): StorageResult {
    loaded = true;
    if (!storage) { status = 'memory'; return result(false); }
    let raw: string | null;
    try { raw = storage.getItem(STORAGE_KEY); } catch { return fail('blocked', 'read-failed'); }
    observedRaw = raw;
    if (raw === null) { state = createDefaultState(now()); status = 'persistent'; reason = undefined; return result(true); }
    let value: unknown;
    try { value = JSON.parse(raw); } catch { return fail('blocked', 'corrupt'); }
    if (object(value) && typeof value.schemaVersion === 'number' && value.schemaVersion > 1) return fail('blocked', 'future-version');
    // No older production schema exists. Do not invent a lossy v0 migration.
    if (object(value) && typeof value.schemaVersion === 'number' && value.schemaVersion < 1) return fail('blocked', 'unsupported-version');
    if (!isLocalState(value)) return fail('blocked', 'corrupt');
    state = retain(value, now()); status = 'persistent'; reason = undefined;
    return result(true);
  }

  function save(next: LocalState): StorageResult {
    if (!loaded) load();
    if (!isLocalState(next)) { reason = 'invalid-state'; return result(false); }
    const candidate = retain(next, now());
    // The state handed to consumers is a snapshot. A stale snapshot cannot resurrect reset data.
    if (candidate.revision !== state.revision) { reason = 'invalid-state'; return result(false); }
    state = candidate;
    if (!storage || status === 'blocked' || status === 'conflict') return result(false);
    let currentRaw: string | null;
    try { currentRaw = storage.getItem(STORAGE_KEY); } catch { return fail('blocked', 'read-failed'); }
    if (currentRaw !== observedRaw) return fail('conflict', 'external-change');
    const persisted = { ...candidate, revision: candidate.revision + 1, savedAt: new Date(now()).toISOString() };
    const raw = JSON.stringify(persisted);
    try { storage.setItem(STORAGE_KEY, raw); } catch { return fail('memory', 'write-failed'); }
    state = persisted; observedRaw = raw; status = 'persistent'; reason = undefined;
    return result(true);
  }

  function updateSettings(settings: Settings): StorageResult {
    if (!loaded) load();
    return save({ ...state, settings: clone(settings) });
  }

  function recordAttempt(attempt: CompletedAttempt, resume: Resume | null = state.resume): StorageResult {
    if (!loaded) load();
    if (!isCompletedAttempt(attempt) || Date.parse(attempt.completedAt) > now()) { reason = 'invalid-state'; return result(false); }
    if (state.progress.some((p) => p.attemptIds.includes(attempt.attemptId))) return result(status === 'persistent');
    const next = clone(state);
    let entry = next.progress.find((p) => sameGroup(p, attempt));
    if (!entry) {
      entry = { contentId: attempt.contentId, contentVersion: attempt.contentVersion, variantLanguage: attempt.variantLanguage, scoringVersion: attempt.scoringVersion, practiceMode: attempt.practiceMode, environmentGroup: attempt.environmentGroup, hintExposed: attempt.hintExposed, assisted: attempt.assisted, interrupted: attempt.interrupted, comparisonEligible: attempt.comparisonEligible, completionCount: 0, firstAttemptCount: 0, firstTypingCorrectCount: 0, firstMeaningSubmitted: 0, firstMeaningCorrectCount: 0, attemptIds: [], latestAttempt: clone(attempt) };
      next.progress.push(entry);
    }
    entry.completionCount += 1; entry.attemptIds.push(attempt.attemptId); entry.latestAttempt = clone(attempt);
    if (attempt.attemptKind === 'first') {
      entry.firstAttemptCount += 1;
      if (attempt.typingCorrect) entry.firstTypingCorrectCount += 1;
      if (attempt.meaningCorrect !== null) entry.firstMeaningSubmitted += 1;
      if (attempt.meaningCorrect === true) entry.firstMeaningCorrectCount += 1;
    }
    // Review membership follows first answers. Retries remain separate learning history.
    if (attempt.attemptKind === 'first') {
      const previousReview = next.reviewQueue.find((review) => sameContent(review, attempt));
      let typingWrong = (previousReview?.typingWrong ?? false) || !attempt.typingCorrect;
      let meaningWrong = (previousReview?.meaningWrong ?? false) || attempt.meaningCorrect === false;
      if (attempt.practiceMode === 'review') {
        if (attempt.typingCorrect) typingWrong = false;
        if (attempt.meaningCorrect === true && !attempt.hintExposed) meaningWrong = false;
      }
      next.reviewQueue = next.reviewQueue.filter((review) => !sameContent(review, attempt));
      if (typingWrong || meaningWrong) next.reviewQueue.push({ contentId: attempt.contentId, contentVersion: attempt.contentVersion, variantLanguage: attempt.variantLanguage, typingWrong, meaningWrong, lastAttemptId: attempt.attemptId });
    }
    next.recentAttempts.push(clone(attempt));
    next.resume = clone(resume);
    return save(next);
  }

  function reset(scope: 'learning' | 'all'): StorageResult {
    if (!loaded) load();
    const cleared = createDefaultState(now());
    cleared.revision = state.revision + 1;
    if (scope === 'learning') {
      cleared.settings = clone(state.settings); cleared.contentPackVersion = state.contentPackVersion; cleared.scoringVersion = state.scoringVersion;
      if (!storage) { state = cleared; status = 'memory'; reason = undefined; return result(true); }
      if (status === 'blocked' || status === 'conflict') { reason ??= 'invalid-state'; return result(false); }
      // Synchronous writes mean there is no delayed request to resurrect deleted data.
      const previous = state;
      const saved = save({ ...cleared, revision: state.revision });
      if (!saved.ok) state = previous;
      return { ...saved, state: clone(state) };
    }
    if (storage) {
      try { storage.removeItem(STORAGE_KEY); } catch { return fail(status, 'delete-failed'); }
    }
    state = cleared; observedRaw = null; status = storage ? 'persistent' : 'memory'; reason = undefined;
    return result(true);
  }

  function notifyExternalChange() { status = 'conflict'; reason = 'external-change'; }
  return { load, save, updateSettings, recordAttempt, reset, notifyExternalChange, getState: () => clone(state), getStatus: () => status };
}
