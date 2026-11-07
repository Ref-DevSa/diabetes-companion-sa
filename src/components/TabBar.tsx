import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BookOpen, House, LayoutDashboard, ListChecks, NotebookPen, type LucideIcon } from 'lucide-react';
import { isSignedIn, useAuth } from '../auth/AuthContext';
import { linkTarget } from '../auth/protectedLink';

const tabs: Array<{ path: string; labelKey: string; icon: LucideIcon }> = [
  { path: '/', labelKey: 'tabs.home', icon: House },
  { path: '/learn', labelKey: 'tabs.learn', icon: BookOpen },
  { path: '/diary', labelKey: 'tabs.diary', icon: NotebookPen },
  { path: '/checklist', labelKey: 'tabs.checklist', icon: ListChecks },
  { path: '/dashboard', labelKey: 'tabs.dashboard', icon: LayoutDashboard },
];

/**
 * Five tabs at the bottom of a phone; a top menu from 640 px (PRD 8.3, 9.3).
 * A Visitor tapping Diary, Checklist or Dashboard goes to S3 (BR16).
 * Tapping the active tab scrolls to the top (Section 11).
 */
export function TabBar() {
  const { t } = useTranslation();
  const signedIn = isSignedIn(useAuth());
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 h-tab-bar border-t border-placeholder bg-card tablet:static tablet:border-b tablet:border-t-0">
      <ul className="mx-auto flex h-full w-full max-w-desktop items-stretch justify-around tablet:justify-center tablet:gap-2">
        {tabs.map(({ path, labelKey, icon: Icon }) => {
          const active = pathname === path;
          const target = linkTarget(path, signedIn);
          return (
            <li key={path} className="flex flex-1 tablet:flex-none">
              <Link
                to={target.to}
                state={target.state}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  if (active) window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={[
                  'focus-ring flex min-h-touch min-w-touch flex-1 flex-col items-center justify-center gap-0.5 rounded-button px-1 text-small tablet:flex-row tablet:gap-2 tablet:px-3',
                  active ? 'font-semibold text-primary' : 'text-text-secondary hover:text-text',
                ].join(' ')}
              >
                <Icon className="size-5" aria-hidden="true" />
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
