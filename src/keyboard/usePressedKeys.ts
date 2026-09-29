import { useEffect, useState, type KeyboardEvent } from 'react';
import { PHYSICAL_CODES } from './layout';

/** Read-only physical-key feedback, scoped to the focused practice field. */
export function usePressedKeys(enabled: boolean, questionKey: string) {
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
  const clear = () => setPressed(previous => previous.size ? new Set() : previous);
  useEffect(() => { setPressed(new Set()); }, [enabled, questionKey]);
  useEffect(() => {
    const clearKeys = () => setPressed(previous => previous.size ? new Set() : previous);
    const onHidden = () => { if (document.hidden) clearKeys(); };
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', onHidden);
    return () => { window.removeEventListener('blur', clearKeys); document.removeEventListener('visibilitychange', onHidden); };
  }, []);
  return {
    pressed: enabled ? pressed : new Set<string>(),
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (!enabled || event.currentTarget !== document.activeElement || !PHYSICAL_CODES.has(event.code)) return;
      const code = event.code;
      setPressed(previous => previous.has(code) ? previous : new Set([...previous, code]));
    },
    onKeyUp: (event: KeyboardEvent<HTMLInputElement>) => {
      const code = event.code;
      setPressed(previous => { if (!previous.has(code)) return previous; const next = new Set(previous); next.delete(code); return next; });
    },
    onBlur: clear,
  };
}
