#!/usr/bin/env node
/**
 * Aetherfall — Google Play purchase verification service.
 *
 * Verifies consumable coin-pack purchases with the Google Play Android
 * Publisher API, credits exactly the coin amount declared in
 * `shared/iap-products.json`, and records every delivered purchase token in an
 * idempotent ledger so retries can never double-deliver.
 *
 * Environment:
 *   GOOGLE_SERVICE_ACCOUNT_FILE   Path to the Play Console service-account JSON.
 *   GOOGLE_SERVICE_ACCOUNT_JSON   Inline service-account JSON (alternative).
 *   ANDROID_PACKAGE               Defaults to com.aetherfall.idle.
 *   IAP_PORT                      Defaults to 8787.
 *   IAP_LEDGER_FILE               Defaults to server/data/purchases.json.
 *   IAP_ALLOWED_ORIGINS           Comma-separated allowlist for browser CORS.
 *   IAP_TRUST_PROXY               Set to 1 behind a reverse proxy you control.
 *
 * There is deliberately no "test mode", no fake purchase, and no way to issue
 * coins without a purchase token that Google confirms as purchased.
 */

import { createServer } from 'node:http'
import { createHash, createSign } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

loadDotEnv(resolve(ROOT, '.env'))
loadDotEnv(resolve(ROOT, '.env.local'))

const PORT = Number(process.env.IAP_PORT ?? process.env.PORT ?? 8787)
const PACKAGE_NAME = process.env.ANDROID_PACKAGE ?? 'com.aetherfall.idle'
const LEDGER_FILE = resolve(ROOT, process.env.IAP_LEDGER_FILE ?? 'server/data/purchases.json')
const ALLOWED_ORIGINS = (process.env.IAP_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const MAX_BODY_BYTES = 16 * 1024
const VERIFY_TIMEOUT_MS = 15_000
const RATE_LIMIT_PER_MINUTE = 30

const PRODUCT_COINS = readProductMap(resolve(ROOT, 'shared/iap-products.json'))
const productIds = new Set(Object.keys(PRODUCT_COINS))

const serviceAccount = loadServiceAccount()
const ledger = loadLedger()
const inFlight = new Map()

let accessToken = null
let accessTokenExpiresAt = 0

// ── HTTP server ──────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const origin = req.headers.origin
  const cors = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    res.writeHead(cors.allowed ? 204 : 403, cors.headers)
    res.end()
    return
  }

  if (!cors.allowed) {
    sendJson(res, 403, { ok: false, error: 'Origin is not allowed.' }, cors.headers)
    return
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  try {
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      sendJson(
        res,
        200,
        {
          ok: true,
          service: 'aetherfall-iap-verifier',
          googleConfigured: Boolean(serviceAccount),
          packageName: PACKAGE_NAME,
          products: [...productIds],
          ledgerEntries: Object.keys(ledger.entries).length,
        },
        cors.headers,
      )
      return
    }

    if (req.method === 'POST' && (url.pathname === '/iap/google/verify' || url.pathname === '/iap/google/restore')) {
      if (!rateLimit(req)) {
        sendJson(res, 429, { ok: false, error: 'Too many verification attempts. Try again shortly.' }, cors.headers)
        return
      }

      const body = await readJsonBody(req)
      const result = await handleVerify(body)
      sendJson(res, 200, result, cors.headers)
      return
    }

    sendJson(res, 404, { ok: false, error: 'Not found.' }, cors.headers)
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message =
      error instanceof HttpError ? error.message : 'Verification service error. Nothing was credited.'
    // Never log purchase tokens or service-account secrets.
    console.error(`[iap] ${req.method} ${url.pathname} → ${status}:`, message)
    if (!(error instanceof HttpError) && error instanceof Error) {
      console.error(`[iap] ${error.name}: ${error.message}`)
    }
    sendJson(res, status, { ok: false, error: message }, cors.headers)
  }
})

