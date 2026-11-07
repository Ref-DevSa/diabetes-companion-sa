import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { LOADING_LIMIT_MS } from '../lib/tokens';

type LoadingPlaceholderProps = {
  children: ReactNode;
  /** Called after 3 seconds of loading so the screen can show its error state (PRD 12.1). */
  onTimeout?: () => void;
};

/** Grey blocks in the shape of the content while it loads (PRD 8.3). */
export function LoadingPlaceholder({ children, onTimeout }: LoadingPlaceholderProps) {
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    const timer = window.setTimeout(() => onTimeoutRef.current?.(), LOADING_LIMIT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div data-testid="loading-placeholder" aria-busy="true" className="flex flex-col gap-4">
      {children}
    </div>
  );
}

/** One grey #E4E6EB block; give it a height class such as `h-20`. */
export function PlaceholderBlock({ className, ...rest }: HTMLAttributes<HTMLDivElement> & { 'data-shape'?: string }) {
  return <div aria-hidden="true" className={['rounded-card bg-placeholder', className].filter(Boolean).join(' ')} {...rest} />;
}
