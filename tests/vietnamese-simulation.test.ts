import { describe, expect, it } from 'vitest';
import coreDraft from '../content/core-draft.json';
import { PHYSICAL_CODES } from '../src/keyboard/layout';
import { planVietnameseSimulation, type VietnameseMethod } from '../src/keyboard/vietnameseSimulation';

const methods: VietnameseMethod[] = ['telex', 'vni'];
const viTargets = coreDraft.concepts.map(concept => concept.variants.vi.targetText);
const keys = (target: string, method: VietnameseMethod) => planVietnameseSimulation(target, method).steps
  .map(step => step.code === 'Space' ? ' ' : step.label).join('');

describe.each(methods)('%s Vietnamese teaching simulation', method => {
  it.each(viTargets)('reaches the NFC target: %s', target => {
    const plan = planVietnameseSimulation(target, method);
    expect(plan.supported).toBe(true);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps.at(-1)?.text).toBe(target.normalize('NFC'));
    for (const step of plan.steps) {
      expect(PHYSICAL_CODES.has(step.code)).toBe(true);
      expect(step.text).toBe(step.text.normalize('NFC'));
    }
  });

  it('defers the tone for chào until the whole word has been typed', () => {
    const plan = planVietnameseSimulation('chào', method);
    expect(plan.steps.map(step => step.text)).toEqual(['c', 'ch', 'cha', 'chao', 'chào']);
    expect(plan.steps.map(step => step.kind)).toEqual(['letter', 'letter', 'letter', 'letter', 'tone']);
    expect(plan.steps.at(-1)).toMatchObject(method === 'telex'
      ? { code: 'KeyF', label: 'f', shift: false }
      : { code: 'Digit2', label: '2', shift: false });
  });

  it('shows both consecutive horn transformations before the word-final tone', () => {
    const plan = planVietnameseSimulation('đường', method);
    expect(plan.steps.map(step => step.text)).toEqual([
      'd', 'đ', 'đu', 'đư', 'đưo', 'đươ', 'đươn', 'đương', 'đường',
    ]);
    expect(plan.steps.map(step => step.kind)).toEqual([
      'letter', 'shape', 'letter', 'shape', 'letter', 'shape', 'letter', 'letter', 'tone',
    ]);
  });

  it('shows the water example with immediate horns and a final acute tone', () => {
    const plan = planVietnameseSimulation('nước', method);
    expect(plan.steps.map(step => step.text)).toEqual(['n', 'nu', 'nư', 'nưo', 'nươ', 'nươc', 'nước']);
    expect(keys('nước', method)).toBe(method === 'telex' ? 'nuwowcs' : 'nu7o7c1');
  });

  it('normalizes decomposed accents without dropping tones', () => {
    expect(planVietnameseSimulation('Tôi đến trường.'.normalize('NFD'), method))
      .toEqual(planVietnameseSimulation('Tôi đến trường.', method));
    expect(planVietnameseSimulation('chào'.normalize('NFD'), method).steps.at(-1)?.text).toBe('chào');
  });

  it('uses Shift for uppercase base letters and preserves their shaped forms', () => {
    const plan = planVietnameseSimulation('ĐƯỜNG', method);
    expect(plan.steps.at(-1)?.text).toBe('ĐƯỜNG');
    expect(plan.steps.filter(step => step.kind === 'letter').map(step => [step.code, step.label, step.shift]))
      .toEqual([['KeyD', 'D', true], ['KeyU', 'U', true], ['KeyO', 'O', true], ['KeyN', 'N', true], ['KeyG', 'G', true]]);
    expect(plan.steps.filter(step => step.kind === 'shape' || step.kind === 'tone').every(step => !step.shift)).toBe(true);
  });

  it('preserves leading, repeated and trailing spaces and punctuation', () => {
    const plan = planVietnameseSimulation(' Xin  chào, Việt! ', method);
    expect(plan.steps.at(-1)?.text).toBe(' Xin  chào, Việt! ');
    expect(plan.steps.filter(step => step.kind === 'separator').map(step => [step.code, step.shift]))
      .toEqual([['Space', false], ['Space', false], ['Space', false], ['Comma', false], ['Space', false], ['Digit1', true], ['Space', false]]);
    expect(plan.steps.find(step => step.label === ',')?.text).toBe(' Xin  chào,');
  });

  it('maps question mark, colon and semicolon to physical keys', () => {
    expect(planVietnameseSimulation('xin: chào; Việt?', method).steps.filter(step => step.kind === 'separator'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'Semicolon', label: ':', shift: true }),
        expect.objectContaining({ code: 'Semicolon', label: ';', shift: false }),
        expect.objectContaining({ code: 'Slash', label: '?', shift: true }),
      ]));
  });

  it.each(['', '   ', '.', 'hello', 'coffee', 'xin coffee', 'chao', 'abc', 'hòa', '한글', 'xin\nchào', 'xin\tchào', 'xin\u00a0chào', 'xin 1', 'xin🙂', 'sữã', '\u0301'])
    ('rejects an empty, unknown or unsafe target without partial steps: %j', target => {
      expect(planVietnameseSimulation(target, method)).toEqual({ supported: false, steps: [] });
    });
});

describe('documented UniKey keys', () => {
  it.each([
    ['tiếng Việt', 'tieengs Vieetj', 'tie6ng1 Vie6t5'],
    ['đường', 'dduwowngf', 'd9u7o7ng2'],
    ['â', 'aa', 'a6'], ['ê', 'ee', 'e6'], ['ô', 'oo', 'o6'],
    ['ă', 'aw', 'a8'], ['ơ', 'ow', 'o7'], ['ư', 'uw', 'u7'], ['đ', 'dd', 'd9'],
  ])('uses the documented sequence for %s', (target, telex, vni) => {
    expect(keys(target, 'telex')).toBe(telex);
    expect(keys(target, 'vni')).toBe(vni);
  });

  it.each([
    ['sách', 's', '1'], ['chào', 'f', '2'], ['cảm', 'r', '3'], ['sữa', 'x', '4'], ['phụ', 'j', '5'],
  ])('uses the correct tone key for %s', (target, telex, vni) => {
    expect(planVietnameseSimulation(target, 'telex').steps.at(-1)).toMatchObject({ kind: 'tone', label: telex });
    expect(planVietnameseSimulation(target, 'vni').steps.at(-1)).toMatchObject({ kind: 'tone', label: vni });
  });

  it('keeps the corpus coverage check pinned to all twenty current targets', () => {
    expect(viTargets).toHaveLength(20);
  });

  it('returns independent plans without sharing mutable step state', () => {
    const first = planVietnameseSimulation('chào', 'telex');
    first.steps[0].text = 'changed by consumer';
    expect(planVietnameseSimulation('chào', 'telex').steps[0].text).toBe('c');
  });
});
