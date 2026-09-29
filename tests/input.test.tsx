// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PracticeInputController, usePracticeInput, type AcceptedInput } from '../src/input/usePracticeInput';

afterEach(cleanup);

function setup() {
  let time = 0;
  const accepted = vi.fn<(value: AcceptedInput) => void>();
  const controller = new PracticeInputController({ questionKey: 'q1', onAccepted: accepted }, () => time);
  let node = document.createElement('input');
  controller.attach(node, controller.getSnapshot().epoch);
  const input = (text: string, isComposing = false, inputType = 'insertText') => {
    node.value = text;
    controller.input(node, controller.getSnapshot().epoch, new InputEvent('input', { inputType, isComposing }));
  };
  const remount = () => {
    node = document.createElement('input');
    node.value = controller.getSnapshot().committedText;
    controller.attach(node, controller.getSnapshot().epoch);
  };
  return { controller, accepted, input, remount, node: () => node, advance: (ms: number) => { time += ms; } };
}

describe('provisional IME controller (synthetic evidence only)', () => {
  it('does not score composing/settling input and requires a new activation', () => {
    const test = setup();
    test.controller.compositionStart(test.node(), 0);
    for (const text of ['ㅎ', '하', '한']) {
      test.input(text, true, 'insertCompositionText');
      expect(test.controller.submit()).toBe('blocked');
      expect(test.accepted).not.toHaveBeenCalled();
    }
    test.controller.compositionEnd(test.node(), 0);
    test.input('한', false, 'insertText');
    expect(test.controller.submit()).toBe('confirm-required');
    expect(test.accepted).not.toHaveBeenCalled();
    expect(test.controller.submit({ detail: 2 })).toBe('blocked');
    test.advance(2000);
    expect(test.controller.submit()).toBe('accepted');
    expect(test.controller.submit()).toBe('blocked');
    expect(test.accepted).toHaveBeenCalledTimes(1);
    expect(test.accepted.mock.calls[0][0]).toMatchObject({ text: '한', elapsedMs: 2000, measurementStart: 'compositionstart' });
  });

  it('handles cancellation using the full DOM value and never compositionend.data', () => {
    const test = setup();
    test.input('한');
    test.controller.compositionStart(test.node(), 0);
    test.input('한ㄱ', true);
    test.node().value = '한';
    test.controller.compositionEnd(test.node(), 0);
    expect(test.controller.submit()).toBe('confirm-required');
    expect(test.controller.submit()).toBe('accepted');
    expect(test.accepted.mock.calls[0][0].text).toBe('한');
  });

  it('does not rewrite decomposed text during composition or confirmation', () => {
    const test = setup();
    test.controller.compositionStart(test.node(), 0);
    test.input('cha\u0300o', true);
    test.controller.compositionEnd(test.node(), 0);
    test.controller.submit();
    expect(test.node().value).toBe('cha\u0300o');
    test.controller.submit();
    expect(test.accepted.mock.calls[0][0].text).toBe('chào');
    expect(test.node().value).toBe('cha\u0300o');
  });

  it('discards late old-element input/end after explicit retry', () => {
    const test = setup();
    const oldNode = test.node();
    test.controller.compositionStart(oldNode, 0);
    test.input('한', true);
    const previousAttempt = test.controller.getSnapshot().attemptId;
    test.controller.reset();
    test.remount();
    test.controller.compositionEnd(oldNode, 0);
    oldNode.value = '늦은 이벤트';
    test.controller.input(oldNode, 0, new InputEvent('input'));
    expect(test.controller.getSnapshot()).toMatchObject({ state: 'stable', committedText: '', epoch: 1 });
    expect(test.node().value).toBe('');
    expect(test.controller.getSnapshot().attemptId).not.toBe(previousAttempt);
  });

  it('retains paste assistance after deletion and excludes it from later normal input', () => {
    const test = setup();
    test.input('copied', false, 'insertFromPaste');
    test.input('', false, 'deleteContentBackward');
    test.input('cat');
    test.advance(1000);
    test.controller.submit();
    expect(test.accepted.mock.calls[0][0]).toMatchObject({ text: 'cat', assisted: true });
    test.controller.reset();
    expect(test.controller.getSnapshot().assisted).toBe(false);
  });

  it('resumes only committed text and retains interrupted timing metadata', () => {
    const test = setup();
    test.input('한');
    test.advance(1000);
    test.controller.compositionStart(test.node(), 0);
    test.input('한ㄱ', true);
    test.controller.pause();
    expect(test.controller.submit()).toBe('blocked');
    test.advance(5000);
    test.controller.resume();
    test.remount();
    expect(test.node().value).toBe('한');
    test.controller.submit();
    expect(test.accepted.mock.calls[0][0]).toMatchObject({ text: '한', interrupted: true, elapsedMs: 6000 });
  });

  it('uses beforeinput timing before input and rejects empty without locking', () => {
    const test = setup();
    expect(test.controller.submit()).toBe('empty');
    test.node().dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', bubbles: true }));
    test.advance(1000);
    test.input('cat');
    test.controller.submit();
    expect(test.accepted.mock.calls[0][0]).toMatchObject({ elapsedMs: 1000, measurementStart: 'beforeinput' });
  });

  it('reconfirms unobserved changes after composition confirmation', () => {
    const test = setup();
    test.controller.compositionStart(test.node(), 0);
    test.input('한', true);
    test.controller.compositionEnd(test.node(), 0);
    expect(test.controller.submit()).toBe('confirm-required');
    test.node().value = '한국';
    expect(test.controller.submit()).toBe('confirm-required');
    expect(test.accepted).not.toHaveBeenCalled();
  });

  it('requires a new confirmation when a late noncomposing input changes the confirmed value', () => {
    const test = setup();
    test.controller.compositionStart(test.node(), 0);
    test.input('한', true);
    test.controller.compositionEnd(test.node(), 0);
    expect(test.controller.submit()).toBe('confirm-required');
    test.input('한국', false, 'insertText');
    expect(test.controller.getSnapshot()).toMatchObject({ state: 'settling', committedText: '한' });
    expect(test.controller.submit()).toBe('confirm-required');
    expect(test.accepted).not.toHaveBeenCalled();
    expect(test.controller.submit()).toBe('accepted');
    expect(test.accepted).toHaveBeenCalledTimes(1);
    expect(test.accepted.mock.calls[0][0].text).toBe('한국');
  });

  it('keeps confirmation for a late input that leaves the confirmed whole value unchanged', () => {
    const test = setup();
    test.controller.compositionStart(test.node(), 0);
    test.input('한', true);
    test.controller.compositionEnd(test.node(), 0);
    expect(test.controller.submit()).toBe('confirm-required');
    test.input('한', false, 'insertText');
    expect(test.controller.submit()).toBe('accepted');
    expect(test.accepted.mock.calls[0][0].text).toBe('한');
  });

  it('does not preserve an unconfirmed late replacement across pause and resume', () => {
    const test = setup();
    test.controller.compositionStart(test.node(), 0);
    test.input('한', true);
    test.controller.compositionEnd(test.node(), 0);
    test.controller.submit();
    test.input('한국', false, 'insertText');
    test.controller.pause();
    test.controller.resume();
    test.remount();
    expect(test.node().value).toBe('한');
    expect(test.controller.getSnapshot().interrupted).toBe(true);
  });
});

