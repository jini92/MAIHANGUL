import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../content';
import { messages } from '../i18n';

/** Only reviewed local assets may be passed as approved. No network TTS fallback. */
export function AudioControl({ source, approved, locale }: { source: string | null; approved: boolean; locale: Locale }) {
  const text = messages[locale];
  const player = useRef<HTMLAudioElement | null>(null);
  const request = useRef(0);
  const [state, setState] = useState<'idle' | 'playing' | 'failed'>('idle');
  const allowed = approved && source?.startsWith('/audio/') && !source.includes('..');
  useEffect(() => {
    setState('idle');
    return () => {
      request.current += 1;
      player.current?.pause();
      player.current = null;
    };
  }, [source]);
  if (!allowed) return <span className="audio-note">{text.audioMissing}</span>;
  const play = async () => {
    if (state === 'playing') {
      request.current += 1;
      player.current?.pause();
      setState('idle');
      return;
    }
    const generation = ++request.current;
    const audio = new Audio(source!);
    player.current?.pause();
    player.current = audio;
    audio.onended = () => { if (generation === request.current) setState('idle'); };
    audio.onerror = () => { if (generation === request.current) setState('failed'); };
    try {
      await audio.play();
      if (generation === request.current) setState('playing');
      else audio.pause();
    } catch {
      if (generation === request.current) setState('failed');
    }
  };
  return <div className="audio-control">
    <button className="quiet" onClick={() => void play()}>{state === 'playing' ? text.audioStop : state === 'failed' ? text.audioRetry : text.audioPlay}</button>
    {state === 'failed' && <p role="status">{text.audioFailed}</p>}
  </div>;
}
