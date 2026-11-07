import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock, WifiOff } from 'lucide-react';
import { listSafetyItems, type SafetyItem, type SafetySection } from '../data/content';
import { findLanguage } from '../i18n/languages';
import { formatDay, latestDate } from '../lib/dates';
import { useLoad } from '../hooks/useLoad';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { EmergencyBox } from '../components/EmergencyBox';
import { ErrorState } from '../components/ErrorState';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { NoticeCard } from '../components/NoticeCard';

const sections: Array<{ section: SafetySection; titleKey: string }> = [
  { section: 'low', titleKey: 'safety.lowTitle' },
  { section: 'high', titleKey: 'safety.highTitle' },
  { section: 'urgent', titleKey: 'safety.urgentTitle' },
];

function SafetyList({ title, items, urgent }: { title: string; items: SafetyItem[]; urgent: boolean }) {
  const headingId = useId();
  return (
    <Card border={urgent ? 'error' : undefined} className="flex flex-col gap-2">
      <h2 id={headingId} className={['text-body font-bold', urgent ? 'text-error' : 'text-text'].join(' ')}>
        {title}
      </h2>
      <ul aria-labelledby={headingId} className="flex list-disc flex-col gap-1 pl-6 text-body text-text">
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </Card>
  );
}

/** A plain message card under the emergency box (empty and offline states). */
function Message({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-6 text-center">
      <Icon className="size-8 text-text-secondary" aria-hidden="true" />
      <p role="status" className="text-body text-text">
        {text}
      </p>
    </Card>
  );
}

/**
 * S6 Safety Guide (PRD 8.2). The emergency box is built in and shows first, at once, even offline;
 * the three lists come from the database (BR19). No playful wording here (BR15).
 */
export function SafetyGuide() {
  const { t, i18n } = useTranslation();
  const language = findLanguage(i18n.language).code;
  const { state, retry, timeout } = useLoad(() => listSafetyItems(language), language);

  let lists;
  if (state.status === 'loading') {
    lists = (
      <LoadingPlaceholder onTimeout={timeout}>
        {sections.map(({ section }) => (
          <PlaceholderBlock key={section} data-shape="list" className="h-40" />
        ))}
      </LoadingPlaceholder>
    );
  } else if (state.status === 'error' && state.code === 'offline') {
    lists = <Message icon={WifiOff} text={t('safety.offline')} />;
  } else if (state.status === 'error') {
    lists = <ErrorState message={t('safety.loadError')} onRetry={retry} />;
  } else if (state.data.length === 0) {
    lists = <Message icon={Clock} text={t('safety.empty')} />;
  } else {
    const items = state.data;
    lists = (
      <>
        {sections.map(({ section, titleKey }) => {
          const sectionItems = items.filter((item) => item.section === section);
          return sectionItems.length > 0 ? <SafetyList key={section} title={t(titleKey)} items={sectionItems} urgent={section === 'urgent'} /> : null;
        })}
      </>
    );
  }

  const reviewed = state.status === 'ready' ? formatDay(latestDate(state.data.map((item) => item.reviewedAt))) : '';

  return (
    <div className="flex flex-col gap-4">
      <EmergencyBox />
      <NoticeCard>{t('safety.note')}</NoticeCard>
      {lists}
      <ButtonLink to="/help">
        {t('safety.findHelp')}
        <ChevronRight className="size-5" aria-hidden="true" />
      </ButtonLink>
      <NoticeCard>{t('notice.disclaimer')}</NoticeCard>
      {reviewed ? <p className="text-center text-small text-text-secondary">{t('common.lastReviewed', { date: reviewed })}</p> : null}
    </div>
  );
}
