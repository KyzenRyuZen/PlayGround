import { L } from '../core/i18n.js';

export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: L('Krieger', 'Warrior'),
    role: L('Tank · Nahkampf', 'Tank · Melee'),
    weapon: L('Kriegsaxt & Turmschild', 'War Axe & Tower Shield'),
    armorType: L('Schwer', 'Heavy'),
    color: '#d2a35c',
    accent: '#8f3f2f',
    resource: 'rage',
    base: { hp: 280, attack: 16, armor: 15, crit: 0.05, critDmg: 1.5, speed: 196, resourceMax: 100, hpRegen: 4.5, resourceRegen: 0 },
    growth: { hp: 36, attack: 3.2, armor: 3.1, crit: 0.0008, critDmg: 0.005, hpRegen: 0.5 },
    passive: { id: 'ironhide', name: L('Eisenhaut', 'Ironhide'), desc: L('Erhöht Rüstung um 12 %.', 'Increases armor by 12%.'), icon: 'shield' },
    skills: [
      { id: 'cleave', name: L('Klingensturm', 'Bladestorm'), desc: L('Wirbelt die Waffe und trifft alle Feinde um dich herum.', 'Whirls your weapon, striking all enemies around you.'), unlock: 2, cd: 7, cost: 30, range: 138, radius: 138, mult: 1.35, type: 'aoe', dmg: 'physical', icon: 'whirl', color: '#e3b262' },
      { id: 'bash', name: L('Schildstoß', 'Shield Bash'), desc: L('Betäubt ein Ziel und verursacht schweren Schaden.', 'Stuns a target and deals heavy damage.'), unlock: 5, cd: 9, cost: 25, range: 118, radius: 0, mult: 1.9, type: 'single', dmg: 'physical', icon: 'shield', color: '#e8c477', effect: 'stun' },
      { id: 'unbroken', name: L('Unbeugsam', 'Unbroken'), desc: L('Stärkt deine Rüstung und heilt dich über Zeit.', 'Fortifies your armor and heals you over time.'), unlock: 9, cd: 22, cost: 40, range: 0, radius: 0, mult: 0, type: 'buff', dmg: 'holy', icon: 'heart', color: '#f2d27a', effect: 'unbroken' },
    ],
  },
  mage: {
    id: 'mage',
    name: L('Magier', 'Mage'),
    role: L('Fernkampf · Magie', 'Ranged · Magic'),
    weapon: L('Aetherstab & Foliant', 'Aether Staff & Tome'),
    armorType: L('Leicht', 'Light'),
    color: '#7fb7e6',
    accent: '#6a4fbf',
    resource: 'mana',
    base: { hp: 180, attack: 21, armor: 6, crit: 0.06, critDmg: 1.55, speed: 198, resourceMax: 130, hpRegen: 2.4, resourceRegen: 7.5 },
    growth: { hp: 23, attack: 4.3, armor: 1.3, crit: 0.001, critDmg: 0.006, hpRegen: 0.3 },
    passive: { id: 'aetherflow', name: L('Aetherfluss', 'Aetherflow'), desc: L('Erhöht Manaregeneration um 20 %.', 'Increases mana regeneration by 20%.'), icon: 'spark' },
    skills: [
      { id: 'frostnova', name: L('Frostnova', 'Frost Nova'), desc: L('Friert Feinde in der Nähe ein und verlangsamt sie.', 'Freezes nearby enemies and slows them.'), unlock: 2, cd: 8, cost: 32, range: 160, radius: 160, mult: 1.25, type: 'aoe', dmg: 'frost', icon: 'snow', color: '#8fd8ff', effect: 'slow' },
      { id: 'lance', name: L('Aetherlanze', 'Aether Lance'), desc: L('Durchbohrt einen Feind mit gebündeltem Sternenlicht.', 'Pierces an enemy with focused starlight.'), unlock: 5, cd: 6, cost: 26, range: 380, radius: 0, mult: 2.3, type: 'single', dmg: 'holy', icon: 'lance', color: '#c4b2ff' },
      { id: 'meteor', name: L('Meteorfälle', 'Meteorfall'), desc: L('Ruft einen Meteorschwarm auf das Zielgebiet herab.', 'Calls a swarm of meteors down on the target area.'), unlock: 9, cd: 15, cost: 58, range: 320, radius: 158, mult: 3.0, type: 'ground', dmg: 'fire', icon: 'meteor', color: '#ff9a5c', effect: 'burn' },
    ],
  },
  assassin: {
    id: 'assassin',
    name: L('Assassine', 'Assassin'),
    role: L('Schaden · Beweglichkeit', 'Damage · Agility'),
    weapon: L('Zwillingsklingen', 'Twin Blades'),
    armorType: L('Mittel', 'Medium'),
    color: '#b06bcd',
    accent: '#3c2d55',
    resource: 'energy',
    base: { hp: 205, attack: 18, armor: 9, crit: 0.1, critDmg: 1.62, speed: 218, resourceMax: 110, hpRegen: 3.2, resourceRegen: 9 },
    growth: { hp: 28, attack: 3.7, armor: 1.9, crit: 0.0012, critDmg: 0.008, hpRegen: 0.35 },
    passive: { id: 'executioner', name: L('Meuchelmörder', 'Executioner'), desc: L('Erhöht Krit-Schaden um 15 %.', 'Increases crit damage by 15%.'), icon: 'dagger' },
    skills: [
      { id: 'step', name: L('Schattenschritt', 'Shadowstep'), desc: L('Springt durch die Schatten hinter dein Ziel und stärkt den nächsten Hieb.', 'Steps through shadows behind your target and empowers your next strike.'), unlock: 2, cd: 8, cost: 24, range: 210, radius: 0, mult: 0.8, type: 'dash', dmg: 'shadow', icon: 'step', color: '#c08cf0', effect: 'empower' },
      { id: 'venom', name: L('Giftzahn', 'Venomfang'), desc: L('Vergiftet die Klinge. Der Feind erleidet Schaden über Zeit.', 'Poisons the blade. The enemy takes damage over time.'), unlock: 5, cd: 7, cost: 20, range: 98, radius: 0, mult: 1.25, type: 'single', dmg: 'poison', icon: 'venom', color: '#8ce07a', effect: 'poison' },
      { id: 'dance', name: L('Klingentanz', 'Bladedance'), desc: L('Entfesselt eine Serie blitzschneller Schnitte.', 'Unleashes a series of lightning-fast cuts.'), unlock: 9, cd: 12, cost: 36, range: 112, radius: 112, mult: 3.4, type: 'aoe', dmg: 'physical', icon: 'blades', color: '#e29cf5', effect: 'bleed' },
    ],
  },
};

