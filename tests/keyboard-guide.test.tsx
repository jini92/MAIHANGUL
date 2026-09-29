import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { KeyboardGuide } from '../src/components/KeyboardGuide';
import { KEYBOARD_ROWS, jamoKeySteps } from '../src/keyboard/layout';
import { createStorageAdapter, STORAGE_KEY } from '../src/storage';
import { messages } from '../src/i18n';
import type { Locale } from '../src/content';

beforeEach(() => { localStorage.clear(); });

describe('static two-set keyboard reference', () => {
  it.each([
    ['ㄱ', ['R'], ['leftIndex']], ['ㄴ', ['S'], ['leftRing']], ['ㅏ', ['K'], ['rightMiddle']],
    ['가', ['R', 'K'], ['leftIndex', 'rightMiddle']], ['과', ['R', 'H', 'K'], ['leftIndex', 'rightIndex', 'rightMiddle']],
    ['값', ['R', 'K', 'Q', 'T'], ['leftIndex', 'rightMiddle', 'leftLittle', 'leftIndex']],
    ['ㅠ', ['B'], ['leftIndex']],
  ])('shows the physical sequence and fingers for %s', (target, keys, fingers) => {
    const steps = jamoKeySteps(target as string);
    expect(steps.map(step => step.label)).toEqual(keys);
    expect(steps.map(step => step.finger)).toEqual(fingers);
  });

  it('supports NFC-equivalent syllables and opposite-hand Shift without guessing word progress', () => {
    expect(jamoKeySteps('가')).toEqual(jamoKeySteps('가'));
    expect(jamoKeySteps('ㄲ')[0]).toMatchObject({ code: 'KeyR', shiftCode: 'ShiftRight' });
    expect(jamoKeySteps('ㅒ')[0]).toMatchObject({ code: 'KeyO', shiftCode: 'ShiftLeft' });
    expect(jamoKeySteps('한국어')).toEqual([]);
    expect(jamoKeySteps('á')).toEqual([]);
  });

  it('gives each physical key one identity and preserves five full-width staggered rows', () => {
    expect(KEYBOARD_ROWS).toHaveLength(5);
    expect(new Set(KEYBOARD_ROWS.flat().map(key => key.code)).size).toBe(KEYBOARD_ROWS.flat().length);
    for (const row of KEYBOARD_ROWS) expect(row.reduce((total, key) => total + (key.width ?? 1), 0)).toBe(15);
    expect(KEYBOARD_ROWS.flat().filter(key => key.home).map(key => key.code)).toEqual(['KeyF', 'KeyJ']);
  });

  it.each(['ko', 'en', 'vi'] as Locale[])('explains Korean keys in %s without adding dozens of tab stops', locale => {
    const { container } = render(<KeyboardGuide locale={locale} language="ko" target="가" isJamo />);
    const guide = screen.getByRole('region', { name: messages[locale].keyboardTitle });
    expect(within(guide).getByText(messages[locale].keyboardHome)).toBeInTheDocument();
    expect(within(guide).getByText(messages[locale].leftIndex)).toBeInTheDocument();
    expect(within(guide).getByText(messages[locale].rightMiddle)).toBeInTheDocument();
    expect(container.querySelector('[data-code="KeyR"]')).toHaveClass('is-target');
    expect(container.querySelector('[data-code="KeyK"]')).toHaveClass('is-target');
    expect(container.querySelector('[data-code="KeyR"]')).toHaveTextContent('ㄱ');
    expect(guide.querySelectorAll('button, input')).toHaveLength(0);
    const scroll = within(guide).getByRole('region', { name: messages[locale].keyboardScroll });
    expect(scroll).toHaveAttribute('tabindex', '0');
    expect(guide.querySelectorAll('[tabindex]')).toHaveLength(1);
  });

  it('shows Vietnamese QWERTY and method-specific examples without converting text', () => {
    const { container, rerender } = render(<KeyboardGuide locale="vi" language="vi" inputMethod="telex" />);
    expect(screen.getByText(messages.vi.keyboardTelex)).toBeInTheDocument();
    expect(container.querySelector('.key-hangul')).not.toBeInTheDocument();
    rerender(<KeyboardGuide locale="vi" language="vi" inputMethod="vni" />);
    expect(screen.getByText(messages.vi.keyboardVni)).toBeInTheDocument();
    expect(screen.queryByText(messages.vi.keyboardTelex)).not.toBeInTheDocument();
  });

  it('scrolls an overflowing keyboard with its own arrow / Home / End keys and preserves unrelated keys', () => {
    render(<KeyboardGuide locale="en" language="ko" />);
    const scroll = screen.getByRole('region', { name: messages.en.keyboardScroll });
    Object.defineProperties(scroll, { clientWidth: { configurable: true, value: 506 }, scrollWidth: { value: 594 } });
    const scrollTo = vi.fn((options: ScrollToOptions) => { scroll.scrollLeft = options.left ?? 0; });
    Object.defineProperty(scroll, 'scrollTo', { value: scrollTo });
    scroll.focus();
    expect(fireEvent.keyDown(scroll, { key: 'ArrowRight' })).toBe(false);
    expect(scroll.scrollLeft).toBe(64);
    fireEvent.keyDown(scroll, { key: 'ArrowRight' });
    expect(scroll.scrollLeft).toBe(88);
    fireEvent.keyDown(scroll, { key: 'ArrowLeft' });
    expect(scroll.scrollLeft).toBe(24);
    fireEvent.keyDown(scroll, { key: 'End' });
    expect(scroll.scrollLeft).toBe(88);
    fireEvent.keyDown(scroll, { key: 'Home' });
    expect(scroll.scrollLeft).toBe(0);
    const calls = scrollTo.mock.calls.length;
    for (const key of ['Tab', 'ArrowDown', 'Enter', 'r']) expect(fireEvent.keyDown(scroll, { key })).toBe(true);
    expect(fireEvent.keyDown(scroll, { key: 'ArrowRight', ctrlKey: true })).toBe(true);
    Object.defineProperty(scroll, 'clientWidth', { value: 594 });
    expect(fireEvent.keyDown(scroll, { key: 'ArrowRight' })).toBe(true);
    expect(scrollTo).toHaveBeenCalledTimes(calls);
  });
});

