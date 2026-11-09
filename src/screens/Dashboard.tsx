import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, NotebookPen, Plus } from 'lucide-react';
import { getDashboard } from '../data/dashboard';
import type { Reading } from '../data/readings';
import { formatShortDate } from '../lib/dates';
import { getFlag } from '../lib/flag';
import { useLoad } from '../hooks/useLoad';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { FlagBadge } from '../components/FlagBadge';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { ProgressRing } from '../components/ProgressRing';

/** A titled card that is its own landmark region, so each can be found by its title. */
function DashboardCard({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId();
  return (
    <Card as="section" aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2 id={titleId} className="text-heading font-bold text-text">
        {title}
      </h2>
      {children}
    </Card>
  );
}

/** One row on "Last 7 readings": value, "When" label, short date and the Flag badge (BR5, D1). */
function ReadingRow({ reading }: { reading: Reading }) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center justify-between gap-2 border-b border-placeholder py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-col">
        <p className="text-text">
          <span className="text-heading font-bold">{reading.value.toFixed(1)}</span>{' '}
          <span className="text-small text-text-secondary">{t('diary.unit')}</span>
        </p>
        <p className="text-small text-text-secondary">
          <span>{t(`when.${reading.when}`)}</span>
          <span aria-hidden="true"> · </span>
          <span>{formatShortDate(reading.takenAt)}</span>
        </p>
      </div>
      <FlagBadge flag={getFlag(reading.value, reading.when)} />
    </li>
  );
}

/** S10 Dashboard (PRD 8.2): the last 7 Readings and today's Checklist progress. */
export function Dashboard() {
  const { t } = useTranslation();
  // Offline after loading: nothing reloads, so the last loaded data stays visible (PRD S10).
  const { state, retry, timeout } = useLoad(getDashboard, 'dashboard');

  let body;
  if (state.status === 'loading') {
    body = (
      <LoadingPlaceholder onTimeout={timeout}>
        <PlaceholderBlock data-shape="card" className="h-80" />
        <PlaceholderBlock data-shape="card" className="h-44" />
      </LoadingPlaceholder>
    );
  } else if (state.status === 'error') {
    body = <ErrorState message={t('dashboard.loadError')} onRetry={retry} />;
  } else {
    const { readings, progress } = state.data;
    body = (
      <>
        <DashboardCard title={t('dashboard.lastReadings')}>
          {readings.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex size-ring items-center justify-center rounded-card bg-primary-tint text-primary-dark">
                <NotebookPen className="size-8" aria-hidden="true" />
              </span>
              <p className="text-body text-text">{t('dashboard.empty')}</p>
              <ButtonLink to="/diary">
                <Plus className="size-5" aria-hidden="true" />
                {t('dashboard.addReading')}
              </ButtonLink>
            </div>
          ) : (
            <>
              <ul className="flex flex-col">
                {readings.map((reading) => (
                  <ReadingRow key={reading.id} reading={reading} />
                ))}
              </ul>
              <Link
                to="/diary"
                className="focus-ring flex min-h-touch items-center justify-center gap-1 rounded-button text-body font-semibold text-primary hover:underline"
              >
                {t('dashboard.seeAll')}
                <ChevronRight className="size-5" aria-hidden="true" />
              </Link>
            </>
          )}
        </DashboardCard>
        <DashboardCard title={t('dashboard.todayChecklist')}>
          <div className="flex items-center gap-4">
            <ProgressRing done={progress.done} total={progress.total} complete={progress.allDone} />
            <div className="flex flex-col gap-1">
              <p className="text-heading font-bold text-text">{t('checklist.progress', { done: progress.done, total: progress.total })}</p>
              {progress.allDone ? <p className="text-body text-success">{t('checklist.allDone')}</p> : null}
            </div>
          </div>
          <ButtonLink to="/checklist">
            {t('dashboard.goToChecklist')}
            <ChevronRight className="size-5" aria-hidden="true" />
          </ButtonLink>
        </DashboardCard>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-bold text-text">{t('dashboard.title')}</h1>
      {body}
    </div>
  );
}
