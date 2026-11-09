import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { logIn, resendConfirmation } from '../data/auth';
import { errorMessageKey, type ErrorCode } from '../lib/errors';
import { isValidEmail } from '../lib/password';
import { useAuth } from '../auth/AuthContext';
import type { LogInState } from '../auth/guards';
import { useOnline } from '../hooks/useOnline';
import { Banner } from '../components/Banner';
import { FormStatus } from '../components/FormStatus';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PasswordField } from '../components/PasswordField';
import { TextField } from '../components/TextField';
import { Toast } from '../components/Toast';

/** S3 Log in (PRD 8.2): BR16 return, 5-tries wait, unconfirmed email and ended-session banners. */
export function LogIn() {
  const { t } = useTranslation();
  const online = useOnline();
  const auth = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state as LogInState | null) ?? {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [failure, setFailure] = useState<ErrorCode | null>(null);
  const [lockedEmail, setLockedEmail] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const locked = lockedEmail !== null && lockedEmail === email.trim().toLowerCase();
  // True while S3 is on screen. The app may already have moved on (the sign-in changes the session
  // before logIn() finishes its last step); then a late redirect must not pull the person back.
  const onScreen = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    onScreen.current = true;
    return () => {
      onScreen.current = false;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) found.email = t('errors.invalidEmail');
    if (password === '') found.password = t('errors.passwordRequired');
    setFieldErrors(found);
    setFailure(null);
    if (Object.keys(found).length > 0) return;

    setWorking(true);
    const result = await logIn(email.trim(), password);
    setWorking(false);
    if (result.ok) {
      auth.clearNotices();
      if (onScreen.current) navigate(state.from ?? '/', { replace: true });
      return;
    }
    setFailure(result.code);
    if (result.code === 'too_many_tries') setLockedEmail(email.trim().toLowerCase());
  }

  async function onResend() {
    const result = await resendConfirmation(email.trim());
    setToast(result.ok ? t('logIn.resent') : t(errorMessageKey[result.code]));
  }

  let banner = null;
  if (!online) {
    banner = <FormStatus online={online} failure={null} />;
  } else if (failure) {
    banner = (
      <Banner
        variant="error"
        action={failure === 'server' ? { label: t('common.tryAgain'), onClick: () => formRef.current?.requestSubmit() } : undefined}
      >
        <p>{t(errorMessageKey[failure])}</p>
        {failure === 'unconfirmed' ? (
          <button
            type="button"
            onClick={() => void onResend()}
            className="focus-ring inline-flex min-h-touch items-center self-start rounded-button font-semibold text-primary-dark underline"
          >
            {t('logIn.resend')}
          </button>
        ) : null}
      </Banner>
    );
  } else if (state.reason === 'session_ended' || auth.sessionEnded) {
    banner = <Banner variant="info">{t('errors.sessionEnded')}</Banner>;
  } else if (state.notice === 'password_changed') {
    banner = <Banner variant="info">{t('logIn.passwordChanged')}</Banner>;
  } else if (state.from) {
    banner = <Banner variant="info">{t('errors.loginRequired')}</Banner>;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {banner}
        <Card className="flex flex-col gap-4">
          <h1 className="text-title font-bold text-text">{t('logIn.title')}</h1>
          <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
            <TextField
              label={t('logIn.email')}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldErrors.email}
            />
            <PasswordField
              label={t('logIn.password')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
            />
            <Button type="submit" loading={working} loadingLabel={t('logIn.submitting')} disabled={!online || locked}>
              {t('logIn.submit')}
            </Button>
          </form>
          <div className="flex flex-col items-center gap-1 text-body">
            <Link to="/forgot-password" className="focus-ring inline-flex min-h-touch items-center rounded-button font-semibold text-primary-dark underline">
              {t('logIn.forgot')}
            </Link>
            <Link to="/sign-up" className="focus-ring inline-flex min-h-touch items-center rounded-button font-semibold text-primary-dark underline">
              {t('logIn.createAccount')}
            </Link>
          </div>
        </Card>
      </div>
      {toast ? <Toast key={toast} message={toast} variant="success" onDone={() => setToast(null)} /> : null}
    </>
  );
}
