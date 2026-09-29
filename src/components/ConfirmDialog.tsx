import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmationRequest {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}

export function ConfirmDialog({ request, trigger, onClose }: {
  request: ConfirmationRequest;
  trigger: HTMLElement | null;
  onClose: (confirmed: boolean) => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const background = Array.from(document.body.children).filter(node => !node.contains(dialog.current));
    const previous = background.map(node => ({ node, inert: node.hasAttribute('inert'), hidden: node.getAttribute('aria-hidden') }));
    previous.forEach(({ node }) => { node.setAttribute('inert', ''); node.setAttribute('aria-hidden', 'true'); });
    const keepFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.current?.contains(event.target)) cancel.current?.focus();
    };
    document.addEventListener('focusin', keepFocus);
    cancel.current?.focus();
    return () => {
      document.removeEventListener('focusin', keepFocus);
      previous.forEach(({ node, inert, hidden }) => {
        if (!inert) node.removeAttribute('inert');
        if (hidden === null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', hidden);
      });
      if (trigger?.isConnected) trigger.focus();
    };
  }, [trigger]);

  return createPortal(<div className="modal-backdrop">
    <section className="confirm-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="confirmation-message" onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(false); }
      if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
      if (event.key === 'Tab') {
        event.preventDefault();
        if (document.activeElement === cancel.current) confirm.current?.focus(); else cancel.current?.focus();
      }
    }}>
      <h2 id="confirmation-message">{request.message}</h2>
      <div className="actions">
        <button ref={cancel} data-session-setting="true" onClick={() => onClose(false)}>{request.cancelLabel}</button>
        <button className="primary" ref={confirm} data-session-setting="true" onClick={event => { if (event.detail <= 1) onClose(true); }}>{request.confirmLabel}</button>
      </div>
    </section>
  </div>, document.body);
}
