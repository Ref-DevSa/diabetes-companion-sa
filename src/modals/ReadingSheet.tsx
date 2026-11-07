import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { addReading, updateReading, type Reading } from '../data/readings';
import { errorMessageKey, type ErrorCode } from '../lib/errors';
import { sastDateTimeToIso, sastParts } from '../lib/dates';
import {
  READING_WHEN,
  defaultDateTime,
  noteCounter,
  parseReadingValue,
  validateReading,
  type ReadingErrors,
  type ReadingForm,
  type ReadingWhen,
} from '../lib/readingRules';
import { useOnline } from '../hooks/useOnline';
import { Banner } from '../components/Banner';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { FieldMessage, fieldClasses } from '../components/FieldMessage';
import { SelectField } from '../components/SelectField';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';

type ReadingSheetProps = {
  /** The Reading to edit; leave out to add a new one. */
  reading?: Reading;
  onClose: () => void;
  /** Called only after the database has confirmed the save (BR23). */
  onSaved: (reading: Reading, kind: 'added' | 'updated') => void;
  /** The Reading was deleted on another phone (edge case 4). */
  onGone: () => void;
};

function startingForm(reading?: Reading): ReadingForm {
  if (!reading) return { value: '', when: '', ...defaultDateTime(), note: '' };
  return { value: reading.value.toFixed(1), when: reading.when, ...sastParts(reading.takenAt), note: reading.note ?? '' };
}

/** M1 Add or edit Reading (PRD 8.2 M1): checks BR1 to BR4 here and again in the database. */
export function ReadingSheet({ reading, onClose, onSaved, onGone }: ReadingSheetProps) {
  const { t } = useTranslation();
  const online = useOnline();
  const dateMessageId = useId();
  const [form, setForm] = useState<ReadingForm>(() => startingForm(reading));
  const [errors, setErrors] = useState<ReadingErrors>({});
  const [failure, setFailure] = useState<ErrorCode | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ReadingForm>(key: K, value: ReadingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFailure(null);
    const found = validateReading(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const input = {
      value: parseReadingValue(form.value) as number,
      when: form.when as ReadingWhen,
      takenAt: sastDateTimeToIso(form.date, form.time),
      note: form.note.trim() === '' ? null : form.note,
    };
    setSaving(true);
    const result = reading ? await updateReading(reading.id, input) : await addReading(input);
    setSaving(false);

    if (result.ok) {
      onSaved(result.data, reading ? 'updated' : 'added');
    } else if (result.code === 'not_found') {
      onGone();
    } else if (result.code === 'reading_future' || result.code === 'reading_too_old') {
      setErrors({ dateTime: errorMessageKey[result.code] });
    } else {
      setFailure(result.code);
    }
  }

  const dateTimeError = errors.dateTime ? t(errors.dateTime) : undefined;

  return (
    <BottomSheet title={t(reading ? 'reading.editTitle' : 'reading.addTitle')} onCancel={onClose}>
      {!online ? <Banner variant="error">{t('errors.offline')}</Banner> : null}
      {failure && online ? <Banner variant="error">{t(errorMessageKey[failure])}</Banner> : null}
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label={t('reading.value')}
          inputMode="decimal"
          autoComplete="off"
          placeholder={t('reading.valuePlaceholder')}
          value={form.value}
          onChange={(event) => set('value', event.target.value)}
          error={errors.value ? t(errors.value) : undefined}
        />
        <SelectField
          label={t('reading.when')}
          placeholder={t('reading.whenPlaceholder')}
          options={READING_WHEN.map((when) => ({ value: when, label: t(`when.${when}`) }))}
          value={form.when}
          onChange={(event) => set('when', event.target.value as ReadingWhen | '')}
          error={errors.when ? t(errors.when) : undefined}
        />
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-2">
            {(['date', 'time'] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label htmlFor={`${dateMessageId}-${key}`} className="text-body font-semibold text-text">
                  {t(`reading.${key}`)}
                </label>
                <input
                  id={`${dateMessageId}-${key}`}
                  type={key}
                  value={form[key]}
                  onChange={(event) => set(key, event.target.value)}
                  aria-invalid={dateTimeError ? true : undefined}
                  aria-describedby={dateTimeError ? dateMessageId : undefined}
                  className={fieldClasses(Boolean(dateTimeError), 'h-button')}
                />
              </div>
            ))}
          </div>
          <FieldMessage id={dateMessageId} error={dateTimeError} />
        </div>
        <TextAreaField
          label={t('reading.note')}
          placeholder={t('reading.notePlaceholder')}
          value={form.note}
          onChange={(event) => set('note', event.target.value)}
          message={noteCounter(form.note)}
          error={errors.note ? t(errors.note) : undefined}
        />
        <div className="flex flex-col gap-2">
          <Button type="submit" loading={saving} loadingLabel={t('reading.saving')} disabled={!online}>
            {t('reading.save')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
