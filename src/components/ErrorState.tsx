import { useTranslation } from 'react-i18next';
import { CircleAlert, RotateCw } from 'lucide-react';
import { Button } from './Button';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

/** A message and a "Try again" button on a white card (PRD 8.2, 12.2). */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-card bg-card p-6 text-center shadow-card">
      <CircleAlert className="size-8 text-error" aria-hidden="true" />
      <p className="text-body text-text">{message}</p>
      <Button onClick={onRetry}>
        <RotateCw className="size-5" aria-hidden="true" />
        {t('common.tryAgain')}
      </Button>
    </div>
  );
}
