import { useId, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleAlert, ExternalLink, Library } from 'lucide-react';
import { listFamilyTips, listResources, type FamilyTip, type Resource } from '../data/content';
import { findLanguage } from '../i18n/languages';
import { isOfflineNow, ok, type Result } from '../lib/errors';
import { useLoad } from '../hooks/useLoad';
import { buttonClasses } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { NoticeCard } from '../components/NoticeCard';

type HelpContent = { resources: Resource[]; tips: FamilyTip[] };

/** OP13 and OP14 together: the page shows its error if either list cannot be loaded. */
async function loadHelp(language: ReturnType<typeof findLanguage>['code']): Promise<Result<HelpContent>> {
  const [resources, tips] = await Promise.all([listResources(language), listFamilyTips(language)]);
  if (!resources.ok) return resources;
  if (!tips.ok) return tips;
  return ok({ resources: resources.data, tips: tips.data });
}

type ResourceCardProps = { resource: Resource; offline: boolean; onOfflineTap: (id: string) => void };

/** One trusted organisation (PRD S7): name, one line of text, and "Open website" in a new tab. */
function ResourceCard({ resource, offline, onOfflineTap }: ResourceCardProps) {
  const { t } = useTranslation();
  const nameId = useId();

  function onOpen(event: MouseEvent<HTMLAnchorElement>) {
    if (!isOfflineNow()) return;
    event.preventDefault();
    onOfflineTap(resource.id);
  }

  return (
    <Card as="article" aria-labelledby={nameId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 id={nameId} className="text-body font-semibold text-text">
          {resource.name}
        </h3>
        <p className="text-small text-text-secondary">{resource.description}</p>
      </div>
      <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={onOpen} className={buttonClasses('secondary', { fullWidth: true })}>
        {t('help.openWebsite')}
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
      {offline ? (
        <p role="alert" className="flex items-start gap-2 rounded-card border-2 border-warning bg-card p-3 text-small text-text">
          <CircleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
          {t('help.offlineLink')}
        </p>
      ) : null}
    </Card>
  );
}

/** S7 Resources and Family Support (PRD 8.2): trusted South African links and tips for family. Open to everyone. */
export function Resources() {
  const { t, i18n } = useTranslation();
  const language = findLanguage(i18n.language).code;
  const { state, retry, timeout } = useLoad(() => loadHelp(language), language);
  const [offlineTapId, setOfflineTapId] = useState<string | null>(null);

  let body;
  if (state.status === 'loading') {
    body = (
      <LoadingPlaceholder onTimeout={timeout}>
        {[1, 2, 3].map((n) => (
          <PlaceholderBlock key={n} data-shape="card" className="h-36" />
        ))}
        {[1, 2, 3].map((n) => (
          <PlaceholderBlock key={`tip-${n}`} data-shape="tip" className="h-6" />
        ))}
      </LoadingPlaceholder>
    );
  } else if (state.status === 'error') {
    body = <ErrorState message={t('help.loadError')} onRetry={retry} />;
  } else if (state.data.resources.length === 0 && state.data.tips.length === 0) {
    body = <EmptyState icon={Library} message={t('help.empty')} />;
  } else {
    const { resources, tips } = state.data;
    body = (
      <>
        <section className="flex flex-col gap-3">
          <h2 className="text-heading font-bold text-primary-dark">{t('help.trusted')}</h2>
          {resources.length === 0 ? (
            <EmptyState icon={Library} message={t('help.empty')} />
          ) : (
            resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                offline={offlineTapId === resource.id}
                onOfflineTap={setOfflineTapId}
              />
            ))
          )}
        </section>
        {tips.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-heading font-bold text-primary-dark">{t('help.tips')}</h2>
            <Card>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-body text-text marker:text-primary">
                {tips.map((tip) => (
                  <li key={tip.id}>{tip.text}</li>
                ))}
              </ul>
            </Card>
          </section>
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-bold text-text">{t('help.title')}</h1>
      {body}
      <NoticeCard>{t('help.notice')}</NoticeCard>
    </div>
  );
}
