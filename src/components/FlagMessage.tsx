import { useTranslation } from 'react-i18next';
import { CircleAlert } from 'lucide-react';
import type { Flag } from '../lib/flag';

/** BR6: the message on a flagged Reading, on a white card with a coloured border. No playful words. */
export function FlagMessage({ flag }: { flag: Flag }) {
  const { t } = useTranslation();
  if (!flag) return null;
  const low = flag === 'low';
  return (
    <p
      data-flag={flag}
      className={['flex items-start gap-2 rounded-card border-2 bg-card p-3 text-small', low ? 'border-warning text-warning' : 'border-error text-error'].join(' ')}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{t(low ? 'flag.lowMessage' : 'flag.veryHighMessage')}</span>
    </p>
  );
}
