import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { VietnameseSimulator } from '../src/components/VietnameseSimulator';
import { loadContent, type Locale } from '../src/content';
import { messages } from '../src/i18n';
import { createStorageAdapter, STORAGE_KEY } from '../src/storage';

const text = messages.en;
const content = loadContent('preview').concepts;

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); });

describe('Vietnamese teaching preview controls', () => {
  it('starts paused, plays one frame at a time, pauses and supports previous / next / reset', () => {
    vi.useFakeTimers();
    const onStepChange = vi.fn();
    render(<VietnameseSimulator target="chào" locale="en" onStepChange={onStepChange} onClose={vi.fn()} />);
    const output = () => screen.getByLabelText(text.demoOutput);
    expect(output()).toHaveTextContent('—');
    act(() => { vi.advanceTimersByTime(1800); });
    expect(output()).toHaveTextContent('—');
    fireEvent.click(screen.getByRole('button', { name: text.demoPlay }));
    act(() => { vi.advanceTimersByTime(900); });
    expect(output()).toHaveTextContent(/^c$/);
    expect(onStepChange).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'KeyC', text: 'c' }));
    act(() => { vi.advanceTimersByTime(900); });
    expect(output()).toHaveTextContent(/^ch$/);
    fireEvent.click(screen.getByRole('button', { name: text.demoPause }));
    act(() => { vi.advanceTimersByTime(2700); });
    expect(output()).toHaveTextContent(/^ch$/);
    fireEvent.click(screen.getByRole('button', { name: text.demoNext }));
    expect(output()).toHaveTextContent(/^cha$/);
    fireEvent.click(screen.getByRole('button', { name: text.demoPrevious }));
    expect(output()).toHaveTextContent(/^ch$/);
    fireEvent.click(screen.getByRole('button', { name: text.demoReset }));
    expect(output()).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: text.demoPrevious })).toBeDisabled();
  });

  it('resets and stops on method / target changes while preserving state on UI language changes', () => {
    vi.useFakeTimers(); const onStepChange = vi.fn(); const onClose = vi.fn();
    const { rerender } = render(<VietnameseSimulator target="chào" locale="en" onStepChange={onStepChange} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: text.demoPlay }));
    act(() => { vi.advanceTimersByTime(900); });
    fireEvent.change(screen.getByLabelText(text.demoMethod), { target: { value: 'vni' } });
    expect(screen.getByLabelText(text.demoOutput)).toHaveTextContent('—');
    act(() => { vi.advanceTimersByTime(1800); });
    expect(screen.getByLabelText(text.demoOutput)).toHaveTextContent('—');
    for (let i = 0; i < 5; i += 1) fireEvent.click(screen.getByRole('button', { name: text.demoNext }));
    expect(screen.getByLabelText(text.demoOutput)).toHaveTextContent(/^chào$/);
    expect(onStepChange).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'Digit2' }));
    rerender(<VietnameseSimulator target="chào" locale="vi" onStepChange={onStepChange} onClose={onClose} />);
    expect(screen.getByLabelText(messages.vi.demoOutput)).toHaveTextContent(/^chào$/);
    expect(screen.getByLabelText(messages.vi.demoMethod)).toHaveValue('vni');
    rerender(<VietnameseSimulator target="nước" locale="vi" onStepChange={onStepChange} onClose={onClose} />);
    expect(screen.getByLabelText(messages.vi.demoOutput)).toHaveTextContent('—');
    expect(screen.getByLabelText(messages.vi.demoMethod)).toHaveValue('telex');
  });

  it('stops timers on window departure and unmount without changing the teaching frame', () => {
    vi.useFakeTimers(); const onStepChange = vi.fn();
    const { unmount } = render(<VietnameseSimulator target="chào" locale="en" onStepChange={onStepChange} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: text.demoPlay }));
    act(() => { vi.advanceTimersByTime(900); window.dispatchEvent(new Event('blur')); });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByLabelText(text.demoOutput)).toHaveTextContent(/^c$/);
    expect(screen.getByRole('button', { name: text.demoPlay })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: text.demoPlay }));
    unmount();
    expect(onStepChange).toHaveBeenLastCalledWith(null);
    const calls = onStepChange.mock.calls.length;
    act(() => { vi.advanceTimersByTime(4000); });
    expect(onStepChange).toHaveBeenCalledTimes(calls);
  });

  it('stops playback when the document becomes hidden', () => {
    vi.useFakeTimers();
    render(<VietnameseSimulator target="chào" locale="en" onStepChange={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: text.demoPlay }));
    const previous = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    if (previous) Object.defineProperty(document, 'hidden', previous); else Reflect.deleteProperty(document, 'hidden');
    act(() => { vi.advanceTimersByTime(1800); });
    expect(screen.getByLabelText(text.demoOutput)).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: text.demoPlay })).toBeInTheDocument();
  });

  it.each(['ko', 'en', 'vi'] as Locale[])('explains unsupported content and assistance in %s', locale => {
    render(<VietnameseSimulator target="unsupported 😀" locale={locale} onStepChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(messages[locale].demoUnsupported);
    expect(screen.getByText(messages[locale].demoAssisted)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages[locale].demoPlay })).toBeDisabled();
    expect(screen.getByRole('button', { name: messages[locale].demoNext })).toBeDisabled();
  });
});

