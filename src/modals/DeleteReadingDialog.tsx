import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Reading } from '../data/readings';
import { formatGlucose } from '../lib/readingRules';
import { formatDateTime } from '../lib/dates';

type DeleteReadingDialogProps = {
  reading: Reading;
  loading?: boolean;
  /** True after a failed attempt (error or offline); nothing was deleted. */
  failed?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** M4 Delete Reading confirmation (PRD 8.2 M4), naming the Reading to be deleted. */
export function DeleteReadingDialog({ reading, loading = false, failed = false, onConfirm, onCancel }: DeleteReadingDialogProps) {
  const { t } = useTranslation();
  return (
    <ConfirmDialog
      title={t('deleteReading.title')}
      text={t('deleteReading.text', {
        dateTime: formatDateTime(reading.takenAt),
        value: formatGlucose(reading.value),
        when: t(`when.${reading.when}`),
      })}
      confirmLabel={t('deleteReading.confirm')}
      loadingLabel={t('deleteReading.deleting')}
      cancelLabel={t('common.cancel')}
      loading={loading}
      error={failed ? t('errors.deleteReading') : undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
