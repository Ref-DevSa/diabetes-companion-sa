import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Card } from './Card';

/** A short notice on a card, such as the disclaimer on S1, S5 and S6. */
export function NoticeCard({ children }: { children: ReactNode }) {
  return (
    <Card className="flex items-start gap-3">
      <Info className="mt-0.5 size-4 shrink-0 text-text-secondary" aria-hidden="true" />
      <p className="text-small text-text-secondary">{children}</p>
    </Card>
  );
}
