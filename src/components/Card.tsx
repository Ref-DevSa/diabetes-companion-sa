import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type CardBorder = 'error' | 'warning' | 'success' | 'primary';

const borders: Record<CardBorder, string> = {
  error: 'border-2 border-error',
  warning: 'border-2 border-warning',
  success: 'border-2 border-success',
  primary: 'border-2 border-primary',
};

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** Optional coloured border; Flags, errors and success always sit on a white card (PRD 9.1). */
  border?: CardBorder;
  children: ReactNode;
};

/** White block, 16 px padding, 12 px corners, soft shadow (PRD 8.3). */
export function Card({ as: Element = 'div', border, className, children, ...rest }: CardProps) {
  return (
    <Element
      className={['rounded-card bg-card p-4 shadow-card', border ? borders[border] : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Element>
  );
}
