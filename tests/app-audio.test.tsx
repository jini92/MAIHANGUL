import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioControl } from '../src/audio/AudioControl';
import { messages } from '../src/i18n';

afterEach(() => vi.unstubAllGlobals());

describe('optional audio boundary (mock media, no reviewed audio supplied)', () => {
  it('does not construct audio for missing or unapproved media', () => {
    const construct = vi.fn(); vi.stubGlobal('Audio', construct);
    const view = render(<AudioControl source={null} approved={false} locale="vi" />);
    expect(screen.getByText(messages.vi.audioMissing)).toBeInTheDocument();
    view.rerender(<AudioControl source="/audio/draft.mp3" approved={false} locale="en" />);
    expect(screen.getByText(messages.en.audioMissing)).toBeInTheDocument();
    expect(construct).not.toHaveBeenCalled();
  });

  it('reports playback rejection and lets the user retry without an external fallback', async () => {
    const play = vi.fn().mockRejectedValueOnce(new Error('blocked')).mockResolvedValue(undefined);
    const pause = vi.fn();
    vi.stubGlobal('Audio', class { play = play; pause = pause; onended = null; onerror = null; });
    const view = render(<AudioControl source="/audio/test-fixture.mp3" approved={true} locale="en" />);
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: messages.en.audioPlay }));
    expect(await screen.findByText(messages.en.audioFailed)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: messages.en.audioRetry }));
    await waitFor(() => expect(screen.getByRole('button', { name: messages.en.audioStop })).toBeInTheDocument());
    view.unmount(); expect(pause).toHaveBeenCalled();
  });
});
