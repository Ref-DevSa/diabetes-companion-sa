import { useTranslation } from 'react-i18next';
import { errorMessageKey, type ErrorCode } from '../lib/errors';
import { Banner } from './Banner';

type FormStatusProps = {
  /** From useOnline(): while offline the form shows the offline message (and disables its save button). */
  online: boolean;
  /** The last save's failure, if any. */
  failure: ErrorCode | null;
  /** Sends the form again; shown as "Try again" after a server or unknown error. */
  onRetry?: () => void;
};

/**
 * The message at the top of every form that saves something (PRD 6.2, 12.2):
 * offline → "You're offline. Reconnect and try again."; server or unknown error →
 * "Something went wrong on our side. Please try again." with "Try again"; any other failure → its PRD text.
 */
export function FormStatus({ online, failure, onRetry }: FormStatusProps) {
  const { t } = useTranslation();
  if (!online) return <Banner variant="error">{t('errors.offline')}</Banner>;
  if (!failure) return null;
  const action = failure === 'server' && onRetry ? { label: t('common.tryAgain'), onClick: onRetry } : undefined;
  return (
    <Banner variant="error" action={action}>
      {t(errorMessageKey[failure])}
    </Banner>
  );
}
