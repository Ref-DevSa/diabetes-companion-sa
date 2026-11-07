import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

/** The sections of PRD 8.2 M2 (v0.4), in order. The text is built in, so it works offline. */
const sections = ['collect', 'why', 'who', 'where', 'howLong', 'delete', 'health', 'contact'] as const;

/** M2 Privacy Notice: a scrollable modal with a "Close" button (opens from S2 and S11). */
export function PrivacyNotice({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <Modal labelledBy={titleId} onEscape={onClose} className="flex max-h-[85dvh] max-w-tablet flex-col">
      <div className="flex items-center gap-3 border-b border-placeholder p-4">
        <ShieldCheck className="size-6 shrink-0 text-primary-dark" aria-hidden="true" />
        <h2 id={titleId} className="text-heading font-bold text-text">
          {t('privacy.title')}
        </h2>
      </div>
      <div data-testid="privacy-notice-body" className="flex flex-col gap-4 overflow-y-auto p-4">
        {sections.map((section) => (
          <section key={section} className="flex flex-col gap-1">
            <h3 className="text-body font-semibold text-text">{t(`privacy.${section}Title`)}</h3>
            <p className="text-body text-text-secondary">{t(`privacy.${section}Text`)}</p>
          </section>
        ))}
      </div>
      <div className="border-t border-placeholder p-4">
        <Button onClick={onClose}>{t('common.close')}</Button>
      </div>
    </Modal>
  );
}
