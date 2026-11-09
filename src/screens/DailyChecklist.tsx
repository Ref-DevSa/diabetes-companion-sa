import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleCheck, Plus } from 'lucide-react';
import {
  deleteCustomItem,
  getTodayChecklist,
  tickItem,
  untickItem,
  type ChecklistItem,
  type TodayChecklist,
} from '../data/checklist';
import { canAddCustomItem, checklistProgress } from '../lib/checklistRules';
import { formatWeekday, msUntilSastMidnight, sastToday } from '../lib/dates';
import { errorMessageKey, isOfflineNow, type ErrorCode } from '../lib/errors';
import { useLoad } from '../hooks/useLoad';
import { useOnline } from '../hooks/useOnline';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChecklistItemRow } from '../components/ChecklistItemRow';
import { ErrorState } from '../components/ErrorState';
import { LoadingPlaceholder, PlaceholderBlock } from '../components/LoadingPlaceholder';
import { ProgressRing } from '../components/ProgressRing';
import { Toast } from '../components/Toast';
import { CustomItemSheet } from '../modals/CustomItemSheet';

type Sheet = { mode: 'add' } | { mode: 'edit'; item: ChecklistItem } | null;
/** A message above the Items; a server error offers "Try again" to repeat the action (PRD 6.2). */
type Notice = { text: string; variant: 'info' | 'error'; retry?: () => void } | null;
type ToastState = { id: number; message: string; variant: 'success' | 'neutral' } | null;

