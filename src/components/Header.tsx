import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CircleUserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import { Logo } from './Logo';
import { WarningSignsButton } from './WarningSignsButton';

/** Screens where the Visitor "Log in" button is hidden (PRD 8.3): S2, S3, S4. */
const NO_LOG_IN_BUTTON = ['/sign-up', '/log-in', '/forgot-password'];

/** One header for every screen, 56 px, fixed at the top (PRD 8.3, design correction D10). */
export function Header() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { pathname } = useLocation();
  const showLogIn = !session && !NO_LOG_IN_BUTTON.includes(pathname);

  return (
    <header className="sticky top-0 z-20 h-header border-b border-placeholder bg-card">
      <div className="mx-auto flex h-full w-full max-w-desktop items-center justify-between gap-2 px-3">
        <Link to="/" className="focus-ring inline-flex min-h-touch items-center rounded-button">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSelector />
          <WarningSignsButton />
          {session ? (
            <Link
              to="/profile"
              className="focus-ring inline-flex min-h-touch min-w-touch items-center justify-center rounded-button text-primary-dark hover:bg-primary-tint"
            >
              <CircleUserRound className="size-6" aria-hidden="true" />
              <span className="sr-only">{t('header.profile')}</span>
            </Link>
          ) : showLogIn ? (
            <Link
              to="/log-in"
              className="focus-ring inline-flex min-h-touch items-center whitespace-nowrap rounded-button border-2 border-primary-dark px-2 text-small font-semibold text-primary-dark hover:bg-primary-tint"
            >
              {t('header.logIn')}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
