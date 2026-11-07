import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { chooseLanguage } from '../i18n';
import { enabledLanguages, findLanguage, type LanguageCode } from '../i18n/languages';

type LanguageSelectorProps = {
  /** Languages offered in the menu; defaults to the reviewed ones (BR21). */
  languages?: LanguageCode[];
};

/** Globe + "EN"/"ZU"/"TN"; a small menu of the enabled languages; applies at once (PRD 8.3, BR17). */
export function LanguageSelector({ languages = enabledLanguages }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = findLanguage(i18n.language);

  useEffect(() => {
    if (open) itemRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  function openMenu() {
    setFocusIndex(Math.max(0, languages.indexOf(current.code)));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  async function select(code: LanguageCode) {
    await chooseLanguage(code);
    close();
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusIndex((index) => (index + 1) % languages.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusIndex((index) => (index - 1 + languages.length) % languages.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setFocusIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setFocusIndex(languages.length - 1);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="focus-ring inline-flex min-h-touch min-w-touch items-center justify-center gap-1 rounded-button px-1 text-small font-semibold text-text hover:bg-background"
      >
        <Globe className="size-4 text-text-secondary" aria-hidden="true" />
        <span className="sr-only">{t('header.language')}</span>
        <span>{current.short}</span>
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-label={t('header.language')}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-30 mt-1 min-w-40 rounded-card bg-card py-1 shadow-card"
        >
          {languages.map((code, index) => {
            const language = findLanguage(code);
            const selected = language.code === current.code;
            return (
              <li key={code} role="none">
                <button
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  tabIndex={index === focusIndex ? 0 : -1}
                  onClick={() => void select(code)}
                  className={[
                    'focus-ring flex min-h-touch w-full items-center px-4 text-left text-body hover:bg-primary-tint',
                    selected ? 'font-semibold text-primary-dark' : 'text-text',
                  ].join(' ')}
                >
                  {language.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
