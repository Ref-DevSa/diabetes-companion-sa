import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChecklistItem } from '../data/checklist';

type ChecklistItemRowProps = {
  item: ChecklistItem;
  ticked: boolean;
  /** True while the tick is being saved: the box waits for the database (BR23). */
  saving?: boolean;
  /** True while offline or deleting: Edit and Delete cannot be used. */
  actionsDisabled?: boolean;
  onToggle: (item: ChecklistItem) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
};

/** One Item on S9 (PRD 8.2): a 44 px checkbox and the name; a Custom Item also has "Edit" and "Delete". */
export function ChecklistItemRow({ item, ticked, saving = false, actionsDisabled = false, onToggle, onEdit, onDelete }: ChecklistItemRowProps) {
  const { t } = useTranslation();
  const nameId = useId();
  const name = item.standardKey ? t(`checklist.standard.${item.standardKey}`) : item.name;

  return (
    <li aria-labelledby={nameId} className="flex items-center gap-2 rounded-card bg-card px-2 py-1 shadow-card">
      <label className="flex min-h-touch min-w-0 flex-1 cursor-pointer items-center gap-1">
        <span className="flex size-touch shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={ticked}
            disabled={saving}
            aria-labelledby={nameId}
            onChange={() => onToggle(item)}
            className="focus-ring size-6 cursor-pointer accent-primary disabled:cursor-wait"
          />
        </span>
        <span
          id={nameId}
          data-part="name"
          className={['min-w-0 break-words text-body', ticked ? 'text-text-secondary line-through' : 'text-text'].join(' ')}
        >
          {name}
        </span>
      </label>
      {item.isStandard ? null : (
        <div className="flex shrink-0">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onEdit(item)}
            className="focus-ring min-h-touch rounded-button px-2 text-small font-semibold text-primary disabled:text-disabled"
          >
            {t('checklist.edit')}
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onDelete(item)}
            className="focus-ring min-h-touch rounded-button px-2 text-small font-semibold text-error disabled:text-disabled"
          >
            {t('checklist.delete')}
          </button>
        </div>
      )}
    </li>
  );
}
