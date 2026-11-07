import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, MailCheck } from 'lucide-react';
import { requestPasswordReset, saveNewPassword } from '../data/auth';
import { errorMessageKey, type ErrorCode } from '../lib/errors';
import { checkNewPassword, isValidEmail } from '../lib/password';
import { useAuth } from '../auth/AuthContext';
import type { LogInState } from '../auth/guards';
import { useOnline } from '../hooks/useOnline';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PasswordField } from '../components/PasswordField';
import { TextField } from '../components/TextField';

const linkClass = 'focus-ring inline-flex min-h-touch items-center self-center rounded-button font-semibold text-primary-dark underline';

/** S4 step 1: ask for a reset link. The answer is the same whether or not the email exists. */
function RequestLink() {
  const { t } = useTranslation();
  const online = useOnline();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [failure, setFailure] = useState<ErrorCode | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFailure(null);
    if (!isValidEmail(email)) {
      setEmailError(t('errors.invalidEmail'));
      return;
    }
    setEmailError(undefined);
    setSending(true);
    const result = await requestPasswordReset(email.trim());
    setSending(false);
    if (result.ok) setSent(true);
    else setFailure(result.code);
  }

  if (sent) {
    return (
      <Card className="flex flex-col items-center gap-4 p-6 text-center">
        <MailCheck className="size-10 text-success" aria-hidden="true" />
        <p role="status" className="text-body font-semibold text-text">
          {t('forgot.sent')}
        </p>
        <Link to="/log-in" className={linkClass}>
          {t('forgot.back')}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-title font-bold text-text">{t('forgot.title')}</h1>
      <p className="text-body text-text-secondary">{t('forgot.text')}</p>
      {failure ? <Banner variant="error">{t(errorMessageKey[failure])}</Banner> : null}
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label={t('forgot.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />
        <Button type="submit" loading={sending} loadingLabel={t('forgot.submitting')} disabled={!online}>
          {t('forgot.submit')}
        </Button>
      </form>
      <Link to="/log-in" className={linkClass}>
        {t('forgot.back')}
      </Link>
    </Card>
  );
}

/** S4 step 2: choose a new password with the recovery session from the email link. */
function ChooseNewPassword({ onExpired }: { onExpired: () => void }) {
  const { t } = useTranslation();
  const online = useOnline();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [problem, setProblem] = useState<'weak' | 'mismatch' | null>(null);
  const [failure, setFailure] = useState<ErrorCode | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFailure(null);
    const check = checkNewPassword(password, confirmation);
    setProblem(check);
    if (check) return;
    setSaving(true);
    const result = await saveNewPassword(password);
    setSaving(false);
    if (result.ok) {
      const state: LogInState = { notice: 'password_changed' };
      navigate('/log-in', { replace: true, state });
    } else if (result.code === 'link_expired') {
      onExpired();
    } else if (result.code === 'weak_password') {
      setProblem('weak');
    } else {
      setFailure(result.code);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h1 className="text-title font-bold text-text">{t('forgot.newTitle')}</h1>
      {failure ? <Banner variant="error">{t(errorMessageKey[failure])}</Banner> : null}
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <PasswordField
          label={t('forgot.newPassword')}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={problem === 'weak' ? t('errors.weakPassword') : undefined}
        />
        <PasswordField
          label={t('forgot.confirmPassword')}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={problem === 'mismatch' ? t('errors.passwordsDontMatch') : undefined}
        />
        <Button type="submit" loading={saving} loadingLabel={t('forgot.saving')} disabled={!online}>
          {t('forgot.save')}
        </Button>
      </form>
    </Card>
  );
}

/** S4 Forgot password (PRD 8.2): step 1, step 2 and the expired-link state. */
export function ForgotPassword() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [expired, setExpired] = useState(auth.linkExpired);
  const [askAgain, setAskAgain] = useState(false);

  if (expired && !askAgain) {
    return (
      <Card border="error" className="flex flex-col items-center gap-4 p-6 text-center">
        <Clock className="size-10 text-error" aria-hidden="true" />
        <p role="alert" className="text-body font-semibold text-text">
          {t('errors.linkExpired')}
        </p>
        <Button
          onClick={() => {
            auth.clearNotices();
            setExpired(false);
            setAskAgain(true);
          }}
        >
          {t('forgot.sendNewLink')}
        </Button>
      </Card>
    );
  }

  if (auth.recovery && auth.session && !askAgain) {
    return <ChooseNewPassword onExpired={() => setExpired(true)} />;
  }

  return <RequestLink />;
}
