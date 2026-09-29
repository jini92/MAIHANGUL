import { useEffect, useMemo, useSyncExternalStore, type InputHTMLAttributes } from 'react';
import { normalizeText } from '../scoring';

export type InputState = 'stable' | 'composing' | 'settling' | 'submitted' | 'paused';
export type MeasurementStart = 'compositionstart' | 'beforeinput' | 'input' | 'none';
export type SubmitResult = 'accepted' | 'empty' | 'blocked' | 'confirm-required';

export interface AcceptedInput {
  attemptId: string;
  questionKey: string;
  text: string;
  elapsedMs: number;
  measurementStart: MeasurementStart;
  assisted: boolean;
  interrupted: boolean;
}

export interface PracticeInputSnapshot {
  state: InputState;
  epoch: number;
  attemptId: string;
  committedText: string;
  assisted: boolean;
  interrupted: boolean;
}

interface PracticeInputOptions {
  questionKey: string;
  onAccepted: (result: AcceptedInput) => void;
  onInterrupted?: () => void;
}

/**
 * Provisional conservative controller, pending Windows IME observation.
 * compositionend never submits or assumes an event order. A fresh activation
 * reads the DOM and confirms it; another distinct activation may submit it.
 */
export class PracticeInputController {
  private snapshot: PracticeInputSnapshot;
  private listeners = new Set<() => void>();
  private node: HTMLInputElement | null = null;
  private detachBeforeInput: (() => void) | null = null;
  private startedAt: number | null = null;
  private measurementStart: MeasurementStart = 'none';
  private disposed = false;
  private confirmationArmed = false;
  private readonly now: () => number;

  constructor(private readonly options: PracticeInputOptions, now = () => performance.now()) {
    this.now = now;
    this.snapshot = this.freshSnapshot(0);
  }

  private freshSnapshot(epoch: number): PracticeInputSnapshot {
    return {
      state: 'stable', epoch, attemptId: `${this.options.questionKey}:${crypto.randomUUID()}`,
      committedText: '', assisted: false, interrupted: false,
    };
  }

  getSnapshot = (): PracticeInputSnapshot => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(patch: Partial<PracticeInputSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach(listener => listener());
  }

  private isCurrent(node: HTMLInputElement, epoch: number) {
    return !this.disposed && node === this.node && epoch === this.snapshot.epoch;
  }

  private editable(node: HTMLInputElement, epoch: number) {
    return this.isCurrent(node, epoch) && this.snapshot.state !== 'submitted' && this.snapshot.state !== 'paused';
  }

  private beginTiming(source: MeasurementStart) {
    if (this.startedAt !== null) return;
    this.startedAt = this.now();
    this.measurementStart = source;
  }

  private observeAssistance(inputType: string) {
    if (/insertFromPaste|insertFromDrop|insertReplacementText/.test(inputType)) this.update({ assisted: true });
  }

  attach = (node: HTMLInputElement | null, epoch: number) => {
    if (epoch !== this.snapshot.epoch || this.disposed) return;
    this.detachBeforeInput?.();
    this.detachBeforeInput = null;
    this.node = node;
    if (!node) return;
    // Native beforeinput avoids relying on React's composition-related fallback.
    const beforeInput = (event: InputEvent) => {
      if (!this.editable(node, epoch)) return;
      this.beginTiming('beforeinput');
      this.observeAssistance(event.inputType);
      if (event.isComposing && this.snapshot.state !== 'composing') {
        this.confirmationArmed = false;
        this.update({ state: 'composing' });
      }
    };
    node.addEventListener('beforeinput', beforeInput);
    this.detachBeforeInput = () => node.removeEventListener('beforeinput', beforeInput);
  };

  compositionStart(node: HTMLInputElement, epoch: number) {
    if (!this.editable(node, epoch)) return;
    this.beginTiming('compositionstart');
    this.confirmationArmed = false;
    this.update({ state: 'composing' });
  }

  compositionEnd(node: HTMLInputElement, epoch: number) {
    if (!this.editable(node, epoch)) return;
    this.confirmationArmed = false;
    this.update({ state: 'settling' });
  }

  input(node: HTMLInputElement, epoch: number, event: InputEvent) {
    if (!this.editable(node, epoch)) return;
    this.beginTiming('input');
    this.observeAssistance(event.inputType ?? '');
    if (event.isComposing) {
      this.confirmationArmed = false;
      this.update({ state: 'composing' });
      return;
    }
    // Late final input may follow compositionend. It does not prove settlement.
    if (this.snapshot.state !== 'stable') return;
    if (this.confirmationArmed) {
      // The previous activation confirmed one exact full value. A later input
      // must not silently replace it, even when isComposing is false.
      if (node.value !== this.snapshot.committedText) {
        this.confirmationArmed = false;
        this.update({ state: 'settling' });
      }
      return;
    }
    this.update({ committedText: node.value });
  }

