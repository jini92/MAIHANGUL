import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import App from '../src/App';
import { loadContent } from '../src/content';
import { messages } from '../src/i18n';
import { createStorageAdapter } from '../src/storage';

beforeEach(() => {
  localStorage.clear();
  const storage = createStorageAdapter(localStorage); storage.load();
  storage.updateSettings({ uiLocale: 'en', practiceLanguage: 'ko' });
});

it('uses the rendered hero as decoration and derives four-stage counts from real completed content', async () => {
  const user = userEvent.setup(); render(<App contentMode="preview" />);
  expect(screen.getByAltText('')).toHaveAttribute('src', '/assets/keyboard-studio.webp');
  await user.click(screen.getByRole('button', { name: messages.en.start }));
  const stages = ['jamo', 'word', 'daily', 'cafe'] as const;
  const content = loadContent('preview').concepts;
  const rows = () => within(screen.getByRole('list', { name: messages.en.progressLabel })).getAllByRole('listitem');
  expect(rows()).toHaveLength(4);
  stages.forEach((stage, index) => {
    expect(rows()[index]).toHaveTextContent(messages.en[stage]);
    expect(rows()[index]).toHaveTextContent(`0 / ${content.filter(item => item.stage === stage).length}`);
  });
  expect(rows()[0]).toHaveAttribute('aria-current', 'step');
  fireEvent.input(screen.getByRole('textbox'), { target: { value: content[0].variants.ko.targetText } });
  await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
  // Viewing typing feedback has not yet persisted a completed question.
  expect(rows()[0]).toHaveTextContent('0 / 4');
  await user.click(screen.getByRole('button', { name: messages.en.result }));
  expect(rows()[0]).toHaveTextContent('1 / 4');
  await user.selectOptions(screen.getByLabelText(messages.en.practiceLanguage), 'en');
  await user.click(screen.getByRole('button', { name: messages.en.changePracticeLanguage }));
  expect(rows()[0]).toHaveTextContent('0 / 4');
});

it('treats the physical R cue as guidance and keeps Korean ㄱ as the actual answer', async () => {
  const user = userEvent.setup(); const { container } = render(<App contentMode="preview" />);
  await user.click(screen.getByRole('button', { name: messages.en.start }));
  const cue = screen.getByRole('complementary', { name: messages.en.keyboardSequence });
  expect(cue).toHaveTextContent('R'); expect(cue).toHaveTextContent('ㄱ');
  expect(cue).toHaveTextContent(messages.en.leftIndex);
  fireEvent.input(screen.getByRole('textbox'), { target: { value: 'R' } });
  await user.click(screen.getByRole('button', { name: messages.en.inputConfirm }));
  expect(container.querySelector('.typing-score')).toHaveTextContent(messages.en.incorrect);
  expect(container.querySelector('.typing-score')).toHaveTextContent('0.0%');
});