function Harness({ questionKey = 'q1', label = '답', accepted = () => {} }: { questionKey?: string; label?: string; accepted?: (result: AcceptedInput) => void }) {
  const input = usePracticeInput({ questionKey, onAccepted: accepted });
  return <>
    <input aria-label={label} key={input.inputKey} {...input.inputProps} />
    <button onClick={event => input.submit({ detail: event.detail })}>확인</button>
    <span>{input.state}</span>
  </>;
}

describe('React input integration', () => {
  it('keeps the DOM input on UI language changes, but replaces it on a question change', () => {
    const accepted = vi.fn();
    const { rerender } = render(<Harness accepted={accepted} />);
    const first = screen.getByRole('textbox');
    fireEvent.input(first, { target: { value: '한' } });
    rerender(<Harness label="Answer" accepted={accepted} />);
    expect(screen.getByRole('textbox')).toBe(first);
    expect((first as HTMLInputElement).value).toBe('한');
    rerender(<Harness questionKey="q2" accepted={accepted} />);
    const second = screen.getByRole('textbox');
    expect(second).not.toBe(first);
    fireEvent.compositionEnd(first, { data: '늦은 값' });
    fireEvent.input(first, { target: { value: '늦은 값' } });
    expect((second as HTMLInputElement).value).toBe('');
    expect(accepted).not.toHaveBeenCalled();
  });

  it('prevents regular Enter default but does not intercept IME Enter', () => {
    const accepted = vi.fn();
    render(<Harness accepted={accepted} />);
    const field = screen.getByRole('textbox');
    fireEvent.input(field, { target: { value: '한' } });
    expect(fireEvent.keyDown(field, { key: 'Enter' })).toBe(false);
    fireEvent.compositionStart(field);
    expect(fireEvent.keyDown(field, { key: 'Enter', isComposing: true })).toBe(true);
    expect(accepted).not.toHaveBeenCalled();
  });

  it('does not treat normal input-to-submit focus movement as interruption', () => {
    const accepted = vi.fn();
    render(<Harness accepted={accepted} />);
    const field = screen.getByRole('textbox');
    fireEvent.input(field, { target: { value: 'cat' } });
    fireEvent.blur(field, { relatedTarget: screen.getByRole('button') });
    fireEvent.click(screen.getByRole('button'));
    expect(accepted.mock.calls[0][0].interrupted).toBe(false);
  });

  it('pauses on window blur and discards the unconfirmed composition', () => {
    render(<Harness />);
    const field = screen.getByRole('textbox');
    fireEvent.input(field, { target: { value: '한' } });
    fireEvent.compositionStart(field);
    fireEvent.input(field, { target: { value: '한ㄱ' }, isComposing: true });
    fireEvent(window, new Event('blur'));
    expect(screen.getByText('paused')).toBeTruthy();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('한');
    expect((screen.getByRole('textbox') as HTMLInputElement).readOnly).toBe(true);
  });
});
