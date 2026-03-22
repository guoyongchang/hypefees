import { useState, useEffect } from 'react';
import { useLang, t } from '../lib/i18n';
import { track, Events } from '../lib/analytics';

const DISMISS_KEY = 'wallet-banner-dismissed';

function shouldShowBanner(): boolean {
  if (typeof window === 'undefined') return false;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) return false;
  if ((window as any).ethereum) return false;
  if (sessionStorage.getItem(DISMISS_KEY)) return false;
  return true;
}

export default function MobileWalletBanner() {
  const [lang] = useLang();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shouldShowBanner()) {
      setVisible(true);
      track(Events.MOBILE_BANNER_SHOWN);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
    track(Events.MOBILE_BANNER_DISMISSED);
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      track(Events.MOBILE_BANNER_COPY_URL);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }

  if (!visible) return null;

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        color: 'var(--color-text-secondary)',
        animation: 'mwb-slide-down 0.25s ease-out',
      }}
    >
      {/* Wallet icon */}
      <span style={{ fontSize: 16, flexShrink: 0 }}>🔗</span>

      {/* Message */}
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        {t('banner.openInWallet', lang)}
      </span>

      {/* Copy URL button */}
      <button
        onClick={copyUrl}
        style={{
          flexShrink: 0,
          padding: '5px 12px',
          borderRadius: 8,
          background: copied ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
          color: copied ? '#0a0a0a' : 'var(--color-text)',
          fontSize: 12,
          fontWeight: 600,
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
      >
        {copied ? `✓ ${t('banner.copied', lang)}` : t('banner.copyUrl', lang)}
      </button>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Close"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          fontSize: 16,
          lineHeight: 1,
          cursor: 'pointer',
          padding: 4,
        }}
      >
        ✕
      </button>

      <style>{`
        @keyframes mwb-slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}