describe('practice integration (synthetic DOM, not OS IME verification)', () => {
  async function begin() {
    const storage = createStorageAdapter(localStorage); storage.load();
    storage.updateSettings({ uiLocale: 'en', practiceLanguage: 'vi' });
    const user = userEvent.setup(); const result = render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: text.settings }));
    await user.selectOptions(screen.getByLabelText(text.inputMethod), 'vni');
    await user.click(screen.getByRole('button', { name: text.viStart }));
    return { user, field: screen.getByRole('textbox'), ...result };
  }

  it('preserves real input, distinguishes demo keys and restores editable focus on close', async () => {
    const { user, field, container } = await begin();
    await user.type(field, 'ph');
    await user.click(screen.getByRole('button', { name: text.demoOpen }));
    expect(field).toHaveValue('ph'); expect(field).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: text.inputConfirm })).toBeDisabled();
    expect(screen.getByLabelText(text.demoMethod)).toHaveValue('telex');
    await user.click(screen.getByRole('button', { name: text.demoNext }));
    expect(container.querySelector('.is-demo')).toBeInTheDocument();
    expect(container.querySelector('.is-pressed')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.keyboard-body')).toHaveLength(1);
    await user.type(field, 'xyz');
    expect(field).toHaveValue('ph');
    await user.click(screen.getByRole('button', { name: text.demoClose }));
    expect(field).toHaveFocus(); expect(field).not.toHaveAttribute('readonly');
    expect(field).toHaveValue('ph');
    expect(container.querySelector('.is-demo')).not.toBeInTheDocument();
    expect(screen.getByText(text.keyboardVni)).toBeInTheDocument();
  });

  it('blocks opening during composing / settling and remembers a blocked pointerdown until click', async () => {
    const { user, field } = await begin();
    await user.click(field);
    fireEvent.compositionStart(field);
    fireEvent.input(field, { target: { value: 'p' }, isComposing: true });
    const open = screen.getByRole('button', { name: text.demoOpen });
    expect(fireEvent.pointerDown(open)).toBe(false);
    fireEvent.compositionEnd(field);
    // Settle the input before the pending pointer click: its initial guard must still hold.
    fireEvent.click(screen.getByRole('button', { name: text.inputConfirm }));
    expect(screen.getByText(text.settling)).toBeInTheDocument();
    fireEvent.click(open);
    expect(screen.queryByRole('region', { name: text.demoTitle })).not.toBeInTheDocument();
    expect(screen.getByText(text.composeBlocked)).toBeInTheDocument();
    await user.click(open);
    expect(screen.getByRole('region', { name: text.demoTitle })).toBeInTheDocument();
  });

  it('moves focus before a boundary control disables itself, keeping the practice session active', async () => {
    const { user } = await begin();
    await user.click(screen.getByRole('button', { name: text.demoOpen }));
    await user.click(screen.getByRole('button', { name: text.demoNext }));
    await user.click(screen.getByRole('button', { name: text.demoReset }));
    expect(screen.getByRole('button', { name: text.demoPlay })).toHaveFocus();
    expect(screen.getByRole('button', { name: text.demoReset })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: text.demoNext }));
    await user.click(screen.getByRole('button', { name: text.demoPrevious }));
    expect(screen.getByRole('button', { name: text.demoPlay })).toHaveFocus();
    const steps = within(screen.getByRole('list', { name: text.demoSequence })).getAllByRole('listitem').length;
    for (let i = 0; i < steps; i += 1) await user.click(screen.getByRole('button', { name: text.demoNext }));
    expect(screen.getByRole('button', { name: text.demoPlay })).toHaveFocus();
    expect(screen.getByRole('button', { name: text.demoNext })).toBeDisabled();
    expect(screen.getByRole('region', { name: text.demoTitle })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: text.paused })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(screen.queryByText(text.keyboardVni)).not.toBeInTheDocument();
  });

  it('blocks a fresh keyboard activation while the controller is still settling', async () => {
    const { field } = await begin();
    fireEvent.compositionStart(field); fireEvent.input(field, { target: { value: 'p' }, isComposing: true }); fireEvent.compositionEnd(field);
    const open = screen.getByRole('button', { name: text.demoOpen });
    expect(fireEvent.keyDown(open, { key: 'Enter' })).toBe(false);
    fireEvent.click(open);
    expect(screen.queryByRole('region', { name: text.demoTitle })).not.toBeInTheDocument();
  });

  it('retains assistance through close and retry, then resets it for the next question', async () => {
    const { user } = await begin();
    await user.click(screen.getByRole('button', { name: text.demoOpen }));
    await user.click(screen.getByRole('button', { name: text.demoClose }));
    fireEvent.input(screen.getByRole('textbox'), { target: { value: content[0].variants.vi.targetText } });
    await user.click(screen.getByRole('button', { name: text.inputConfirm }));
    expect(screen.getByText(text.excluded)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: text.retryTyping }));
    fireEvent.input(screen.getByRole('textbox'), { target: { value: content[0].variants.vi.targetText } });
    await user.click(screen.getByRole('button', { name: text.inputConfirm }));
    await user.click(screen.getByRole('button', { name: text.result }));
    let attempts = JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts;
    expect(attempts).toHaveLength(2);
    expect(attempts.every((attempt: { assisted: boolean }) => attempt.assisted)).toBe(true);
    await user.click(screen.getByRole('button', { name: text.next }));
    expect(screen.queryByRole('region', { name: text.demoTitle })).not.toBeInTheDocument();
    fireEvent.input(screen.getByRole('textbox'), { target: { value: content[1].variants.vi.targetText } });
    await user.click(screen.getByRole('button', { name: text.inputConfirm }));
    await user.click(screen.getByRole('button', { name: text.result }));
    attempts = JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts;
    expect(attempts.at(-1).assisted).toBe(false);
  });

  it('keeps the chosen demo method and frame when only the interface language changes', async () => {
    const { user } = await begin();
    await user.click(screen.getByRole('button', { name: text.demoOpen }));
    await user.selectOptions(screen.getByLabelText(text.demoMethod), 'vni');
    await user.click(screen.getByRole('button', { name: text.demoNext }));
    const output = screen.getByLabelText(text.demoOutput).textContent;
    await user.selectOptions(screen.getByLabelText(text.uiLanguage), 'ko');
    expect(screen.getByLabelText(messages.ko.demoOutput)).toHaveTextContent(output!);
    expect(screen.getByLabelText(messages.ko.demoMethod)).toHaveValue('vni');
    expect(within(screen.getByRole('region', { name: messages.ko.keyboardTitle })).getByText(messages.ko.demoKey)).toBeInTheDocument();
  });
});