server.listen(PORT, () => {
  console.log(`[iap] Aetherfall verifier listening on :${PORT}`)
  console.log(`[iap] package=${PACKAGE_NAME} products=${productIds.size} ledger=${LEDGER_FILE}`)
  if (!serviceAccount) {
    console.warn(
      '[iap] Google credentials are NOT configured. /verify will return 503 until ' +
        'GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SERVICE_ACCOUNT_JSON is set. No purchase is ever faked.',
    )
  }
  if (!ALLOWED_ORIGINS.length) {
    console.warn('[iap] IAP_ALLOWED_ORIGINS is empty: browser requests will be rejected. Set your app origin.')
  }
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[iap] ${signal} received, shutting down.`)
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3_000).unref()
  })
}

// ── Verification ─────────────────────────────────────────────────────────────

async function handleVerify(body) {
  const packageName = stringField(body, 'packageName', 200)
  const productId = stringField(body, 'productId', 200)
  const purchaseToken = stringField(body, 'purchaseToken', 4096)
  const productType = body.productType === undefined ? 'consumable' : stringField(body, 'productType', 40)

  if (packageName !== PACKAGE_NAME) {
    throw new HttpError(400, 'packageName does not match this game.')
  }
  if (productType !== 'consumable') {
    throw new HttpError(400, 'Only consumable coin packages are supported by this endpoint.')
  }
  if (!productIds.has(productId)) {
    throw new HttpError(400, 'Unknown productId.')
  }
  if (purchaseToken.length < 10) {
    throw new HttpError(400, 'Invalid purchase token.')
  }

  const tokenHash = createHash('sha256').update(purchaseToken).digest('hex')
  const existing = ledger.entries[tokenHash]
  if (existing) return replayResponse(existing, productId)

  const pending = inFlight.get(tokenHash)
  if (pending) return pending

  const job = (async () => {
    // Re-check after acquiring the in-flight slot: a parallel request may have
    // finished while this one waited.
    const raced = ledger.entries[tokenHash]
    if (raced) return replayResponse(raced, productId)

    const purchase = await verifyWithGoogle(packageName, productId, purchaseToken)

    if (purchase.purchaseState !== 0) {
      throw new HttpError(422, 'Google Play reports this purchase is not completed. Nothing was credited.')
    }

    const coins = PRODUCT_COINS[productId]
    if (!Number.isInteger(coins) || coins <= 0) {
      throw new HttpError(500, 'Product coin mapping is invalid. Nothing was credited.')
    }

    const transactionId = purchase.orderId ? `google:${purchase.orderId}` : `google:${tokenHash.slice(0, 32)}`
    const entry = {
      tokenHash,
      packageName,
      productId,
      coins,
      transactionId,
      orderId: purchase.orderId ?? null,
      purchaseTimeMillis: purchase.purchaseTimeMillis ?? null,
      purchaseType: purchase.purchaseType ?? null,
      verifiedAt: new Date().toISOString(),
    }

    // Persist before responding. If the write fails, the client gets an error
    // and nothing is credited; retrying re-verifies with Google.
    ledger.entries[tokenHash] = entry
    await persistLedger()

    console.log(`[iap] delivered ${coins} coins · ${productId} · ${transactionId}`)
    return {
      ok: true,
      productId,
      coins,
      transactionId,
      orderId: entry.orderId,
      replay: false,
    }
  })().finally(() => inFlight.delete(tokenHash))

  inFlight.set(tokenHash, job)
  return job
}

function replayResponse(entry, requestedProductId) {
  if (entry.productId !== requestedProductId) {
    throw new HttpError(409, 'This purchase token was already delivered for a different product.')
  }
  return {
    ok: true,
    productId: entry.productId,
    coins: entry.coins,
    transactionId: entry.transactionId,
    orderId: entry.orderId,
    replay: true,
  }
}

async function verifyWithGoogle(packageName, productId, purchaseToken) {
  if (!serviceAccount) {
    throw new HttpError(
      503,
      'Google Play verification is not configured on this server. No purchase was credited.',
    )
  }

  const token = await getAccessToken()
  const url =
    'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' +
    `${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}` +
    `/tokens/${encodeURIComponent(purchaseToken)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS)
  let response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new HttpError(504, 'Google Play verification timed out. Nothing was credited; retry safely.')
    }
    throw new HttpError(502, 'Could not reach Google Play. Nothing was credited; retry safely.')
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 401) {
    accessToken = null
    accessTokenExpiresAt = 0
    throw new HttpError(502, 'Google Play rejected the service credentials. Nothing was credited.')
  }
  if (response.status === 400 || response.status === 404) {
    throw new HttpError(422, 'Google Play does not recognise this purchase token. Nothing was credited.')
  }
  if (response.status === 403) {
    throw new HttpError(502, 'The service account lacks Android Publisher access. Nothing was credited.')
  }
  if (!response.ok) {
    throw new HttpError(502, `Google Play verification failed (HTTP ${response.status}). Nothing was credited.`)
  }

  const data = await response.json()
  return {
    purchaseState: Number(data.purchaseState),
    orderId: typeof data.orderId === 'string' ? data.orderId : null,
    purchaseTimeMillis: data.purchaseTimeMillis ?? null,
    purchaseType: data.purchaseType ?? null,
    acknowledgementState: data.acknowledgementState ?? null,
    consumptionState: data.consumptionState ?? null,
  }
}

