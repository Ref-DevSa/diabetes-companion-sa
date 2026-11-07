import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerSecondary';

const base =
  'focus-ring inline-flex h-button items-center justify-center gap-2 rounded-button px-4 text-body font-semibold transition-colors';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
  secondary: 'border-2 border-primary-dark bg-card text-primary-dark hover:bg-primary-tint active:bg-primary-tint',
  danger: 'bg-error text-white hover:brightness-90 active:brightness-90',
  /** A smaller-looking destructive action next to others (e.g. Delete on a Reading card); opens a confirmation. */
  dangerSecondary: 'border-2 border-error bg-card text-error hover:bg-background active:bg-background',
};

const disabledLook = 'cursor-not-allowed bg-disabled text-text-secondary';

/** Shared look for buttons and links that look like buttons (PRD 8.3). */
export function buttonClasses(variant: ButtonVariant = 'primary', options: { disabled?: boolean; fullWidth?: boolean } = {}) {
  const { disabled = false, fullWidth = true } = options;
  return [base, fullWidth ? 'w-full' : '', disabled ? disabledLook : variants[variant]].filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** While true the button is disabled and shows `loadingLabel` (e.g. "Saving…"). */
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel,
  fullWidth = true,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[buttonClasses(variant, { disabled: isDisabled, fullWidth }), className].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; fullWidth?: boolean };

/** A link that looks like a button (for example "Create free account" on S1). */
export function ButtonLink({ variant = 'primary', fullWidth = true, className, ...rest }: ButtonLinkProps) {
  return <Link className={[buttonClasses(variant, { fullWidth }), className].filter(Boolean).join(' ')} {...rest} />;
}
