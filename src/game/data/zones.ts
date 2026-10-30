import type { Region, StageInfo } from '../types'

// Each region holds eight stages. Stage eight is always a guardian boss.
export const REGIONS: Region[] = [
  {
    id: 'whispering_hollow',
    name: 'Whispering Hollow',
    subtitle: 'Where the forest remembers names',
    stageStart: 1,
    stageEnd: 8,
    levelStart: 1,
    levelEnd: 12,
    palette: { sky: '#16202a', far: '#1d2c31', near: '#0c1417', glow: '#5fb8a0', fog: 'rgba(95,184,160,.14)' },
    pool: ['frostfang_wolf', 'gloomhide_bear', 'moor_warg', 'runestone_hoarder'],
    lore: 'Pale lanterns drift between the pines. The Hollow does not kill travellers — it keeps them.',
  },
  {
    id: 'ashen_marches',
    name: 'Ashen Marches',
    subtitle: 'The war that never ended',
    stageStart: 9,
    stageEnd: 16,
    levelStart: 13,
    levelEnd: 24,
    palette: { sky: '#2a1a16', far: '#3a241b', near: '#170e0b', glow: '#e07a3f', fog: 'rgba(224,122,63,.15)' },
    pool: ['ashfang_raider', 'moor_warg', 'gloomhide_bear', 'runestone_hoarder'],
    lore: 'Banners rot on spears no one will ever pull free. The ash falls upward here.',
  },
  {
    id: 'gloomfen',
    name: 'Gloomfen Cemetery',
    subtitle: 'A quiet that listens back',
    stageStart: 17,
    stageEnd: 24,
    levelStart: 25,
    levelEnd: 36,
    palette: { sky: '#171a26', far: '#222738', near: '#0a0c14', glow: '#8494ff', fog: 'rgba(132,148,255,.14)' },
    pool: ['gravebound_legionnaire', 'wailing_shade', 'hollow_revenant', 'runestone_hoarder'],
    lore: 'Graves are stacked like books. Something is still reading them.',
  },
  {
    id: 'emberdeep',
    name: 'Emberdeep Mines',
    subtitle: 'The stone that dreams of fire',
    stageStart: 25,
    stageEnd: 32,
    levelStart: 37,
    levelEnd: 48,
    palette: { sky: '#221510', far: '#3a1d12', near: '#120a07', glow: '#ff8b3d', fog: 'rgba(255,139,61,.16)' },
    pool: ['ashfang_raider', 'runestone_colossus', 'cinder_fiend', 'runestone_hoarder'],
    lore: 'The miners dug too deep and found a heartbeat in the ore.',
  },
  {
    id: 'frostveil',
    name: 'Frostveil Peaks',
    subtitle: 'Cold enough to keep a promise',
    stageStart: 33,
    stageEnd: 40,
    levelStart: 49,
    levelEnd: 60,
    palette: { sky: '#151f2c', far: '#263a4d', near: '#0a1119', glow: '#8ddcff', fog: 'rgba(141,220,255,.16)' },
    pool: ['frostfang_wolf', 'gloomhide_bear', 'wailing_shade', 'runestone_hoarder'],
    lore: 'The wind speaks in the voices of everyone who ever froze here.',
  },
  {
    id: 'abyssal_rift',
    name: 'Abyssal Rift',
    subtitle: 'A wound in the shape of a door',
    stageStart: 41,
    stageEnd: 48,
    levelStart: 61,
    levelEnd: 72,
    palette: { sky: '#1a1024', far: '#2b1a3a', near: '#0b0611', glow: '#c06bff', fog: 'rgba(192,107,255,.16)' },
    pool: ['cinder_fiend', 'wailing_shade', 'void_lasher', 'runestone_hoarder'],
    lore: 'No one built the Rift. It was always there, waiting to be noticed.',
  },
  {
    id: 'dragonmaw',
    name: 'Dragonmaw Caldera',
    subtitle: 'The sky has teeth',
    stageStart: 49,
    stageEnd: 56,
    levelStart: 73,
    levelEnd: 84,
    palette: { sky: '#2b1410', far: '#4a2116', near: '#150806', glow: '#ff6a3d', fog: 'rgba(255,106,61,.17)' },
    pool: ['ember_drake', 'cinder_fiend', 'ashfang_raider', 'runestone_hoarder'],
    lore: 'A caldera shaped like an open mouth. It is not closed when you look away.',
  },
  {
    id: 'celestial_ruins',
    name: 'Celestial Ruins',
    subtitle: 'The last unbroken throne',
    stageStart: 57,
    stageEnd: 64,
    levelStart: 85,
    levelEnd: 96,
    palette: { sky: '#1b1b2e', far: '#30304f', near: '#0d0d18', glow: '#ffe09a', fog: 'rgba(255,224,154,.13)' },
    pool: ['fallen_seraph', 'void_lasher', 'ember_drake', 'runestone_hoarder'],
    lore: 'The old gods left their furniture behind. Some of it is still guarding the door.',
  },
]

export const REGION_BOSSES: Record<string, string> = {
  whispering_hollow: 'fenrir_mooneaten',
  ashen_marches: 'grimmaw_unbroken',
  gloomfen: 'pale_choir',
  emberdeep: 'korvath_stoneheart',
  frostveil: 'winters_widow',
  abyssal_rift: 'malzareth',
  dragonmaw: 'vharzuun',
  celestial_ruins: 'hollow_crown',
}

export function regionForStage(stage: number): Region {
  const s = Math.max(1, Math.floor(stage))
  const region = REGIONS.find((r) => s >= r.stageStart && s <= r.stageEnd)
  if (region) return region
  // Endless endgame: cycle the visuals but keep scaling.
  return REGIONS[(Math.floor((s - 1) / 8) % REGIONS.length)]!
}

export function stageLevel(stage: number): number {
  return 1 + Math.floor((Math.max(1, stage) - 1) * 1.5)
}

export function getStageInfo(stage: number): StageInfo {
  const s = Math.max(1, Math.floor(stage))
  const region = regionForStage(s)
  const cycle = Math.floor((s - 1) / 8)
  const isBoss = s % 8 === 0
  return {
    stage: s,
    region,
    level: stageLevel(s),
    isBossStage: isBoss,
    name: isBoss ? `${region.name} — Guardian` : `${region.name} ${((s - 1) % 8) + 1}`,
  }
}

export function stageBossId(stage: number): string {
  const region = regionForStage(stage)
  return REGION_BOSSES[region.id] ?? 'fenrir_mooneaten'
}

export const MAX_STAGE = 96

export function unlockedRegions(highestStage: number): Region[] {
  return REGIONS.filter((r) => highestStage >= r.stageStart)
}

export function nextStageName(stage: number): string {
  return getStageInfo(stage).name
}
