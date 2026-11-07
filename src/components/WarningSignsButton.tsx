import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';

/** Red header button that opens the Safety Guide (S6) from every screen (PRD 8.3, US13). */
export function WarningSignsButton() {
  const { t } = useTranslation();
  return (
    <Link
      to="/safety"
      className="focus-ring inline-flex min-h-touch items-center gap-1 whitespace-nowrap rounded-button bg-error px-2 text-small font-semibold text-white hover:brightness-90"
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      {t('header.warningSigns')}
    </Link>
  );
}
