import { useCallback, useEffect, useRef, useState } from 'react';
import { loadContent, type Concept, type ContentMode, type Locale, type Stage } from './content';
import { messages, localeNames } from './i18n';
import { PracticeSession } from './components/PracticeSession';
import { ConfirmDialog, type ConfirmationRequest } from './components/ConfirmDialog';
import type { InputState } from './input/usePracticeInput';
import type { InputMethod } from './scoring';
import { createStorageAdapter, type CompletedAttempt, type Resume, type StorageResult } from './storage';

const stages: Stage[] = ['jamo', 'word', 'daily', 'cafe'];
type Screen = 'home' | 'practice' | 'reviewPrepare';

export default function App({ contentMode = import.meta.env.DEV || import.meta.env.MODE === 'demo' ? 'preview' : 'release' }: { contentMode?: ContentMode }) {
  const [repository] = useState(() => loadContent(contentMode));
  const [storage] = useState(() => {
    try { return createStorageAdapter(window.localStorage); }
    catch { return createStorageAdapter(null); }
  });
  const [stored, setStored] = useState<StorageResult>(() => storage.load());
  const [locale, setLocale] = useState<Locale>(stored.state.settings.uiLocale);
  const [language, setLanguage] = useState<Locale>(stored.state.settings.practiceLanguage);
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Concept[]>([]);
  const [sessionId, setSessionId] = useState(0);
  const [review, setReview] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [inputMethod, setInputMethod] = useState<InputMethod>('unknown');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<(ConfirmationRequest & { trigger: HTMLElement | null }) | null>(null);
  const inputState = useRef<InputState>('stable');
  const currentQuestion = useRef('');
  const sessionIncomplete = useRef(false);
  const exposure = useRef(new Set<string>());
  const heading = useRef<HTMLHeadingElement>(null);
  const text = messages[locale];
  const concepts = repository.concepts;
  const firstStage = stages.find(stage => concepts.some(concept => concept.stage === stage));
  const startLabel = firstStage === 'word' ? text.startWord : firstStage === 'daily' ? text.startDaily : firstStage === 'cafe' ? text.startCafe : text.start;
  const activeReview = stored.state.reviewQueue.filter(item => item.variantLanguage === language && concepts.some(concept => concept.id === item.contentId && concept.revision === item.contentVersion));
  const completedIds = new Set(stored.state.progress.filter(item => item.variantLanguage === language && concepts.some(concept => concept.id === item.contentId && concept.revision === item.contentVersion)).map(item => item.contentId));

  useEffect(() => { document.documentElement.lang = locale; document.title = `MAIHANGUL · ${text.jamo}`; }, [locale, text.jamo]);
  useEffect(() => { heading.current?.focus(); }, [screen]);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== 'maihangul.state' && event.key !== null) return;
      storage.notifyExternalChange();
      setStored({ ok: false, state: storage.getState(), status: storage.getStatus(), reason: 'external-change' });
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, [storage]);

  const onInputState = useCallback((value: InputState) => { inputState.current = value; }, []);
  const onQuestionChange = useCallback((value: string) => { currentQuestion.current = value; }, []);
  const onIncompleteChange = useCallback((value: boolean) => { sessionIncomplete.current = value; }, []);
  const requestConfirmation = useCallback((request: ConfirmationRequest) => {
    setConfirmation({ ...request, trigger: document.activeElement instanceof HTMLElement ? document.activeElement : null });
  }, []);
  const allowChange = () => {
    if (screen === 'practice' && (inputState.current === 'composing' || inputState.current === 'settling')) { setStatusMessage(text.composeBlocked); return false; }
    setStatusMessage(null); return true;
  };
  const persistSettings = (nextLocale: Locale, nextLanguage: Locale) => {
    setStored(storage.updateSettings({ uiLocale: nextLocale, practiceLanguage: nextLanguage }));
  };
  const goHome = () => {
    if (!allowChange()) return;
    const leave = () => {
      if (!allowChange()) return;
      setScreen('home'); setReview(false); setSession([]); inputState.current = 'stable';
      exposure.current = new Set();
    };
    if (screen === 'practice' && sessionIncomplete.current) {
      requestConfirmation({ message: text.confirmLeave, confirmLabel: text.leavePractice, cancelLabel: text.continue, onConfirm: leave });
    } else leave();
  };
  const start = (stage: Stage, fromId?: string) => {
    const list = concepts.filter(item => item.stage === stage);
    if (!list.length) return;
    const from = fromId ? list.findIndex(item => item.id === fromId) : 0;
    setSession(list.slice(Math.max(0, from))); setSessionId(value => value + 1);
    setScreen('practice'); setReview(false); setShowHints(true); inputState.current = 'stable';
  };
  const openReview = () => {
    setReview(true); setShowHints(true); exposure.current = new Set(); setScreen('reviewPrepare');
  };
  const beginReview = () => {
    setSession(concepts.filter(concept => activeReview.some(item => item.contentId === concept.id && item.contentVersion === concept.revision)));
    setSessionId(value => value + 1); setScreen('practice'); inputState.current = 'stable';
  };
  const persistAttempts = (attempts: CompletedAttempt[], resume: Resume | null) => {
    let latest: StorageResult | null = null;
    attempts.forEach(attempt => { latest = storage.recordAttempt(attempt, resume); });
    if (latest) setStored(latest);
  };
  const deleteData = (scope: 'learning' | 'all') => {
    requestConfirmation({ message: scope === 'all' ? text.confirmDeleteAll : text.confirmDeleteLearning,
      confirmLabel: scope === 'all' ? text.deleteAll : text.deleteLearning, cancelLabel: text.cancel, onConfirm: () => {
        const result = storage.reset(scope);
        setStored(result);
        if (!result.ok) { setStatusMessage(text.deleteFailed); return; }
        setLocale(result.state.settings.uiLocale); setLanguage(result.state.settings.practiceLanguage);
        setScreen('home'); setSession([]); exposure.current = new Set(); setReview(false); setStatusMessage(null);
      } });
  };
  const storageMessage = stored.status === 'persistent' ? text.saved : stored.status === 'conflict' ? text.conflict : stored.status === 'blocked' ? text.blocked : text.memory;

  return <>
    <a className="skip-link" href="#main">{text.skip}</a>
    <header className="site-header">
      <button className="brand" data-session-setting="true" onClick={goHome} aria-label={`MAIHANGUL · ${text.home}`}><span className="brand-symbol" lang="ko">ㅎ</span><span>MAIHANGUL</span></button>
      <div className="language-settings">
        <label>{text.uiLanguage}<select data-session-setting="true" value={locale} onChange={event => {
          if (!allowChange()) return;
          const next = event.target.value as Locale; setLocale(next); persistSettings(next, language);
        }}>{(['ko', 'en', 'vi'] as Locale[]).map(item => <option key={item} value={item}>{localeNames[item]}</option>)}</select></label>
        <label>{text.practiceLanguage}<select data-session-setting="true" value={language} onChange={event => {
          if (!allowChange()) return;
          const next = event.target.value as Locale;
          const change = () => {
            if (!allowChange()) return;
            setLanguage(next); persistSettings(locale, next);
            setInputMethod('unknown'); setSessionId(value => value + 1); inputState.current = 'stable';
            if (screen === 'practice') {
              if (review) { setScreen('reviewPrepare'); setShowHints(true); }
              else setSession(list => list.slice(Math.max(0, list.findIndex(item => item.id === currentQuestion.current))));
            }
          };
          if (screen === 'practice') requestConfirmation({ message: text.confirmLanguage, confirmLabel: text.changePracticeLanguage, cancelLabel: text.continue, onConfirm: change });
          else change();
        }}>{(['ko', 'en', 'vi'] as Locale[]).map(item => <option key={item} value={item}>{localeNames[item]}</option>)}</select></label>
      </div>
    </header>
    {contentMode === 'preview' && <div className="preview-banner">{text.draft}</div>}
    {statusMessage && <p className="global-status" role="status">{statusMessage}</p>}
    <main id="main">
      {screen === 'home' && <>
        <section className="welcome">
          <div className="welcome-copy"><h1 tabIndex={-1} ref={heading}>{text.title}</h1><p>{text.subtitle}</p>
            <div className="actions"><button className="primary" disabled={!firstStage} onClick={() => { if (firstStage) start(firstStage); }}>{startLabel}</button>
              {stored.state.resume && concepts.some(item => item.id === stored.state.resume?.nextContentId && item.revision === stored.state.resume.nextContentVersion) && <button onClick={() => start(stored.state.resume!.stage, stored.state.resume!.nextContentId)}>{text.resume}</button>}
            </div><p className="pace-welcome"><span aria-hidden="true">◷</span> {text.freePace}</p>
          </div>
          <figure className="keyboard-hero">
            <img src={`${import.meta.env.BASE_URL}assets/keyboard-studio.webp`} alt="" width="1400" height="900" decoding="async" />
            <figcaption><span className="hero-key" aria-hidden="true">R <span>ㄱ</span></span><p>{text.keyboardPreview}</p></figcaption>
          </figure>
        </section>
        {!concepts.length ? <section className="empty-state"><h2>{text.noContent}</h2><p>{text.noContentHelp}</p></section> : <>
          <section className="path-section" aria-labelledby="path-title"><div className="section-heading"><h2 id="path-title">{text.recommended}</h2><p>{completedIds.size} / {concepts.length} {text.completed}</p></div>
            <nav className="learning-path" aria-label={text.progressLabel}>{stages.map((stage, position) => {
              const stageConcepts = concepts.filter(item => item.stage === stage);
              return <button key={stage} className={`stage-option stage-${stage}`} disabled={!stageConcepts.length} onClick={() => start(stage)}>
                <span className="stage-number">{position + 1}</span><span className="stage-copy"><strong>{text[stage]}</strong><span>{text[`${stage}Description`]}</span><small>{stageConcepts.length ? <>{stageConcepts.filter(item => completedIds.has(item.id)).length} / {stageConcepts.length} {text.completed}</> : text.stageUnavailable}</small></span>
                <span className="stage-glyph" aria-hidden="true">{stage === 'jamo' ? 'ㄱ' : stage === 'word' ? '가' : stage === 'daily' ? '말' : '잔'}</span>
              </button>;
            })}</nav>
          </section>
          <section className="review-strip"><div><h2>{text.review}</h2><p>{text.reviewDescription}</p><p className="small">{text.typingReview} {activeReview.filter(item => item.typingWrong).length} <span aria-hidden="true">/</span> {text.meaningReview} {activeReview.filter(item => item.meaningWrong).length}</p></div><button onClick={openReview}>{text.review}</button></section>
        </>}
        <details className="input-help"><summary>{text.keyboardHelp}</summary><p>{text.inputHelp}</p></details>
      </>}
      {screen === 'reviewPrepare' && <section className="review-preparation">
        <h1 tabIndex={-1} ref={heading}>{text.reviewPrepare}</h1><p>{text.reviewPrepareText}</p>
        {activeReview.length ? <><fieldset><legend>{text.explanations}</legend><label><input type="radio" name="hints" checked={showHints} onChange={() => setShowHints(true)} />{text.showHints}</label><label><input type="radio" name="hints" checked={!showHints} onChange={() => setShowHints(false)} />{text.hideHintsStart}</label></fieldset>
          <button className="primary" onClick={beginReview}>{text.beginReview}</button></> : <p>{text.noReview}</p>}
        <button className="quiet" onClick={goHome}>{text.reviewFinish}</button>
      </section>}
      {screen === 'practice' && <>
        <PracticeSession key={`${sessionId}:${language}`} concepts={session} locale={locale} language={language} inputMethod={inputMethod} review={review} showHints={showHints} exposure={exposure.current}
          stageProgress={stages.map(stage => ({ stage, total: concepts.filter(item => item.stage === stage).length,
            completed: concepts.filter(item => item.stage === stage && completedIds.has(item.id)).length }))}
          onHintsChange={setShowHints} onStateChange={onInputState} onQuestionChange={onQuestionChange} onIncompleteChange={onIncompleteChange} onPersist={persistAttempts} onHome={goHome} onRequestConfirmation={requestConfirmation} onReviewSettings={() => { setShowHints(true); setScreen('reviewPrepare'); }} />
      </>}
    </main>
    <footer className="site-footer">
      <p className={`storage-status ${stored.status !== 'persistent' ? 'warning' : ''}`} role="status"><span aria-hidden="true">{stored.status === 'persistent' ? '●' : '!'}</span> {storageMessage}</p>
      {stored.status === 'memory' && <button className="quiet" onClick={() => { setStored(storage.save(storage.getState())); }}>{text.retrySave}</button>}
      {stored.status === 'conflict' && <button className="quiet" onClick={() => { const result = storage.load(); setStored(result); setLocale(result.state.settings.uiLocale); setLanguage(result.state.settings.practiceLanguage); setScreen('home'); setSession([]); }}>{text.reloadSaved}</button>}
      <p>{text.privacy}</p>
      {screen === 'home' && <><button className="quiet" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}>{text.settings}</button>
        {settingsOpen && <section className="settings-panel"><p>{text.retention}</p>
          <label>{text.inputMethod}<select value={inputMethod} onChange={event => setInputMethod(event.target.value as InputMethod)}>
            <option value="unknown">{text.unknownInput}</option><option value="korean-2set">{text.koreanInput}</option><option value="english">{text.englishInput}</option><option value="telex">{text.telexInput}</option><option value="vni">{text.vniInput}</option>
          </select></label><div className="actions"><button onClick={() => deleteData('learning')}>{text.deleteLearning}</button><button onClick={() => deleteData('all')}>{text.deleteAll}</button></div>
        </section>}</>}
    </footer>
    {confirmation && <ConfirmDialog request={confirmation} trigger={confirmation.trigger} onClose={confirmed => {
      setConfirmation(null);
      if (confirmed) confirmation.onConfirm();
    }} />}
  </>;
}
