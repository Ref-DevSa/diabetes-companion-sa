import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

type EmptyStateProps = {
  icon: LucideIcon;
  message: string;
  action?: { label: string; onClick: () => void };
};

/** Replaces a list when it has no items (PRD 8.3). */
export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card bg-card p-6 text-center shadow-card">
      <span className="flex size-ring items-center justify-center rounded-card bg-primary-tint text-primary-dark">
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <p className="text-body text-text">{message}</p>
      {action ? <Button onClick={action.onClick}>{action.label}</Button> : null}
    </div>
  );
}
