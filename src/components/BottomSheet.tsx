import { useId, type ReactNode } from 'react';
import { Modal } from './Modal';

type BottomSheetProps = {
  title: string;
  /** "Cancel", Escape and the phone's back gesture all close the sheet (Section 11). */
  onCancel: () => void;
  children: ReactNode;
};

/** Slides up from the bottom over a dimmed page; focus stays inside (PRD 8.3: M1, M5). */
export function BottomSheet({ title, onCancel, children }: BottomSheetProps) {
  const titleId = useId();
  return (
    <Modal
      labelledBy={titleId}
      onEscape={onCancel}
      placement="bottom"
      className="flex max-h-[90dvh] max-w-tablet flex-col motion-safe:animate-sheet-up"
    >
      <div className="flex flex-col items-center gap-3 px-4 pt-3">
        <span aria-hidden="true" className="h-1 w-10 rounded-button bg-disabled" />
        <h2 id={titleId} className="self-start text-heading font-bold text-text">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto p-4">{children}</div>
    </Modal>
  );
}