// ── Google service-account OAuth ─────────────────────────────────────────────

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  if (accessToken && now < accessTokenExpiresAt - 60) return accessToken

  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()
  const assertion = `${unsigned}.${signer.sign(serviceAccount.private_key, 'base64url')}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS)
  let response
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
      signal: controller.signal,
    })
  } catch {
    throw new HttpError(502, 'Could not obtain a Google API token. Nothing was credited.')
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new HttpError(502, 'Google rejected the service-account credentials. Nothing was credited.')
  }

  const data = await response.json()
  if (typeof data.access_token !== 'string') {
    throw new HttpError(502, 'Google returned no access token. Nothing was credited.')
  }
  accessToken = data.access_token
  accessTokenExpiresAt = now + Number(data.expires_in ?? 3600)
  return accessToken
}

// ── Ledger ───────────────────────────────────────────────────────────────────

function loadLedger() {
  try {
    if (!existsSync(LEDGER_FILE)) return { version: 1, entries: {} }
    const parsed = JSON.parse(readFileSync(LEDGER_FILE, 'utf8'))
    if (!parsed || typeof parsed !== 'object' || typeof parsed.entries !== 'object' || parsed.entries === null) {
      throw new Error('ledger has an unexpected shape')
    }
    return { version: 1, entries: parsed.entries }
  } catch (error) {
    console.error(`[iap] Could not read ledger at ${LEDGER_FILE}:`, error.message)
    if (process.env.IAP_LEDGER_STRICT === '1') {
      console.error('[iap] IAP_LEDGER_STRICT=1: refusing to start with an unreadable ledger.')
      process.exit(1)
    }
    console.error('[iap] Starting with an EMPTY ledger. Previously delivered tokens may be re-delivered.')
    return { version: 1, entries: {} }
  }
}

let ledgerWrite = Promise.resolve()

function persistLedger() {
  // Serialize writes and replace atomically so a crash cannot truncate the
  // ledger into an unreadable state.
  ledgerWrite = ledgerWrite.then(() => {
    mkdirSync(dirname(LEDGER_FILE), { recursive: true })
    const temp = `${LEDGER_FILE}.${process.pid}.tmp`
    writeFileSync(temp, JSON.stringify(ledger, null, 2), { mode: 0o600 })
    renameSync(temp, LEDGER_FILE)
  })
  return ledgerWrite
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadServiceAccount() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const file = process.env.GOOGLE_SERVICE_ACCOUNT_FILE
  try {
    const raw = inline ?? (file ? readFileSync(resolve(ROOT, file), 'utf8') : null)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.client_email || !parsed.private_key) {
      console.warn('[iap] Service account JSON is missing client_email or private_key.')
      return null
    }
    parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n')
    return parsed
  } catch (error) {
    console.error('[iap] Could not load service account:', error.message)
    return null
  }
}

function loadDotEnv(path) {
  if (!existsSync(path)) return
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (!match || process.env[match[1]] !== undefined) continue
      let value = match[2]
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[match[1]] = value
    }
  } catch {
    /* .env is optional */
  }
}

function readProductMap(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    const out = {}
    for (const [id, coins] of Object.entries(parsed)) {
      if (typeof coins === 'number' && Number.isInteger(coins) && coins > 0) out[id] = coins
    }
    if (!Object.keys(out).length) throw new Error('no valid products')
    return out
  } catch (error) {
    console.error(`[iap] Cannot read ${path}:`, error.message)
    process.exit(1)
  }
}

function stringField(body, key, maxLength) {
  const value = body?.[key]
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new HttpError(400, `Invalid ${key}.`)
  }
  return value.trim()
}

function readJsonBody(req) {
  return new Promise((resolvePromise, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Request body too large.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        const parsed = raw ? JSON.parse(raw) : null
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new HttpError(400, 'Expected a JSON object.'))
          return
        }
        resolvePromise(parsed)
      } catch {
        reject(new HttpError(400, 'Invalid JSON body.'))
      }
    })
    req.on('error', () => reject(new HttpError(400, 'Could not read request body.')))
  })
}

function corsHeaders(origin) {
  if (!origin) return { allowed: true, headers: {} }
  const allowed = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)
  if (!allowed) return { allowed: false, headers: {} }
  return {
    allowed: true,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes('*') ? '*' : origin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    },
  }
}

const rateBuckets = new Map()

function rateLimit(req) {
  const forwarded = process.env.IAP_TRUST_PROXY === '1' ? req.headers['x-forwarded-for'] : null
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ??
    req.socket.remoteAddress ??
    'unknown'
  const now = Date.now()
  const bucket = rateBuckets.get(ip)
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  bucket.count += 1
  return bucket.count <= RATE_LIMIT_PER_MINUTE
}

function sendJson(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  })
  res.end(body)
}

function base64url(value) {
  return Buffer.from(value).toString('base64url')
}

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
