# HypeFees

**Compare Hyperliquid builder fees, check your spending, switch to save.**

Every time you trade on Hyperliquid through a third-party wallet, you pay a hidden builder fee on top of the exchange's base trading fee. Most traders never notice, but the costs add up fast. HypeFees makes these fees visible so you can make informed decisions.

**Live at [hypefees.com](https://hypefees.com)**

<!-- TODO: Add screenshot / Open Graph image -->

---

## Features

- **Address fee lookup** — Enter any ETH address to get a full breakdown of trading history on Hyperliquid: total volume, exchange fees vs. builder fees, trade count, and date range. Fetches complete trade history via paginated API calls.

- **Builder comparison table** — Sortable table of 240+ active builders with fee rates, user counts, volume, and revenue. Curated featured view with platform support badges (iOS, Android, Desktop, Extension, Web) and hardware wallet compatibility. Search and filter across all builders.

- **Fee calculator** — Drag a slider from $10K to $100M in volume to compare costs across builders. Supports all 7 VIP tiers and 7 HYPE staking discount tiers for accurate fee simulation.

- **One-click builder switch** — Connect your wallet, sign two gasless EIP-712 transactions (approve builder fee + set referrer), and switch to a 0% fee builder. No gas, no fund transfers, just signatures.

- **Shareable Wrapped-style brag card** — After looking up your address, generate a personalized share card with your trading stats, percentile rank, fun facts, and a narrative title. Bento grid layout, renders to a 2x resolution canvas image optimized for Twitter/X sharing.

- **Live fee counter** — Real-time ticking counter showing total builder fees collected across all Hyperliquid builders, estimated from historical revenue data.

- **10-language i18n** — Full internationalization: English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian, and Turkish. Auto-detects browser language with cookie persistence.

- **Light and dark theme** — System-aware theme with manual toggle and localStorage persistence. No flash on load.

- **Mobile responsive** — Fully responsive design with touch-friendly 44px minimum tap targets throughout.

- **Animated hero visualization** — Canvas-based particle animation showing fee flows across popular builders, rendered at the top of the page.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 6](https://astro.build) + [React 19](https://react.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Fonts | Roobert (variable, self-hosted), DM Sans, JetBrains Mono (Google Fonts) |
| Wallet | [wagmi 3](https://wagmi.sh) + [viem 2](https://viem.sh) + [WalletConnect (Reown AppKit)](https://reown.com) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) + Workers |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (builder data) |
| Cache | [Cloudflare KV](https://developers.cloudflare.com/kv/) (1-hour TTL) |
| Data | [CoinMarketMan HyperTracker API](https://app.coinmarketman.com/hypertracker/builders) + [Hyperliquid Public API](https://hyperliquid.gitbook.io/hyperliquid-docs) |

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- A [CoinMarketMan](https://app.coinmarketman.com) API key (free)

### Install and Run

```bash
# Clone the repository
git clone https://github.com/nicholasgasior/hypefees.git
cd hypefees

# Install dependencies
npm install

# Run local dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare
npx wrangler deploy
```

### Environment Variables

Create a `.dev.vars` file in the project root for local development:

```
CMM_API_KEY=your_coinmarketman_api_key
```

Get a free API key at [CoinMarketMan](https://app.coinmarketman.com).

In production, this is set as a Cloudflare Workers secret.

## Project Structure

```
src/
  components/
    HeroSection.tsx        # Address lookup input + results display
    HeroFlow.tsx           # Canvas particle animation (fee flow visualization)
    ShareCard.tsx          # Wrapped-style brag card with canvas export
    BuilderTable.tsx       # Sortable builder comparison with curation + platform badges
    FeeSimulator.tsx       # Volume slider calculator with VIP + staking tiers
    SwitchBuilder.tsx      # Wallet connect + EIP-712 builder switch
    FeeCounter.tsx         # Live ticking total fee counter
    SectionAbout.tsx       # "What are builder fees" explainer
    SectionHowItWorks.tsx  # How builder fees work
    SectionFAQ.tsx         # FAQ accordion
    LanguageSwitcher.tsx   # 10-language dropdown
    ThemeToggle.tsx        # Light/dark theme toggle
    TranslatedText.tsx     # i18n text rendering helper
    WalletProvider.tsx     # wagmi + WalletConnect provider
    ScrollReveal.astro     # Intersection Observer scroll animations
  lib/
    api.ts                 # Hyperliquid API client (paginated fill fetching)
    fees.ts                # Fee calculation logic, VIP tiers, staking tiers
    i18n.ts                # Translation system (10 languages, ~200 keys)
    wallet.ts              # wagmi config, EIP-712 types, builder switch actions
  pages/
    index.astro            # Single-page layout
    api/builders.ts        # Builder data API (D1 -> KV cache -> local fallback)
  data/
    builders-cache.json    # Offline fallback builder data
    curated-builders.json  # Curated builder metadata (platforms, types, URLs)
    builder-icons.json     # Builder icon/logo URLs
  layouts/
    Layout.astro           # Base HTML layout with OG tags, fonts, theme init
  styles/
    global.css             # CSS custom properties, theme variables
```

## Data Sources

| Source | What | How |
|---|---|---|
| **Hyperliquid Public API** | User trade history (`userFillsByTime`), fee data | Direct POST requests, no API key, all on-chain data |
| **CoinMarketMan HyperTracker** | Builder list with fee rates, user counts, volumes | API proxy through Cloudflare Worker, cached in D1 + KV |
| **Cloudflare D1** | Builder data (source of truth) | Populated from CoinMarketMan, queried by the `/api/builders` endpoint |
| **Cloudflare KV** | Builder data cache (1-hour TTL) | Reduces D1 read load |
| **Local JSON** | `builders-cache.json` fallback | Used when D1 and KV are unavailable (local dev) |

## How Builder Switching Works

1. User connects their wallet (injected or WalletConnect)
2. Wallet is switched to Arbitrum chain (chainId 42161) if needed
3. User signs an `ApproveBuilderFee` EIP-712 typed data message (sets builder fee to 0%)
4. User signs a `SetReferrer` EIP-712 typed data message (sets referral code)
5. Both signatures are submitted to Hyperliquid's exchange API
6. No gas is spent, no funds are transferred — only signatures

## Contributing

Issues and PRs welcome. If you find a builder with incorrect data, please open an issue.

## License

[MIT](LICENSE)

## Disclaimer

HypeFees is an informational tool. Nothing on this site constitutes financial advice. Builder fee data is sourced from public APIs and may not always be current. Always verify fee rates independently before making trading decisions. Use at your own risk.
