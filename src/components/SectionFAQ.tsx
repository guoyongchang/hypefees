import { useLang, t } from '../lib/i18n';

const FAQ_COUNT = 9;

export default function SectionFAQ() {
  const [lang] = useLang();
  return (
    <>
      {Array.from({ length: FAQ_COUNT }, (_, i) => {
        const n = i + 1;
        return (
          <details
            key={n}
            className="group border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)]"
          >
            <summary className="px-5 py-4 cursor-pointer font-medium hover:text-[var(--color-accent)]">
              {t(`faq.q${n}`, lang)}
            </summary>
            <div
              className="px-5 pb-4 text-[var(--color-text-secondary)] leading-relaxed"
              style={{ fontSize: 'var(--text-sm)' }}
            >
              {t(`faq.a${n}`, lang)}
            </div>
          </details>
        );
      })}
    </>
  );
}
