import { CircleAlert } from 'lucide-react';

type FieldMessageProps = {
  /** id for aria-describedby on the field. */
  id: string;
  /** Error text: red, with an icon (PRD 8.3, 12.2). Takes the place of the helper message. */
  error?: string;
  /** Helper text when there is no error, such as the "0/200" counter. */
  message?: string;
};

/** The line under a form field: an error with its icon, or a helper message, or nothing. */
export function FieldMessage({ id, error, message }: FieldMessageProps) {
  if (error) {
    return (
      <p className="flex items-center gap-1 text-small">
        <CircleAlert className="size-4 shrink-0 text-error" aria-hidden="true" />
        <span id={id} className="text-error">
          {error}
        </span>
      </p>
    );
  }
  if (message) {
    return (
      <p id={id} className="text-small text-text-secondary">
        {message}
      </p>
    );
  }
  return null;
}

/** Shared look for inputs, dropdowns and text areas: 48 px, 12 px corners, red border on error. */
export function fieldClasses(error: boolean, extra?: string): string {
  return [
    'focus-ring w-full rounded-input bg-card px-4 text-body text-text placeholder:text-text-secondary',
    error ? 'border-2 border-error' : 'border border-text-secondary',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}
