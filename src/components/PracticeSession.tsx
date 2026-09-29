import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Concept, Locale, Stage } from '../content';
import { messages, localeNames, learningCopy, type MessageKey } from '../i18n';
import { usePracticeInput, type AcceptedInput, type InputState } from '../input/usePracticeInput';
import { scoreTyping, type InputMethod, type TypingScore } from '../scoring';
import type { CompletedAttempt, Resume } from '../storage';
import { AudioControl } from '../audio/AudioControl';
import type { ConfirmationRequest } from './ConfirmDialog';
import { KeyboardGuide } from './KeyboardGuide';
import { usePressedKeys } from '../keyboard/usePressedKeys';
import { TargetCue } from './TargetCue';
import { VietnameseSimulator } from './VietnameseSimulator';
import type { SimulationStep } from '../keyboard/vietnameseSimulation';

type Answer = { input: AcceptedInput; score: TypingScore };
type MeaningAnswer = { id: string; correct: boolean; hinted: boolean };
type Phase = 'typing' | 'typed' | 'meaning' | 'meaningFeedback' | 'result' | 'complete';

interface Props {
  concepts: Concept[];
  stageProgress: { stage: Stage; completed: number; total: number }[];
  locale: Locale;
  language: Locale;
  inputMethod: InputMethod;
  initialDemoOpen?: boolean;
  review: boolean;
  showHints: boolean;
  exposure: Set<string>;
  onHintsChange: (value: boolean) => void;
  onStateChange: (state: InputState) => void;
  onQuestionChange: (id: string) => void;
  onIncompleteChange: (incomplete: boolean) => void;
  onPersist: (attempts: CompletedAttempt[], resume: Resume | null) => void;
  onHome: () => void;
  onReviewSettings: () => void;
  onRequestConfirmation: (request: ConfirmationRequest) => void;
}

const preventRepeat = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
};

