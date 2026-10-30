# Aetherfall: Sundered Realms

A complete, original dark-fantasy idle MMORPG built with Vite, React 18, and
TypeScript. Every character, monster, item, stone, and backdrop is hand-built SVG
— there are no external game assets.

## Play

```bash
npm install
npm run dev        # http://localhost:3000
```

Choose a Warrior, Mage, or Archer, then let the auto-combat loop farm while you
manage gear. Progress saves to `localStorage` under `aetherfall.save.v1`; offline
rewards accumulate for up to 12 hours.

### Systems

- **Three classes** with distinct stats, weapons, and skill rotations.
- **Auto-combat and auto-loot** across 64 stages, 8 regions, elites, stone
  monsters, and guardian bosses.
- **Nine equipment slots**, six rarities (Common → Divine), random affixes, and
  blacksmith upgrades from +0 to +15 with failure, downgrade, destruction, and
  protection scrolls.
- **Fusion** of four identical items, plus add/reroll/empower affix operations.
- **Magical stones** with six types, five grades, socketing, levelling, and
  crushing.
- **Pets and mounts** with passives, cosmetic costumes, daily trials, and timed
  dungeons.
- **Gold and Premium Coins.** Real Google Play purchases are verified by the
  included Node service. Nothing simulates a payment.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 3000. |
| `npm run build` | Type-check and produce a production build in `dist/`. |
| `npm test` | Vitest suite for items, fusion, upgrades, combat, offline, progression, stats, and persistence. |
| `npm run iap:server` | Start the Google Play verification service on port 8787. |

## Google Play purchases

The client uses the Digital Goods API and `PaymentRequest`, forwards the purchase
token to `server/iap-verifier.mjs`, and credits coins only after the server
confirms the purchase with the Android Publisher API. Product IDs and coin
amounts live in `shared/iap-products.json`; the server keeps an idempotent token
ledger so retries cannot double-deliver.

See **[docs/GOOGLE_PLAY_IAP.md](docs/GOOGLE_PLAY_IAP.md)** for Play Console
setup, the service account, environment variables, testing with license testers,
and production hardening.

> Purchasing is disabled unless `VITE_IAP_VERIFY_URL` is set and the app runs in
> an Android build with Play Billing. There is no mock checkout and no free-coin
> path.

## Project layout

```
src/
  config/        shop, IAP, and endpoint configuration
  game/
    data/        classes, items, monsters, zones, dungeons, companions, stones
    engine/      stats, items, combat, rewards, progression, offline, stones
    state/       GameStore, initial state, save persistence
    __tests__/   deterministic engine tests
  screens/       battle, character, inventory, equipment, skills, pets, mounts,
                 stages, dungeons, blacksmith, fusion, stones, costumes, shop,
                 settings
  ui/            SVG art primitives, icons, shell, modals
  services/      Google Play billing bridge
server/          dependency-free IAP verification service
shared/          product → coin map shared by client and server
docs/            Google Play IAP guide
```


<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/KyzenRyuZen/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/KyzenRyuZen/PlayGround)

- 🎮 [Open the project](https://omgithub.com/KyzenRyuZen/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=KyzenRyuZen%2FPlayGround).
- 💻 [Explore the source](https://github.com/KyzenRyuZen/PlayGround).
- 🛠️ [Check build runs](https://github.com/KyzenRyuZen/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/KyzenRyuZen/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/KyzenRyuZen).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->
