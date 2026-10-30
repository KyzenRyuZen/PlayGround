import type { DailyDef } from '../types'

export const DAILIES: DailyDef[] = [
  {
    id: 'hunt_100',
    title: 'The Long Hunt',
    description: 'Defeat 100 monsters in any region.',
    metric: 'kills',
    target: 100,
    rewards: { gold: 6000, materials: { weapon_stone: 2, armor_stone: 2 } },
  },
  {
    id: 'boss_3',
    title: 'Guardian Breaker',
    description: 'Defeat 3 stage guardians or dungeon bosses.',
    metric: 'bosses',
    target: 3,
    rewards: { gold: 9000, materials: { protection_scroll: 1, mystic_rune: 1 } },
  },
  {
    id: 'forge_3',
    title: 'Sparks and Iron',
    description: 'Attempt 3 equipment upgrades at the Blacksmith.',
    metric: 'upgrades',
    target: 3,
    rewards: { gold: 4000, materials: { chaos_crystal: 1, refinement_powder: 2 } },
  },
  {
    id: 'delve_1',
    title: 'Into the Dark',
    description: 'Clear 1 dungeon.',
    metric: 'dungeons',
    target: 1,
    rewards: { gold: 12000, materials: { stone_dust: 6, pet_essence: 2, mount_essence: 2 } },
  },
]

export const dailyById = (id: string) => DAILIES.find((d) => d.id === id)
export const todayKey = () => new Date().toISOString().slice(0, 10)
