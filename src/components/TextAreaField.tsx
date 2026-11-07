import { useId, type TextareaHTMLAttributes } from 'react';
import { FieldMessage, fieldClasses } from './FieldMessage';

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  /** Helper text when there is no error, such as the "0/200" counter (BR4). */
  message?: string;
};

/** A text area with its label above and its message below, like a text field (PRD 8.3). */
export function TextAreaField({ label, error, message, id, ...rest }: TextAreaFieldProps) {
  const generatedId = useId();
  const areaId = id ?? generatedId;
  const messageId = `${areaId}-message`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={areaId} className="text-body font-semibold text-text">
        {label}
      </label>
      <textarea
        id={areaId}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || message ? messageId : undefined}
        className={fieldClasses(Boolean(error), 'min-h-button py-3')}
        {...rest}
      />
      <FieldMessage id={messageId} error={error} message={message} />
    </div>
  );
}