  markAssisted(node: HTMLInputElement, epoch: number) {
    if (this.editable(node, epoch)) this.update({ assisted: true });
  }

  submit = ({ detail = 1 }: { detail?: number } = {}): SubmitResult => {
    if (this.disposed || !this.node || detail > 1 || this.snapshot.state === 'composing' || this.snapshot.state === 'paused' || this.snapshot.state === 'submitted') return 'blocked';
    if (this.snapshot.state === 'settling') {
      this.confirmationArmed = true;
      this.update({ state: 'stable', committedText: this.node.value });
      return 'confirm-required';
    }
    // After a confirmation, an unexpected DOM change without an observed input
    // requires confirmation again rather than accepting an unobserved value.
    if (this.confirmationArmed && this.node.value !== this.snapshot.committedText) {
      this.update({ committedText: this.node.value });
      return 'confirm-required';
    }
    const text = normalizeText(this.node.value);
    if (!text) return 'empty';
    const accepted: AcceptedInput = {
      attemptId: this.snapshot.attemptId,
      questionKey: this.options.questionKey,
      text,
      elapsedMs: this.startedAt === null ? 0 : Math.max(0, this.now() - this.startedAt),
      measurementStart: this.measurementStart,
      assisted: this.snapshot.assisted,
      interrupted: this.snapshot.interrupted,
    };
    this.update({ state: 'submitted', committedText: this.node.value });
    this.options.onAccepted(accepted);
    return 'accepted';
  };

  reset = () => {
    if (this.disposed) return;
    this.detachBeforeInput?.();
    this.node = null;
    this.startedAt = null;
    this.measurementStart = 'none';
    this.confirmationArmed = false;
    this.snapshot = this.freshSnapshot(this.snapshot.epoch + 1);
    this.listeners.forEach(listener => listener());
  };

  markInterrupted = () => {
    if (this.disposed || this.snapshot.state === 'submitted' || this.snapshot.interrupted) return;
    this.update({ interrupted: true });
    this.options.onInterrupted?.();
  };

  pause = () => {
    if (this.disposed || this.snapshot.state === 'submitted' || this.snapshot.state === 'paused') return;
    this.markInterrupted();
    this.detachBeforeInput?.();
    this.node = null;
    this.confirmationArmed = false;
    this.update({ state: 'paused', epoch: this.snapshot.epoch + 1 });
  };

  resume = () => {
    if (this.disposed || this.snapshot.state !== 'paused') return;
    this.update({ state: 'stable', epoch: this.snapshot.epoch + 1 });
  };

  dispose = () => {
    this.disposed = true;
    this.detachBeforeInput?.();
    this.node = null;
  };
}

export function usePracticeInput(options: PracticeInputOptions) {
  // This identity changes only when the question/attempt owner changes, never
  // when a UI translation or an onAccepted callback changes.
  const callbackHolder = useMemo(() => ({ onAccepted: options.onAccepted, onInterrupted: options.onInterrupted }), [options.questionKey]);
  callbackHolder.onAccepted = options.onAccepted;
  callbackHolder.onInterrupted = options.onInterrupted;
  const controller = useMemo(() => new PracticeInputController({
    questionKey: options.questionKey,
    onAccepted: result => callbackHolder.onAccepted(result),
    onInterrupted: () => callbackHolder.onInterrupted?.(),
  }), [options.questionKey, callbackHolder]);
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);

  useEffect(() => {
    const visibility = () => { if (document.hidden) controller.pause(); };
    const blur = () => controller.pause();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
      // Event handlers also carry both controller identity and element epoch.
      // Avoid disposing here: React StrictMode replays effect cleanup/setup.
    };
  }, [controller]);

  const epoch = snapshot.epoch;
  const inputProps: InputHTMLAttributes<HTMLInputElement> & { ref: (node: HTMLInputElement | null) => void } = {
    ref: node => controller.attach(node, epoch),
    defaultValue: snapshot.committedText,
    readOnly: snapshot.state === 'submitted' || snapshot.state === 'paused',
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    onCompositionStart: event => controller.compositionStart(event.currentTarget, epoch),
    onCompositionEnd: event => controller.compositionEnd(event.currentTarget, epoch),
    onInput: event => controller.input(event.currentTarget, epoch, event.nativeEvent as InputEvent),
    onPaste: event => controller.markAssisted(event.currentTarget, epoch),
    onDrop: event => controller.markAssisted(event.currentTarget, epoch),
    onKeyDown: event => {
      if (event.key === 'Enter' && !event.nativeEvent.isComposing && controller.getSnapshot().state !== 'composing') event.preventDefault();
    },
  };
  return {
    inputProps,
    inputKey: `${options.questionKey}:${epoch}`,
    state: snapshot.state,
    snapshot,
    submit: controller.submit,
    reset: controller.reset,
    pause: controller.pause,
    resume: controller.resume,
    markInterrupted: controller.markInterrupted,
    getSnapshot: controller.getSnapshot,
  };
}
