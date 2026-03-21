import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected, walletConnect } from 'wagmi/connectors';

// Hyperliquid uses a custom EIP-712 signing chain ID (0x66eee = 421614)
// This is NOT Arbitrum Sepolia — it's Hyperliquid's own signing identifier.
// We define a custom chain so wallets don't reject the signature due to chainId mismatch.
const WALLETCONNECT_PROJECT_ID = '2b94db6c6e635e7bebd0b4b52b2beb37';

export const HL_CHAIN_ID = 0x66eee; // 421614 — Hyperliquid signing chain ID

const hyperliquidSigningChain = defineChain({
  id: HL_CHAIN_ID,
  name: 'Hyperliquid',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
});

export const wagmiConfig = createConfig({
  chains: [hyperliquidSigningChain],
  connectors: [
    // injected() auto-detects: MetaMask, Phantom, Rabby, OneKey, OKX, Coinbase, etc.
    injected(),
    walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }),
  ],
  transports: {
    [hyperliquidSigningChain.id]: http(),
  },
});

// OneKey builder address (0% fee)
export const ONEKEY_BUILDER_ADDRESS = '0x9b12e858da780a96876e3018780cf0d83359b0bb' as const;
export const ONEKEY_REFERRAL_CODE = '1KREF';

// Hyperliquid EIP-712 domain and types
export const APPROVE_BUILDER_FEE_TYPES = {
  'HyperliquidTransaction:ApproveBuilderFee': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'maxFeeRate', type: 'string' },
    { name: 'builder', type: 'address' },
    { name: 'nonce', type: 'uint64' },
  ],
} as const;

export const SET_REFERRER_TYPES = {
  'HyperliquidTransaction:SetReferrer': [
    { name: 'hyperliquidChain', type: 'string' },
    { name: 'code', type: 'string' },
    { name: 'nonce', type: 'uint64' },
  ],
} as const;

export const EIP712_DOMAIN = {
  name: 'HyperliquidSignTransaction',
  version: '1',
  chainId: HL_CHAIN_ID,
  verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;

export function buildApproveBuilderFeeAction(builder: string, maxFeeRate: string) {
  const nonce = Date.now();
  return {
    action: {
      type: 'approveBuilderFee' as const,
      hyperliquidChain: 'Mainnet' as const,
      signatureChainId: `0x${HL_CHAIN_ID.toString(16)}`,
      maxFeeRate,
      builder,
      nonce,
    },
    message: {
      hyperliquidChain: 'Mainnet',
      maxFeeRate,
      builder: builder as `0x${string}`,
      nonce: BigInt(nonce),
    },
    nonce,
  };
}

export function buildSetReferrerAction(code: string) {
  const nonce = Date.now();
  return {
    action: {
      type: 'setReferrer' as const,
      hyperliquidChain: 'Mainnet' as const,
      signatureChainId: `0x${HL_CHAIN_ID.toString(16)}`,
      code,
      nonce,
    },
    message: {
      hyperliquidChain: 'Mainnet',
      code,
      nonce: BigInt(nonce),
    },
    nonce,
  };
}

const HL_EXCHANGE_API = 'https://api.hyperliquid.xyz/exchange';

export async function submitAction(
  action: Record<string, unknown>,
  signature: { r: string; s: string; v: number },
  nonce: number,
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(HL_EXCHANGE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      signature,
      nonce,
    }),
  });

  const data = await res.json();

  if (data.status === 'ok') return { success: true };

  const msg = typeof data.response === 'string' ? data.response : 'Transaction failed';
  return { success: false, error: msg };
}
