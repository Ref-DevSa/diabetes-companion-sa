import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';

/** Shown under the header while the phone has no internet (PRD 8.3, 12.1). */
export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();
  if (online) return null;

  return (
    <div role="status" className="bg-text text-white">
      <div className="mx-auto flex w-full max-w-tablet items-center gap-2 px-margin py-2 desktop:max-w-desktop">
        <WifiOff className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-small">{t('offline.banner')}</p>
      </div>
    </div>
  );
}
