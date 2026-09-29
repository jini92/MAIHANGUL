/** A visual reference for a standard PC QWERTY / Korean two-set keyboard. */
export interface PhysicalKey {
  code: string;
  label: string;
  korean?: string;
  shifted?: string;
  width?: number;
  home?: boolean;
}

const letter = (latin: string, korean: string, shifted?: string): PhysicalKey => ({
  code: `Key${latin}`, label: latin, korean, shifted, home: latin === 'F' || latin === 'J',
});

export const KEYBOARD_ROWS: readonly (readonly PhysicalKey[])[] = [
  [
    { code: 'Backquote', label: '`', shifted: '~' },
    ...'1234567890'.split('').map((label, index) => ({ code: `Digit${label}`, label, shifted: '!@#$%^&*()'[index] })),
    { code: 'Minus', label: '-', shifted: '_' }, { code: 'Equal', label: '=', shifted: '+' },
    { code: 'Backspace', label: 'Backspace', width: 2 },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    letter('Q', 'ㅂ', 'ㅃ'), letter('W', 'ㅈ', 'ㅉ'), letter('E', 'ㄷ', 'ㄸ'), letter('R', 'ㄱ', 'ㄲ'), letter('T', 'ㅅ', 'ㅆ'),
    letter('Y', 'ㅛ'), letter('U', 'ㅕ'), letter('I', 'ㅑ'), letter('O', 'ㅐ', 'ㅒ'), letter('P', 'ㅔ', 'ㅖ'),
    { code: 'BracketLeft', label: '[', shifted: '{' }, { code: 'BracketRight', label: ']', shifted: '}' },
    { code: 'Backslash', label: '\\', shifted: '|', width: 1.5 },
  ],
  [
    { code: 'CapsLock', label: 'Caps Lock', width: 1.75 },
    letter('A', 'ㅁ'), letter('S', 'ㄴ'), letter('D', 'ㅇ'), letter('F', 'ㄹ'), letter('G', 'ㅎ'),
    letter('H', 'ㅗ'), letter('J', 'ㅓ'), letter('K', 'ㅏ'), letter('L', 'ㅣ'),
    { code: 'Semicolon', label: ';', shifted: ':' }, { code: 'Quote', label: "'", shifted: '"' },
    { code: 'Enter', label: 'Enter', width: 2.25 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    letter('Z', 'ㅋ'), letter('X', 'ㅌ'), letter('C', 'ㅊ'), letter('V', 'ㅍ'), letter('B', 'ㅠ'),
    letter('N', 'ㅜ'), letter('M', 'ㅡ'),
    { code: 'Comma', label: ',', shifted: '<' }, { code: 'Period', label: '.', shifted: '>' }, { code: 'Slash', label: '/', shifted: '?' },
    { code: 'ShiftRight', label: 'Shift', width: 2.75 },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.25 }, { code: 'MetaLeft', label: 'Win', width: 1.25 },
    { code: 'AltLeft', label: 'Alt', width: 1.25 }, { code: 'Space', label: 'Space', width: 6.25 },
    { code: 'AltRight', label: 'Alt', width: 1.25 }, { code: 'MetaRight', label: 'Win', width: 1.25 },
    { code: 'ContextMenu', label: 'Menu', width: 1.25 }, { code: 'ControlRight', label: 'Ctrl', width: 1.25 },
  ],
];

export const PHYSICAL_CODES = new Set(KEYBOARD_ROWS.flat().map(key => key.code));
export type Finger = 'leftLittle' | 'leftRing' | 'leftMiddle' | 'leftIndex' | 'rightIndex' | 'rightMiddle' | 'rightRing' | 'rightLittle';

export function fingerFor(code: string): Finger {
  const letter = code.replace('Key', '');
  if ('QAZ'.includes(letter)) return 'leftLittle';
  if ('WSX'.includes(letter)) return 'leftRing';
  if ('EDC'.includes(letter)) return 'leftMiddle';
  if ('RFVTGB'.includes(letter)) return 'leftIndex';
  if ('YHNUJM'.includes(letter)) return 'rightIndex';
  if ('IK'.includes(letter)) return 'rightMiddle';
  if ('OL'.includes(letter)) return 'rightRing';
  return 'rightLittle';
}

const JAMO_KEYS: Record<string, string> = {
  ㄱ: 'r', ㄲ: 'R', ㄳ: 'rt', ㄴ: 's', ㄵ: 'sw', ㄶ: 'sg', ㄷ: 'e', ㄸ: 'E', ㄹ: 'f',
  ㄺ: 'fr', ㄻ: 'fa', ㄼ: 'fq', ㄽ: 'ft', ㄾ: 'fx', ㄿ: 'fv', ㅀ: 'fg', ㅁ: 'a', ㅂ: 'q', ㅃ: 'Q', ㅄ: 'qt',
  ㅅ: 't', ㅆ: 'T', ㅇ: 'd', ㅈ: 'w', ㅉ: 'W', ㅊ: 'c', ㅋ: 'z', ㅌ: 'x', ㅍ: 'v', ㅎ: 'g',
  ㅏ: 'k', ㅐ: 'o', ㅑ: 'i', ㅒ: 'O', ㅓ: 'j', ㅔ: 'p', ㅕ: 'u', ㅖ: 'P', ㅗ: 'h', ㅘ: 'hk', ㅙ: 'ho',
  ㅚ: 'hl', ㅛ: 'y', ㅜ: 'n', ㅝ: 'nj', ㅞ: 'np', ㅟ: 'nl', ㅠ: 'b', ㅡ: 'm', ㅢ: 'ml', ㅣ: 'l',
};
const INITIALS = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const VOWELS = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const FINALS = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];

export interface KeyStep { code: string; label: string; shiftCode: 'ShiftLeft' | 'ShiftRight' | null; finger: Finger }

/** Static guidance for one target only. Never examines typed/composing text or infers correctness. */
export function jamoKeySteps(target: string): KeyStep[] {
  const characters = [...target.normalize('NFC')];
  if (characters.length !== 1) return [];
  const code = characters[0].codePointAt(0)! - 0xac00;
  const parts = code >= 0 && code < 11172
    ? [INITIALS[Math.floor(code / 588)], VOWELS[Math.floor(code % 588 / 28)], FINALS[code % 28]]
    : characters;
  if (parts.some(part => part && !JAMO_KEYS[part])) return [];
  return [...parts.map(part => JAMO_KEYS[part] ?? '').join('')].map(key => {
    const code = `Key${key.toUpperCase()}`;
    const finger = fingerFor(code);
    const shiftCode = key === key.toUpperCase() ? finger.startsWith('left') ? 'ShiftRight' : 'ShiftLeft' : null;
    return { code, label: key.toUpperCase(), shiftCode, finger };
  });
}
