import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../components/ConfirmDialog';

type DeleteAccountDialogProps = {
  loading?: boolean;
  /** True after a failed attempt (error or offline); nothing was deleted. */
  failed?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** M3 Delete account confirmation (PRD 8.2 M3). */
export function DeleteAccountDialog({ loading = false, failed = false, onConfirm, onCancel }: DeleteAccountDialogProps) {
  const { t } = useTranslation();
  return (
    <ConfirmDialog
      title={t('deleteAccount.title')}
      text={t('deleteAccount.text')}
      confirmLabel={t('deleteAccount.confirm')}
      loadingLabel={t('deleteAccount.deleting')}
      cancelLabel={t('common.cancel')}
      loading={loading}
      error={failed ? t('errors.deleteAccount') : undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
