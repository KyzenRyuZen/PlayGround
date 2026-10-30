/* Daily contracts and long-term milestones. */

export const DAILY_CONTRACTS = [
  {
    id: 'daily_slayer', name: 'Cull the Herd', icon: 'sword', metric: 'kills', target: 150,
    desc: 'Defeat 150 monsters anywhere in the realms.',
    rewards: [{ type: 'gold', amount: 1800 }, { type: 'material', key: 'upgradeStone', amount: 12 }],
  },
  {
    id: 'daily_boss', name: 'Crownbreaker', icon: 'skull', metric: 'bossKills', target: 3,
    desc: 'Defeat 3 bosses or elite guardians.',
    rewards: [{ type: 'gold', amount: 3200 }, { type: 'material', key: 'ember', amount: 3 }],
  },
  {
    id: 'daily_gold', name: 'A Heavy Purse', icon: 'coin', metric: 'goldEarned', target: 6000,
    desc: 'Earn 6,000 gold from hunts and spoils.',
    rewards: [{ type: 'gold', amount: 2200 }, { type: 'material', key: 'blessing', amount: 5 }],
  },
  {
    id: 'daily_dungeon', name: 'Into the Dark', icon: 'gate', metric: 'dungeonClears', target: 1,
    desc: 'Complete any dungeon expedition.',
    rewards: [{ type: 'gold', amount: 4500 }, { type: 'material', key: 'protection', amount: 1 }],
  },
  {
    id: 'daily_forge', name: 'Sparks and Sweat', icon: 'hammer', metric: 'upgrades', target: 5,
    desc: 'Attempt 5 equipment upgrades at the blacksmith.',
    rewards: [{ type: 'gold', amount: 2600 }, { type: 'material', key: 'stoneDust', amount: 8 }],
  },
];

export const MILESTONES = [
  { id: 'ms_first_blood', name: 'First Blood', desc: 'Defeat 10 monsters.', icon: 'sword', metric: 'kills', target: 10, rewards: [{ type: 'gold', amount: 300 }] },
  { id: 'ms_wolfbane', name: 'Wolfbane', desc: 'Defeat 100 monsters.', icon: 'skull', metric: 'kills', target: 100, rewards: [{ type: 'gold', amount: 1200 }, { type: 'premium', amount: 10 }] },
  { id: 'ms_veteran', name: 'Veteran of the Vale', desc: 'Reach level 10.', icon: 'level', metric: 'level', target: 10, rewards: [{ type: 'gold', amount: 1500 }, { type: 'material', key: 'upgradeStone', amount: 10 }] },
  { id: 'ms_power', name: 'A Rising Power', desc: 'Reach 500 power.', icon: 'power', metric: 'power', target: 500, rewards: [{ type: 'gold', amount: 2000 }, { type: 'material', key: 'enchant', amount: 1 }] },
  { id: 'ms_boss_hunter', name: 'Crownfall', desc: 'Defeat 10 bosses.', icon: 'crown', metric: 'bossKills', target: 10, rewards: [{ type: 'gold', amount: 4000 }, { type: 'premium', amount: 15 }] },
  { id: 'ms_forge', name: 'The Tenth Strike', desc: 'Upgrade an item to +10.', icon: 'hammer', metric: 'bestUpgrade', target: 10, rewards: [{ type: 'gold', amount: 6000 }, { type: 'material', key: 'protection', amount: 2 }] },
  { id: 'ms_fusion', name: 'Impossible Geometry', desc: 'Fuse a Legendary item.', icon: 'merge', metric: 'legendaryFusions', target: 1, rewards: [{ type: 'gold', amount: 5000 }, { type: 'material', key: 'chaos', amount: 1 }] },
  { id: 'ms_dungeon', name: 'Delver', desc: 'Clear 5 dungeons.', icon: 'gate', metric: 'dungeonClears', target: 5, rewards: [{ type: 'gold', amount: 8000 }, { type: 'premium', amount: 20 }] },
  { id: 'ms_level_50', name: 'Halfway to Heaven', desc: 'Reach level 50.', icon: 'level', metric: 'level', target: 50, rewards: [{ type: 'gold', amount: 20000 }, { type: 'premium', amount: 25 }] },
  { id: 'ms_rich', name: 'Dragon\'s Hoard', desc: 'Earn 100,000 gold in total.', icon: 'coin', metric: 'goldEarned', target: 100000, rewards: [{ type: 'gold', amount: 10000 }, { type: 'material', key: 'ember', amount: 10 }] },
  { id: 'ms_stage_2', name: 'Beyond the Vale', desc: 'Unlock the Ashen Marches.', icon: 'map', metric: 'stagesCleared', target: 20, rewards: [{ type: 'gold', amount: 5000 }, { type: 'premium', amount: 20 }] },
  { id: 'ms_stage_6', name: 'The Last Road', desc: 'Unlock the Celestial Rift.', icon: 'map', metric: 'stagesCleared', target: 100, rewards: [{ type: 'gold', amount: 100000 }, { type: 'premium', amount: 100 }] },
  { id: 'ms_divine', name: 'Touched by Heaven', desc: 'Own a Divine item.', icon: 'spark', metric: 'divineOwned', target: 1, rewards: [{ type: 'gold', amount: 50000 }, { type: 'premium', amount: 100 }] },
  { id: 'ms_level_100', name: 'Riftbound', desc: 'Reach level 100.', icon: 'level', metric: 'level', target: 100, rewards: [{ type: 'gold', amount: 200000 }, { type: 'premium', amount: 150 }] },
];

export const METRIC_LABELS = {
  kills: 'Monsters slain', bossKills: 'Bosses felled', goldEarned: 'Gold earned', dungeonClears: 'Dungeons cleared',
  upgrades: 'Forge attempts', level: 'Hero level', power: 'Power score', bestUpgrade: 'Best upgrade',
  legendaryFusions: 'Legendary fusions', stagesCleared: 'Stages cleared', divineOwned: 'Divine items owned',
};
