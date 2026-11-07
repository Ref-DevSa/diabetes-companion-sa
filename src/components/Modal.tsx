import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  labelledBy: string;
  describedBy?: string;
  /** Called on Escape (like "Cancel" or "Close"); leave out to ignore Escape. */
  onEscape?: () => void;
  className?: string;
  children: ReactNode;
};

/**
 * A centred pop-up over a dimmed page. Keyboard focus stays inside until it closes, then goes
 * back to what opened it (PRD 8.3). Used by the confirmation pop-ups (M3, M4) and M2.
 */
export function Modal({ labelledBy, describedBy, onEscape, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    return () => opener?.focus?.();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      if (onEscape) {
        event.preventDefault();
        onEscape();
      }
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) return;
    const firstItem = items[0] as HTMLElement;
    const lastItem = items[items.length - 1] as HTMLElement;
    const current = document.activeElement;
    if (event.shiftKey && (current === firstItem || !dialogRef.current.contains(current))) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && (current === lastItem || !dialogRef.current.contains(current))) {
      event.preventDefault();
      firstItem.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-text/60 px-margin">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
        className={['w-full rounded-card bg-card shadow-card', className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
