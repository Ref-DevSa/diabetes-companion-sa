import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, HeartHandshake, WifiOff } from 'lucide-react';
import { listTopics } from '../data/content';
import { findLanguage } from '../i18n/languages';
import { useLoad } from '../hooks/useLoad';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { NoticeCard } from '../components/NoticeCard';
import { TopicCard } from '../components/TopicCard';

/** S5 Learning Centre (PRD 8.2): Topics in the chosen language, opened in place. */
export function LearningCentre() {
  const { t, i18n } = useTranslation();
  const language = findLanguage(i18n.language).code;
  const { state, retry, timeout } = useLoad(() => listTopics(language), language);
  const [openId, setOpenId] = useState<string | null>(null);

  let topics;
  if (state.status === 'loading') {
    topics = (
      <LoadingPlaceholder onTimeout={timeout}>
        {[1, 2, 3].map((n) => (
          <PlaceholderBlock key={n} data-shape="card" className="h-28" />
        ))}
      </LoadingPlaceholder>
    );
  } else if (state.status === 'error' && state.code === 'offline') {
    topics = (
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <WifiOff className="size-8 text-text-secondary" aria-hidden="true" />
        <p role="status" className="text-body text-text">
          {t('learn.offline')}
        </p>
      </Card>
    );
  } else if (state.status === 'error') {
    topics = <ErrorState message={t('learn.loadError')} onRetry={retry} />;
  } else if (state.data.length === 0) {
    topics = <EmptyState icon={BookOpen} message={t('learn.empty')} />;
  } else {
    topics = (
      <div className="flex flex-col gap-3">
        {state.data.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            open={openId === topic.id}
            onToggle={() => setOpenId((current) => (current === topic.id ? null : topic.id))}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold text-text">{t('learn.title')}</h1>
        <p className="text-body text-text-secondary">{t('learn.intro')}</p>
      </div>
      {topics}
      <Link
        to="/help"
        className="focus-ring flex min-h-touch items-center gap-3 rounded-card bg-card p-4 shadow-card hover:bg-primary-tint"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary-tint text-primary-dark">
          <HeartHandshake className="size-6" aria-hidden="true" />
        </span>
        <span className="flex-1 text-body font-semibold text-text">{t('learn.familyLink')}</span>
        <ChevronRight className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
      </Link>
      <NoticeCard>{t('notice.disclaimer')}</NoticeCard>
    </div>
  );
}
