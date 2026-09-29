import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../content';
import { messages } from '../i18n';
import { planVietnameseSimulation, type SimulationStep, type VietnameseMethod } from '../keyboard/vietnameseSimulation';
import './VietnameseSimulator.css';

interface Props {
  target: string;
  locale: Locale;
  onStepChange: (step: SimulationStep | null) => void;
  onClose: () => void;
}

const keyLabel = (step: SimulationStep | undefined) => step ? `${step.shift ? 'Shift + ' : ''}${step.label}` : '—';

/** Changing the target remounts the player; UI locale changes preserve its state. */
export function VietnameseSimulator(props: Props) {
  return <SimulatorPlayer key={props.target} {...props} />;
}

function SimulatorPlayer({ target, locale, onStepChange, onClose }: Props) {
  const text = messages[locale];
  const [method, setMethod] = useState<VietnameseMethod>('telex');
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const plan = useMemo(() => planVietnameseSimulation(target, method), [target, method]);
  const current = position > 0 ? plan.steps[position - 1] : undefined;
  const next = plan.steps[position];
  const activeKey = useRef<HTMLLIElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);

  useEffect(() => { title.current?.focus(); }, []);
  useEffect(() => { onStepChange(current ?? null); }, [current, onStepChange]);
  useEffect(() => () => { onStepChange(null); }, [onStepChange]);
  useEffect(() => {
    if (!playing || !plan.supported) return;
    if (position >= plan.steps.length) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setPosition(value => Math.min(value + 1, plan.steps.length)), 900);
    return () => window.clearTimeout(timer);
  }, [playing, position, plan.supported, plan.steps.length]);
  useEffect(() => {
    const stop = () => setPlaying(false);
    const hidden = () => { if (document.hidden) stop(); };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  useEffect(() => {
    const key = activeKey.current;
    const list = key?.parentElement;
    if (!key || !list) return;
    if (key.offsetTop < list.scrollTop) list.scrollTop = key.offsetTop;
    else if (key.offsetTop + key.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = key.offsetTop + key.offsetHeight - list.clientHeight;
    }
  }, [position]);

  return <section id="vietnamese-demo" className="vietnamese-simulator" aria-label={text.demoTitle}>
    <div className="simulator-heading"><h2 ref={title} tabIndex={-1}>{text.demoTitle}</h2><button className="quiet" onClick={onClose}>{text.demoClose}</button></div>
    <p className="simulator-help">{text.demoHelp}</p>
    <div className="simulator-toolbar">
      <label>{text.demoMethod}<select value={method} onChange={event => {
        setPlaying(false); setPosition(0); setMethod(event.target.value as VietnameseMethod);
      }}><option value="telex">Telex</option><option value="vni">VNI</option></select></label>
      <div className="simulator-controls">
        <button ref={playButton} className="primary" disabled={!plan.supported || !plan.steps.length} onClick={() => {
          if (playing) setPlaying(false);
          else { if (position >= plan.steps.length) setPosition(0); setPlaying(true); }
        }}>{playing ? text.demoPause : text.demoPlay}</button>
        <button disabled={!plan.supported || !position && !playing} onClick={() => {
          playButton.current?.focus(); setPlaying(false); setPosition(0);
        }}>{text.demoReset}</button>
        <button disabled={!position} onClick={() => {
          if (position <= 1) playButton.current?.focus();
          setPlaying(false); setPosition(value => Math.max(0, value - 1));
        }}>{text.demoPrevious}</button>
        <button disabled={!plan.supported || position >= plan.steps.length} onClick={() => {
          if (position + 1 >= plan.steps.length) playButton.current?.focus();
          setPlaying(false); setPosition(value => Math.min(plan.steps.length, value + 1));
        }}>{text.demoNext}</button>
      </div>
    </div>
    {plan.supported ? <>
      <div className="simulator-frame"><div className="simulator-output"><span>{text.demoOutput}</span><output lang="vi" aria-label={text.demoOutput}>{current?.text || '—'}</output></div>
        <dl className="simulator-key-status"><div><dt>{text.demoCurrent}</dt><dd><kbd>{keyLabel(current)}</kbd></dd></div><div><dt>{text.demoNextKey}</dt><dd><kbd>{keyLabel(next)}</kbd></dd></div></dl>
      </div>
      <p className="simulator-status" role="status" aria-live="polite">{text.demoCurrent}: {keyLabel(current)} · {position} / {plan.steps.length}</p>
      <ol className="simulator-steps" aria-label={text.demoSequence}>{plan.steps.map((step, index) => <li key={index}
        ref={index === position - 1 ? activeKey : undefined} className={index === position - 1 ? 'is-current' : index < position ? 'is-complete' : ''}
        aria-current={index === position - 1 ? 'step' : undefined}><kbd>{keyLabel(step)}</kbd></li>)}</ol>
    </> : <p className="simulator-status" role="status">{text.demoUnsupported}</p>}
    <p className="simulator-assistance">{text.demoAssisted}</p>
  </section>;
}
