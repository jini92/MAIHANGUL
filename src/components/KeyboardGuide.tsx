import type { CSSProperties, KeyboardEvent } from 'react';
import type { Locale } from '../content';
import { messages } from '../i18n';
import { KEYBOARD_ROWS, jamoKeySteps } from '../keyboard/layout';
import type { InputMethod } from '../scoring';
import './KeyboardGuide.css';

interface Props {
  locale: Locale;
  language: Locale;
  target?: string;
  isJamo?: boolean;
  inputMethod?: InputMethod;
  pressed?: ReadonlySet<string>;
  preview?: boolean;
  showSequence?: boolean;
}

function scrollWithKeys(event: KeyboardEvent<HTMLDivElement>) {
  const region = event.currentTarget;
  if (event.target !== region || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const maximum = region.scrollWidth - region.clientWidth;
  if (maximum <= 0) return;
  let left: number;
  if (event.key === 'ArrowRight') left = region.scrollLeft + 64;
  else if (event.key === 'ArrowLeft') left = region.scrollLeft - 64;
  else if (event.key === 'Home') left = 0;
  else if (event.key === 'End') left = maximum;
  else return;
  event.preventDefault();
  region.scrollTo({ left: Math.max(0, Math.min(maximum, left)), behavior: 'instant' });
}

export function KeyboardGuide({ locale, language, target = '', isJamo = false, inputMethod = 'unknown', pressed = new Set(), preview = false, showSequence = true }: Props) {
  const text = messages[locale];
  const steps = language === 'ko' && isJamo ? jamoKeySteps(target) : [];
  const targets = new Set(steps.flatMap(step => step.shiftCode ? [step.code, step.shiftCode] : [step.code]));
  const inputTip = language === 'ko' ? text.keyboardKorean : language === 'en' ? text.keyboardEnglish
    : inputMethod === 'telex' ? text.keyboardTelex : inputMethod === 'vni' ? text.keyboardVni : text.keyboardVietnamese;

  return <section className={`keyboard-guide ${preview ? 'keyboard-preview' : ''}`} aria-label={text.keyboardTitle}>
    <div className="keyboard-heading"><div className="keyboard-heading-title"><h2>{text.keyboardTitle}</h2><span>{language === 'ko' ? text.keyboardTwoSet : 'QWERTY'}</span></div>
      {!preview && <div className="keyboard-legend"><span><i className="legend-target" />{text.keyboardTarget}</span><span><i className="legend-home" />F / J</span><span><i className="legend-pressed" />{text.keyboardPressed}</span></div>}
    </div>
    {!preview && (showSequence || !steps.length) && <div className="keyboard-instruction">
      {steps.length && showSequence ? <div className="key-sequence"><span>{text.keyboardSequence}</span><ol>{steps.map((step, index) => <li key={index}>
        <kbd>{step.shiftCode ? 'Shift + ' : ''}{step.label}</kbd><span>{text[step.finger]}</span>
      </li>)}</ol></div> : <p>{inputTip}</p>}
    </div>}
    <div className="keyboard-scroll" tabIndex={preview ? undefined : 0} role={preview ? undefined : 'region'} aria-label={preview ? undefined : text.keyboardScroll} onKeyDown={preview ? undefined : scrollWithKeys}><div className={`keyboard-body ${language === 'ko' ? 'keyboard-korean' : ''}`} aria-hidden="true">
      {KEYBOARD_ROWS.map((row, index) => <div className="keyboard-row" key={index}>{row.map(key => <div
        key={key.code} data-code={key.code}
        className={`keycap ${key.korean ? 'key-letter' : ''} ${key.width ? 'key-wide' : ''} ${key.home ? 'key-home' : ''} ${targets.has(key.code) ? 'is-target' : ''} ${pressed.has(key.code) ? 'is-pressed' : ''}`}
        style={{ '--key-width': key.width ?? 1 } as CSSProperties}>
        <span className="key-latin">{key.label}</span>
        {language === 'ko' && key.korean && <span className="key-hangul" lang="ko">{key.korean}</span>}
        {key.shifted && (language === 'ko' || !key.korean) && <span className="key-shifted">{key.shifted}</span>}
        {key.home && <span className="home-mark" />}
      </div>)}</div>)}
    </div></div>
    <p className="keyboard-footnote">{preview ? text.keyboardPreview : text.keyboardHome}</p>
    {!preview && steps.length > 0 && <p className="keyboard-method">{inputTip}</p>}
  </section>;
}
