export const POLICY_VERSION = 'strict-nfc-v1' as const;
export const SCORING_VERSION = 'scoring-v1' as const;

export type InputMethod = 'korean-2set' | 'telex' | 'vni' | 'english' | 'unknown';
export type ExclusionReason = 'invalid-time' | 'too-short' | 'assisted' | 'interrupted' | 'unknown-input-method';

/** Apply only to confirmed submissions. Never write this back into an active IME field. */
export function normalizeText(text: string): string {
  return text.normalize('NFC').replace(/^ +| +$/g, '');
}

export function splitGraphemes(text: string): string[] {
  if (typeof Intl.Segmenter !== 'function') {
    throw new Error('GRAPHEME_SEGMENTATION_UNAVAILABLE');
  }
  return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.segment);
}

export function levenshtein(target: readonly string[], actual: readonly string[]): number {
  let previous = Array.from({ length: actual.length + 1 }, (_, index) => index);
  for (let row = 1; row <= target.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= actual.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + Number(target[row - 1] !== actual[column - 1]),
      );
    }
    previous = current;
  }
  return previous[actual.length];
}

export interface TypingScore {
  correct: boolean;
  accuracy: number;
  cpm: number | null;
  editDistance: number;
  targetLength: number;
  inputLength: number;
  elapsedMs: number;
  assisted: boolean;
  interrupted: boolean;
  inputMethod: InputMethod;
  comparisonEligible: boolean;
  exclusionReasons: ExclusionReason[];
  policyVersion: typeof POLICY_VERSION;
  scoringVersion: typeof SCORING_VERSION;
}

export interface TypingScoreInput {
  expected: string;
  actual: string;
  elapsedMs: number;
  assisted?: boolean;
  interrupted?: boolean;
  inputMethod?: InputMethod;
}

export function scoreTyping(input: TypingScoreInput): TypingScore | null {
  const expected = normalizeText(input.expected);
  const actual = normalizeText(input.actual);
  if (!expected) throw new Error('EMPTY_EXPECTED_TEXT');
  if (!actual) return null;
  const target = splitGraphemes(expected);
  const typed = splitGraphemes(actual);
  const distance = levenshtein(target, typed);
  const validTime = Number.isFinite(input.elapsedMs) && input.elapsedMs > 0;
  const assisted = input.assisted ?? false;
  const interrupted = input.interrupted ?? false;
  const inputMethod = input.inputMethod ?? 'unknown';
  const exclusionReasons: ExclusionReason[] = [];
  if (!validTime) exclusionReasons.push('invalid-time');
  else if (input.elapsedMs < 1_000) exclusionReasons.push('too-short');
  if (assisted) exclusionReasons.push('assisted');
  if (interrupted) exclusionReasons.push('interrupted');
  if (inputMethod === 'unknown') exclusionReasons.push('unknown-input-method');
  return {
    correct: expected === actual,
    accuracy: 100 * Math.max(0, 1 - distance / Math.max(target.length, typed.length)),
    cpm: validTime ? typed.length * 60_000 / input.elapsedMs : null,
    editDistance: distance,
    targetLength: target.length,
    inputLength: typed.length,
    elapsedMs: Number.isFinite(input.elapsedMs) ? input.elapsedMs : 0,
    assisted,
    interrupted,
    inputMethod,
    comparisonEligible: exclusionReasons.length === 0,
    exclusionReasons,
    policyVersion: POLICY_VERSION,
    scoringVersion: SCORING_VERSION,
  };
}

export interface FirstMeaningResult {
  choiceId: string;
  correct: boolean;
  hintExposed: boolean;
}

/** A retry cannot overwrite the first answer or remove an earlier hint exposure. */
export function recordFirstMeaning(
  existing: FirstMeaningResult | null,
  choiceId: string,
  correctChoiceId: string,
  hintExposed: boolean,
): FirstMeaningResult {
  return existing ?? { choiceId, correct: choiceId === correctChoiceId, hintExposed };
}

export function summarizeMeaning(results: readonly (FirstMeaningResult | null)[]) {
  const group = (hintExposed: boolean) => {
    const completed = results.filter((result): result is FirstMeaningResult => result !== null && result.hintExposed === hintExposed);
    const correct = completed.filter(result => result.correct).length;
    return { correct, total: completed.length, percent: completed.length ? 100 * correct / completed.length : null };
  };
  return { withHint: group(true), withoutHint: group(false) };
}

export interface ComparisonContext {
  practiceLanguage: 'ko' | 'en' | 'vi';
  inputMethod: InputMethod;
  device: string;
  osFamily: string;
  browserFamily: string;
  contentId: string;
  contentRevision: number;
  attemptKind: 'first' | 'retry';
}

/** No cross-language or cross-environment aggregation is implied by a raw CPM. */
export function comparisonKey(score: TypingScore, context: ComparisonContext): string | null {
  if (!score.comparisonEligible || context.inputMethod === 'unknown' || context.inputMethod !== score.inputMethod) return null;
  if ([context.device, context.osFamily, context.browserFamily].some(value => !value || value === 'unknown')) return null;
  return JSON.stringify([
    context.practiceLanguage, context.inputMethod, context.device, context.osFamily,
    context.browserFamily, context.contentId, context.contentRevision, context.attemptKind,
    score.policyVersion, score.scoringVersion, score.assisted, score.interrupted,
  ]);
}
