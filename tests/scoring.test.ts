import { describe, expect, it, vi } from 'vitest';
import { comparisonKey, normalizeText, recordFirstMeaning, scoreTyping, splitGraphemes, summarizeMeaning } from '../src/scoring';

describe('strict-nfc-v1 normalization', () => {
  it('preserves tone, compatibility jamo, case, punctuation and non-ASCII whitespace', () => {
    expect(normalizeText('  cha\u0300o  ')).toBe('chào');
    expect(normalizeText('\u1100\u1161')).toBe('가');
    expect(normalizeText('ㄱㅏ')).toBe('ㄱㅏ');
    for (const text of ['chao', 'Cat', 'cat.', 'cat  dog', '\tcat', 'cat\n', '\u00a0cat']) {
      expect(normalizeText(text)).toBe(text);
    }
  });

  it('counts graphemes rather than UTF-16 units', () => {
    expect(splitGraphemes(normalizeText('cha\u0300o'))).toHaveLength(4);
    expect(splitGraphemes('👨‍👩‍👧‍👦')).toHaveLength(1);
    expect(splitGraphemes('한글')).toHaveLength(2);
  });

  it('fails explicitly when grapheme segmentation is unavailable', () => {
    vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined });
    try { expect(() => splitGraphemes('한')).toThrow('GRAPHEME_SEGMENTATION_UNAVAILABLE'); }
    finally { vi.unstubAllGlobals(); }
  });
});

describe('scoring-v1', () => {
  it.each([
    ['한글', '한굴', 4_000, 50, 30, false],
    ['물을 주세요.', '물을 주세요.', 14_000, 100, 30, true],
    ['xin chào', 'xin chao', 16_000, 87.5, 30, false],
    ['cat', 'cats', 8_000, 75, 30, false],
    ['cats', 'cat', 6_000, 75, 30, false],
  ])('%s / %s matches documented metrics', (expected, actual, elapsedMs, accuracy, cpm, correct) => {
    expect(scoreTyping({ expected, actual, elapsedMs, inputMethod: 'english' })).toMatchObject({ accuracy, cpm, correct, comparisonEligible: true });
  });

  it.each([['chào', 'cha\u0300o'], ['가', '\u1100\u1161'], ['cat', '  cat  ']])('accepts canonical equivalent %s / %s', (expected, actual) => {
    expect(scoreTyping({ expected, actual, elapsedMs: 2000 })?.correct).toBe(true);
  });

  it.each([['chào', 'chao'], ['가', 'ㄱㅏ'], ['cat', 'Cat'], ['cat.', 'cat'], ['a b', 'a  b'], ['cat', '\u00a0cat']])('rejects significant change %s / %s', (expected, actual) => {
    expect(scoreTyping({ expected, actual, elapsedMs: 2000 })?.correct).toBe(false);
  });

  it('creates no record for empty submissions and rejects invalid content', () => {
    expect(scoreTyping({ expected: '한', actual: '   ', elapsedMs: 1000 })).toBeNull();
    expect(() => scoreTyping({ expected: ' ', actual: '한', elapsedMs: 1000 })).toThrow('EMPTY_EXPECTED_TEXT');
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('has no speed for invalid elapsed time %s', elapsedMs => {
    expect(scoreTyping({ expected: 'cat', actual: 'cat', elapsedMs, inputMethod: 'english' })).toMatchObject({ cpm: null, comparisonEligible: false, exclusionReasons: ['invalid-time'] });
  });

  it('keeps each comparison exclusion visible', () => {
    expect(scoreTyping({ expected: 'cat', actual: 'cat', elapsedMs: 999, assisted: true, interrupted: true })).toMatchObject({ comparisonEligible: false, exclusionReasons: ['too-short', 'assisted', 'interrupted', 'unknown-input-method'] });
    expect(scoreTyping({ expected: 'cat', actual: 'cat', elapsedMs: 1000, inputMethod: 'english' })?.comparisonEligible).toBe(true);
  });

  it('does not infer correctness from a rounded 100.0%', () => {
    const score = scoreTyping({ expected: 'a'.repeat(2500), actual: 'a'.repeat(2499) + 'b', elapsedMs: 1000 });
    expect(score?.accuracy.toFixed(1)).toBe('100.0');
    expect(score?.correct).toBe(false);
  });

  it('keeps language, environment, revision and attempt kind in comparison groups', () => {
    const score = scoreTyping({ expected: 'cat', actual: 'cat', elapsedMs: 1000, inputMethod: 'english' })!;
    const context = { practiceLanguage: 'en' as const, inputMethod: 'english' as const, device: 'pc', osFamily: 'windows', browserFamily: 'chrome', contentId: 'MH-C005', contentRevision: 1, attemptKind: 'first' as const };
    const key = comparisonKey(score, context);
    expect(key).not.toBeNull();
    expect(comparisonKey(score, { ...context, practiceLanguage: 'vi' })).not.toBe(key);
    expect(comparisonKey(score, { ...context, browserFamily: 'edge' })).not.toBe(key);
    expect(comparisonKey(score, { ...context, contentRevision: 2 })).not.toBe(key);
    expect(comparisonKey(score, { ...context, attemptKind: 'retry' })).not.toBe(key);
    expect(comparisonKey(score, { ...context, inputMethod: 'unknown' })).toBeNull();
    expect(comparisonKey(score, { ...context, device: 'unknown' })).toBeNull();
  });
});

describe('meaning outcomes', () => {
  it('retains a first wrong answer after a correct retry and preserves hint exposure', () => {
    const first = recordFirstMeaning(null, 'coffee', 'water', true);
    expect(recordFirstMeaning(first, 'water', 'water', false)).toBe(first);
    expect(first).toMatchObject({ correct: false, hintExposed: true });
  });

  it('reports hinted and unhinted denominators independently, excluding missing tasks', () => {
    const yes = (hintExposed: boolean) => recordFirstMeaning(null, 'a', 'a', hintExposed);
    const no = recordFirstMeaning(null, 'b', 'a', true);
    const summary = summarizeMeaning([yes(true), yes(true), no, yes(false), null]);
    expect(summary.withHint).toMatchObject({ correct: 2, total: 3 });
    expect(summary.withHint.percent).toBeCloseTo(66.6667);
    expect(summary.withoutHint).toEqual({ correct: 1, total: 1, percent: 100 });
    expect(summarizeMeaning([]).withoutHint.percent).toBeNull();
  });
});
