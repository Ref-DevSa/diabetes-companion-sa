import { useId } from 'react';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmDialogProps = {
  title: string;
  text: string;
  confirmLabel: string;
  loadingLabel: string;
  cancelLabel: string;
  loading?: boolean;
  /** Shown above the buttons when the action failed (nothing was changed). */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Title, text, a danger button and "Cancel"; up to 328 px wide (PRD 8.3: M3, M4). */
export function ConfirmDialog({ title, text, confirmLabel, loadingLabel, cancelLabel, loading = false, error, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  const textId = useId();
  return (
    <Modal labelledBy={titleId} describedBy={textId} onEscape={loading ? undefined : onCancel} className="max-w-dialog p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <TriangleAlert className="size-8 text-error" aria-hidden="true" />
        <h2 id={titleId} className="text-heading font-bold text-text">
          {title}
        </h2>
        <p id={textId} className="text-body text-text-secondary">
          {text}
        </p>
        {error ? (
          <p role="alert" className="flex w-full items-start gap-2 rounded-card border-2 border-error bg-card p-3 text-left text-small text-error">
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        <div className="flex w-full flex-col gap-2">
          <Button variant="danger" loading={loading} loadingLabel={loadingLabel} onClick={onConfirm} data-autofocus>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
