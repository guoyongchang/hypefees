import { useLang, t } from '../lib/i18n';

export default function SectionAbout() {
  const [lang] = useLang();
  return (
    <div className="space-y-3 text-[var(--color-text-secondary)] leading-relaxed" style={{ fontSize: 'var(--text-sm)' }}>
      <p dangerouslySetInnerHTML={{ __html: t('about.p1', lang) }} />
      <p dangerouslySetInnerHTML={{ __html: t('about.p2', lang) }} />
      <p>{t('about.p3', lang)}</p>
    </div>
  );
}
