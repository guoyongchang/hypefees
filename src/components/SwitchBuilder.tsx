import { useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSignTypedData, useSwitchChain } from 'wagmi';
import WalletProvider from './WalletProvider';
import { useLang, t } from '../lib/i18n';
import {
  ONEKEY_BUILDER_ADDRESS,
  ONEKEY_REFERRAL_CODE,
  HL_CHAIN_ID,
  EIP712_DOMAIN,
  APPROVE_BUILDER_FEE_TYPES,
  SET_REFERRER_TYPES,
  buildApproveBuilderFeeAction,
  buildSetReferrerAction,
  submitAction,
} from '../lib/wallet';

type Step = 'idle' | 'approving' | 'setting-referrer' | 'done' | 'error';

function SwitchBuilderInner() {
  const [lang] = useLang();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();

  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);

  const handleConnect = useCallback(() => {
    // Prefer injected (browser wallet) first
    const injectedConnector = connectors.find((c) => c.id === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  const handleApproveBuilder = useCallback(async () => {
    if (!isConnected) return;
    setStep('approving');
    setError(null);

    try {
      // Ensure wallet is on Arbitrum (chainId must match EIP-712 domain)
      if (chain?.id !== HL_CHAIN_ID) {
        try { await switchChainAsync({ chainId: HL_CHAIN_ID }); } catch {}
      }

      const { action, message, nonce } = buildApproveBuilderFeeAction(ONEKEY_BUILDER_ADDRESS, '0.01%');

      const sig = await signTypedDataAsync({
        domain: EIP712_DOMAIN,
        types: APPROVE_BUILDER_FEE_TYPES,
        primaryType: 'HyperliquidTransaction:ApproveBuilderFee',
        message,
      });

      const r = '0x' + sig.slice(2, 66);
      const s = '0x' + sig.slice(66, 130);
      const v = parseInt(sig.slice(130, 132), 16);

      const result = await submitAction(action, { r, s, v }, nonce);
      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      setApproveSuccess(true);
      await handleSetReferrer();
    } catch (err: any) {
      const msg = err?.message || err?.shortMessage || '';
      if (msg.includes('User rejected') || msg.includes('denied') || msg.includes('cancelled')) {
        setStep('idle');
        return;
      }
      setError(msg || 'Failed to approve builder');
      setStep('error');
    }
  }, [isConnected, chain, signTypedDataAsync, switchChainAsync]);

  const handleSetReferrer = useCallback(async () => {
    setStep('setting-referrer');

    try {
      const { action, message, nonce } = buildSetReferrerAction(ONEKEY_REFERRAL_CODE);

      const sig = await signTypedDataAsync({
        domain: EIP712_DOMAIN,
        types: SET_REFERRER_TYPES,
        primaryType: 'HyperliquidTransaction:SetReferrer',
        message,
      });

      const r = '0x' + sig.slice(2, 66);
      const s = '0x' + sig.slice(66, 130);
      const v = parseInt(sig.slice(130, 132), 16);

      const result = await submitAction(action, { r, s, v }, nonce);
      if (!result.success) {
        console.warn('setReferrer:', result.error);
      }

      setReferralSuccess(true);
      setStep('done');
    } catch (err: any) {
      setReferralSuccess(false);
      setStep('done');
    }
  }, [signTypedDataAsync]);

  // Success state
  if (step === 'done') {
    return (
      <div className="rounded-2xl overflow-hidden bg-[var(--color-switch-bg)] p-8 md:p-12">
        <div className="flex items-start gap-4">
          <div className="mt-1 text-[var(--color-switch-accent)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-switch-accent)]">{t('switch.success', lang)}</h2>
            <p className="text-[var(--color-switch-muted)] mt-2">
              {t('switch.approvalConfirmed', lang)}{referralSuccess ? t('switch.referralApplied', lang) : ''}.
              {t('switch.futureTradesSub', lang)}
            </p>
            <button
              onClick={() => { disconnect(); setStep('idle'); setApproveSuccess(false); setReferralSuccess(false); }}
              className="mt-4 text-sm text-[var(--color-switch-dim)] hover:text-[var(--color-switch-muted)] transition-colors"
            >
              {t('switch.disconnect', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--color-switch-bg)] p-8 md:p-12">
      <div className="max-w-2xl">
        <h2 className="text-xl md:text-2xl font-bold text-[var(--color-switch-accent)]">{t('switch.title', lang)}</h2>
        <p className="text-[var(--color-switch-muted)] mt-2 leading-relaxed">
          {t('switch.subtitle', lang)}
        </p>

        <div className="mt-6">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-switch-accent)] text-[#0a2e2a] font-semibold hover:opacity-90 transition-colors min-h-[44px]"
            >
              {t('switch.connectWallet', lang)}
            </button>
          ) : (
            <div className="space-y-4">
              {/* Connected state */}
              <div className="flex items-center gap-3 text-sm text-[var(--color-switch-muted)]">
                <div className="w-2 h-2 rounded-full bg-[var(--color-switch-accent)]" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
                <button
                  onClick={() => disconnect()}
                  className="text-xs text-[var(--color-switch-dim)] hover:text-[var(--color-switch-muted)] transition-colors ml-2"
                >
                  {t('switch.disconnect', lang)}
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    approveSuccess ? 'bg-[var(--color-switch-accent)] text-[#0a2e2a]' : 'border border-[#5ef0d0] text-[var(--color-switch-accent)]'
                  }`}>
                    {approveSuccess ? '✓' : '1'}
                  </div>
                  <span className="text-[var(--color-switch-text)] text-sm">{t('switch.approve', lang)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    referralSuccess ? 'bg-[var(--color-switch-accent)] text-[#0a2e2a]' : 'border border-[#5a756b] text-[var(--color-switch-dim)]'
                  }`}>
                    {referralSuccess ? '✓' : '2'}
                  </div>
                  <span className="text-[var(--color-switch-muted)] text-sm">{t('switch.referral', lang)}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleApproveBuilder}
                disabled={step === 'approving' || step === 'setting-referrer'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-switch-accent)] text-[#0a2e2a] font-semibold hover:opacity-90 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {step === 'approving'
                  ? t('switch.waitingSignature', lang)
                  : step === 'setting-referrer'
                    ? t('switch.settingReferral', lang)
                    : t('switch.switchBtn', lang)}
                {step === 'idle' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              <p className="text-xs text-[var(--color-switch-dim)]">
                {t('switch.twoSignatures', lang)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper with providers
export default function SwitchBuilder() {
  return (
    <WalletProvider>
      <SwitchBuilderInner />
    </WalletProvider>
  );
}