export const CLASS_IDS = ['warrior', 'mage', 'assassin'];
export const CLASS_ICON = { warrior: 'axe', mage: 'staff', assassin: 'daggers' };
export const FACTION_BONUS = {
  angel: { armor: 0.06, healing: 0.06, label: L('+6 % Rüstung', '+6% armor') },
  demon: { attack: 0.06, lifesteal: 0.02, label: L('+6 % Angriff', '+6% attack') },
};

export const HAIR_STYLES = [
  { id: 1, name: L('Kurz', 'Short') },
  { id: 2, name: L('Lang', 'Long') },
  { id: 3, name: L('Pferdeschwanz', 'Ponytail') },
  { id: 4, name: L('Zöpfe', 'Braids') },
  { id: 5, name: L('Bun', 'Bun') },
  { id: 6, name: L('Wuschel', 'Tousled') },
];

export const HAIR_COLORS = [
  { id: 'ink', hex: '#1b1a20', name: L('Tintenschwarz', 'Ink Black') },
  { id: 'ash', hex: '#6d6a6f', name: L('Aschegrau', 'Ash Grey') },
  { id: 'silver', hex: '#d8d5dc', name: L('Silberweiß', 'Silver White') },
  { id: 'chestnut', hex: '#6b4226', name: L('Kastanie', 'Chestnut') },
  { id: 'copper', hex: '#a65a32', name: L('Kupfer', 'Copper') },
  { id: 'gold', hex: '#d7b46a', name: L('Goldblond', 'Gold Blond') },
  { id: 'crimson', hex: '#8e2f37', name: L('Karminrot', 'Crimson') },
  { id: 'violet', hex: '#6f4b91', name: L('Violett', 'Violet') },
  { id: 'teal', hex: '#326d6c', name: L('Tiefsee', 'Deep Teal') },
];

export const EYE_COLORS = [
  { id: 'amber', hex: '#e6b35c', name: L('Bernstein', 'Amber') },
  { id: 'emerald', hex: '#63c99a', name: L('Smaragd', 'Emerald') },
  { id: 'sapphire', hex: '#6aa8ea', name: L('Saphir', 'Sapphire') },
  { id: 'amethyst', hex: '#b07ce0', name: L('Amethyst', 'Amethyst') },
  { id: 'ruby', hex: '#e06060', name: L('Rubin', 'Ruby') },
  { id: 'silver', hex: '#cfd8e2', name: L('Silber', 'Silver') },
  { id: 'void', hex: '#8f7bd8', name: L('Leere', 'Void') },
  { id: 'gold', hex: '#f2d98a', name: L('Gold', 'Gold') },
];

export const OUTFITS = [
  { id: 1, name: L('Nachtwache', 'Nightwatch'), angel: ['#e7e2d4', '#b89857', '#46536b'], demon: ['#3a2428', '#b64b45', '#7e2b31'] },
  { id: 2, name: L('Ascheklinge', 'Ashblade'), angel: ['#c9d6e4', '#7e93ad', '#2f3b4a'], demon: ['#2a2229', '#8a3b3b', '#3b2b36'] },
  { id: 3, name: L('Morgenrot', 'Dawnrise'), angel: ['#f2d9b8', '#c88e5c', '#6b4d44'], demon: ['#42262a', '#c9733f', '#5c2b2b'] },
];

export const RANDOM_NAMES = {
  angel: ['Aurelia', 'Seraphine', 'Lioran', 'Elowen', 'Cassiel', 'Mirelle', 'Aelric', 'Solene', 'Nerissa', 'Vaelin'],
  demon: ['Malzareth', 'Vesper', 'Azrun', 'Nyxara', 'Kael', 'Sable', 'Vorgath', 'Lilith', 'Morvane', 'Zephira'],
};
