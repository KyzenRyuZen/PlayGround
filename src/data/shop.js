import { L } from '../core/i18n.js';

export const MOUNTS = {
  mount_stag: { id: 'mount_stag', name: L('Silberhirsch', 'Silver Stag'), desc: L('Ein uralter Hirsch aus den Tiefen Greendales. Questbelohnung aus Kapitel 1.', 'An ancient stag from the deep Greendale. Chapter 1 quest reward.'), speed: 0.34, price: 0, source: 'quest', body: '#d8d2c4', mane: '#eae4d2', glow: '#cfe6a0', icon: 'stag' },
  mount_wolf: { id: 'mount_wolf', name: L('Schattenwolf', 'Shadow Wolf'), desc: L('Ein Wolf mit Augen wie zwei Sterne. Schnell und leise.', 'A wolf with eyes like two stars. Fast and silent.'), speed: 0.38, price: 350, source: 'shop', body: '#3b3642', mane: '#6f667a', glow: '#b9a2ff', icon: 'wolf' },
  mount_drake: { id: 'mount_drake', name: L('Ascheflügel-Drache', 'Ashwing Drake'), desc: L('Ein junger Drache, dessen Schwingen nach Asche riechen.', 'A young drake whose wings smell of ash.'), speed: 0.45, price: 620, source: 'shop', body: '#4a2320', mane: '#b6563c', glow: '#ff8a5c', icon: 'dragon' },
  mount_nightmare: { id: 'mount_nightmare', name: L('Albtraum', 'Nightmare'), desc: L('Ein Ross aus schwarzem Feuer. Die Straße brennt unter seinen Hufen.', 'A steed of black fire. The road burns beneath its hooves.'), speed: 0.52, price: 900, source: 'shop', body: '#221826', mane: '#8f3b66', glow: '#e06b63', icon: 'horse' },
};

export const PETS = {
  pet_wisp: { id: 'pet_wisp', name: L('Aetherwisp', 'Aether Wisp'), desc: L('Ein kleines Licht, das deine Schritte begleitet.', 'A little light that follows your steps.'), price: 200, color: '#b9e6ff', icon: 'wisp' },
  pet_raven: { id: 'pet_raven', name: L('Nachtrabe', 'Night Raven'), desc: L('Ein Rabe, der Geheimnisse sammelt.', 'A raven that collects secrets.'), price: 220, color: '#8d7bc4', icon: 'raven' },
  pet_imp: { id: 'pet_imp', name: L('Kleiner Aschenbold', 'Little Ash Imp'), desc: L('Frech, feurig und angeblich harmlos.', 'Cheeky, fiery and allegedly harmless.'), price: 260, color: '#ff8a5c', icon: 'imp' },
};

export const FXS = {
  fx_ember: { id: 'fx_ember', name: L('Glutklinge', 'Ember Blade'), desc: L('Deine Waffe hinterlässt glühende Spuren.', 'Your weapon leaves glowing trails.'), price: 300, color: '#ff8a5c', icon: 'flame' },
  fx_frost: { id: 'fx_frost', name: L('Frostklinge', 'Frost Blade'), desc: L('Eisige Splitter folgen jedem Hieb.', 'Icy shards follow every strike.'), price: 300, color: '#9fe8ff', icon: 'snow' },
  fx_void: { id: 'fx_void', name: L('Leerenklinge', 'Void Blade'), desc: L('Die Klinge schneidet durch den Raum selbst.', 'The blade cuts through space itself.'), price: 340, color: '#c08cf0', icon: 'void' },
};

export const WINGS_SHOP = {
  wing_light: { id: 'wing_light', name: L('Lichtschwingen', 'Wings of Light'), desc: L('Schwingen aus reinem Morgenlicht. Rein kosmetisch.', 'Wings of pure morning light. Purely cosmetic.'), price: 420, color: '#e3f2ff', icon: 'wings', source: 'shop' },
  wing_void: { id: 'wing_void', name: L('Schattenflügel', 'Void Wings'), desc: L('Flügel aus gefalteter Leere. Rein kosmetisch.', 'Wings of folded void. Purely cosmetic.'), price: 420, color: '#c08cf0', icon: 'wings', source: 'shop' },
  wing_eternity: { id: 'wing_eternity', name: L('Flügel der Ewigkeit', 'Wings of Eternity'), desc: L('Nur die Vollendung von Kapitel 4 verleiht diese Flügel. Nicht im Shop, nicht handelbar.', 'Granted only by completing Chapter 4. Not in the shop, not tradeable.'), price: 0, color: '#f4df9a', icon: 'wings', source: 'quest' },
};

