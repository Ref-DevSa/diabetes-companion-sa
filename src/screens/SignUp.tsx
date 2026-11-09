import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MailCheck } from 'lucide-react';
import { signUp } from '../data/auth';
import { errorMessageKey, type ErrorCode } from '../lib/errors';
import { isValidEmail, isValidPassword } from '../lib/password';
import { useOnline } from '../hooks/useOnline';
import { FormStatus } from '../components/FormStatus';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { Checkbox } from '../components/Checkbox';
import { PasswordField } from '../components/PasswordField';
import { TextField } from '../components/TextField';
import { PrivacyNotice } from '../modals/PrivacyNotice';

type FieldErrors = { email?: string; password?: string; age?: string; privacy?: string };

/** S2 Sign up (PRD 8.2): email, password, the two consent boxes (BR18). */
export function SignUp() {
  const { t } = useTranslation();
  const online = useOnline();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<ErrorCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found: FieldErrors = {};
    if (!isValidEmail(email)) found.email = t('errors.invalidEmail');
    if (!isValidPassword(password)) found.password = t('errors.weakPassword');
    if (!age) found.age = t('errors.ageRequired');
    if (!privacy) found.privacy = t('errors.privacyRequired');
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const result = await signUp({ email: email.trim(), password });
    setSaving(false);
    if (result.ok) {
      setDone(true);
    } else if (result.code === 'email_taken' || result.code === 'invalid_email') {
      setErrors({ email: t(errorMessageKey[result.code]) });
    } else if (result.code === 'weak_password') {
      setErrors({ password: t('errors.weakPassword') });
    } else {
      setServerError(result.code);
    }
  }

  if (done) {
    return (
      <Card className="flex flex-col items-center gap-4 p-6 text-center">
        <MailCheck className="size-10 text-success" aria-hidden="true" />
        <p role="status" className="text-body font-semibold text-text">
          {t('signUp.success')}
        </p>
        <ButtonLink to="/log-in">{t('signUp.goToLogIn')}</ButtonLink>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex flex-col gap-4">
        <h1 className="text-title font-bold text-text">{t('signUp.title')}</h1>
        <FormStatus online={online} failure={serverError} onRetry={() => formRef.current?.requestSubmit()} />
        <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <TextField
            label={t('signUp.email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t('signUp.emailPlaceholder')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <PasswordField
            label={t('signUp.password')}
            autoComplete="new-password"
            placeholder={t('signUp.passwordPlaceholder')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <Checkbox label={t('signUp.age')} checked={age} onChange={(event) => setAge(event.target.checked)} error={errors.age} />
          <Checkbox
            checked={privacy}
            onChange={(event) => setPrivacy(event.target.checked)}
            error={errors.privacy}
            label={
              <>
                {t('signUp.privacyBefore')}{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="focus-ring inline-flex min-h-touch items-center rounded-button align-middle font-semibold text-primary-dark underline"
                >
                  {t('signUp.privacyLink')}
                </button>
              </>
            }
          />
          <Button type="submit" loading={saving} loadingLabel={t('signUp.submitting')} disabled={!online}>
            {t('signUp.submit')}
          </Button>
        </form>
        <p className="text-center text-body text-text-secondary">
          {t('signUp.haveAccount')}{' '}
          <Link to="/log-in" className="focus-ring inline-flex min-h-touch items-center rounded-button font-semibold text-primary-dark underline">
            {t('signUp.logIn')}
          </Link>
        </p>
      </Card>
      {showPrivacy ? <PrivacyNotice onClose={() => setShowPrivacy(false)} /> : null}
    </>
  );
}
