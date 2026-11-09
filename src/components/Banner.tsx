import type { ReactNode } from 'react';
import { CircleAlert, Info, RotateCw } from 'lucide-react';

type BannerProps = {
  variant: 'info' | 'error';
  children: ReactNode;
  /** An optional button under the message, such as "Try again" after a server error (PRD 6.2). */
  action?: { label: string; onClick: () => void };
};

/**
 * A message at the top of a form (S3 "Info or error banner"). Errors sit on a white card with a
 * red border and an icon (PRD 9.1); information sits on the light blue highlight panel.
 */
export function Banner({ variant, children, action }: BannerProps) {
  const button = action ? (
    <button
      type="button"
      onClick={action.onClick}
      className="focus-ring inline-flex min-h-touch items-center gap-1 self-start rounded-button font-semibold text-primary-dark underline"
    >
      <RotateCw className="size-4" aria-hidden="true" />
      {action.label}
    </button>
  ) : null;

  if (variant === 'error') {
    return (
      <div role="alert" className="flex items-start gap-2 rounded-card border-2 border-error bg-card p-3 text-body text-error">
        <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          {children}
          {button}
        </div>
      </div>
    );
  }
  return (
    <div role="status" className="flex items-start gap-2 rounded-card bg-primary-tint p-3 text-body text-primary-dark">
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {children}
        {button}
      </div>
    </div>
  );
}
