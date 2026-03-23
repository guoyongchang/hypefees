// Hyperliquid base exchange fees by VIP tier
// Source: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees
export const VIP_TIERS = [
  { tier: 0, label: 'VIP 0', minVolume: 0, takerFee: 0.00045, makerFee: 0.00015 },
  { tier: 1, label: 'VIP 1', minVolume: 5_000_000, takerFee: 0.00040, makerFee: 0.00012 },
  { tier: 2, label: 'VIP 2', minVolume: 25_000_000, takerFee: 0.00035, makerFee: 0.00008 },
  { tier: 3, label: 'VIP 3', minVolume: 100_000_000, takerFee: 0.00030, makerFee: 0.00004 },
  { tier: 4, label: 'VIP 4', minVolume: 500_000_000, takerFee: 0.00028, makerFee: 0 },
  { tier: 5, label: 'VIP 5', minVolume: 2_000_000_000, takerFee: 0.00026, makerFee: 0 },
  { tier: 6, label: 'VIP 6', minVolume: 7_000_000_000, takerFee: 0.00024, makerFee: 0 },
] as const;

export type VipTier = (typeof VIP_TIERS)[number];

// HYPE staking tiers — discount applied on top of VIP tier fees
export const STAKING_TIERS = [
  { name: 'None',     minStake: 0,       discount: 0 },
  { name: 'Wood',     minStake: 10,      discount: 0.05 },
  { name: 'Bronze',   minStake: 100,     discount: 0.10 },
  { name: 'Silver',   minStake: 1_000,   discount: 0.15 },
  { name: 'Gold',     minStake: 10_000,  discount: 0.20 },
  { name: 'Platinum', minStake: 100_000, discount: 0.30 },
  { name: 'Diamond',  minStake: 500_000, discount: 0.40 },
] as const;

export type StakingTier = (typeof STAKING_TIERS)[number];

export interface Builder {
  refCode: string | null;
  address: string;
  usageFee: number; // e.g. 0.0005 = 0.05%
  users: number;
  volume: number;
  revenue: number;
  timeJoined?: string;
}

export function formatFeePercent(fee: number): string {
  return `${(fee * 100).toFixed(3)}%`;
}

export function formatFeeRate(fee: number): string {
  const bps = fee * 10000;
  if (bps >= 1) return `${bps.toFixed(1)} bps`;
  return `${(fee * 100).toFixed(4)}%`;
}

export function totalTakerFee(builderFee: number, vipTier: number = 0): number {
  const tier = VIP_TIERS[vipTier] ?? VIP_TIERS[0];
  return tier.takerFee + builderFee;
}

export function totalMakerFee(builderFee: number, vipTier: number = 0): number {
  const tier = VIP_TIERS[vipTier] ?? VIP_TIERS[0];
  return tier.makerFee + builderFee;
}

export function calculateFees(
  volume: number,
  builderFee: number,
  vipTier: number = 0,
  takerRatio: number = 0.7, // assume 70% taker, 30% maker
): { total: number; hlFee: number; builderTotal: number } {
  const tier = VIP_TIERS[vipTier] ?? VIP_TIERS[0];
  const takerVolume = volume * takerRatio;
  const makerVolume = volume * (1 - takerRatio);

  const hlFee = takerVolume * tier.takerFee + makerVolume * tier.makerFee;
  const builderTotal = volume * builderFee;
  const total = hlFee + builderTotal;

  return { total, hlFee, builderTotal };
}

export function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
