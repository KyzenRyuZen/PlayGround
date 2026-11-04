# PlayGround

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

## Mosswold Vale

A cozy top-down pixel-art fantasy village, built to feel good on a phone and
to be easy to grow.

Wander the green, find the cottage, the old well, the Wayfarer's Inn, and
Starfall Tower. Pollen drifts, chimney smoke curls, butterflies visit the
flowers, and every tile is drawn in code — no image assets required.

### Play

Open `index.html` through any static server. In the OMGithub workspace, use
the normal preview/start command.

- **Touch:** drag the ring in the bottom-left corner.
- **Keyboard:** WASD or the arrow keys.
- **Goal:** discover all four landmarks. The counter in the top-right tracks
  your progress.

The game starts immediately; there is no loading screen or start button.

### Structure

```
index.html          Page shell and UI
styles.css          Responsive HUD, chapter title, joystick chrome
js/main.js          Boot entry point
js/game.js          Loop, discoveries, toast/HUD state
js/world.js         Terrain painting, props, collisions, baked ground
js/art.js           All procedural pixel-art tiles and sprites
js/renderer.js      Pixel-perfect camera view and depth sorting
js/player.js        Smooth movement, collision response, walk cycle
js/input.js         Keyboard + pointer joystick
js/camera.js        Smoothed follow camera with world clamping
js/ambient.js       Pollen, leaves, butterflies, smoke, footstep dust
js/config.js        Shared tuning and landmark data
js/util.js          Math, seeded RNG, canvas helpers
```

Everything is deliberately data-driven. To add a building, prop, or landmark,
extend `js/world.js` or `js/config.js`; to add a tile or character frame, add a
generator in `js/art.js`. There are no external runtimes or dependencies.

