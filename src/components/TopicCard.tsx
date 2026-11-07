import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Apple, BookOpen, Clock, Footprints, HeartHandshake, Stethoscope, Activity, type LucideIcon } from 'lucide-react';
import type { Topic } from '../data/content';
import { formatDay } from '../lib/dates';
import { Button } from './Button';

/** One icon per Topic (Lucide outline, PRD 9.1); new Topics get the book. */
const icons: Record<string, LucideIcon> = {
  'what-is-diabetes': BookOpen,
  'type-2-diabetes-basics': Activity,
  'eating-well': Apple,
  'moving-more': Footprints,
  'check-ups-and-complications': Stethoscope,
  'supporting-someone-with-diabetes': HeartHandshake,
};

type TopicCardProps = {
  topic: Topic;
  open: boolean;
  onToggle: () => void;
};

/**
 * A Topic card (PRD 8.3): icon, title (20 px bold), summary and reading time. Tapping it opens the
 * full text in place, with the review date (BR22) and a "Close" button.
 */
export function TopicCard({ topic, open, onToggle }: TopicCardProps) {
  const { t } = useTranslation();
  const bodyId = useId();
  const Icon = icons[topic.slug] ?? BookOpen;
  const reviewed = formatDay(topic.reviewedAt);

  return (
    <article className={['relative flex flex-col gap-2 rounded-card bg-card p-4 shadow-card', open ? 'border-2 border-primary' : ''].join(' ')}>
      <h2 className="text-heading font-bold text-text">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          onClick={onToggle}
          className={[
            'focus-ring flex min-h-touch w-full items-center gap-3 rounded-button text-left',
            open ? '' : 'after:absolute after:inset-0 after:content-[""]',
          ].join(' ')}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary-tint text-primary-dark">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          {topic.title}
        </button>
      </h2>
      <p className="text-body text-text-secondary">{topic.summary}</p>
      <p className="flex items-center gap-1 text-small text-text-secondary">
        <Clock className="size-4" aria-hidden="true" />
        {t('learn.readingTime', { minutes: topic.readingMinutes })}
      </p>
      {open ? (
        <div id={bodyId} className="flex flex-col gap-3 border-t border-background pt-3">
          <p className="whitespace-pre-line text-body text-text">{topic.body}</p>
          {reviewed ? <p className="text-small text-text-secondary">{t('common.lastReviewed', { date: reviewed })}</p> : null}
          <Button variant="secondary" onClick={onToggle}>
            {t('common.close')}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
