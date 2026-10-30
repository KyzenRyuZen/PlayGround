export type Tab =
  | 'battle'
  | 'character'
  | 'inventory'
  | 'equipment'
  | 'skills'
  | 'pets'
  | 'mounts'
  | 'stages'
  | 'dungeons'
  | 'blacksmith'
  | 'fusion'
  | 'stones'
  | 'costumes'
  | 'shop'
  | 'settings'

export const TAB_META: Record<Tab, { label: string; icon: string; group: string; blurb: string }> = {
  battle: { label: 'Battle', icon: 'battle', group: 'Journey', blurb: 'Auto-farm the Sundered Realms.' },
  stages: { label: 'Stages', icon: 'stages', group: 'Journey', blurb: 'Choose where to farm.' },
  dungeons: { label: 'Dungeons', icon: 'dungeons', group: 'Journey', blurb: 'Hunt guardians for rare spoils.' },
  character: { label: 'Character', icon: 'character', group: 'Hero', blurb: 'Attributes, power and progression.' },
  equipment: { label: 'Equipment', icon: 'equipment', group: 'Hero', blurb: 'Your nine worn relics.' },
  inventory: { label: 'Inventory', icon: 'inventory', group: 'Hero', blurb: 'Loot, lock and equip.' },
  skills: { label: 'Skills', icon: 'skills', group: 'Hero', blurb: 'Class abilities and ranks.' },
  stones: { label: 'Magical Stones', icon: 'stones', group: 'Hero', blurb: 'Socket and empower runestones.' },
  costumes: { label: 'Costumes', icon: 'costumes', group: 'Hero', blurb: 'Skins, hair and auras.' },
  pets: { label: 'Pets', icon: 'pets', group: 'Bonds', blurb: 'Loyal companions and passives.' },
  mounts: { label: 'Mounts', icon: 'mounts', group: 'Bonds', blurb: 'Steeds of legend.' },
  blacksmith: { label: 'Blacksmith', icon: 'blacksmith', group: 'Craft', blurb: 'Upgrade and enchant gear.' },
  fusion: { label: 'Fusion', icon: 'fusion', group: 'Craft', blurb: 'Four alike become one greater.' },
  shop: { label: 'Premium Shop', icon: 'shop', group: 'Market', blurb: 'Coins, boosters and cosmetics.' },
  settings: { label: 'Settings', icon: 'settings', group: 'Market', blurb: 'Save data and preferences.' },
}

export const TAB_ORDER: Tab[] = [
  'battle',
  'stages',
  'dungeons',
  'character',
  'equipment',
  'inventory',
  'skills',
  'stones',
  'costumes',
  'pets',
  'mounts',
  'blacksmith',
  'fusion',
  'shop',
  'settings',
]

export const NAV_GROUPS: { label: string; tabs: Tab[] }[] = [
  { label: 'Journey', tabs: ['battle', 'stages', 'dungeons'] },
  { label: 'Hero', tabs: ['character', 'equipment', 'inventory', 'skills', 'stones', 'costumes'] },
  { label: 'Bonds', tabs: ['pets', 'mounts'] },
  { label: 'Craft', tabs: ['blacksmith', 'fusion'] },
  { label: 'Market', tabs: ['shop', 'settings'] },
]

export const BOTTOM_TABS: Tab[] = ['battle', 'character', 'inventory', 'blacksmith', 'shop']
