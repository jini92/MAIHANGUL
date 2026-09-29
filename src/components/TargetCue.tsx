import type { Locale } from '../content';
import { messages } from '../i18n';
import { jamoKeySteps } from '../keyboard/layout';

/** A static mechanical cue beside the target; it never reads the practice field. */
export function TargetCue({ target, locale }: { target: string; locale: Locale }) {
  const steps = jamoKeySteps(target);
  if (!steps.length) return null;
  const text = messages[locale];
  return <aside className="target-cue" aria-label={text.keyboardSequence}>
    <span className="target-cue-label">{text.keyboardSequence}</span>
    <div className="target-cue-keys">
      {steps.map((step, index) => <span key={index}>
        {index > 0 && <span className="cue-join" aria-hidden="true">→</span>}
        <kbd>{step.shiftCode ? 'Shift + ' : ''}{step.label}</kbd>
      </span>)}
      <span className="cue-join" aria-hidden="true">→</span><strong lang="ko">{target}</strong>
    </div>
    <p>{steps.map(step => text[step.finger]).join(' → ')}</p>
  </aside>;
}
