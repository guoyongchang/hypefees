import { useState, useEffect } from 'react';
import { useLang, t } from '../lib/i18n';

const DISMISS_KEY = 'wallet-banner-dismissed';

function shouldShowBanner(): boolean {
  if (typeof window === 'undefined') return false;
  // Must be mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) return false;
  // Must NOT have injected wallet
  if ((window as any).ethereum) return false;
  // Must not have been dismissed this session
  if (sessionStorage.getItem(DISMISS_KEY)) return false;
  return true;
}

export default function MobileWalletBanner() {
  const [lang] = useLang();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shouldShowBanner()) setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }

  if (!visible) return null;

  return (
    <div
      className="mobile-wallet-banner"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: 'calc(100% + 2rem)',
        zIndex: 9998,
        background: '#1a1a2e',
        color: '#fff',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        animation: 'mwb-slide-down 0.3s ease-out',
        margin: '0 -1rem',
      }}
    >
      <span style={{ flex: 1, lineHeight: 1.35 }}>
        {t('banner.openInWallet', lang)}
      </span>

      <button
        onClick={copyUrl}
        style={{
          flexShrink: 0,
          padding: '4px 10px',
          borderRadius: '999px',
          background: 'var(--color-accent, #6c5ce7)',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? t('banner.copied', lang) : t('banner.copyUrl', lang)}
      </button>

      <button
        onClick={dismiss}
        aria-label="Close"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '18px',
          lineHeight: 1,
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.7,
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
