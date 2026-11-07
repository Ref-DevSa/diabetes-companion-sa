import { useId, type SelectHTMLAttributes } from 'react';
import { FieldMessage, fieldClasses } from './FieldMessage';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  /** The first, empty choice (for example "Choose when"): there is no default (BR3). */
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
};

/** A dropdown with its label above and its message below, like a text field (PRD 8.3). */
export function SelectField({ label, placeholder, options, error, id, ...rest }: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-body font-semibold text-text">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        className={fieldClasses(Boolean(error), 'h-button')}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessage id={messageId} error={error} />
    </div>
  );
}
