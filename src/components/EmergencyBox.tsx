import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';

/**
 * The S6 emergency box. Its text is built into the app (BR19), so it shows at once, even with no
 * internet and before anything else loads. The phone numbers stand out in bold red.
 */
export function EmergencyBox() {
  const { t } = useTranslation();
  const titleId = useId();
  const parts = t('safety.emergencyText').split(/(112|10177)/);
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2 rounded-card border-2 border-error bg-card p-4 shadow-card">
      <h2 id={titleId} className="flex items-start gap-2 text-heading font-bold text-error">
        <TriangleAlert className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
        {t('safety.emergencyTitle')}
      </h2>
      <p className="text-body text-text">
        {parts.map((part, index) =>
          part === '112' || part === '10177' ? (
            <strong key={index} className="font-bold text-error">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
      </p>
    </section>
  );
}
