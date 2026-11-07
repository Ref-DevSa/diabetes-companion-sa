import { Outlet } from 'react-router';
import { Header } from './Header';
import { OfflineBanner } from './OfflineBanner';
import { TabBar } from './TabBar';

/**
 * Page frame: header, tab bar (or top menu from 640 px), offline banner and one centred column
 * up to 720 px on tablets and 1200 px on computers (PRD 9.3).
 */
export function AppLayout({ showTabBar }: { showTabBar: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      {showTabBar ? <TabBar /> : null}
      <OfflineBanner />
      <main
        className={[
          'mx-auto w-full max-w-tablet flex-1 px-margin py-4 desktop:max-w-desktop',
          showTabBar ? 'mb-tab-bar tablet:mb-0' : '',
        ].join(' ')}
      >
        <Outlet />
      </main>
    </div>
  );
}
