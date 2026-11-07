import { useEffect, useRef, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { tokens } from '../lib/tokens';

type ToastProps = {
  message: string;
  variant?: 'success' | 'neutral';
  /** Called when the toast has been shown for 3 seconds and goes away. */
  onDone?: () => void;
};

/** One short message above the tab bar for 3 seconds (PRD 8.3). */
export function Toast({ message, variant = 'neutral', onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDoneRef.current?.();
    }, tokens.motion.toast);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-tab-bar z-30 flex justify-center px-margin pb-2 tablet:bottom-4"
    >
      <div className="flex max-w-tablet items-center gap-2 rounded-card bg-text px-4 py-3 text-body text-white shadow-card">
        {variant === 'success' ? <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" /> : null}
        <span>{message}</span>
      </div>
    </div>
  );
}
