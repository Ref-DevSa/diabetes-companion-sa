import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** The label; it may contain a link (for example "Privacy Notice"). */
  label: ReactNode;
  error?: string;
};

/** A checkbox with a 44 px touch target (PRD 9.4). Starts unticked unless `checked` is set. */
export function Checkbox({ label, error, id, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="flex min-h-touch items-center gap-1 text-body text-text">
        <span className="flex min-h-touch min-w-touch shrink-0 items-center justify-center">
          <input
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={['focus-ring size-5 accent-primary', error ? 'outline-2 outline-error' : ''].join(' ')}
            {...rest}
          />
        </span>
        <span>{label}</span>
      </label>
      {error ? (
        <p className="flex items-center gap-1 pl-2 text-small">
          <CircleAlert className="size-4 shrink-0 text-error" aria-hidden="true" />
          <span id={errorId} className="text-error">
            {error}
          </span>
        </p>
      ) : null}
    </div>
  );
}