/** S9 Daily Checklist (PRD 8.2): today's Items with their ticks, progress, and Custom Items. */
export function DailyChecklist() {
  const { t } = useTranslation();
  const online = useOnline();
  const { state, retry, timeout, update } = useLoad(getTodayChecklist, 'checklist');
  const [saving, setSaving] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const toastCount = useRef(0);

  function showToast(message: string, variant: 'success' | 'neutral') {
    toastCount.current += 1;
    setToast({ id: toastCount.current, message, variant });
  }

  function showError(code: ErrorCode, retry?: () => void) {
    setNotice({
      text: t(code === 'offline' ? 'checklist.offlineTicks' : errorMessageKey[code]),
      variant: 'error',
      retry: code === 'server' ? retry : undefined,
    });
  }

  // BR12 and edge case 7: at 00:00 SAST a new day starts, so say so and load it with every Item unticked.
  const loadedDate = state.status === 'ready' ? state.data.date : null;
  const newDay = useRef(() => {});
  useEffect(() => {
    newDay.current = () => {
      setNotice(null);
      setSheet(null);
      showToast(t('checklist.newDay'), 'neutral');
      retry();
    };
  });
  useEffect(() => {
    let timer = 0;
    function schedule() {
      timer = window.setTimeout(() => {
        newDay.current();
        schedule();
      }, msUntilSastMidnight());
    }
    schedule();
    return () => window.clearTimeout(timer);
  }, []);
  // A phone that slept through midnight wakes with an old day on screen.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && loadedDate && loadedDate !== sastToday()) newDay.current();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadedDate]);

  /** BR23: the tick shows as saved only after the database confirms; on failure it stays as it was. */
  async function onToggle(item: ChecklistItem, ticked: boolean) {
    setNotice(null);
    if (isOfflineNow()) {
      showError('offline');
      return;
    }
    setSaving((ids) => [...ids, item.id]);
    const result = ticked ? await untickItem(item.id) : await tickItem(item.id);
    setSaving((ids) => ids.filter((id) => id !== item.id));
    if (!result.ok) {
      showError(result.code, () => void onToggle(item, ticked));
      return;
    }
    update((current: TodayChecklist) => ({
      ...current,
      tickedIds: ticked ? current.tickedIds.filter((id) => id !== item.id) : [...current.tickedIds, item.id],
    }));
  }

  function onAdd(customCount: number) {
    setNotice(null);
    if (!canAddCustomItem(customCount)) {
      setNotice({ text: t('errors.customItemLimit'), variant: 'info' });
      return;
    }
    setSheet({ mode: 'add' });
  }

  function onSaved(item: ChecklistItem, kind: 'added' | 'updated') {
    setSheet(null);
    update((current: TodayChecklist) => ({
      ...current,
      items: kind === 'added' ? [...current.items, item] : current.items.map((i) => (i.id === item.id ? item : i)),
    }));
    showToast(t('checklist.saved'), 'success');
  }

  async function onDelete(item: ChecklistItem) {
    setNotice(null);
    setDeleting(item.id);
    const result = await deleteCustomItem(item.id);
    setDeleting(null);
    if (!result.ok && result.code !== 'not_found') {
      const code = result.code === 'offline' ? 'offline' : 'server';
      setNotice({ text: t(errorMessageKey[code]), variant: 'error', retry: code === 'server' ? () => void onDelete(item) : undefined });
      return;
    }
    update((current: TodayChecklist) => ({
      ...current,
      items: current.items.filter((i) => i.id !== item.id),
      tickedIds: current.tickedIds.filter((id) => id !== item.id),
    }));
    showToast(t('checklist.deleted'), 'success');
  }

  let body;
  if (state.status === 'loading') {
    body = (
      <LoadingPlaceholder onTimeout={timeout}>
        <div className="flex items-center gap-4 rounded-card bg-card p-4 shadow-card">
          <PlaceholderBlock data-shape="ring" className="size-ring rounded-full" />
          <PlaceholderBlock className="h-6 flex-1" />
        </div>
        {[1, 2, 3, 4, 5].map((n) => (
          <PlaceholderBlock key={n} data-shape="item" className="h-14" />
        ))}
      </LoadingPlaceholder>
    );
  } else if (state.status === 'error') {
    body = <ErrorState message={t('checklist.loadError')} onRetry={retry} />;
  } else {
    const { items, tickedIds } = state.data;
    const ticked = new Set(tickedIds);
    const progress = checklistProgress(
      items.map((item) => item.id),
      tickedIds,
    );
    const customItems = items.filter((item) => !item.isStandard);
    body = (
      <>
        <Card border={progress.allDone ? 'success' : undefined} className="flex items-center gap-4">
          <ProgressRing done={progress.done} total={progress.total} complete={progress.allDone} />
          <div className="flex flex-col gap-1">
            <p className="text-heading font-bold text-text">{t('checklist.progress', { done: progress.done, total: progress.total })}</p>
            {progress.allDone ? (
              <p role="status" className="flex items-center gap-1 text-body text-success">
                <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
                {t('checklist.allDone')}
              </p>
            ) : null}
          </div>
        </Card>
        {notice ? (
          <Banner variant={notice.variant} action={notice.retry ? { label: t('common.tryAgain'), onClick: notice.retry } : undefined}>
            {notice.text}
          </Banner>
        ) : null}
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              ticked={ticked.has(item.id)}
              saving={saving.includes(item.id)}
              actionsDisabled={!online || deleting === item.id}
              onToggle={(i) => void onToggle(i, ticked.has(i.id))}
              onEdit={(i) => {
                setNotice(null);
                setSheet({ mode: 'edit', item: i });
              }}
              onDelete={(i) => void onDelete(i)}
            />
          ))}
        </ul>
        <Button variant="secondary" disabled={!online} onClick={() => onAdd(customItems.length)}>
          <Plus className="size-5" aria-hidden="true" />
          {t('checklist.addItem')}
        </Button>
        <p className="text-small text-text-secondary">{t('checklist.note')}</p>
        {sheet ? (
          <CustomItemSheet
            key={sheet.mode === 'edit' ? sheet.item.id : 'new'}
            item={sheet.mode === 'edit' ? sheet.item : undefined}
            existingNames={customItems.map((item) => item.name)}
            onClose={() => setSheet(null)}
            onSaved={onSaved}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-title font-bold text-text">{t('checklist.title')}</h1>
        {loadedDate ? <p className="text-small text-text-secondary">{formatWeekday(loadedDate)}</p> : null}
      </div>
      {body}
      {toast ? <Toast key={toast.id} message={toast.message} variant={toast.variant} onDone={() => setToast(null)} /> : null}
    </div>
  );
}
