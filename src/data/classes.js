/* Classes, base attributes and the complete skill kit for each path. */

export const PASSIVES = {
  warrior: {
    id: 'passive_warrior',
    name: 'Ironblood',
    icon: 'heart',
    desc: '+12% maximum HP and +10% defense from the Vanguard discipline.',
    bonuses: { hpPct: 12, defensePct: 10 },
  },
  mage: {
    id: 'passive_mage',
    name: 'Arcane Mind',
    icon: 'arcane',
    desc: '+25% maximum MP, +20% MP regeneration and +10% skill damage.',
    bonuses: { mpPct: 25, mpRegenPct: 20, skillDamage: 10 },
  },
  archer: {
    id: 'passive_archer',
    name: 'Eagle Eye',
    icon: 'eye',
    desc: '+8% critical chance and +12% attack speed.',
    bonuses: { critChance: 8, attackSpeed: 12 },
  },
};

export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    order: 'Vanguard',
    tagline: 'Steel remembers what the living forget.',
    lore: 'A wall of scarred plate and stubborn will. The Vanguard thrives where the line breaks, turning every wound into another reason to swing.',
    color: '#e5a45d',
    glow: 'rgba(229,164,93,.2)',
    baseWeapon: { name: 'Iron Oathblade', min: 11, max: 15, speed: 0.98 },
    autoWeights: { strength: 2, vitality: 1 },
    growthText: 'Strength & Vitality',
    startingSkill: 'cleave',
    weaponType: 'Sword',
    baseCrit: 4,
    moveSpeed: 1,
    stats: { strength: 12, intelligence: 4, dexterity: 6, vitality: 11 },
    passive: PASSIVES.warrior,
    skills: [
      {
        id: 'cleave', name: 'Cleaving Arc', icon: 'slash', unlock: 1, mana: 12, cooldown: 4.2,
        type: 'damage', mult: 1.85, element: 'physical', color: '#ffb06e', priority: 4,
        desc: 'A wide sweep that deals {mult}% weapon damage to the target.',
      },
      {
        id: 'war_cry', name: 'Battle Roar', icon: 'roar', unlock: 5, mana: 20, cooldown: 18,
        type: 'buff', buff: { stat: 'attackPct', value: 25, duration: 8 }, color: '#ff9a55', priority: 3,
        desc: 'Raises attack by 25% for 8 seconds.',
      },
      {
        id: 'whirlwind', name: 'Sundering Whirl', icon: 'whirl', unlock: 10, mana: 28, cooldown: 9.5,
        type: 'damage', mult: 2.65, element: 'physical', color: '#ffd08a', priority: 5,
        desc: 'A brutal spinning cut for {mult}% weapon damage. Always critical against bosses.',
        bossCrit: true,
      },
      {
        id: 'iron_bulwark', name: 'Iron Bulwark', icon: 'shield', unlock: 20, mana: 22, cooldown: 22,
        type: 'shield', shieldPct: 22, duration: 10, condition: 'hpBelow75', color: '#e6c07a', priority: 2,
        desc: 'Weaves a shield absorbing 22% of maximum HP for 10 seconds when wounded.',
      },
    ],
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    order: 'Arcanist',
    tagline: 'The rift answers those bold enough to knock.',
    lore: 'A scholar of forbidden currents. The Arcanist unmakes armor with frost, sets the air alight, and always has one more spell than the enemy expects.',
    color: '#a88bff',
    glow: 'rgba(141,108,242,.24)',
    baseWeapon: { name: 'Kindled Runestaff', min: 10, max: 14, speed: 1.04 },
    autoWeights: { intelligence: 2, vitality: 1 },
    growthText: 'Intelligence & Vitality',
    startingSkill: 'emberbolt',
    weaponType: 'Staff',
    baseCrit: 5,
    moveSpeed: 1,
    stats: { strength: 4, intelligence: 13, dexterity: 6, vitality: 8 },
    passive: PASSIVES.mage,
    skills: [
      {
        id: 'emberbolt', name: 'Emberlance', icon: 'flame', unlock: 1, mana: 14, cooldown: 3.8,
        type: 'damage', mult: 1.95, element: 'fire', color: '#ff8a4c', priority: 4,
        desc: 'Hurls a spear of living flame for {mult}% spell damage.',
      },
      {
        id: 'frost_nova', name: 'Frost Nova', icon: 'frost', unlock: 5, mana: 24, cooldown: 11,
        type: 'damage', mult: 1.5, element: 'ice', color: '#8bd6ff', priority: 3,
        desc: 'Freezes the target in place for 2.5 seconds and deals {mult}% spell damage.',
        freeze: 2.5,
      },
      {
        id: 'arcane_lance', name: 'Arcane Lance', icon: 'lance', unlock: 10, mana: 32, cooldown: 10,
        type: 'damage', mult: 3.1, element: 'arcane', color: '#c3a8ff', priority: 5,
        desc: 'Pierces reality for {mult}% spell damage and ignores 25% of enemy defense.',
        armorPen: 25,
      },
      {
        id: 'mana_shield', name: 'Aether Ward', icon: 'ward', unlock: 20, mana: 20, cooldown: 20,
        type: 'shield', shieldPct: 18, duration: 12, condition: 'hpBelow70', color: '#b49bff', priority: 2,
        desc: 'A shimmering ward absorbs 18% of maximum HP for 12 seconds when wounded.',
      },
    ],
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    order: 'Ranger',
    tagline: 'One breath. One arrow. One less monster.',
    lore: 'A ghost between the trees. The Ranger reads the wind, poisons the silence, and finishes fights before the enemy knows they began.',
    color: '#79d6a2',
    glow: 'rgba(121,214,162,.2)',
    baseWeapon: { name: 'Vale Longbow', min: 10, max: 14, speed: 1.12 },
    autoWeights: { dexterity: 2, vitality: 1 },
    growthText: 'Dexterity & Vitality',
    startingSkill: 'piercing_shot',
    weaponType: 'Bow',
    baseCrit: 6,
    moveSpeed: 1.05,
    stats: { strength: 6, intelligence: 6, dexterity: 13, vitality: 9 },
    passive: PASSIVES.archer,
    skills: [
      {
        id: 'piercing_shot', name: 'Piercing Shot', icon: 'pierce', unlock: 1, mana: 12, cooldown: 3.9,
        type: 'damage', mult: 1.9, element: 'physical', color: '#9ee7b8', priority: 4,
        desc: 'An arrow that ignores 30% of enemy defense for {mult}% weapon damage.',
        armorPen: 30,
      },
      {
        id: 'hunters_mark', name: "Hunter's Mark", icon: 'mark', unlock: 5, mana: 18, cooldown: 17,
        type: 'buff', buff: { stat: 'critChance', value: 18, duration: 9 }, color: '#bfeecb', priority: 3,
        desc: 'Marks the prey. +18% critical chance for 9 seconds.',
      },
      {
        id: 'arrow_rain', name: 'Rain of Arrows', icon: 'rain', unlock: 10, mana: 27, cooldown: 9,
        type: 'damage', mult: 2.8, element: 'physical', color: '#c5f4d2', priority: 5,
        desc: 'A lethal volley dealing {mult}% weapon damage to the target.',
      },
      {
        id: 'evasive_roll', name: 'Shadowstep', icon: 'roll', unlock: 20, mana: 16, cooldown: 15,
        type: 'buff', buff: { stat: 'damageReduction', value: 35, duration: 6 }, condition: 'hpBelow70', color: '#70cfa0', priority: 2,
        desc: 'Melt into shadow, reducing incoming damage by 35% for 6 seconds when wounded.',
      },
    ],
  },
};

export function classById(id) { return CLASSES[id] || CLASSES.warrior; }
export function skillById(classId, skillId) {
  return classById(classId).skills.find(s => s.id === skillId);
}
export function allSkills(classId) { return classById(classId).skills; }
