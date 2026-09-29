import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../src/App';
import { messages } from '../src/i18n';
import { createStorageAdapter } from '../src/storage';

vi.mock('../src/content', async importOriginal => {
  const original = await importOriginal<typeof import('../src/content')>();
  return { ...original, loadContent: () => {
    const preview = original.loadContent('preview');
    // A repository fixture models partial approval without approving the draft assets.
    return { ...preview, concepts: preview.concepts.filter(item => ['MH-C005', 'MH-C011', 'MH-C017'].includes(item.id)), mode: 'release' as const };
  } };
});

beforeEach(() => {
  localStorage.clear(); const adapter = createStorageAdapter(localStorage); adapter.load();
  adapter.updateSettings({ uiLocale: 'en', practiceLanguage: 'ko' });
});

it('starts the first available stage and disables an empty stage in a partial release fixture', async () => {
  const user = userEvent.setup(); render(<App contentMode="release" />);
  const unavailable = screen.getByRole('button', { name: /Letters & keyboard/ });
  expect(unavailable).toBeDisabled(); expect(unavailable).toHaveTextContent(messages.en.stageUnavailable);
  await user.click(screen.getByRole('button', { name: messages.en.startWord }));
  expect(screen.queryByRole('heading', { name: messages.en.noContent })).not.toBeInTheDocument();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});
