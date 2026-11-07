import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Error text shown under the field with a red border and an icon (PRD 8.3, 12.2). */
  error?: string;
  /** Helper text shown under the field when there is no error (for example "0/200"). */
  message?: string;
  /** Content placed inside the right end of the input, such as the show/hide toggle. */
  trailing?: ReactNode;
};

export function TextField({ label, error, message, trailing, id, className, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const messageId = `${inputId}-message`;
  const describedBy = error ? errorId : message ? messageId : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-body font-semibold text-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'focus-ring h-button w-full rounded-input bg-card px-4 text-body text-text placeholder:text-text-secondary',
            error ? 'border-2 border-error' : 'border border-text-secondary',
            trailing ? 'pr-12' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {trailing ? <div className="absolute inset-y-0 right-0 flex items-center">{trailing}</div> : null}
      </div>
      {error ? (
        <p className="flex items-center gap-1 text-small">
          <CircleAlert className="size-4 shrink-0 text-error" aria-hidden="true" />
          <span id={errorId} className="text-error">
            {error}
          </span>
        </p>
      ) : message ? (
        <p id={messageId} className="text-small text-text-secondary">
          {message}
        </p>
      ) : null}
    </div>
  );
}
