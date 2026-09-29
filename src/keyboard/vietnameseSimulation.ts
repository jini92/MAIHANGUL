export type VietnameseMethod = 'telex' | 'vni';
export type SimulationStep = {
  code: string;
  label: string;
  shift: boolean;
  kind: 'letter' | 'shape' | 'tone' | 'separator';
  text: string;
};

// Explicit teaching vocabulary: current core-draft VI targets, UniKey's three
// example words, and its seven shape-table letters. New content needs review.
const SUPPORTED_WORDS = new Set((
  'âm ấm cà cảm chào cho chữ chút cốc đến đọc đợi hình học là làm lòng một ' +
  'nguyên nước ơn phê phụ sách sinh sữa tiết tôi trường vui xin tiếng việt đường ' +
  'â ê ô ă ơ ư đ'
).split(' '));

const SHAPES: Record<string, { base: string; telex: string; vni: string }> = {
  â: { base: 'a', telex: 'a', vni: '6' },
  ê: { base: 'e', telex: 'e', vni: '6' },
  ô: { base: 'o', telex: 'o', vni: '6' },
  ă: { base: 'a', telex: 'w', vni: '8' },
  ơ: { base: 'o', telex: 'w', vni: '7' },
  ư: { base: 'u', telex: 'w', vni: '7' },
  đ: { base: 'd', telex: 'd', vni: '9' },
};
const TONES: Record<string, Record<VietnameseMethod, string>> = {
  '\u0301': { telex: 's', vni: '1' },
  '\u0300': { telex: 'f', vni: '2' },
  '\u0309': { telex: 'r', vni: '3' },
  '\u0303': { telex: 'x', vni: '4' },
  '\u0323': { telex: 'j', vni: '5' },
};
const SEPARATORS: Record<string, { code: string; shift: boolean }> = {
  ' ': { code: 'Space', shift: false },
  ',': { code: 'Comma', shift: false },
  '.': { code: 'Period', shift: false },
  ';': { code: 'Semicolon', shift: false },
  ':': { code: 'Semicolon', shift: true },
  '!': { code: 'Digit1', shift: true },
  '?': { code: 'Slash', shift: true },
};

function step(key: string, kind: SimulationStep['kind'], text: string): SimulationStep {
  const separator = SEPARATORS[key];
  return {
    code: separator?.code ?? (/^[0-9]$/.test(key) ? `Digit${key}` : `Key${key.toUpperCase()}`),
    label: key === ' ' ? 'Space' : key,
    shift: separator?.shift ?? /^[A-Z]$/.test(key),
    kind,
    text: text.normalize('NFC'),
  };
}

/**
 * A teaching example, not an IME. Frames may differ from actual OS/UniKey
 * intermediate states and never process a learner's live composition events.
 * UniKey manual §§3.1–3.3: https://www.unikey.org/support/ukmanual.html
 * Use each shape key immediately and the tone key at the end of the word.
 * Capitalize the base letter; shape/tone keys can remain lowercase.
 * Unknown words and unsupported separators fail closed, without a partial plan.
 */
export function planVietnameseSimulation(
  target: string,
  method: VietnameseMethod,
): { supported: boolean; steps: SimulationStep[] } {
  const normalized = target.normalize('NFC');
  const tokens = normalized.match(/\p{L}+|[ .,!?;:]/gu) ?? [];
  const hasWord = tokens.some(token => SUPPORTED_WORDS.has(token.toLowerCase()));
  if ((method !== 'telex' && method !== 'vni') || !hasWord || tokens.join('') !== normalized ||
      tokens.some(token => !Object.hasOwn(SEPARATORS, token) && !SUPPORTED_WORDS.has(token.toLowerCase()))) {
    return { supported: false, steps: [] };
  }

  const steps: SimulationStep[] = [];
  let prefix = '';
  for (const token of tokens) {
    if (Object.hasOwn(SEPARATORS, token)) {
      prefix += token;
      steps.push(step(token, 'separator', prefix));
      continue;
    }

    let word = '';
    let toneKey: string | undefined;
    for (const character of token) {
      const decomposed = [...character.normalize('NFD')];
      const tone = decomposed.find(mark => Object.hasOwn(TONES, mark));
      if (tone) toneKey = TONES[tone][method];
      const shaped = decomposed.filter(mark => !Object.hasOwn(TONES, mark)).join('').normalize('NFC');
      const shape = SHAPES[shaped.toLowerCase()];
      const base = shape
        ? (shaped === shaped.toUpperCase() ? shape.base.toUpperCase() : shape.base)
        : shaped;
      steps.push(step(base, 'letter', prefix + word + base));
      if (shape) steps.push(step(shape[method], 'shape', prefix + word + shaped));
      word += shaped;
    }
    if (toneKey) steps.push(step(toneKey, 'tone', prefix + token));
    prefix += token;
  }
  return { supported: true, steps };
}
