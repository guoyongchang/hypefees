// Mixpanel analytics wrapper for HypeFees
// Token will be set after creating the Mixpanel project

const MIXPANEL_TOKEN = '61e3f170295a9a4135e64a3e651e53a1';

// ── Event Names ──
export const Events = {
  // Core conversion funnel
  PAGE_VIEW: 'Page View',
  FEE_LOOKUP_STARTED: 'Fee Lookup Started',
  FEE_LOOKUP_SUCCESS: 'Fee Lookup Success',
  FEE_LOOKUP_ERROR: 'Fee Lookup Error',
  WALLET_CONNECTED: 'Wallet Connected',
  BUILDER_APPROVAL_STARTED: 'Builder Approval Started',
  BUILDER_APPROVAL_SUCCESS: 'Builder Approval Success',
  BUILDER_APPROVAL_ERROR: 'Builder Approval Error',
  REFERRAL_SET_SUCCESS: 'Referral Set Success',
  REFERRAL_SET_FAILED: 'Referral Set Failed',

  // Engagement
  SHARE_CARD_OPENED: 'Share Card Opened',
  SHARE_CARD_DOWNLOADED: 'Share Card Downloaded',
  BUILDER_TABLE_SEARCHED: 'Builder Table Searched',
  BUILDER_TABLE_SORTED: 'Builder Table Sorted',
  BUILDER_TABLE_VIEW_CHANGED: 'Builder Table View Changed',
  FEE_CALCULATOR_USED: 'Fee Calculator Used',
  WALLET_MODAL_OPENED: 'Wallet Modal Opened',
  WALLET_SELECTED: 'Wallet Selected',
  LANGUAGE_CHANGED: 'Language Changed',
} as const;

// ── SSR-safe Mixpanel access ──
function getMixpanel(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).mixpanel;
}

function isReady(): boolean {
  const mp = getMixpanel();
  return mp && typeof mp.track === 'function';
}

// ── Device type detection ──
export function getDeviceType(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

// ── Track event ──
export function track(event: string, props?: Record<string, any>): void {
  if (!isReady()) return;
  const mp = getMixpanel();
  mp.track(event, {
    ...props,
    device_type: getDeviceType(),
  });
}

// ── Identify user (by address hash for privacy) ──
export function identify(address: string): void {
  if (!isReady() || !address) return;
  const mp = getMixpanel();
  // Use a simple hash of the address as distinct_id (privacy)
  const id = `hl_${address.toLowerCase().slice(2, 10)}`;
  mp.identify(id);
}

// ── Set user properties ──
export function setUserProps(props: Record<string, any>): void {
  if (!isReady()) return;
  const mp = getMixpanel();
  mp.people.set(props);
}

// ── Track page view (call once on mount) ──
export function trackPageView(): void {
  track(Events.PAGE_VIEW, {
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
  });
}

// ── Initialize Mixpanel (called from layout) ──
export function initMixpanel(): void {
  if (typeof window === 'undefined' || !MIXPANEL_TOKEN) return;
  const mp = getMixpanel();
  if (mp && typeof mp.init === 'function') {
    mp.init(MIXPANEL_TOKEN, {
      track_pageview: false, // We track manually
      persistence: 'localStorage',
    });
  }
}
