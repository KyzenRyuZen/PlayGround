# Google Play In-App Purchases

Aetherfall sells **consumable Premium Coin packages** through Google Play. There is
no simulated checkout anywhere in the project: when Google Play billing or the
verification service is unavailable, purchasing is disabled.

```
Android app (Digital Goods API + PaymentRequest)
        │  purchase token
        ▼
POST /iap/google/verify          server/iap-verifier.mjs
        │  OAuth2 service-account JWT
        ▼
Google Play Android Publisher API
        │  purchaseState === 0
        ▼
shared/iap-products.json → coin amount
        │  idempotent token ledger
        ▼
{ ok: true, coins, transactionId }
        │
        ▼
Client credits Premium Coins, then consumes the product
```

## Files

| File | Purpose |
| --- | --- |
| `shared/iap-products.json` | Single source of truth for `productId → coins`. Used by the client and the server. |
| `src/config/shop.config.ts` | Display names, EUR reference prices, bonus labels, and the Premium Coin offers. Throws at startup if coin amounts drift from the shared map. |
| `src/config/iap.ts` | Build-time endpoints and Android package name. |
| `src/services/iap.ts` | Real Google Play billing bridge, server verification, restore. |
| `server/iap-verifier.mjs` | Verification service: Google API check, product mapping, idempotent ledger. |
| `src/game/state/store.ts` | Credits coins only from a verified server response and records transaction IDs. |

## 1. Create the products in Play Console

1. Upload a signed Android App Bundle that contains the Trusted Web Activity (or
   your Play Billing wrapper) for the game.
2. In **Monetize → Products → In-app products**, create one **consumable**
   product for each coin package. The product IDs must match exactly:

   ```
   aetherfall_coins_500
   aetherfall_coins_1100
   aetherfall_coins_3000
   aetherfall_coins_6500
   aetherfall_coins_14000
   aetherfall_coins_30000
   ```

3. Set the price in Play Console. The EUR values in `shop.config.ts` are display
   fallbacks only; Google Play always charges the localized Play price.
4. Activate every product. Inactive products do not appear in `getDetails()`.

If you add or rename a package, update **all three** of:

- `COIN_PACKAGES` in `src/config/shop.config.ts`
- `shared/iap-products.json`
- the Play Console product

The client throws a startup error if the shop and shared map disagree.

## 2. Create the service account

1. Create or select a Google Cloud project.
2. Enable the **Google Play Android Developer API** (Android Publisher API).
3. Create a service account and download its JSON key.
4. In **Play Console → Users and permissions → Invite new users**, add the
   service-account email. Grant:
   - app-level access to the Aetherfall app,
   - **View financial data** (required to read purchase state),
   - **Manage orders** if you later add refund/void handling.
5. Keep the JSON key out of source control. Store it as a secret on your host.

## 3. Configure and run the verifier

```bash
# .env (never commit)
GOOGLE_SERVICE_ACCOUNT_FILE=server/secrets/play-service-account.json
ANDROID_PACKAGE=com.aetherfall.idle
IAP_PORT=8787
IAP_ALLOWED_ORIGINS=https://play.aetherfall.example,https://www.aetherfall.example
IAP_LEDGER_FILE=server/data/purchases.json

npm run iap:server
```

`GOOGLE_SERVICE_ACCOUNT_JSON` can be used instead of the file when your platform
injects secrets as environment variables.

| Variable | Default | Notes |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | – | Path to the Play service-account JSON. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | – | Inline JSON alternative. |
| `ANDROID_PACKAGE` | `com.aetherfall.idle` | Must match the Play application ID. |
| `IAP_PORT` | `8787` | HTTP port. Terminate TLS in front of it. |
| `IAP_ALLOWED_ORIGINS` | empty | Comma-separated browser origins. Requests without a matching `Origin` are rejected. Use `*` only for local testing. |
| `IAP_LEDGER_FILE` | `server/data/purchases.json` | Append-only delivered-token ledger. Persist this volume. |
| `IAP_LEDGER_STRICT` | – | `1` refuses to start if the ledger cannot be read. Recommended in production. |
| `IAP_TRUST_PROXY` | – | `1` trusts `X-Forwarded-For` for rate limiting when behind your own proxy. |

The ledger file is created with mode `0600` and written atomically. Back it up:
losing it can allow a token to be delivered twice.

### Endpoints

- `GET /health` → configuration and product count. No secrets are returned.
- `POST /iap/google/verify` → verifies and records a purchase.
- `POST /iap/google/restore` → alias of `/verify` (the client re-verifies
  unconsumed purchases through the same flow).

Request:

```json
{
  "packageName": "com.aetherfall.idle",
  "productId": "aetherfall_coins_1100",
  "purchaseToken": "<token from Google Play>",
  "productType": "consumable"
}
```

Successful response:

```json
{
  "ok": true,
  "productId": "aetherfall_coins_1100",
  "coins": 1100,
  "transactionId": "google:GPA.1234-5678-9012-34567",
  "orderId": "GPA.1234-5678-9012-34567",
  "replay": false
}
```

The server returns `replay: true` for a token it has already delivered. The
token hash — never the token itself — is stored in the ledger.

Failure responses always mean **nothing was credited**:

| Status | Meaning |
| --- | --- |
| `400` | Malformed request, wrong package, or unknown product. |
| `403` | Browser origin not allowed. |
| `409` | Token already delivered for a different product. |
| `413` | Body too large. |
| `422` | Google says the purchase is not completed, or the token is unknown/consumed. |
| `429` | Rate limit (30 requests/minute per IP). |
| `502` | Google API/auth failure. Safe to retry. |
| `503` | No service-account credentials configured. Nothing is ever faked. |
| `504` | Google API timeout. Safe to retry. |

## 4. Point the client at the verifier

Set these at build time (Vite reads `.env.production` or CI secrets):

```bash
VITE_IAP_VERIFY_URL=https://api.aetherfall.example/iap/google/verify
VITE_IAP_RESTORE_URL=https://api.aetherfall.example/iap/google/restore
VITE_ANDROID_PACKAGE=com.aetherfall.idle
npm run build
```

`billingAvailable()` is deliberately strict: it requires both a configured
verification URL and the Android Digital Goods API + `PaymentRequest`. In a
desktop browser the shop displays prices but purchase buttons remain disabled.

## 5. Purchase and delivery flow

1. The player taps **Buy**. The app calls `getDigitalGoodsService()` and
   `getDetails()` to confirm the product and localized price.
2. `PaymentRequest` opens the real Google Play purchase sheet.
3. Google returns a `purchaseToken`. The client posts it to the verifier.
4. The verifier obtains an OAuth2 token with the service account, calls
   `purchases.products.get`, and requires `purchaseState === 0` (purchased).
5. The verifier maps `productId` to coins via `shared/iap-products.json`, writes
   the token hash to the ledger, and returns the delivery.
6. Only then does `GameStore.creditVerifiedPurchase()` add coins, record the
   transaction ID, and log the delivery.
7. The client calls `response.complete('success')` and consumes the product. If
   consumption fails, the server ledger makes a later restore safe.

`restorePurchases()` lists unconsumed purchases and re-verifies each one. The
client also deduplicates by transaction ID, so the same delivery cannot be
credited twice in one save.

## 6. Testing without inventing payments

Use a **real** Google Play test purchase. There is no mock-success mode.

1. Publish the build to an **internal testing** track.
2. Add license testers under **Play Console → Setup → License testing**. Test
   purchases are real Play flows and are not charged.
3. Install through the Play testing link on a device with a Play account.
4. Buy a package, confirm the service log line `[iap] delivered …`, and verify
   the coin balance and the `verifiedPurchases` transaction ID in the save.
5. Kill the app after the Play sheet succeeds but before consumption; reopen and
   use **Restore purchases** to confirm idempotent redelivery.
6. Replay the same token with `curl` against `/verify`; the response must be
   `replay: true` with the same `transactionId`.

Never place a real token in source, tests, or issue reports.

## 7. Production hardening

The verifier is intentionally small and dependency-free, but a production MMO
should add the following:

- **Authenticate the player.** Bind each purchase to a server-side account and
  store the delivery in that account's wallet. The current endpoint proves a
  token is genuine but does not know which player owns it. Put the verifier
  behind your session/JWT auth and pass the account ID server-side; never trust
  a client-supplied account ID alone.
- **Make the wallet server-authoritative.** This project is a single-player idle
  game whose save lives on the device. A determined user can edit local save
  data. Verified purchases prevent free coins from the shop, but competitive or
  cross-device economies need the Premium Coin balance and item grants to live
  on the server.
- **Handle refunds and chargebacks.** Poll the
  [Voided Purchases API](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.voidedpurchases)
  or consume Real-time Developer Notifications, then revoke the corresponding
  entitlement in your account ledger.
- **Rotate secrets** and restrict the service account to this one app.
- **Keep the ledger durable** (managed disk/database with backups) and alert on
  write failures.
- **Rate-limit and monitor** by account, not only by IP.
- **Use HTTPS** and lock `IAP_ALLOWED_ORIGINS` to your real app origins.

## 8. Compliance notes

- Digital goods must use Google Play Billing; this project does not link to
  external checkout.
- Consumable products must be consumed before they can be repurchased. The
  client consumes after verified delivery.
- Show localized Play prices, not hard-coded currency, whenever billing is
  available.
- Premium Coins have no cash value and are non-transferable. The shop UI already
  states this.
- Keep the privacy policy and terms links current in the Play listing and in the
  game's settings/store metadata before release.