export function PracticeSession(props: Props) {
  const { concepts, locale, language, inputMethod, review, showHints, exposure } = props;
  const text = messages[locale];
  const course = learningCopy(locale, language);
  const [index, setIndex] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const [firstTyping, setFirstTyping] = useState<Answer | null>(null);
  const [typing, setTyping] = useState<Answer | null>(null);
  const [firstMeaning, setFirstMeaning] = useState<MeaningAnswer | null>(null);
  const [meaning, setMeaning] = useState<MeaningAnswer | null>(null);
  const [choice, setChoice] = useState('');
  const [message, setMessage] = useState<MessageKey | null>(null);
  const [paused, setPaused] = useState(false);
  const [demoOpen, setDemoOpen] = useState(props.initialDemoOpen === true && language === 'vi');
  const [demoStep, setDemoStep] = useState<SimulationStep | null>(null);
  const demoUsed = useRef(props.initialDemoOpen === true && language === 'vi');
  const demoPointerBlocked = useRef(false);
  const practiceField = useRef<HTMLInputElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const persisted = useRef(new Set<string>());
  const question = concepts[index];
  const variant = question?.variants[language];
  const physicalKeys = usePressedKeys(phase === 'typing' && !paused && !demoOpen, `${question?.id}:${language}:${index}:${epoch}`);
  const exposureKey = question ? `${question.id}:${question.revision}` : '';
  if (showHints && question) exposure.add(exposureKey);
  const hinted = !review || exposure.has(exposureKey);
  const input = usePracticeInput({
    questionKey: `${question?.id ?? 'empty'}:${language}:${index}:${epoch}`,
    onAccepted: accepted => {
      if (!variant) return;
      const assistedInput = { ...accepted, assisted: accepted.assisted || demoUsed.current };
      const score = scoreTyping({ expected: variant.targetText, actual: assistedInput.text, elapsedMs: assistedInput.elapsedMs,
        assisted: assistedInput.assisted, interrupted: assistedInput.interrupted, inputMethod });
      if (!score) return;
      const answer = { input: assistedInput, score };
      setFirstTyping(value => value ?? answer);
      setTyping(answer);
      setMessage(null);
      setPhase('typed');
    },
    onInterrupted: () => {
      // A real app/window departure pauses only the editable part of this question.
      setPaused(true);
    },
  });
  useEffect(() => { props.onStateChange(input.state); }, [input.state, props.onStateChange]);
  useEffect(() => { if (question) props.onQuestionChange(question.id); }, [question, props.onQuestionChange]);
  useEffect(() => { props.onIncompleteChange(phase !== 'result' && phase !== 'complete'); }, [phase, props.onIncompleteChange]);
  useEffect(() => { heading.current?.focus(); }, [phase, index, paused]);
  useEffect(() => {
    if (paused && phase === 'typing') input.pause();
  }, [paused, phase, input.pause]);
  useEffect(() => {
    // Input is already locked after typing; keep the meaning activity pausable too.
    const pauseActivity = () => {
      if (phase !== 'typing' && phase !== 'result' && phase !== 'complete') setPaused(true);
    };
    const hidden = () => { if (document.hidden) pauseActivity(); };
    window.addEventListener('blur', pauseActivity);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', pauseActivity);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [phase]);

  if (!question || !variant) return <section className="empty-state"><h1>{text.noContent}</h1><p>{text.noContentHelp}</p><button onClick={props.onHome}>{text.home}</button></section>;

  const retryTyping = () => {
    setDemoOpen(false); setDemoStep(null);
    input.reset();
    setPhase('typing');
    setTyping(null);
    setMessage(null);
    setPaused(false);
  };
  const complete = () => {
    if (!firstTyping || persisted.current.has(firstTyping.input.attemptId)) { setPhase('result'); return; }
    persisted.current.add(firstTyping.input.attemptId);
    const toRecord = (answer: Answer, kind: 'first' | 'retry', meaningAnswer: MeaningAnswer | null): CompletedAttempt => ({
      attemptId: answer.input.attemptId + (kind === 'retry' ? ':retry' : ''),
      completedAt: new Date().toISOString(), attemptKind: kind, practiceMode: review ? 'review' : 'learning',
      contentId: question.id, contentVersion: question.revision, variantLanguage: language,
      scoringVersion: answer.score.scoringVersion, accuracy: answer.score.accuracy, cpm: answer.score.cpm,
      typingCorrect: answer.score.correct, meaningCorrect: meaningAnswer?.correct ?? null,
      hintExposed: meaningAnswer?.hinted ?? hinted, assisted: answer.score.assisted, interrupted: answer.score.interrupted,
      comparisonEligible: false, environmentGroup: `unknown-os|unknown-browser|pc|${inputMethod}`,
    });
    const records = [toRecord(firstTyping, 'first', firstMeaning)];
    if (typing && (typing.input.attemptId !== firstTyping.input.attemptId || meaning !== firstMeaning)) {
      records.push(toRecord(typing, 'retry', meaning));
    }
    const next = concepts[index + 1];
    props.onPersist(records, next ? { stage: next.stage, nextContentId: next.id, nextContentVersion: next.revision } : null);
    setPhase('result');
  };
  const startQuestion = (nextIndex: number) => {
    demoUsed.current = false; demoPointerBlocked.current = false;
    setDemoOpen(false); setDemoStep(null);
    setIndex(nextIndex); setEpoch(value => value + 1); setPhase('typing');
    setFirstTyping(null); setTyping(null); setFirstMeaning(null); setMeaning(null);
    setChoice(''); setMessage(null); setPaused(false);
  };
  const scorePanel = (answer: Answer, label: string) => <div className="typing-score">
    <p className="result-label">{label} <strong>{answer.score.correct ? `✓ ${text.correct}` : `↺ ${text.incorrect}`}</strong></p>
    <dl className="score-pair"><div><dt>{text.accuracy}</dt><dd>{answer.score.accuracy.toFixed(1)}<small>%</small></dd></div>
      <div><dt>{text.speed}</dt><dd>{answer.score.cpm !== null && answer.score.exclusionReasons.every(reason => reason === 'unknown-input-method') ? <>{Math.round(answer.score.cpm)}<small>{text.cpm}</small></> : <span className="metric-note">{text.excluded}</span>}</dd></div></dl>
    {!answer.score.comparisonEligible && <p className="small">{text.exclusionHelp}</p>}
  </div>;

  if (phase === 'complete') return <section className="complete-state">
    <span className="complete-mark" aria-hidden="true">✓</span><h1 tabIndex={-1} ref={heading}>{text.sessionComplete}</h1>
    <p>{text.sessionCompleteText}</p><button className="primary" onClick={props.onHome}>{review ? text.reviewFinish : text.home}</button>
  </section>;

  return <section className={`practice ${question.stage === 'cafe' ? 'cafe-practice' : ''}`} onBlur={event => {
    // UI language controls may change labels without pausing the live input.
    const target = event.relatedTarget;
    if (target instanceof HTMLElement && (event.currentTarget.contains(target) || target.dataset.sessionSetting === 'true' || target.closest('[role="dialog"]'))) return;
    if (phase === 'typing' && !paused) input.markInterrupted();
  }}>
    <div className="practice-topline">
      <ol className="course-track" aria-label={text.progressLabel}>{props.stageProgress.map((item, position) => <li key={item.stage}
        className={item.stage === question.stage ? 'is-current' : ''} aria-current={item.stage === question.stage ? 'step' : undefined}>
        <span className="course-marker" aria-hidden="true">{position + 1}</span>
        <span><strong>{course.names[item.stage]}</strong><small>{item.total ? <>{item.completed} / {item.total} {text.completed}</> : text.stageUnavailable}</small></span>
      </li>)}</ol>
      <button className="quiet" onClick={() => {
        if (input.state === 'composing' || input.state === 'settling') { setMessage('composeBlocked'); return; }
        props.onRequestConfirmation({ message: text.confirmPause, confirmLabel: text.pausePractice, cancelLabel: text.continue, onConfirm: () => {
          const current = input.getSnapshot().state;
          if (current === 'composing' || current === 'settling') { setMessage('composeBlocked'); return; }
          input.pause(); setPaused(true);
        } });
      }}>{text.pause}</button>
    </div>
    {paused ? <div className="paused-panel" role="status">
      <h1 tabIndex={-1} ref={heading}>{text.paused}</h1><p>{text.pausedText}</p>
      <button className="primary" onClick={() => { input.resume(); setPaused(false); }}>{text.continue}</button>
    </div> : <>
      {phase !== 'result' && <>
        <div className="question-header"><span>{review ? text.review : course.names[question.stage]} <strong>{index + 1} / {concepts.length}</strong> · {localeNames[language]}</span>
          <span className="pace-note">{text.freePace}</span><AudioControl source={variant.audioRef} approved={false} locale={locale} /></div>
        <div className={`target-workspace ${question.stage === 'jamo' && language === 'ko' ? 'target-workspace-jamo' : ''}`}>
          <h1 className="target-text" lang={language} tabIndex={-1} ref={phase === 'typing' || phase === 'meaning' ? heading : undefined}>{variant.targetText}</h1>
          {question.stage === 'jamo' && language === 'ko' && <TargetCue target={variant.targetText} locale={locale} />}
        </div>
        {review && <button className="hint-toggle" onClick={() => props.onHintsChange(!showHints)}>{showHints ? text.hideHint : text.showHint}</button>}
        {showHints && <div className="translations" aria-label={text.explanations}>
          {(['ko', 'en', 'vi'] as Locale[]).map(item => <p key={item} lang={item}><span>{localeNames[item]}</span>{variant.explanations[item]}</p>)}
        </div>}
        {question.stage === 'jamo' && <p className="small usage-note">{variant.usageNote[locale]}</p>}
      </>}
      {phase === 'typing' && <div className="input-area">
        <label htmlFor="practice-input">{text.inputLabel}</label>
        <input {...input.inputProps} key={input.inputKey} id="practice-input" lang={language} aria-describedby="input-help input-status"
          ref={node => { practiceField.current = node; input.inputProps.ref(node); }} readOnly={demoOpen || input.inputProps.readOnly}
          onKeyDown={event => { input.inputProps.onKeyDown?.(event); physicalKeys.onKeyDown(event); }}
          onKeyUp={event => { input.inputProps.onKeyUp?.(event); physicalKeys.onKeyUp(event); }}
          onBlur={event => { input.inputProps.onBlur?.(event); physicalKeys.onBlur(); }} />
        <p id="input-help" className="small">{demoOpen ? text.demoReadonly : text.inputHint}</p>
        <div className="actions"><button className="primary" disabled={demoOpen} onKeyDown={preventRepeat} onClick={event => {
          if (demoOpen) return;
          const result = input.submit({ detail: event.detail });
          if (result === 'confirm-required') setMessage('settling');
          if (result === 'empty') setMessage('inputEmpty');
          if (result === 'blocked') setMessage('inputBlocked');
        }}>{text.inputConfirm}</button>
        </div>
        <p id="input-status" className="input-status" role="status">{input.state === 'composing' ? text.composing : message ? text[message] : ''}</p>
        {language === 'vi' && !demoOpen && <div className="simulation-entry"><button aria-expanded="false" aria-controls="vietnamese-demo"
          onPointerDown={event => {
            const state = input.getSnapshot().state;
            demoPointerBlocked.current = state === 'composing' || state === 'settling';
            if (demoPointerBlocked.current) { event.preventDefault(); setMessage('composeBlocked'); }
          }} onPointerCancel={() => { demoPointerBlocked.current = false; }}
          onKeyDown={event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const state = input.getSnapshot().state;
            demoPointerBlocked.current = state === 'composing' || state === 'settling';
            if (demoPointerBlocked.current || event.repeat) { event.preventDefault(); setMessage('composeBlocked'); }
          }} onClick={() => {
            const state = input.getSnapshot().state;
            const blocked = demoPointerBlocked.current || state === 'composing' || state === 'settling';
            demoPointerBlocked.current = false;
            if (blocked) { setMessage('composeBlocked'); return; }
            demoUsed.current = true; setMessage(null); setDemoOpen(true);
          }}>{text.demoOpen}</button></div>}
        {language === 'vi' && demoOpen && <VietnameseSimulator target={variant.targetText} locale={locale} onStepChange={setDemoStep}
          onClose={() => { setDemoOpen(false); setDemoStep(null); queueMicrotask(() => practiceField.current?.focus()); }} />}
        <KeyboardGuide locale={locale} language={language} target={variant.targetText} isJamo={question.stage === 'jamo'} inputMethod={inputMethod} pressed={physicalKeys.pressed} showSequence={false} demoMode={demoOpen} demoStep={demoStep} />
      </div>}
      {phase === 'typed' && typing && <div className="feedback-panel">
        <h2 tabIndex={-1} ref={heading}>{text.typingResult}</h2>{firstTyping && scorePanel(firstTyping, text.firstAttempt)}
        {firstTyping?.input.attemptId !== typing.input.attemptId && scorePanel(typing, text.retryAttempt)}
        <div className="actions"><button className="primary" onClick={() => { if (variant.meaningTask) setPhase('meaning'); else complete(); }}>{variant.meaningTask ? question.stage === 'cafe' ? text.chooseOrder : text.chooseMeaning : text.result}</button>
          <button onClick={retryTyping}>{text.retryTyping}</button></div>
      </div>}
      {(phase === 'meaning' || phase === 'meaningFeedback') && variant.meaningTask && <div className="meaning-area">
        <fieldset disabled={phase === 'meaningFeedback'}><legend>{variant.meaningTask.instruction[locale]}</legend>
          <div className="meaning-options">{variant.meaningTask.options.map(option => <label className={`meaning-option ${choice === option.id ? 'selected' : ''}`} key={option.id}>
            <input type="radio" name="meaning" value={option.id} checked={choice === option.id} onChange={() => setChoice(option.id)} />
            <span>{option.label[locale]}</span>
          </label>)}</div>
        </fieldset>
        <p className="small">{hinted ? text.hinted : text.unhinted}</p>
        {phase === 'meaning' ? <><button className="primary" onKeyDown={preventRepeat} onClick={() => {
          if (!choice) { setMessage('chooseRequired'); return; }
          const answer = { id: choice, correct: choice === variant.meaningTask!.correctOptionId, hinted };
          setFirstMeaning(value => value ?? answer); setMeaning(answer); setPhase('meaningFeedback'); setMessage(null);
        }}>{text.chooseConfirm}</button><p role="status">{message ? text[message] : ''}</p></> : <div className="feedback-panel">
          <h2 tabIndex={-1} ref={heading}>{meaning?.correct ? `✓ ${text.correct}` : `↺ ${text.incorrect}`}</h2>
          <p>{variant.meaningTask.feedbackByOptionId[choice]?.[locale] ?? variant.meaningTask.feedback[locale]}</p>
          {meaning !== firstMeaning && <p>{text.firstAttempt}: {firstMeaning?.correct ? text.correct : text.incorrect} · {text.retryAttempt}: {meaning?.correct ? text.correct : text.incorrect}</p>}
          <div className="actions"><button className="primary" onClick={complete}>{text.result}</button>
            <button onClick={() => { setChoice(''); setPhase('meaning'); }}>{text.retryMeaning}</button></div>
        </div>}
      </div>}
      {phase === 'result' && firstTyping && <div className="result-screen">
        <h1 tabIndex={-1} ref={heading}>{text.resultTitle}</h1><p>{text.separate}</p>
        <div className="result-columns"><section><h2>{text.typingResult}</h2>{scorePanel(firstTyping, text.firstAttempt)}
          {typing && typing.input.attemptId !== firstTyping.input.attemptId && scorePanel(typing, text.retryAttempt)}</section>
          <section className="meaning-summary"><h2>{text.meaningResult}</h2>
            {firstMeaning ? <><p>{text.firstAttempt}</p><strong className="meaning-grade">{firstMeaning.correct ? `✓ ${text.correct}` : `↺ ${text.incorrect}`}</strong><p>{firstMeaning.hinted ? text.hinted : text.unhinted}</p>
              {meaning !== firstMeaning && <p>{text.retryAttempt}: {meaning?.correct ? text.correct : text.incorrect}</p>}</> : <p>{text.meaningNone}</p>}
          </section></div>
        <div className="actions"><button className="primary" onClick={() => { if (index + 1 < concepts.length) startQuestion(index + 1); else setPhase('complete'); }}>{index + 1 < concepts.length ? text.next : text.finish}</button>
          <button onClick={() => startQuestion(index)}>{text.restart}</button>
          {review && <button onClick={props.onReviewSettings}>{text.backPrepare}</button>}
        </div>
      </div>}
    </>}
  </section>;
}
