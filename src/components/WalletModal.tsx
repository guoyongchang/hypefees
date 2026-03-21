import { useState, useEffect } from 'react';
import { useConnect } from 'wagmi';
import { useLang, t } from '../lib/i18n';
import { track, Events } from '../lib/analytics';

// ── Wallet registry with deep links ──
const WALLETS = [
  {
    id: 'onekey',
    name: 'OneKey',
    icon: '/icons/onekey.jpg',
    // OneKey: universal link with dApp URL — opens in OneKey's built-in browser
    deepLink: (url: string) => `https://app.onekey.so/wc?uri=${encodeURIComponent(url)}`,
    mobileLink: (url: string) => `onekey-wallet://wc?uri=${encodeURIComponent(url)}`,
    desktopUrl: 'https://onekey.so/download',
    color: '#00B812',
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/icons/metamask.jpg',
    // MetaMask: official format per docs.metamask.io — link.metamask.io/dapp/{host}
    deepLink: (url: string) => `https://link.metamask.io/dapp/${url.replace(/^https?:\/\//, '')}`,
    mobileLink: (url: string) => `https://link.metamask.io/dapp/${url.replace(/^https?:\/\//, '')}`,
    desktopUrl: 'https://metamask.io/download/',
    color: '#F6851B',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '/icons/phantom.jpg',
    // Phantom: official browse deeplink per docs.phantom.com
    deepLink: (url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}`,
    mobileLink: (url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}`,
    desktopUrl: 'https://phantom.app/download',
    color: '#AB9FF2',
  },
  {
    id: 'rabby',
    name: 'Rabby',
    icon: '/icons/rabby.jpg',
    deepLink: () => '',
    mobileLink: () => '',
    desktopUrl: 'https://rabby.io/',
    color: '#7C82F2',
    desktopOnly: true,
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: '/icons/okx.svg',
    // OKX: this format works and carries the URL correctly
    deepLink: (url: string) => `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`,
    mobileLink: (url: string) => `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`,
    desktopUrl: 'https://www.okx.com/web3',
    color: '#000000',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '/icons/rainbow.png',
    // Rainbow: universal link format
    deepLink: (url: string) => `https://rnbwapp.com/1?url=${encodeURIComponent(url)}`,
    mobileLink: (url: string) => `https://rnbwapp.com/1?url=${encodeURIComponent(url)}`,
    desktopUrl: 'https://rainbow.me/',
    color: '#001AFF',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '/icons/trust.png',
    // Trust: official format per developer.trustwallet.com
    deepLink: (url: string) => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`,
    mobileLink: (url: string) => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`,
    desktopUrl: 'https://trustwallet.com/download',
    color: '#3375BB',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/icons/coinbase.png',
    // Coinbase: universal link format
    deepLink: (url: string) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
    mobileLink: (url: string) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
    desktopUrl: 'https://www.coinbase.com/wallet',
    color: '#0052FF',
  },
];

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function hasInjectedWallet(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum;
}

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export default function WalletModal({ open, onClose, onConnected }: WalletModalProps) {
  const [lang] = useLang();
  const { connect, connectors } = useConnect();
  const mobile = isMobile();
  const hasInjected = hasInjectedWallet();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://hypefees.com';

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      track(Events.WALLET_MODAL_OPENED, { device_type: mobile ? 'mobile' : 'desktop' });
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  function handleWalletClick(wallet: typeof WALLETS[0]) {
    track(Events.WALLET_SELECTED, { wallet_id: wallet.id, action: mobile ? 'deeplink' : (hasInjected ? 'connect' : 'install') });
    if (!mobile && hasInjected) {
      // Desktop with injected wallet — try direct connect
      const injected = connectors.find((c) => c.id === 'injected');
      if (injected) {
        connect({ connector: injected });
        onClose();
        onConnected?.();
        return;
      }
    }

    if (mobile) {
      // Mobile — try native app scheme first, fallback to universal link
      const nativeLink = wallet.mobileLink(currentUrl);
      const universalLink = wallet.deepLink(currentUrl);
      const link = nativeLink || universalLink;
      if (link) {
        window.location.href = link;
        return;
      }
    }

    // Desktop without injected wallet — open download page
    if (wallet.desktopUrl) {
      window.open(wallet.desktopUrl, '_blank');
    }
  }

  function handleWalletConnect() {
    track(Events.WALLET_SELECTED, { wallet_id: 'walletconnect', action: 'qr_scan' });
    const wc = connectors.find((c) => c.id === 'walletConnect');
    if (wc) {
      connect({ connector: wc });
      onClose();
      onConnected?.();
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80vh',
          overflowY: 'auto',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{t('wallet.title', lang)}</h3>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--color-bg-elevated)',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          {mobile ? t('wallet.mobileDesc', lang) : t('wallet.desktopDesc', lang)}
        </p>

        {/* Wallet list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WALLETS.map((wallet) => {
            if (wallet.desktopOnly && mobile) return null;
            return (
              <button
                key={wallet.id}
                onClick={() => handleWalletClick(wallet)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
              >
                {wallet.icon ? (
                  <img src={wallet.icon} alt="" width={36} height={36} style={{ borderRadius: 10, flexShrink: 0 }} loading="lazy" />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: wallet.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                    {wallet.name[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{wallet.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {mobile
                      ? (wallet.desktopOnly ? t('wallet.desktopOnly', lang) : t('wallet.openInApp', lang))
                      : (hasInjected ? t('wallet.connectNow', lang) : t('wallet.install', lang))
                    }
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* WalletConnect divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>WalletConnect</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        <button
          onClick={handleWalletConnect}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '1px solid var(--color-accent)',
            background: 'transparent',
            color: 'var(--color-accent)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="18" rx="3" />
            <path d="M8 7l4 4 4-4" />
          </svg>
          {t('wallet.scanQR', lang)}
        </button>

        {/* Safety note */}
        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
          {t('hero.safetyNote', lang)}
        </p>
      </div>
    </div>
  );
}
