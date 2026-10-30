import type { ShopOffer, ShopProduct } from '../game/types'
import productCoins from '../../shared/iap-products.json'

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM SHOP CONFIGURATION
// Change coin amounts, prices, product IDs and offers here.
//
// IMPORTANT: `priceEur` is display metadata only. Google Play always charges
// the price configured in Play Console, and every purchase is verified
// server-side before any coins or items are delivered. Nothing in the client
// simulates a successful payment.
// ─────────────────────────────────────────────────────────────────────────────

export const COIN_PACKAGES: ShopProduct[] = [
  {
    id: 'coins_500',
    productId: 'aetherfall_coins_500',
    name: 'Pouch of Embers',
    coins: 500,
    priceEur: 4.99,
    tagline: 'A small offering to the old fires.',
  },
  {
    id: 'coins_1100',
    productId: 'aetherfall_coins_1100',
    name: 'Coffer of Embers',
    coins: 1100,
    priceEur: 9.99,
    bonusLabel: '+10% bonus',
    tagline: 'Enough to outfit a promising adventurer.',
    featured: true,
  },
  {
    id: 'coins_3000',
    productId: 'aetherfall_coins_3000',
    name: 'Vault of Embers',
    coins: 3000,
    priceEur: 24.99,
    bonusLabel: '+20% bonus',
    tagline: 'The war chest of a rising champion.',
  },
  {
    id: 'coins_6500',
    productId: 'aetherfall_coins_6500',
    name: "Dragon's Hoard",
    coins: 6500,
    priceEur: 49.99,
    bonusLabel: '+30% bonus',
    tagline: 'Spoils taken from a very large dragon.',
  },
  {
    id: 'coins_14000',
    productId: 'aetherfall_coins_14000',
    name: "Sovereign's Reserve",
    coins: 14000,
    priceEur: 99.99,
    bonusLabel: '+40% bonus',
    tagline: 'For those who intend to be remembered.',
  },
  {
    id: 'coins_30000',
    productId: 'aetherfall_coins_30000',
    name: 'Eternal Flame',
    coins: 30000,
    priceEur: 199.99,
    bonusLabel: '+50% bonus',
    tagline: 'The sun itself, rendered down to currency.',
    featured: true,
  },
]

