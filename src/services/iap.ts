import type { ShopProduct } from '../game/types'
import { IAP_CONFIG, isBillingConfigured } from '../config/iap'

/**
 * Google Play billing bridge (Digital Goods API inside a Trusted Web Activity
 * or Play-Billing-wrapper).
 *
 * HARD RULE: this module never simulates a payment, never grants currency on
 * its own, and never trusts a client-side success flag. Coins are credited only
 * from the signed verification response of the server in `server/iap-verifier.mjs`.
 */

type DigitalGoodsService = {
  getDetails: (itemIds: string[]) => Promise<
    Array<{
      itemId: string
      title: string
      description: string
      price: { value: string; currency: string }
    }>
  >
  listPurchases: () => Promise<Array<{ itemId: string; purchaseToken: string }>>
  consume: (purchaseToken: string) => Promise<void>
}

export interface VerifiedPurchase {
  ok: true
  productId: string
  coins: number
  transactionId: string
}

export class BillingUnavailableError extends Error {
  code: 'not-configured' | 'no-service' | 'no-payment-request' | 'cancelled' | 'product-missing'
  constructor(code: BillingUnavailableError['code'], message: string) {
    super(message)
    this.name = 'BillingUnavailableError'
    this.code = code
  }
}

export class VerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VerificationError'
  }
}

function getWindow(): Window & {
  getDigitalGoodsService?: (serviceId: string) => Promise<DigitalGoodsService>
  PaymentRequest?: typeof PaymentRequest
} {
  return window as unknown as Window & {
    getDigitalGoodsService?: (serviceId: string) => Promise<DigitalGoodsService>
    PaymentRequest?: typeof PaymentRequest
  }
}

export function billingAvailable(): boolean {
  const w = getWindow()
  return isBillingConfigured() && typeof w.getDigitalGoodsService === 'function' && typeof w.PaymentRequest === 'function'
}

async function requireService(): Promise<DigitalGoodsService> {
  if (!isBillingConfigured()) {
    throw new BillingUnavailableError(
      'not-configured',
      'Purchases are not connected to a verification server in this build. No payment was attempted.',
    )
  }
  const w = getWindow()
  if (typeof w.getDigitalGoodsService !== 'function') {
    throw new BillingUnavailableError(
      'no-service',
      'Google Play billing is only available in the Android app distributed through Google Play. No payment was attempted.',
    )
  }
  const service = await w.getDigitalGoodsService(IAP_CONFIG.digitalGoodsService)
  if (!service) {
    throw new BillingUnavailableError('no-service', 'Google Play billing is unavailable on this device.')
  }
  return service
}

export async function loadLocalizedPrices(
  packageProducts: ShopProduct[],
): Promise<Record<string, string>> {
  try {
    const service = await requireService()
    const details = await service.getDetails(packageProducts.map((p) => p.productId))
    const out: Record<string, string> = {}
    for (const detail of details) {
      try {
        out[detail.itemId] = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: detail.price.currency,
        }).format(Number(detail.price.value))
      } catch {
        out[detail.itemId] = detail.price.value
      }
    }
    return out
  } catch {
    return {}
  }
}

async function verifyWithServer(productId: string, purchaseToken: string): Promise<VerifiedPurchase> {
  if (!IAP_CONFIG.verifyUrl) throw new VerificationError('No verification endpoint configured.')
  const response = await fetch(IAP_CONFIG.verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageName: IAP_CONFIG.packageName,
      productId,
      purchaseToken,
      productType: IAP_CONFIG.coinProductType,
    }),
  })
  if (!response.ok) {
    throw new VerificationError(`Purchase verification failed (HTTP ${response.status}). Nothing was credited.`)
  }
  const data = (await response.json()) as Partial<VerifiedPurchase> & { ok?: boolean; error?: string }
  if (!data.ok || typeof data.coins !== 'number' || !data.transactionId) {
    throw new VerificationError(data.error ?? 'The verification server rejected this purchase. Nothing was credited.')
  }
  return {
    ok: true,
    productId: data.productId ?? productId,
    coins: data.coins,
    transactionId: data.transactionId,
  }
}

/**
 * Runs the real Google Play purchase sheet, verifies the token with the
 * backend, lets the caller credit the account, then consumes the product.
 */
export async function purchaseCoinPackage(
  product: ShopProduct,
  credit: (verified: VerifiedPurchase) => void,
): Promise<VerifiedPurchase> {
  const service = await requireService()
  const w = getWindow()
  if (typeof w.PaymentRequest !== 'function') {
    throw new BillingUnavailableError('no-payment-request', 'This device cannot open the Google Play purchase sheet.')
  }

  const details = await service.getDetails([product.productId])
  if (!details.length) {
    throw new BillingUnavailableError('product-missing', 'This product is not available in Google Play yet.')
  }

  let response: PaymentResponse
  try {
    const request = new w.PaymentRequest(
      [
        {
          supportedMethods: 'https://play.google.com/billing',
          data: { sku: product.productId },
        },
      ],
      {
        total: {
          label: product.name,
          amount: { currency: 'EUR', value: product.priceEur.toFixed(2) },
        },
      },
    )
    response = await request.show()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BillingUnavailableError('cancelled', 'Purchase cancelled.')
    }
    throw error
  }

  const purchaseToken = (response.details as { purchaseToken?: string })?.purchaseToken
  if (!purchaseToken) {
    throw new VerificationError('Google Play did not return a purchase token. Nothing was credited.')
  }

  const verified = await verifyWithServer(product.productId, purchaseToken)
  // Credit only after the server has verified the token with Google.
  credit(verified)

  try {
    await response.complete('success')
  } catch {
    /* The browser may complete automatically. */
  }
  try {
    await service.consume(purchaseToken)
  } catch {
    // Consumption can be retried on next launch; the server ledger is idempotent.
  }
  return verified
}

/** Re-verifies any unconsumed purchases (e.g. after an interrupted delivery). */
export async function restorePurchases(credit: (verified: VerifiedPurchase) => void): Promise<number> {
  const service = await requireService()
  const purchases = await service.listPurchases()
  let restored = 0
  for (const purchase of purchases) {
    try {
      const verified = await verifyWithServer(purchase.itemId, purchase.purchaseToken)
      credit(verified)
      await service.consume(purchase.purchaseToken).catch(() => undefined)
      restored += 1
    } catch (error) {
      console.warn('[Aetherfall] Could not restore purchase', purchase.itemId, error)
    }
  }
  return restored
}