export const COSTUMES = {
  costume_warden: { id: 'costume_warden', name: L('Wächtergewand', 'Warden Regalia'), desc: L('Das zeremonielle Gewand der letzten Wächter.', 'The ceremonial garb of the last wardens.'), price: 240, colors: ['#e8dfc8', '#c8a45c', '#3a3f54'], icon: 'costume' },
  costume_ash: { id: 'costume_ash', name: L('Aschenmantel', 'Ashen Mantle'), desc: L('Ein Mantel aus verblichenem Adel.', 'A mantle of faded nobility.'), price: 280, colors: ['#3d2a2a', '#b65b47', '#241a1c'], icon: 'costume' },
  costume_star: { id: 'costume_star', name: L('Sternenweber', 'Starweaver'), desc: L('Stoff, gewebt aus dem Licht erloschener Sterne.', 'Cloth woven from the light of dead stars.'), price: 320, colors: ['#2c2b4c', '#b9a2ff', '#16152a'], icon: 'costume' },
  costume_royal: { id: 'costume_royal', name: L('Königliches Blut', 'Royal Blood'), desc: L('Für jene, die Throne nicht nur besteigen, sondern erschaffen.', 'For those who do not just climb thrones, but create them.'), price: 360, colors: ['#5b1f26', '#e8c477', '#2a1114'], icon: 'costume' },
};

export const HAIR_SHOP = {
  hair4: { id: 'hair4', type: 'hair', name: L('Zöpfe der Walküre', 'Valkyrie Braids'), desc: L('Geflochtenes Haar, wie es die Himmelswächter trugen.', 'Braided hair as worn by the sky wardens.'), price: 80, style: 4, icon: 'hair' },
  hair5: { id: 'hair5', type: 'hair', name: L('Bun der Ewigkeit', 'Eternity Bun'), desc: L('Ein makelloser Knoten für große Schlachten.', 'A flawless bun for great battles.'), price: 80, style: 5, icon: 'hair' },
  hair6: { id: 'hair6', type: 'hair', name: L('Wilde Mähne', 'Wild Mane'), desc: L('Ungezähmt wie die Wälder von Venomwood.', 'Untamed like the woods of Venomwood.'), price: 90, style: 6, icon: 'hair' },
};

export const GEM_PACKS = [
  { id: 'gems_daily', name: L('Tägliche Gabe', 'Daily Gift'), desc: L('Einmal pro Tag: 15 Gems und 250 Gold.', 'Once per day: 15 gems and 250 gold.'), price: 0, gems: 15, gold: 250, daily: true, icon: 'gift' },
  { id: 'gems_quest', name: L('Questgems', 'Quest Gems'), desc: L('Haupt- und Nebenquests vergeben Gems. Kein Echtgeld nötig.', 'Main and side quests award gems. No real money needed.'), price: 0, gems: 0, icon: 'gem' },
  { id: 'gems_boss', name: L('Bossgems', 'Boss Gems'), desc: L('Der erste Sieg über einen Gebietsboss gibt 20 Gems.', 'The first victory over a zone boss grants 20 gems.'), price: 0, gems: 0, icon: 'skull' },
];

export const SHOP_TABS = ['featured', 'costumes', 'hair', 'mounts', 'pets', 'fx', 'wings', 'gems'];

export function shopCatalog(tab) {
  switch (tab) {
    case 'costumes': return Object.values(COSTUMES);
    case 'hair': return Object.values(HAIR_SHOP);
    case 'mounts': return Object.values(MOUNTS).filter((m) => m.source === 'shop');
    case 'pets': return Object.values(PETS);
    case 'fx': return Object.values(FXS);
    case 'wings': return Object.values(WINGS_SHOP);
    case 'gems': return GEM_PACKS;
    case 'featured':
    default:
      return [
        MOUNTS.mount_wolf, COSTUMES.costume_warden, PETS.pet_wisp, FXS.fx_ember, WINGS_SHOP.wing_void,
      ];
  }
}
