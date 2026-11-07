import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Flag } from '../lib/flag';

/** BR5 Flag badge: icon, word and colour, on white; never colour alone (PRD 8.3, 9.4). */
export function FlagBadge({ flag }: { flag: Flag }) {
  const { t } = useTranslation();
  if (!flag) return null;
  const low = flag === 'low';
  const Icon = low ? ArrowDown : ArrowUp;
  return (
    <span
      data-flag={flag}
      className={[
        'inline-flex items-center gap-1 rounded-button border bg-card px-2 py-0.5 text-small font-semibold',
        low ? 'border-warning text-warning' : 'border-error text-error',
      ].join(' ')}
    >
      <Icon className="size-4" aria-hidden="true" />
      {t(low ? 'flag.low' : 'flag.very_high')}
    </span>
  );
}
