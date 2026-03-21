import { useLang, t } from '../lib/i18n';

export default function TranslatedText({ k, tag = 'span', className }: { k: string; tag?: string; className?: string }) {
  const [lang] = useLang();
  const Tag = tag as any;
  return <Tag className={className}>{t(k, lang)}</Tag>;
}
