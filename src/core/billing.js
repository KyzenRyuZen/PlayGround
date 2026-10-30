/* Google Play billing bridge.
   This module deliberately contains NO simulated purchase path. Premium coin
   packages can only be delivered after Google Play returns a purchase token
   and the configured verification server confirms it with the Play Developer
   API. In a browser without the Digital Goods API every package purchase is
   disabled rather than faked. */

import { BILLING, SHOP } from '../config.js';

const state = {
  initialized: false,
  service: null,
  ready: false,
  reason: 'not-initialized',
  details: new Map(),
};

function hasDigitalGoods() {
  return typeof window !== 'undefined' && typeof window.getDigitalGoodsService === 'function';
}

export function billingStatus() {
  if (!BILLING.enabled) return { ready: false, reason: 'disabled', message: 'Billing has been disabled in this build.' };
  if (!BILLING.verificationUrl) return {
    ready: false,
    reason: 'verification',
    message: 'Billing is installed but no verification server is configured. Purchases are disabled in this preview.',
  };
  if (!hasDigitalGoods()) return {
    ready: false,
    reason: 'platform',
    message: 'Google Play billing is available in the Android app. This browser preview cannot process real purchases.',
  };
  if (!state.ready) return { ready: false, reason: state.reason || 'initializing', message: 'Connecting to Google Play…' };
  return { ready: true, reason: 'ready', message: 'Google Play billing is connected. Purchases are verified server-side.' };
}

export async function initBilling() {
  state.initialized = true;
  if (!BILLING.enabled || !BILLING.verificationUrl || !hasDigitalGoods()) {
    state.ready = false;
    state.reason = !BILLING.verificationUrl ? 'verification' : 'platform';
    return billingStatus();
  }
  try {
    state.service = await window.getDigitalGoodsService(BILLING.billingService);
    state.ready = !!state.service;
    state.reason = state.ready ? 'ready' : 'platform';
  } catch (err) {
    state.ready = false;
    state.reason = 'platform';
    console.warn('Digital Goods service unavailable', err);
  }
  return billingStatus();
}

export async function loadProductDetails(packages = SHOP.packages) {
  if (!state.service) return {};
  try {
    const skus = packages.map(p => p.productId);
    const details = await state.service.getDetails(skus);
    const out = {};
    for (const d of details || []) {
      out[d.itemId] = d;
      state.details.set(d.itemId, d);
    }
    return out;
  } catch (err) {
    console.warn('Could not load product details', err);
    return {};
  }
}

export function displayPrice(pkg, details = {}) {
  const d = details[pkg.productId];
  if (d?.price) return d.price;
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: BILLING.currencyFallback }).format(pkg.price);
}

async function requestPlayPurchase(pkg, details) {
  if (!state.service) throw new Error('billing-unavailable');
  const detail = details[pkg.productId];
  if (!detail?.price) throw new Error('product-unavailable');
  const methodData = [{
    supportedMethods: BILLING.billingService,
    data: { sku: pkg.productId },
  }];
  const paymentDetails = {
    total: { label: 'Ebonspire premium coins', amount: { currency: detail.priceCurrencyCode || 'EUR', value: String(detail.price?.replace(/[^\d.]/g, '') || pkg.price) } },
  };
  if (typeof window.PaymentRequest !== 'function') throw new Error('billing-unavailable');
  const request = new window.PaymentRequest(methodData, paymentDetails);
  const response = await request.show();
  const token = response.details?.purchaseToken;
  if (!token) {
    await response.complete('fail');
    throw new Error('missing-purchase-token');
  }
  return { response, token };
}

async function verifyWithServer(pkg, purchaseToken, playerId) {
  if (!BILLING.verificationUrl) throw new Error('verification-not-configured');
  const res = await fetch(BILLING.verificationUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: pkg.productId,
      packageName: BILLING.packageName,
      purchaseToken,
      playerId,
      clientPlatform: 'digital-goods',
    }),
  });
  if (!res.ok) {
    let message = 'verification-failed';
    try { const body = await res.json(); message = body.error || message; } catch {}
    throw new Error(message);
  }
  const data = await res.json();
  if (!data || data.ok !== true || data.productId !== pkg.productId) throw new Error('invalid-verification-response');
  if (!Number.isFinite(data.coins) || data.coins <= 0) throw new Error('invalid-coin-grant');
  return data;
}

export async function purchasePackage(pkg, playerId) {
  const status = billingStatus();
  if (!status.ready) throw new Error(status.reason);
  const details = state.details.size ? Object.fromEntries(state.details) : await loadProductDetails();
  const { response, token } = await requestPlayPurchase(pkg, details);
  try {
    const verified = await verifyWithServer(pkg, token, playerId);
    await response.complete('success');
    return verified;
  } catch (err) {
    // Do not complete the Play purchase as successful when verification fails.
    try { await response.complete('fail'); } catch {}
    throw err;
  }
}

export function billingSetupHelp() {
  return [
    'Deploy the verification server in /server over HTTPS.',
    'Set BILLING.verificationUrl in src/config.js to that endpoint.',
    'Create the six consumable products in Google Play Console with the matching product IDs.',
    'Package the game as a Trusted Web Activity and verify Digital Asset Links for your domain.',
    'The server verifies each purchase token with the Android Publisher API, acknowledges/consumes the product, and only then returns the coin grant.',
  ];
}
