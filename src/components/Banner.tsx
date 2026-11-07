import type { ReactNode } from 'react';
import { CircleAlert, Info } from 'lucide-react';

type BannerProps = {
  variant: 'info' | 'error';
  children: ReactNode;
};

/**
 * A message at the top of a form (S3 "Info or error banner"). Errors sit on a white card with a
 * red border and an icon (PRD 9.1); information sits on the light blue highlight panel.
 */
export function Banner({ variant, children }: BannerProps) {
  if (variant === 'error') {
    return (
      <div role="alert" className="flex items-start gap-2 rounded-card border-2 border-error bg-card p-3 text-body text-error">
        <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-1">{children}</div>
      </div>
    );
  }
  return (
    <div role="status" className="flex items-start gap-2 rounded-card bg-primary-tint p-3 text-body text-primary-dark">
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
