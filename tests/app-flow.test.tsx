import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { loadContent, type Locale } from '../src/content';
import { messages } from '../src/i18n';
import { createStorageAdapter, STORAGE_KEY, type CompletedAttempt } from '../src/storage';

const content = loadContent('preview').concepts;

beforeEach(() => {
  localStorage.clear();
});

function setLanguages(locale: Locale, language: Locale = 'ko') {
  const adapter = createStorageAdapter(localStorage); adapter.load();
  adapter.updateSettings({ uiLocale: locale, practiceLanguage: language });
}

function enterText(value: string) {
  const input = screen.getByRole('textbox');
  fireEvent.input(input, { target: { value }, inputType: 'insertText' });
  return input;
}

const reviewSeed = (): CompletedAttempt => ({
  attemptId: 'seed', completedAt: new Date().toISOString(), attemptKind: 'first', practiceMode: 'learning',
  contentId: 'MH-C005', contentVersion: content.find(item => item.id === 'MH-C005')!.revision, variantLanguage: 'ko', scoringVersion: 'scoring-v1',
  accuracy: 0, cpm: 30, typingCorrect: false, meaningCorrect: false, hintExposed: true,
  assisted: false, interrupted: false, comparisonEligible: false, environmentGroup: 'unknown',
});

describe('guided learning preview (synthetic DOM, not OS IME acceptance)', () => {
  it.each((['ko', 'en', 'vi'] as Locale[]).flatMap(locale => (['ko', 'en', 'vi'] as Locale[]).map(language => [locale, language] as const)))('keeps %s UI independent from %s practice and completes a letter', async (locale, language) => {
    setLanguages(locale, language);
    const user = userEvent.setup();
    render(<App contentMode="preview" />);
    const text = messages[locale];
    await user.click(screen.getByRole('button', { name: language === 'vi' ? text.viStart : text.start }));
    expect(screen.getByRole('heading', { name: content[0].variants[language].targetText })).toHaveAttribute('lang', language);
    expect(document.documentElement.lang).toBe(locale);
    const translations = screen.getByLabelText(text.explanations);
    expect(translations.querySelectorAll('p[lang]')).toHaveLength(3);
    enterText(content[0].variants[language].targetText);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', code: 'Enter' });
    expect(screen.getByRole('button', { name: text.inputConfirm })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: text.inputConfirm }));
    await user.click(screen.getByRole('button', { name: text.result }));
    expect(screen.getByRole('heading', { name: text.resultTitle })).toBeInTheDocument();
    expect(screen.getByText(text.meaningNone)).toBeInTheDocument();
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(state.recentAttempts).toHaveLength(1);
    expect(state.recentAttempts[0]).toMatchObject({ typingCorrect: true, meaningCorrect: null, variantLanguage: language });
    expect(state.recentAttempts[0]).not.toHaveProperty('text');
  });

  it('preserves typed text when changing only UI language', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.start }));
    const input = enterText('ㄱ');
    await user.selectOptions(screen.getByLabelText(messages.en.uiLanguage), 'vi');
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveValue('ㄱ');
    expect(screen.getByLabelText(messages.vi.practiceLanguage)).toHaveValue('ko');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('requires a fresh button activation after synthetic composition and blocks repeated Enter', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.start }));
    const field = screen.getByRole('textbox');
    fireEvent.compositionStart(field);
    fireEvent.input(field, { target: { value: 'ㄱ' }, isComposing: true });
    fireEvent.compositionEnd(field);
    const button = screen.getByRole('button', { name: messages.en.inputConfirm });
    await user.click(button);
    expect(screen.getByText(messages.en.settling)).toBeInTheDocument();
    expect(fireEvent.keyDown(button, { key: 'Enter', repeat: true })).toBe(false);
    expect(screen.queryByRole('heading', { name: messages.en.typingResult })).not.toBeInTheDocument();
    await user.click(button);
    expect(screen.getByRole('heading', { name: messages.en.typingResult })).toBeInTheDocument();
  });

  it('restarts the current question, not the stage, after a confirmed practice language change', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.start }));
    enterText(content[0].variants.ko.targetText);
    await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.result }));
    await user.click(screen.getByRole('button', { name: messages.en.next }));
    await user.selectOptions(screen.getByLabelText(messages.en.practiceLanguage), 'vi');
    expect(screen.getByRole('dialog')).toHaveTextContent(messages.en.confirmLanguage);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: messages.en.changePracticeLanguage }));
    expect(screen.getByRole('heading', { name: content[1].variants.vi.targetText })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(1);
  });

  it('records first answers separately from retries through the café flow', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: /Café orders/ }));
    const question = content.find(item => item.stage === 'cafe')!.variants.ko;
    enterText('wrong'); await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.retryTyping }));
    enterText(question.targetText); await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.chooseOrder }));
    const wrong = question.meaningTask!.options.find(item => item.id !== question.meaningTask!.correctOptionId)!;
    const right = question.meaningTask!.options.find(item => item.id === question.meaningTask!.correctOptionId)!;
    await user.click(screen.getByRole('radio', { name: wrong.label.en }));
    await user.click(screen.getByRole('button', { name: messages.en.chooseConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.retryMeaning }));
    await user.click(screen.getByRole('radio', { name: right.label.en }));
    await user.click(screen.getByRole('button', { name: messages.en.chooseConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.result }));
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(state.recentAttempts).toHaveLength(2);
    expect(state.recentAttempts[0]).toMatchObject({ attemptKind: 'first', typingCorrect: false, meaningCorrect: false });
    expect(state.recentAttempts[1]).toMatchObject({ attemptKind: 'retry', typingCorrect: true, meaningCorrect: true });
    expect(state.reviewQueue[0]).toMatchObject({ typingWrong: true, meaningWrong: true });
    expect(screen.getByRole('heading', { name: messages.en.typingResult })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: messages.en.meaningResult })).toBeInTheDocument();
  });

  it('starts review without revealing translations and preserves exposure on same-visit restart', async () => {
    setLanguages('en'); const adapter = createStorageAdapter(localStorage); adapter.load(); adapter.recordAttempt(reviewSeed());
    const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.review }));
    const question = content.find(item => item.id === 'MH-C005')!.variants.ko;
    expect(screen.queryByText(question.targetText)).not.toBeInTheDocument();
    expect(screen.getByLabelText(messages.en.showHints)).toBeChecked();
    await user.click(screen.getByLabelText(messages.en.hideHintsStart));
    await user.click(screen.getByRole('button', { name: messages.en.beginReview }));
    expect(screen.queryByLabelText(messages.en.explanations)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: messages.en.showHint }));
    await user.click(screen.getByRole('button', { name: messages.en.hideHint }));
    enterText(question.targetText); await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.chooseMeaning }));
    const right = question.meaningTask!.options.find(item => item.id === question.meaningTask!.correctOptionId)!;
    await user.click(screen.getByRole('radio', { name: right.label.en }));
    await user.click(screen.getByRole('button', { name: messages.en.chooseConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.result }));
    await user.click(screen.getByRole('button', { name: messages.en.restart }));
    expect(screen.queryByLabelText(messages.en.explanations)).not.toBeInTheDocument();
    enterText(question.targetText); await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.chooseMeaning }));
    expect(screen.getByText(messages.en.hinted)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).reviewQueue[0].meaningWrong).toBe(true);
  });

  it('pauses on window departure, resumes confirmed text, and does not store partial input', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.start }));
    enterText('ㄱ');
    act(() => { window.dispatchEvent(new Event('blur')); });
    expect(screen.getByText(messages.en.paused)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: messages.en.continue }));
    expect(screen.getByRole('textbox')).toHaveValue('ㄱ');
  });

  it('keeps draft content unavailable in release mode', () => {
    setLanguages('en'); render(<App contentMode="release" />);
    expect(screen.getByRole('heading', { name: messages.en.noContent })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.en.start })).toBeDisabled();
    expect(screen.queryByText(messages.en.draft)).not.toBeInTheDocument();
  });

  it('pauses meaning selection on window departure without confirming or changing the typing result', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: /Café orders/ }));
    const question = content.find(item => item.stage === 'cafe')!.variants.ko;
    enterText(question.targetText);
    await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.chooseOrder }));
    const choice = question.meaningTask!.options[0];
    await user.click(screen.getByRole('radio', { name: choice.label.en }));
    act(() => { window.dispatchEvent(new Event('blur')); });
    expect(screen.getByRole('heading', { name: messages.en.paused })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: messages.en.continue }));
    expect(screen.getByRole('radio', { name: choice.label.en })).toBeChecked();
    await user.click(screen.getByRole('button', { name: messages.en.chooseConfirm }));
    await user.click(screen.getByRole('button', { name: messages.en.result }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts[0].interrupted).toBe(false);
  });

  it('shows storage corruption without replacing the original and still allows practice', async () => {
    localStorage.setItem(STORAGE_KEY, '{damaged'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    expect(screen.getByText(messages.vi.blocked)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: messages.vi.start }));
    enterText('ㄱ'); await user.click(screen.getByRole('button', { name: messages.vi.inputConfirm }));
    await user.click(screen.getByRole('button', { name: messages.vi.result }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{damaged');
    expect(screen.queryByText(messages.vi.audioMissing)).not.toBeInTheDocument();
  });

  it.each(['ko', 'en', 'vi'] as Locale[])('confirms language changes in %s with safe focus, Escape cancellation and trigger restoration', async locale => {
    setLanguages(locale); const user = userEvent.setup(); render(<App contentMode="preview" />);
    const text = messages[locale];
    await user.click(screen.getByRole('button', { name: text.start }));
    const input = enterText('ㄱ');
    const languageSelect = screen.getByLabelText(text.practiceLanguage);
    await user.selectOptions(languageSelect, 'vi');
    const dialog = screen.getByRole('dialog');
    const cancel = within(dialog).getByRole('button', { name: text.continue });
    const confirm = within(dialog).getByRole('button', { name: text.changePracticeLanguage });
    expect(cancel).toHaveFocus();
    await user.tab(); expect(confirm).toHaveFocus();
    await user.tab(); expect(cancel).toHaveFocus();
    await user.tab({ shift: true }); expect(confirm).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(languageSelect).toHaveFocus();
    expect(languageSelect).toHaveValue('ko');
    expect(input).toHaveValue('ㄱ');
    expect(screen.getByRole('textbox')).toBe(input);
  });

  it('confirms manual pause and unfinished departure without acting on cancellation', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.start }));
    enterText('ㄱ');
    const pause = screen.getByRole('button', { name: messages.en.pause });
    await user.click(pause);
    await user.keyboard('{Escape}');
    expect(pause).toHaveFocus(); expect(screen.getByRole('textbox')).toHaveValue('ㄱ');
    await user.click(pause);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: messages.en.pausePractice }));
    expect(screen.getByRole('heading', { name: messages.en.paused })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: messages.en.continue }));
    const home = screen.getByRole('button', { name: `MAIHANGUL · ${messages.en.home}` });
    await user.click(home);
    expect(screen.getByRole('dialog')).toHaveTextContent(messages.en.confirmLeave);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: messages.en.continue }));
    expect(home).toHaveFocus(); expect(screen.getByRole('textbox')).toHaveValue('ㄱ');
    await user.click(home);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: messages.en.leavePractice }));
    expect(screen.getByRole('button', { name: messages.en.start })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(0);
  });

  it.each(['ko', 'en', 'vi'] as Locale[])('uses localized safe deletion confirmation in %s and deletes only after explicit activation', async locale => {
    setLanguages(locale); const adapter = createStorageAdapter(localStorage); adapter.load(); adapter.recordAttempt(reviewSeed());
    localStorage.setItem('another-app', 'preserve');
    const user = userEvent.setup(); render(<App contentMode="preview" />); const text = messages[locale];
    await user.click(screen.getByRole('button', { name: text.settings }));
    const deletion = screen.getByRole('button', { name: text.deleteLearning });
    await user.click(deletion);
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: text.cancel })).toHaveFocus();
    await user.keyboard('{Escape}'); expect(deletion).toHaveFocus();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(1);
    await user.click(deletion);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: text.deleteLearning }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).settings.uiLocale).toBe(locale);
    await user.click(screen.getByRole('button', { name: text.deleteAll }));
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: text.cancel })).toHaveFocus();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: text.deleteAll }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('another-app')).toBe('preserve');
  });

  it('does not carry out a pending language change if a late composition starts before confirmation', async () => {
    setLanguages('en'); const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: messages.en.start }));
    const input = enterText('ㄱ');
    await user.selectOptions(screen.getByLabelText(messages.en.practiceLanguage), 'vi');
    fireEvent.compositionStart(input);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: messages.en.changePracticeLanguage }));
    expect(screen.getByLabelText(messages.en.practiceLanguage)).toHaveValue('ko');
    expect(screen.getByRole('textbox')).toBe(input);
    expect(screen.getByText(messages.en.composeBlocked)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts).toHaveLength(0);
  });
});
