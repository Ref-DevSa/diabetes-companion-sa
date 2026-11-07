import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { logOut } from '../data/auth';
import { deleteMyAccount, getProfile, setLanguage } from '../data/profile';
import { chooseLanguage } from '../i18n';
import { enabledLanguages, findLanguage, type LanguageCode } from '../i18n/languages';
import { errorMessageKey } from '../lib/errors';
import { useLoad } from '../hooks/useLoad';
import { useOnline } from '../hooks/useOnline';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { Toast } from '../components/Toast';
import { DeleteAccountDialog } from '../modals/DeleteAccountDialog';
import { PrivacyNotice } from '../modals/PrivacyNotice';

type ToastState = { id: number; message: string; variant: 'success' | 'neutral' } | null;

let toastCount = 0;
function makeToast(message: string, variant: 'success' | 'neutral'): ToastState {
  toastCount += 1;
  return { id: toastCount, message, variant };
}

/** S11 Profile and settings (PRD 8.2): email (read only), language, Privacy Notice, log out, delete. */
export function Profile() {
  const { t } = useTranslation();
  const online = useOnline();
  const navigate = useNavigate();
  const languageHeadingId = useId();
  const { state: load, retry, timeout, update } = useLoad(() => getProfile(), 'profile');
  const [toast, setToast] = useState<ToastState>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  async function onChooseLanguage(code: LanguageCode) {
    if (load.status !== 'ready' || code === load.data.language) return;
    if (!online) {
      setToast(makeToast(t('errors.offline'), 'neutral'));
      return;
    }
    const result = await setLanguage(code);
    if (!result.ok) {
      setToast(makeToast(t(errorMessageKey[result.code]), 'neutral'));
      return;
    }
    await chooseLanguage(code);
    update({ ...load.data, language: code });
    setToast(makeToast(t('profile.languageChanged'), 'success'));
  }

  async function onLogOut() {
    navigate('/', { replace: true });
    await logOut();
  }

  async function onDelete() {
    setDeleting(true);
    setDeleteFailed(false);
    const result = await deleteMyAccount();
    setDeleting(false);
    if (!result.ok) {
      setDeleteFailed(true);
      return;
    }
    navigate('/', { replace: true, state: { toast: 'account_deleted' } });
    await logOut();
  }

  let body;
  if (load.status === 'loading') {
    body = (
      <LoadingPlaceholder onTimeout={timeout}>
        <PlaceholderBlock className="h-20" />
        <PlaceholderBlock className="h-40" />
        <PlaceholderBlock className="h-12" />
      </LoadingPlaceholder>
    );
  } else if (load.status === 'error') {
    body = <ErrorState message={t('errors.profileLoad')} onRetry={retry} />;
  } else {
    const profile = load.data;
    body = (
      <>
        <Card>
          <p className="text-small font-semibold text-text-secondary">{t('profile.email')}</p>
          <p className="break-all text-body text-text">{profile.email}</p>
        </Card>

        <section className="flex flex-col gap-2">
          <h2 id={languageHeadingId} className="text-small font-semibold text-text-secondary">
            {t('profile.language')}
          </h2>
          <div role="radiogroup" aria-labelledby={languageHeadingId} className="overflow-hidden rounded-card bg-card shadow-card">
            {enabledLanguages.map((code) => {
              const selected = profile.language === code;
              return (
                <label
                  key={code}
                  className={[
                    'flex min-h-button cursor-pointer items-center justify-between border-b border-background px-4 text-body last:border-b-0',
                    selected ? 'bg-primary-tint font-semibold text-primary-dark' : 'text-text',
                  ].join(' ')}
                >
                  {findLanguage(code).name}
                  <input
                    type="radio"
                    name="language"
                    value={code}
                    checked={selected}
                    onChange={() => void onChooseLanguage(code)}
                    className="focus-ring size-5 accent-primary"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={() => setShowPrivacy(true)}
          className="focus-ring flex min-h-button items-center gap-3 rounded-card bg-card px-4 text-left text-body text-text shadow-card hover:bg-primary-tint"
        >
          <ShieldCheck className="size-5 shrink-0 text-primary-dark" aria-hidden="true" />
          <span className="flex-1">{t('profile.privacy')}</span>
          <ChevronRight className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />
        </button>

        <Button variant="secondary" onClick={() => void onLogOut()}>
          <LogOut className="size-5" aria-hidden="true" />
          {t('profile.logOut')}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            setDeleteFailed(false);
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="size-5" aria-hidden="true" />
          {t('profile.deleteAccount')}
        </Button>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-bold text-text">{t('profile.title')}</h1>
      {body}
      {showPrivacy ? <PrivacyNotice onClose={() => setShowPrivacy(false)} /> : null}
      {deleteOpen ? (
        <DeleteAccountDialog
          loading={deleting}
          failed={deleteFailed}
          onConfirm={() => void onDelete()}
          onCancel={() => setDeleteOpen(false)}
        />
      ) : null}
      {toast ? <Toast key={toast.id} message={toast.message} variant={toast.variant} onDone={() => setToast(null)} /> : null}
    </div>
  );
}
