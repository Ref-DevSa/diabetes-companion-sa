import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NotebookPen, Plus } from 'lucide-react';
import { deleteReading, listReadings, type Reading } from '../data/readings';
import { errorMessageKey } from '../lib/errors';
import { getFlag } from '../lib/flag';
import { pickFriendlyMessage } from '../lib/friendlyMessage';
import { useLoad } from '../hooks/useLoad';
import { useOnline } from '../hooks/useOnline';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { ReadingCard } from '../components/ReadingCard';
import { Toast } from '../components/Toast';
import { DeleteReadingDialog } from '../modals/DeleteReadingDialog';
import { ReadingSheet } from '../modals/ReadingSheet';

type Sheet = { mode: 'add' } | { mode: 'edit'; reading: Reading } | null;
type ToastState = { id: number; message: string; variant: 'success' | 'neutral' } | null;

/** BR7: newest first by date and time (ties: the newest id first, as in the database). */
function newestFirst(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => b.takenAt.localeCompare(a.takenAt) || b.id.localeCompare(a.id));
}

/** S8 Glucose Diary (PRD 8.2): Readings newest first, 20 at a time, with add, edit and delete. */
export function GlucoseDiary() {
  const { t } = useTranslation();
  const online = useOnline();
  const { state, retry, timeout, update } = useLoad(() => listReadings(0), 'diary');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toDelete, setToDelete] = useState<Reading | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastCount = useRef(0);
  const lastFriendly = useRef<string | null>(null);

  function showToast(message: string, variant: 'success' | 'neutral') {
    toastCount.current += 1;
    setToast({ id: toastCount.current, message, variant });
  }

  const data = state.status === 'ready' ? state.data : null;

  /** After the database confirmed a save (BR23): update the list and say so (BR14, BR6). */
  function onSaved(reading: Reading, kind: 'added' | 'updated') {
    setSheet(null);
    if (data) {
      const others = data.readings.filter((r) => r.id !== reading.id);
      update({ readings: newestFirst([...others, reading]), hasMore: data.hasMore });
    }
    if (kind === 'updated') {
      showToast(t('diary.updated'), 'success');
      return;
    }
    const flag = getFlag(reading.value, reading.when);
    if (flag) {
      showToast(t(flag === 'low' ? 'flag.lowMessage' : 'flag.veryHighMessage'), 'neutral');
    } else {
      lastFriendly.current = pickFriendlyMessage(lastFriendly.current);
      showToast(t(lastFriendly.current), 'success');
    }
  }

  /** Edge case 4: the Reading was deleted on another phone. */
  function onGone() {
    setSheet(null);
    showToast(t('diary.gone'), 'neutral');
    retry();
  }

  async function onLoadMore() {
    if (!data) return;
    setLoadingMore(true);
    const result = await listReadings(data.readings.length);
    setLoadingMore(false);
    if (result.ok) update({ readings: [...data.readings, ...result.data.readings], hasMore: result.data.hasMore });
    else showToast(t(errorMessageKey[result.code]), 'neutral');
  }

  async function onConfirmDelete() {
    if (!toDelete || !data) return;
    setDeleting(true);
    setDeleteFailed(false);
    const result = await deleteReading(toDelete.id);
    setDeleting(false);
    if (!result.ok) {
      setDeleteFailed(true);
      return;
    }
    update({ readings: data.readings.filter((r) => r.id !== toDelete.id), hasMore: data.hasMore });
    setToDelete(null);
    showToast(t('diary.deleted'), 'success');
  }

  let body;
  if (state.status === 'loading') {
    body = (
      <LoadingPlaceholder onTimeout={timeout}>
        {[1, 2, 3].map((n) => (
          <PlaceholderBlock key={n} data-shape="card" className="h-32" />
        ))}
      </LoadingPlaceholder>
    );
  } else if (state.status === 'error') {
    body = <ErrorState message={t('diary.loadError')} onRetry={retry} />;
  } else if (state.data.readings.length === 0) {
    body = <EmptyState icon={NotebookPen} message={t('diary.empty')} action={{ label: t('diary.addReading'), onClick: () => setSheet({ mode: 'add' }) }} />;
  } else {
    body = (
      <>
        <div className="flex flex-col gap-3">
          {state.data.readings.map((reading) => (
            <ReadingCard
              key={reading.id}
              reading={reading}
              disabled={!online}
              onEdit={(r) => setSheet({ mode: 'edit', reading: r })}
              onDelete={(r) => {
                setDeleteFailed(false);
                setToDelete(r);
              }}
            />
          ))}
        </div>
        {state.data.hasMore ? (
          <Button variant="secondary" loading={loadingMore} loadingLabel={t('diary.loadMore')} onClick={() => void onLoadMore()}>
            {t('diary.loadMore')}
          </Button>
        ) : null}
        {/* Room for the sticky button on phones. */}
        <div aria-hidden="true" className="h-16 tablet:hidden" />
        <div className="fixed inset-x-0 bottom-tab-bar z-10 px-margin pb-2 tablet:static tablet:p-0">
          <div className="mx-auto max-w-tablet">
            <Button disabled={!online} onClick={() => setSheet({ mode: 'add' })}>
              <Plus className="size-5" aria-hidden="true" />
              {t('diary.addReading')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title font-bold text-text">{t('diary.title')}</h1>
      {body}
      {sheet ? (
        <ReadingSheet
          key={sheet.mode === 'edit' ? sheet.reading.id : 'new'}
          reading={sheet.mode === 'edit' ? sheet.reading : undefined}
          onClose={() => setSheet(null)}
          onSaved={onSaved}
          onGone={onGone}
        />
      ) : null}
      {toDelete ? (
        <DeleteReadingDialog
          reading={toDelete}
          loading={deleting}
          failed={deleteFailed}
          onConfirm={() => void onConfirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      ) : null}
      {toast ? <Toast key={toast.id} message={toast.message} variant={toast.variant} onDone={() => setToast(null)} /> : null}
    </div>
  );
}
