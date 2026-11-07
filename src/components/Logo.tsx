import { useTranslation } from 'react-i18next';
import { tokens } from '../lib/tokens';

/**
 * Rounded-square blue icon with a white water-drop and a tick; wordmark "Diabetes Companion"
 * with a blue "SA" (PRD 9.1). Never a blue circle (IDF protected symbol).
 */
export function Logo() {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden="true" focusable="false">
        <rect width="36" height="36" rx="10" fill={tokens.color.primary} />
        <path
          data-part="drop"
          d="M18 6.5c-4.6 6.3-8.2 10.6-8.2 14.4a8.2 8.2 0 0 0 16.4 0c0-3.8-3.6-8.1-8.2-14.4z"
          fill={tokens.color.card}
        />
        <path
          data-part="tick"
          d="M14.6 21.4l2.5 2.5 4.6-4.7"
          fill="none"
          stroke={tokens.color.primary}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span data-part="wordmark" aria-hidden="true" className="hidden whitespace-nowrap text-body font-bold text-text wordmark:inline">
        Diabetes Companion <span className="text-primary">SA</span>
      </span>
      <span className="sr-only">{t('app.name')}</span>
    </span>
  );
}
