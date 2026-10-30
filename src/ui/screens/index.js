/* Route table for the screen renderers. */

import * as home from './home.js';
import * as character from './character.js';
import * as inventory from './inventory.js';
import * as equipment from './equipment.js';
import * as skills from './skills.js';
import * as companions from './companions.js';
import * as stages from './stages.js';
import * as dungeons from './dungeons.js';
import * as forge from './forge.js';
import * as fusion from './fusion.js';
import * as stones from './stones.js';
import * as costumes from './costumes.js';
import * as shop from './shop.js';
import * as quests from './quests.js';
import * as settings from './settings.js';

export const SCREENS = {
  home,
  character,
  inventory,
  equipment,
  skills,
  companions,
  stages,
  dungeons,
  forge,
  fusion,
  stones,
  costumes,
  shop,
  quests,
  settings,
};

export const DEFAULT_ROUTE = 'home';
