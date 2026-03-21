import { useState, useEffect, useRef } from 'react';
import { LANGUAGES, type Lang, useLang } from '../lib/i18n';

const LANG_LIST = Object.entries(LANGUAGES) as [Lang, string][];

export default function LanguageSwitcher() {
  const [lang, setLang] = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function select(l: Lang) {
    setLang(l);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 min-h-[44px] rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        aria-label="Switch language"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-xs font-medium hidden sm:inline">{LANGUAGES[lang]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg overflow-hidden z-50">
          {LANG_LIST.map(([code, name]) => (
            <button
              key={code}
              onClick={() => select(code)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center justify-between ${
                code === lang ? 'text-[var(--color-accent)] font-medium' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {name}
              {code === lang && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
