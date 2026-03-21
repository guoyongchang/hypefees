# Hypefees

**See how much you're really paying to trade on Hyperliquid.**

Every time you trade on Hyperliquid through a third-party wallet — Phantom, MetaMask, Rabby, OKX, or any other — you pay a hidden builder fee on top of the exchange's base trading fee. These fees range from 0% to 0.10%, and most traders never notice them.

Hypefees makes these fees visible. Enter your address, see exactly how much you've paid, and switch to a cheaper builder in one click.

**Live at [hypefees.com](https://hypefees.com)**

## What Hypefees Does

### Check Your Fees
Enter any Ethereum address to get a full breakdown of trading fees paid on Hyperliquid — how much went to the exchange vs. how much went to your wallet's builder. See the total across your entire trade history.

### Compare All Builders
A sortable table of 240+ active builders with their fee rates, user counts, and volumes. Sorted by fee rate so you can instantly see who charges the most — and who charges nothing.

### Simulate Costs
Drag a slider to any trading volume ($10K to $100M) and see what you'd pay with each builder. Picks your VIP tier. Shows you the dollar difference.

### Switch in One Click
Connect your wallet, sign two gasless transactions, and you're on a 0% fee builder. No funds transferred, no risk — just a signature that tells Hyperliquid to stop charging you extra.

## Why This Matters

A 0.05% builder fee doesn't sound like much. But on $1M in volume, that's **$500** gone. On $10M, it's **$5,000**. Traders who do real volume are losing thousands of dollars to builder fees without realizing it.

Some builders charge 0%. The fee comparison is public. The only reason traders keep paying is that nobody told them.

## How It Works

- **Builder data** from [HyperTracker](https://app.coinmarketman.com/hypertracker/builders) (CoinMarketMan), cached and refreshed daily
- **Fee breakdowns** from Hyperliquid's public API (`userFillsByTime`) — no API key needed, all on-chain data
- **Builder switching** via Hyperliquid's `approveBuilderFee` action — an EIP-712 signature, no gas, no fund transfers
- **Hosted on Cloudflare** — Pages for the frontend, Workers for the API proxy, KV for caching

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro + React |
| Styling | Tailwind CSS v4 |
| Font | Roobert (variable, self-hosted) |
| Wallet | wagmi + viem + WalletConnect v2 |
| Hosting | Cloudflare Pages + Workers |
| Cache | Cloudflare KV (24h TTL) |
| Data | CoinMarketMan API + Hyperliquid API |

## Development

```bash
# Install
npm install

# Run locally
npm run dev

# Build
npm run build

# Deploy to Cloudflare
npx wrangler deploy
```

Create a `.dev.vars` file for local development:

```
CMM_API_KEY=your_coinmarketman_api_key
```

Get a free API key at [CoinMarketMan](https://app.coinmarketman.com).

## Project Structure

```
src/
  components/
    AddressLookup.tsx    # Fee breakdown by address
    BuilderTable.tsx     # Sortable builder comparison
    FeeSimulator.tsx     # Volume-based fee calculator
    SwitchBuilder.tsx    # Wallet connect + builder switch
  lib/
    api.ts               # Hyperliquid API client
    fees.ts              # Fee calculation logic
    wallet.ts            # EIP-712 signing for builder switch
  pages/
    index.astro          # Single page
    api/builders.ts      # API proxy with KV caching
  data/
    builders-cache.json  # Offline fallback data
```

## Contributing

Issues and PRs welcome. If you find a builder with incorrect data, open an issue.

## License

MIT
