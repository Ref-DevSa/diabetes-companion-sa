import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { TextField, type TextFieldProps } from './TextField';

/** A text field for passwords with a show/hide toggle (PRD Section 5). */
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      trailing={
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? t('password.hide') : t('password.show')}
          onClick={() => setVisible((value) => !value)}
          className="focus-ring inline-flex min-h-touch min-w-touch items-center justify-center rounded-button text-text-secondary hover:text-text"
        >
          <Icon className="size-5" aria-hidden="true" />
        </button>
      }
    />
  );
}
