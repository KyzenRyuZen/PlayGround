import { useEffect, useMemo, useState } from 'react'
import type { MaterialId } from '../game/types'
import { useGame, game } from '../game/state/store'
import { COIN_PACKAGES, SHOP_OFFERS } from '../config/shop.config'
import { formatEur, isBillingConfigured } from '../config/iap'
import { billingAvailable } from '../services/iap'
import { MATERIALS } from '../game/data/materials'
import { costumeById } from '../game/data/costumes'
import { companionById } from '../game/data/companions'
import { Panel, SectionTitle } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { formatCompact, timeLeft, toast } from '../ui/format'

type OfferCategory = 'all' | 'membership' | 'booster' | 'material' | 'cosmetic' | 'companion'

const CATEGORY_LABEL: Record<OfferCategory, string> = {
  all: 'All',
  membership: 'Membership',
  booster: 'Boosters',
  material: 'Materials',
  cosmetic: 'Cosmetics',
  companion: 'Companions',
}

export function ShopScreen() {
  const state = useGame()
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [busyProduct, setBusyProduct] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [category, setCategory] = useState<OfferCategory>('all')

  const billing = billingAvailable()
  const configured = isBillingConfigured()
  const now = Date.now()
  const memberUntil = state.shop.membershipUntil
  const hasMembership = memberUntil > now
  const xpUntil = state.shop.xpBoostUntil
  const lootUntil = state.shop.lootBoostUntil

  useEffect(() => {
    let cancelled = false
    if (!billing) return
    game.localizedPrices().then((loaded) => {
      if (!cancelled && Object.keys(loaded).length) setPrices(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [billing])

  const offers = useMemo(
    () => SHOP_OFFERS.filter((o) => category === 'all' || o.category === category),
    [category],
  )

  const buyCoins = async (productId: string) => {
    if (busyProduct) return
    setBusyProduct(productId)
    const result = await game.purchaseCoins(productId)
    setBusyProduct(null)
    toast(result.message ?? (result.ok ? 'Purchase complete.' : 'Purchase failed.'), result.ok ? 'success' : 'error')
  }

  const restore = async () => {
    setRestoring(true)
    const result = await game.restore()
    setRestoring(false)
    toast(result.message ?? (result.ok ? 'Restore complete.' : 'Nothing to restore.'), result.ok ? 'success' : 'error')
  }

  const buyOffer = (id: string) => {
    const result = game.buyOffer(id)
    toast(result.message ?? (result.ok ? 'Acquired.' : 'Cannot buy this offer.'), result.ok ? 'success' : 'error')
  }

  const ownedCount = (offerId: string) => {
    const offer = SHOP_OFFERS.find((o) => o.id === offerId)
    if (!offer) return false
    const grant = offer.grant
    if (grant.kind === 'cosmetic') return state.costumes.owned.includes(grant.costumeId)
    if (grant.kind === 'pet') return state.companions.pets.some((p) => p.id === grant.petId)
    if (grant.kind === 'mount') return state.companions.mounts.some((p) => p.id === grant.mountId)
    return false
  }

  return (
    <div className="screen shop-screen">
      <SectionTitle eyebrow="The Ember Vault" title="Premium Shop">
        <span className="tag premium-tag"><Icon name="premium" size={14} /> {state.player.premiumCoins.toLocaleString()} Premium Coins</span>
        {billing && (
          <button className="btn btn-ghost btn-sm" onClick={restore} disabled={restoring}>
            <Icon name="clock" size={14} /> {restoring ? 'Restoring…' : 'Restore purchases'}
          </button>
        )}
      </SectionTitle>

      <div className="shop-hero">
        <div className="shop-hero-glow" />
        <div className="shop-hero-copy">
          <span className="eyebrow">Embers for the road</span>
          <h2>Nothing here is required. Everything here is earned by choice.</h2>
          <p>
            Premium Coins buy conveniences, cosmetics and companions. Gold, gear and power are always available through
            play. Every Google Play purchase is verified on our server before a single coin is delivered.
          </p>
          <div className="shop-status-row">
            <span className={`status-chip ${hasMembership ? 'on' : ''}`}>
              <Icon name="crown" size={13} /> {hasMembership ? `Member · ${timeLeft(memberUntil, now)}` : 'No membership'}
            </span>
            <span className={`status-chip ${xpUntil > now ? 'on' : ''}`}>
              <Icon name="xp" size={13} /> {xpUntil > now ? `2× XP · ${timeLeft(xpUntil, now)}` : 'No XP boost'}
            </span>
            <span className={`status-chip ${lootUntil > now ? 'on' : ''}`}>
              <Icon name="spark" size={13} /> {lootUntil > now ? `2× Loot · ${timeLeft(lootUntil, now)}` : 'No loot boost'}
            </span>
          </div>
        </div>
        <div className="shop-hero-emblem">
          <Icon name="premium" size={88} />
          <span>{formatCompact(state.player.premiumCoins)}</span>
          <small>Premium Coins</small>
        </div>
      </div>

      <Panel className={`billing-note ${billing ? 'ready' : ''}`}>
        <Icon name={billing ? 'check' : 'info'} size={18} />
        <div>
          {billing ? (
            <p>
              Google Play billing is connected. Prices below are read from the Play Store. Purchases are verified
              server-side and credited automatically; interrupted deliveries can be restored.
            </p>
          ) : configured ? (
            <p>
              Google Play billing is not available in this browser. Coin purchases work only in the Android build
              distributed through Google Play. Adding coins is disabled here — no payment will be simulated.
            </p>
          ) : (
            <p>
              This build has no Google Play verification endpoint configured. Coin purchases are intentionally disabled:
              no simulated checkout, no free coins, no client-side credit. Set <code>VITE_IAP_VERIFY_URL</code> and deploy
              the verification service to enable real purchases.
            </p>
          )}
          <small className="muted">
            Consumable product type: Google Play consumable · verification via Android Publisher API · idempotent token ledger.
          </small>
        </div>
      </Panel>

      <h3 className="shop-section-title">Coin Packages <span className="muted">charged by Google Play</span></h3>
      <div className="coin-grid">
        {COIN_PACKAGES.map((product) => {
          const display = prices[product.productId] ?? formatEur(product.priceEur)
          const busy = busyProduct === product.id
          return (
            <div className={`coin-card ${product.featured ? 'featured' : ''}`} key={product.id}>
              {product.featured && <span className="coin-ribbon">{product.id === 'coins_30000' ? 'APEX' : 'BEST VALUE'}</span>}
              <div className="coin-card-top">
                <span className="coin-stack"><Icon name="premium" size={28} /></span>
                <div>
                  <span className="eyebrow">{product.name}</span>
                  <strong className="coin-amount">{product.coins.toLocaleString()}</strong>
                  <small>Premium Coins</small>
                </div>
              </div>
              {product.bonusLabel && <span className="coin-bonus">{product.bonusLabel}</span>}
              <p className="muted small">{product.tagline}</p>
              <button
                className={`btn ${product.featured ? 'btn-primary' : 'btn-ghost'} btn-block`}
                disabled={!billing || Boolean(busyProduct)}
                onClick={() => buyCoins(product.id)}
                title={billing ? `Buy for ${display} via Google Play` : 'Google Play billing unavailable in this build'}
              >
                {busy ? 'Opening Google Play…' : billing ? `Buy · ${display}` : `${display} · Play only`}
              </button>
            </div>
          )
        })}
      </div>

      <div className="shop-offer-head">
        <h3 className="shop-section-title">Ember Vault Offers <span className="muted">paid with Premium Coins</span></h3>
        <div className="filter-row">
          {(Object.keys(CATEGORY_LABEL) as OfferCategory[]).map((cat) => (
            <button key={cat} className={`filter-chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="offer-grid">
        {offers.map((offer) => {
          const owned = ownedCount(offer.id)
          const affordable = state.player.premiumCoins >= offer.cost
          const detail =
            offer.grant.kind === 'materials'
              ? Object.entries(offer.grant.materials).map(([id, count]) => `${count}× ${MATERIALS[id as MaterialId]?.name}`).join(' · ') ||
                `${offer.grant.gold?.toLocaleString()} gold`
              : offer.grant.kind === 'cosmetic'
                ? costumeById(offer.grant.costumeId)?.description ?? ''
                : offer.grant.kind === 'pet' || offer.grant.kind === 'mount'
                  ? companionById(offer.grant.kind === 'pet' ? offer.grant.petId : offer.grant.mountId)?.description ?? ''
                  : offer.grant.kind === 'membership'
                    ? `${offer.grant.days} days of membership benefits`
                    : `${offer.grant.hours} hours of ${offer.grant.booster === 'xp' ? 'double experience' : 'double loot'}`
          const repeatable = offer.repeatable || offer.grant.kind === 'booster' || offer.grant.kind === 'membership'
          return (
            <Panel key={offer.id} className={`offer-card ${owned && !repeatable ? 'owned' : ''}`}>
              <div className="offer-icon"><Icon name={offer.icon} size={24} /></div>
              <div className="offer-body">
                <span className="eyebrow">{CATEGORY_LABEL[offer.category]}</span>
                <strong>{offer.name}</strong>
                <p className="muted small">{offer.description}</p>
                <small className="offer-detail">{detail}</small>
              </div>
              <div className="offer-buy">
                <span className="offer-price"><Icon name="premium" size={14} /> {offer.cost.toLocaleString()}</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => buyOffer(offer.id)}
                  disabled={(owned && !repeatable) || !affordable}
                >
                  {owned && !repeatable ? 'Owned' : affordable ? 'Acquire' : 'Not enough'}
                </button>
              </div>
            </Panel>
          )
        })}
      </div>

      <Panel className="fineprint-panel">
        <Icon name="info" size={16} />
        <p>
          Prices are set in Google Play Console and may vary by country and currency. Gold and Premium Coins have no
          cash value and cannot be exchanged. Purchases are non-refundable except where required by law. This game does
          not simulate payments: when Google Play is unavailable, purchasing is disabled.
        </p>
      </Panel>
    </div>
  )
}
