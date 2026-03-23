import { useLang, t } from '../lib/i18n';

const VIP_TIERS = [
  { tier: 'VIP 0', volume: '< $5M',       taker: '0.045%', maker: '0.015%' },
  { tier: 'VIP 1', volume: '$5M\u2013$25M',    taker: '0.040%', maker: '0.012%' },
  { tier: 'VIP 2', volume: '$25M\u2013$100M',   taker: '0.035%', maker: '0.008%' },
  { tier: 'VIP 3', volume: '$100M\u2013$500M',  taker: '0.030%', maker: '0.004%' },
  { tier: 'VIP 4', volume: '$500M\u2013$2B',    taker: '0.028%', maker: '0.000%' },
  { tier: 'VIP 5', volume: '$2B\u2013$7B',      taker: '0.026%', maker: '0.000%' },
  { tier: 'VIP 6', volume: '> $7B',        taker: '0.024%', maker: '0.000%' },
];

export default function SectionHowItWorks() {
  const [lang] = useLang();
  return (
    <div className="space-y-3 text-[var(--color-text-secondary)] leading-relaxed" style={{ fontSize: 'var(--text-sm)' }}>
      <p>{t('how.p1', lang)}</p>

      <h3 className="pt-4 text-[var(--color-text)]">{t('how.vipTitle', lang)}</h3>
      <div className="overflow-x-auto mt-3">
        <table className="w-full border border-[var(--color-border)] rounded-lg overflow-hidden" style={{ fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr className="bg-[var(--color-bg-secondary)]">
              <th className="text-left px-3 py-2.5 font-medium">{t('how.tier', lang)}</th>
              <th className="text-left px-3 py-2.5 font-medium">{t('how.14dVolume', lang)}</th>
              <th className="text-left px-3 py-2.5 font-medium">{t('how.taker', lang)}</th>
              <th className="text-left px-3 py-2.5 font-medium">{t('how.maker', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {VIP_TIERS.map((row) => (
              <tr key={row.tier}>
                <td className="px-3 py-2">{row.tier}</td>
                <td className="px-3 py-2">{row.volume}</td>
                <td className="px-3 py-2">{row.taker}</td>
                <td className="px-3 py-2">{row.maker}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3">{t('how.p2', lang)}</p>

      <h3 className="pt-4 text-[var(--color-text)]">{t('how.switchTitle', lang)}</h3>
      <p dangerouslySetInnerHTML={{ __html: t('how.switchP', lang) }} />
    </div>
  );
}
