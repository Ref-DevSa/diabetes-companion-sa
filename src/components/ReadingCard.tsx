import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import type { Reading } from '../data/readings';
import { formatDateTime } from '../lib/dates';
import { getFlag } from '../lib/flag';
import { Button } from './Button';
import { FlagBadge } from './FlagBadge';
import { FlagMessage } from './FlagMessage';

type ReadingCardProps = {
  reading: Reading;
  /** True while offline: Edit and Delete cannot be used (PRD S8). */
  disabled?: boolean;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
};

/** One Reading on S8 (PRD 8.3): value, When, date and time, Flag badge and message, note, Edit, Delete. */
export function ReadingCard({ reading, disabled = false, onEdit, onDelete }: ReadingCardProps) {
  const { t } = useTranslation();
  const flag = getFlag(reading.value, reading.when);
  return (
    <article data-reading-id={reading.id} className="flex flex-col gap-2 rounded-card bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-text">
          <span data-part="value" className="text-heading font-bold">
            {reading.value.toFixed(1)}
          </span>{' '}
          <span className="text-small text-text-secondary">{t('diary.unit')}</span>
        </p>
        <FlagBadge flag={flag} />
      </div>
      <p className="text-small text-text-secondary">
        <span>{t(`when.${reading.when}`)}</span>
        <span aria-hidden="true"> · </span>
        <span>{formatDateTime(reading.takenAt)}</span>
      </p>
      <FlagMessage flag={flag} />
      {reading.note ? <p className="rounded-card bg-background p-3 text-small text-text">{reading.note}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" fullWidth={false} disabled={disabled} onClick={() => onEdit(reading)}>
          <Pencil className="size-4" aria-hidden="true" />
          {t('diary.edit')}
        </Button>
        <Button variant="dangerSecondary" fullWidth={false} disabled={disabled} onClick={() => onDelete(reading)}>
          <Trash2 className="size-4" aria-hidden="true" />
          {t('diary.delete')}
        </Button>
      </div>
    </article>
  );
}