export const SHOP_OFFERS: ShopOffer[] = [
  {
    id: 'membership_30',
    name: 'Emberbound Membership',
    description: '30 days of +15% XP, +15% Gold, +1 daily dungeon attempt, and automatic loot collection.',
    cost: 500,
    icon: 'crown',
    category: 'membership',
    grant: { kind: 'membership', days: 30 },
  },
  {
    id: 'xp_elixir',
    name: 'Elixir of Insight',
    description: 'Double experience from monsters and dungeons for 2 hours.',
    cost: 150,
    icon: 'flask',
    category: 'booster',
    grant: { kind: 'booster', booster: 'xp', hours: 2 },
  },
  {
    id: 'loot_charm',
    name: 'Gilded Loot Charm',
    description: 'Double item and material drop rates for 2 hours.',
    cost: 150,
    icon: 'charm',
    category: 'booster',
    grant: { kind: 'booster', booster: 'loot', hours: 2 },
  },
  {
    id: 'protection_bundle',
    name: 'Ward Scroll ×3',
    description: 'Three scrolls that prevent equipment destruction on a failed upgrade.',
    cost: 120,
    icon: 'scroll',
    category: 'material',
    grant: { kind: 'materials', materials: { protection_scroll: 3 } },
    repeatable: true,
  },
  {
    id: 'chaos_bundle',
    name: 'Chaos Crystal ×5',
    description: 'Reroll all random bonuses on five pieces of equipment.',
    cost: 180,
    icon: 'crystal',
    category: 'material',
    grant: { kind: 'materials', materials: { chaos_crystal: 5 } },
    repeatable: true,
  },
  {
    id: 'rune_bundle',
    name: 'Mystic Rune ×3',
    description: 'Add an extra random bonus to three pieces of equipment.',
    cost: 150,
    icon: 'rune',
    category: 'material',
    grant: { kind: 'materials', materials: { mystic_rune: 3 } },
    repeatable: true,
  },
  {
    id: 'dust_bundle',
    name: 'Runestone Dust ×25',
    description: 'A generous handful of dust for levelling magical stones.',
    cost: 100,
    icon: 'dust',
    category: 'material',
    grant: { kind: 'materials', materials: { stone_dust: 25 } },
    repeatable: true,
  },
  {
    id: 'gold_chest',
    name: 'Chest of Crowns',
    description: '15,000 gold, enough to fund a week of forging.',
    cost: 200,
    icon: 'coins',
    category: 'material',
    grant: { kind: 'materials', materials: {}, gold: 15000 },
    repeatable: true,
  },
  {
    id: 'cosmetic_crimson',
    name: 'Crimson Court Regalia',
    description: 'A courtly armour skin from a kingdom that no longer exists.',
    cost: 450,
    icon: 'costume',
    category: 'cosmetic',
    grant: { kind: 'cosmetic', costumeId: 'crimson_court' },
  },
  {
    id: 'cosmetic_void',
    name: 'Void Regalia',
    description: 'Armour that negotiates with light. Includes a subtle bonus to critical chance.',
    cost: 900,
    icon: 'costume',
    category: 'cosmetic',
    grant: { kind: 'cosmetic', costumeId: 'void_regalia' },
  },
  {
    id: 'cosmetic_emberblade',
    name: 'Emberwrought Blade Skin',
    description: 'A cosmetic weapon glow of banked embers.',
    cost: 500,
    icon: 'sword',
    category: 'cosmetic',
    grant: { kind: 'cosmetic', costumeId: 'emberwrought_blade' },
  },
  {
    id: 'cosmetic_moonedge',
    name: 'Moonlit Edge Skin',
    description: 'Cold silver light that pools along your weapon.',
    cost: 850,
    icon: 'sword',
    category: 'cosmetic',
    grant: { kind: 'cosmetic', costumeId: 'moonlit_edge' },
  },
  {
    id: 'cosmetic_astral_mane',
    name: 'Astral Mane',
    description: 'Hair threaded with tiny cold stars.',
    cost: 180,
    icon: 'hair',
    category: 'cosmetic',
    grant: { kind: 'cosmetic', costumeId: 'astral_mane' },
  },
  {
    id: 'cosmetic_void_aura',
    name: 'Void Aura',
    description: 'A silent halo of collapsing violet light.',
    cost: 750,
    icon: 'aura',
    category: 'cosmetic',
    grant: { kind: 'cosmetic', costumeId: 'void_aura' },
  },
  {
    id: 'pet_emberwhelp',
    name: 'Ember Whelp',
    description: 'A mythic dragon companion. +9% Attack, +9% Boss Damage and +5% Fire Resistance at level 1.',
    cost: 900,
    icon: 'paw',
    category: 'companion',
    grant: { kind: 'pet', petId: 'emberwhelp' },
  },
  {
    id: 'pet_lumina',
    name: 'Lumina',
    description: 'A divine dawn-shard companion with broad passive bonuses.',
    cost: 1800,
    icon: 'paw',
    category: 'companion',
    grant: { kind: 'pet', petId: 'lumina' },
  },
  {
    id: 'mount_obsidian',
    name: 'Obsidian Drake',
    description: 'A legendary drake mount. +9% Attack and +6% Boss Damage at level 1.',
    cost: 1200,
    icon: 'mount',
    category: 'companion',
    grant: { kind: 'mount', mountId: 'obsidiandrake' },
  },
  {
    id: 'mount_storm',
    name: 'Storm Griffin',
    description: 'A mythic griffin mount. +4% Critical Chance and +5% Attack Speed at level 1.',
    cost: 2200,
    icon: 'mount',
    category: 'companion',
    grant: { kind: 'mount', mountId: 'stormgriffin' },
  },
]

export const BOOSTER_HOURS = 2

// The verification server credits coins from shared/iap-products.json. Fail
// loudly rather than letting a Play product deliver a different amount than
// the one the player saw in the shop.
const productDrift = COIN_PACKAGES.filter(
  (product) => (productCoins as Record<string, number>)[product.productId] !== product.coins,
)
if (productDrift.length) {
  const detail = productDrift.map((p) => `${p.productId} → ${p.coins}`).join(', ')
  throw new Error(
    `[Aetherfall] shared/iap-products.json is out of sync with COIN_PACKAGES: ${detail}. ` +
      'Update the shared product map so server-verified coin amounts match the shop.',
  )
}