describe('read-only key feedback (synthetic DOM, not real IME verification)', () => {
  async function begin() {
    const adapter = createStorageAdapter(localStorage); adapter.load(); adapter.updateSettings({ uiLocale: 'en', practiceLanguage: 'ko' });
    const user = userEvent.setup(); const result = render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.start }));
    const field = screen.getByRole('textbox');
    return { user, field, ...result };
  }

  it('responds only to physical codes in the focused field and clears on keyup / focus departure', async () => {
    const { user, field, container } = await begin();
    const cap = () => container.querySelector('[data-code="KeyR"]');
    fireEvent.keyDown(window, { code: 'KeyR', key: 'r' });
    fireEvent.keyDown(field, { code: 'KeyR', key: 'r' });
    expect(cap()).not.toHaveClass('is-pressed');
    await user.click(field);
    expect(fireEvent.keyDown(field, { code: 'KeyR', key: 'Process', isComposing: true })).toBe(true);
    expect(cap()).toHaveClass('is-pressed');
    expect(field).toHaveValue('');
    fireEvent.keyUp(field, { code: 'KeyR', key: 'Process' });
    expect(cap()).not.toHaveClass('is-pressed');
    fireEvent.keyDown(field, { code: 'KeyR', key: 'r' });
    await user.click(screen.getByLabelText(messages.en.uiLanguage));
    expect(cap()).not.toHaveClass('is-pressed');
    expect(screen.getByRole('textbox')).toBe(field);
    expect(screen.queryByRole('heading', { name: messages.en.typingResult })).not.toBeInTheDocument();
  });

  it('keeps live composition ungraded and clears keys on the result transition and next question', async () => {
    const { user, field, container } = await begin();
    await user.click(field);
    fireEvent.compositionStart(field);
    fireEvent.keyDown(field, { key: 'Process', code: 'KeyR', isComposing: true });
    fireEvent.input(field, { target: { value: 'ㄱ' }, isComposing: true });
    expect(container.querySelector('[data-code="KeyR"]')).toHaveClass('is-pressed');
    expect(screen.getByText(messages.en.composing)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(0);
    expect(screen.queryByRole('heading', { name: messages.en.typingResult })).not.toBeInTheDocument();
    fireEvent.compositionEnd(field);
    await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    expect(screen.getByRole('heading', { name: messages.en.typingResult })).toBeInTheDocument();
    expect(container.querySelector('.is-pressed')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: messages.en.result }));
    await user.click(screen.getByRole('button', { name: messages.en.next }));
    expect(container.querySelector('.is-pressed')).not.toBeInTheDocument();
    expect(container.querySelector('[data-code="KeyS"]')).toHaveClass('is-target');
  });

  it('does not insert text when a keycap is clicked, and clears key feedback on window blur', async () => {
    const { user, field, container } = await begin();
    await user.click(field);
    await user.click(container.querySelector('[data-code="KeyR"]')!);
    expect(field).toHaveValue('');
    await user.click(field);
    fireEvent.keyDown(field, { code: 'KeyR', key: 'r' });
    act(() => { window.dispatchEvent(new Event('blur')); });
    expect(container.querySelector('.is-pressed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.en.continue })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: messages.en.continue }));
    expect(container.querySelector('.is-pressed')).not.toBeInTheDocument();
  });
});
