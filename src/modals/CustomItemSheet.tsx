import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addCustomItem, renameCustomItem, type ChecklistItem } from '../data/checklist';
import { validateItemName, type ItemNameError } from '../lib/checklistRules';
import type { ErrorCode } from '../lib/errors';
import { useOnline } from '../hooks/useOnline';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { FormStatus } from '../components/FormStatus';
import { TextField } from '../components/TextField';

type CustomItemSheetProps = {
  /** The Custom Item to rename; leave out to add a new one. */
  item?: ChecklistItem;
  /** The User's Custom Item names, to catch a duplicate before saving (BR11). */
  existingNames: string[];
  onClose: () => void;
  /** Called only after the database has confirmed the save (BR23). */
  onSaved: (item: ChecklistItem, kind: 'added' | 'updated') => void;
};

/** M5 Add or edit Custom Item (PRD 8.2 M5): checks BR11 here and again in the database. */
export function CustomItemSheet({ item, existingNames, onClose, onSaved }: CustomItemSheetProps) {
  const { t } = useTranslation();
  const online = useOnline();
  const [name, setName] = useState(item?.name ?? '');
  const [error, setError] = useState<ItemNameError | null>(null);
  const [failure, setFailure] = useState<ErrorCode | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFailure(null);
    const found = validateItemName(name, existingNames, item?.name);
    setError(found);
    if (found) return;

    setSaving(true);
    const result = item ? await renameCustomItem(item.id, name.trim()) : await addCustomItem(name.trim());
    setSaving(false);

    if (result.ok) onSaved(result.data, item ? 'updated' : 'added');
    else if (result.code === 'item_name_taken') setError('errors.itemNameTaken');
    else setFailure(result.code);
  }

  return (
    <BottomSheet title={t(item ? 'customItem.editTitle' : 'customItem.addTitle')} onCancel={onClose}>
      <FormStatus online={online} failure={failure} onRetry={() => formRef.current?.requestSubmit()} />
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label={t('customItem.name')}
          placeholder={t('customItem.placeholder')}
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error ? t(error) : undefined}
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" loading={saving} loadingLabel={t('customItem.saving')} disabled={!online}>
            {t('customItem.save')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
