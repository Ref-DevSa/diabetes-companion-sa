import { useTranslation } from 'react-i18next';
import { tokens } from '../lib/tokens';

type ProgressRingProps = {
  done: number;
  total: number;
  /** Green when every Item is ticked (BR13). */
  complete?: boolean;
};

// Drawn in a 64 x 64 box (the ring token) so the numbers below are SVG units, not page sizes.
const RADIUS = 28;
const LENGTH = 2 * Math.PI * RADIUS;

/** 64 px ring with "X of Y" in the middle; fills in 300 ms, or at once with reduced motion (PRD 8.3, D2). */
export function ProgressRing({ done, total, complete = false }: ProgressRingProps) {
  const { t } = useTranslation();
  const share = total > 0 ? Math.min(done / total, 1) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={t('checklist.progress', { done, total })}
      aria-valuetext={t('checklist.progress', { done, total })}
      className="relative size-ring shrink-0"
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="6" className="stroke-placeholder" />
        <circle
          data-part="arc"
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH * (1 - share)}
          style={{ transitionDuration: `${tokens.motion.ring}ms` }}
          className={[
            'transition-[stroke-dashoffset] ease-out motion-reduce:transition-none',
            complete ? 'stroke-success' : 'stroke-primary',
          ].join(' ')}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-small font-semibold text-text">
        {t('checklist.ring', { done, total })}
      </span>
    </div>
  );
}
