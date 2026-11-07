import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BookOpen, CalendarCheck, ChevronRight, HeartHandshake, Plus, TriangleAlert, type LucideIcon } from 'lucide-react';
import heroIllustration from '../assets/home-hero.svg';
import { useAuth } from '../auth/AuthContext';
import { linkTarget } from '../auth/protectedLink';
import { ButtonLink } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { NoticeCard } from '../components/NoticeCard';

type FeatureCard = { path: string; titleKey: string; textKey: string; icon: LucideIcon; tone: 'primary' | 'error' };

/** The four feature cards (PRD 8.2 S1). */
const featureCards: FeatureCard[] = [
  { path: '/learn', titleKey: 'home.cardLearnTitle', textKey: 'home.cardLearnText', icon: BookOpen, tone: 'primary' },
  { path: '/safety', titleKey: 'home.cardSafetyTitle', textKey: 'home.cardSafetyText', icon: TriangleAlert, tone: 'error' },
  { path: '/help', titleKey: 'home.cardFamilyTitle', textKey: 'home.cardFamilyText', icon: HeartHandshake, tone: 'primary' },
  { path: '/diary', titleKey: 'home.cardTrackTitle', textKey: 'home.cardTrackText', icon: CalendarCheck, tone: 'primary' },
];

/** S1 Home (PRD 8.2): Visitor and User views, Loading, Error; Offline via the banner. */
export function Home() {
  const { t } = useTranslation();
  const { session, loading, error, retry } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const signedIn = Boolean(session);

  if (error || timedOut) {
    return (
      <ErrorState
        message={t('common.serverError')}
        onRetry={() => {
          setTimedOut(false);
          retry();
        }}
      />
    );
  }

  if (loading) {
    return (
      <LoadingPlaceholder onTimeout={() => setTimedOut(true)}>
        <PlaceholderBlock data-shape="hero" className="h-72" />
        <PlaceholderBlock className="h-6 w-2/3" />
        {featureCards.map((card) => (
          <PlaceholderBlock key={card.path} data-shape="card" className="h-20" />
        ))}
      </LoadingPlaceholder>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-card bg-primary-tint p-4 shadow-card">
        <img src={heroIllustration} alt="" className="mx-auto h-20 w-28" />
        {signedIn ? <p className="text-body font-semibold text-primary-dark">{t('home.welcomeBack')}</p> : null}
        <h1 className="text-title font-bold text-text">{t('home.heroTitle')}</h1>
        <p className="text-body text-text">{t('home.heroText')}</p>
        <div className="flex flex-col gap-2 pt-1">
          {signedIn ? (
            <ButtonLink to="/diary">
              <Plus className="size-5" aria-hidden="true" />
              {t('home.addReading')}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to="/sign-up">{t('home.createAccount')}</ButtonLink>
              <ButtonLink to="/log-in" variant="secondary">
                {t('home.logIn')}
              </ButtonLink>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="home-features" className="flex flex-col gap-3">
        <h2 id="home-features" className="text-heading font-bold text-primary-dark">
          {t('home.featuresHeading')}
        </h2>
        <ul className="flex flex-col gap-3">
          {featureCards.map(({ path, titleKey, textKey, icon: Icon, tone }) => {
            const target = linkTarget(path, signedIn);
            return (
              <li key={path}>
                <Link
                  to={target.to}
                  state={target.state}
                  className="focus-ring flex min-h-touch items-center gap-3 rounded-card bg-card p-4 shadow-card hover:bg-primary-tint"
                >
                  <span
                    className={[
                      'flex size-11 shrink-0 items-center justify-center rounded-card',
                      tone === 'error' ? 'bg-background text-error' : 'bg-primary-tint text-primary-dark',
                    ].join(' ')}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-body font-semibold text-text">{t(titleKey)}</span>
                    <span className="text-small text-text-secondary">{t(textKey)}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <NoticeCard>{t('notice.disclaimer')}</NoticeCard>
    </div>
  );
}
