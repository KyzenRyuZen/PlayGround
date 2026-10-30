// Google Play billing configuration.
//
// The client never fabricates a purchase. It opens the Play billing flow,
// forwards the resulting purchase token to YOUR verification service, and only
// credits the account after that service confirms the purchase with Google.
//
// Set these at build time:
//   VITE_IAP_VERIFY_URL=https://api.yourdomain.com/iap/google/verify
//   VITE_IAP_RESTORE_URL=https://api.yourdomain.com/iap/google/restore
//   VITE_ANDROID_PACKAGE=com.aetherfall.idle
//
// See docs/GOOGLE_PLAY_IAP.md and server/iap-verifier.mjs for the server side.

export const IAP_CONFIG = {
  verifyUrl: (import.meta.env.VITE_IAP_VERIFY_URL as string | undefined) ?? '',
  restoreUrl: (import.meta.env.VITE_IAP_RESTORE_URL as string | undefined) ?? '',
  packageName: (import.meta.env.VITE_ANDROID_PACKAGE as string | undefined) ?? 'com.aetherfall.idle',
  digitalGoodsService: 'https://play.google.com/billing',
  /** Google Play product type for consumable coin packs. */
  coinProductType: 'consumable' as const,
  /** Currency used only for local display if Play does not return a price. */
  displayCurrency: 'EUR',
}

export function isBillingConfigured(): boolean {
  return Boolean(IAP_CONFIG.verifyUrl)
}

export function formatEur(price: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(price)
}
