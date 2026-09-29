import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { loadContent, type Concept, type Locale, type Stage } from '../src/content';
import { learningCopy, messages } from '../src/i18n';
import { createStorageAdapter, STORAGE_KEY } from '../src/storage';

const concepts = loadContent('preview').concepts;
const stages: Stage[] = ['jamo', 'word', 'daily', 'cafe'];
const daily = concepts.find(item => item.stage === 'daily')!;

beforeEach(() => { localStorage.clear(); });

function setLanguages(locale: Locale) {
  const storage = createStorageAdapter(localStorage); storage.load();
  storage.updateSettings({ uiLocale: locale, practiceLanguage: 'vi' });
}

async function finish(user: ReturnType<typeof userEvent.setup>, question: Concept, language: Locale) {
  const text = messages.en;
  const variant = question.variants[language];
  fireEvent.input(screen.getByRole('textbox'), { target: { value: variant.targetText } });
  await user.click(screen.getByRole('button', { name: text.inputConfirm }));
  if (variant.meaningTask) {
    await user.click(screen.getByRole('button', { name: text.chooseMeaning }));
    const option = variant.meaningTask.options.find(item => item.id === variant.meaningTask!.correctOptionId)!;
    await user.click(screen.getByRole('radio', { name: option.label.en }));
    await user.click(screen.getByRole('button', { name: text.chooseConfirm }));
  }
  await user.click(screen.getByRole('button', { name: text.result }));
}

describe('Vietnamese learning entry', () => {
  it.each(['ko', 'en', 'vi'] as Locale[])('shows Vietnamese learning and actual stage examples in %s UI', async locale => {
    setLanguages(locale); const user = userEvent.setup(); render(<App contentMode="preview" />);
    const text = messages[locale]; const course = learningCopy(locale, 'vi');
    expect(screen.getByRole('heading', { name: text.viTitle })).toBeInTheDocument();
    expect(screen.getByText(text.viSubtitle)).toBeInTheDocument();
    expect(screen.getByText(text.viHero)).toBeInTheDocument();
    expect(screen.queryByText(text.jamoDescription)).not.toBeInTheDocument();
    expect(document.title).toContain(text.viTitle);
    expect(screen.getByText(text.draft)).toBeInTheDocument();
    const path = screen.getByRole('navigation', { name: text.progressLabel });
    stages.forEach(stage => {
      const button = within(path).getByRole('button', { name: new RegExp(course.names[stage]) });
      concepts.filter(item => item.stage === stage).slice(0, stage === 'jamo' || stage === 'word' ? 3 : 2).forEach(item => {
        expect(within(button).getByText(item.variants.vi.targetText)).toBeInTheDocument();
      });
    });
    await user.click(screen.getByRole('button', { name: text.viStart }));
    expect(screen.getByRole('heading', { name: concepts[0].variants.vi.targetText })).toHaveAttribute('lang', 'vi');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly');
    expect(screen.queryByRole('region', { name: text.demoTitle })).not.toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: text.progressLabel })).getByText(text.viJamo)).toBeInTheDocument();
    expect(screen.getByLabelText(text.uiLanguage)).toHaveValue(locale);
    expect(screen.getByLabelText(text.practiceLanguage)).toHaveValue('vi');
  });

  it('opens the first daily preview directly, records assistance and resets the next question', async () => {
    setLanguages('en'); const text = messages.en; const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.click(screen.getByRole('button', { name: text.viPreview }));
    expect(screen.getByRole('heading', { name: daily.variants.vi.targetText })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: text.demoTitle })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: text.inputConfirm })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: text.demoClose }));
    await finish(user, daily, 'vi');
    let attempts = JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts;
    expect(attempts[0]).toMatchObject({ contentId: daily.id, variantLanguage: 'vi', assisted: true, comparisonEligible: false });
    await user.click(screen.getByRole('button', { name: text.next }));
    expect(screen.queryByRole('region', { name: text.demoTitle })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly');
    const next = concepts.filter(item => item.stage === 'daily')[1];
    await finish(user, next, 'vi');
    attempts = JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts;
    expect(attempts.at(-1)).toMatchObject({ contentId: next.id, assisted: false });
  });

  it('keeps UI selection independent and clears a preview when changing practice language', async () => {
    setLanguages('en'); const text = messages.en; const user = userEvent.setup(); render(<App contentMode="preview" />);
    await user.selectOptions(screen.getByLabelText(text.uiLanguage), 'ko');
    expect(screen.getByRole('heading', { name: messages.ko.viTitle })).toBeInTheDocument();
    expect(screen.getByLabelText(messages.ko.practiceLanguage)).toHaveValue('vi');
    await user.selectOptions(screen.getByLabelText(messages.ko.uiLanguage), 'en');
    await user.click(screen.getByRole('button', { name: text.viPreview }));
    await user.selectOptions(screen.getByLabelText(text.practiceLanguage), 'ko');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: text.changePracticeLanguage }));
    expect(screen.queryByRole('region', { name: text.demoTitle })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly');
    await finish(user, daily, 'ko');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).recentAttempts[0]).toMatchObject({ variantLanguage: 'ko', assisted: false });
    await user.click(screen.getByRole('button', { name: `MAIHANGUL · ${text.home}` }));
    expect(screen.getByRole('heading', { name: text.title })).toBeInTheDocument();
    expect(screen.getByText(text.jamoDescription)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: text.viPreview })).not.toBeInTheDocument();
  });

  it('keeps unreviewed Vietnamese content unavailable in release mode', () => {
    setLanguages('en'); render(<App contentMode="release" />);
    expect(screen.getByRole('button', { name: messages.en.viStart })).toBeDisabled();
    expect(screen.getByRole('heading', { name: messages.en.noContent })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: messages.en.viPreview })).not.toBeInTheDocument();
  });
});
