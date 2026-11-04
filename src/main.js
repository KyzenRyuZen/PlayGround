import { WORLD, PLAYER, BLOOM_POSITIONS } from "./config.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { Particles } from "./particles.js";
import { Sound } from "./audio.js";
import { clamp } from "./rng.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const titleScreen = document.getElementById("title-screen");
const startButton = document.getElementById("start-button");
const soundToggle = document.getElementById("sound-toggle");
const toast = document.getElementById("toast");
const track = document.getElementById("bloom-track");
const winBanner = document.getElementById("win-banner");
const winDismiss = document.getElementById("win-dismiss");
const quest = document.getElementById("quest");
const questLabel = document.getElementById("quest-label");
const fatal = document.getElementById("fatal");
const fatalMessage = document.getElementById("fatal-message");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  mode: "title",
  time: 0,
  gathered: 0,
  won: false,
  winDelay: 0,
  shrine: 0,
  toastTimer: 0,
  toastDuration: 0,
  lavaLamp: 0,
};

let world;
let player;
let camera;
let input;
let particles;
let sound;
let smokeTimers = [];
let lanternSparkle = 0;

const bloomIcons = [];

function buildHud() {
  BLOOM_POSITIONS.forEach((spot, index) => {
    const icon = document.createElement("span");
    icon.className = "bloom";
    icon.dataset.index = String(index);
    icon.setAttribute("title", spot.name);
    track.appendChild(icon);
    bloomIcons.push(icon);
  });
  updateHud();
}

function updateHud() {
  track.setAttribute("aria-label", `${state.gathered} of ${BLOOM_POSITIONS.length} starblooms gathered`);
  questLabel.textContent = `Starblooms · ${state.gathered} / ${BLOOM_POSITIONS.length}`;
  bloomIcons.forEach((icon, index) => {
    icon.classList.toggle("filled", index < state.gathered);
  });
  quest.classList.toggle("complete", state.gathered === BLOOM_POSITIONS.length);
}

function popBloom(index) {
  const icon = bloomIcons[index];
  if (!icon) return;
  icon.classList.remove("pop");
  // Restart the CSS animation without forcing a full layout read.
  requestAnimationFrame(() => icon.classList.add("pop"));
}

function showToast(message, duration = 3600, gold = false) {
  toast.textContent = message;
  toast.classList.toggle("gold", gold);
  toast.classList.add("visible");
  state.toastTimer = duration / 1000;
  state.toastDuration = duration / 1000;
}

function startGame() {
  if (state.mode !== "title") return;
  state.mode = "playing";
  document.body.classList.remove("is-title");
  document.body.classList.add("is-playing");
  titleScreen.classList.add("hidden");
  sound.start();
  sound.startJingle();
  window.setTimeout(() => showToast("Six starblooms are hiding in the valley. Follow the old paths.", 4600), 550);
  camera.snapTo(player.x, player.y);
  camera.x = player.x;
  camera.y = player.y - 22;
  camera.clampToWorld();
}

function collectBloom(bloom) {
  if (bloom.collected) return;
  bloom.collected = true;
  state.gathered += 1;
  popBloom(bloom.index);
  updateHud();
  particles.burstBloom(bloom.x, bloom.y);
  sound.chime(state.gathered - 1);
  const left = BLOOM_POSITIONS.length - state.gathered;
  if (left > 0) {
    showToast(`✦ Starbloom gathered at ${bloom.name}  ·  ${state.gathered} / ${BLOOM_POSITIONS.length}`, 3300, true);
  } else {
    showToast("✦ The last starbloom wakes. The shrine is singing!", 4400, true);
    state.won = true;
    state.winDelay = 1.15;
    sound.complete();
    particles.spawn(player.x, player.y - 22, {
      count: 48, speed: 70, life: 2.1, gravity: 9, colors: ["#ffe7a1", "#fff6cf", "#f4c65d", "#f8b7c8"], size: 1,
    });
  }
}

function checkPickups() {
  if (state.mode !== "playing") return;
  for (const bloom of world.blooms) {
    if (bloom.collected) continue;
    const dx = player.x - bloom.x;
    const dy = player.y - (bloom.y - 7);
    if (dx * dx + dy * dy < 19 * 19) collectBloom(bloom);
  }
}

function resize() {
  const cssWidth = Math.max(1, window.innerWidth);
  const cssHeight = Math.max(1, window.innerHeight);
  const minDim = Math.min(cssWidth, cssHeight);
  let zoom = clamp(Math.round(minDim / 300), 2, 4);
  if (minDim < 340) zoom = 2;
  if (cssHeight < 380) zoom = 2;
  const width = Math.max(160, Math.ceil(cssWidth / zoom));
  const height = Math.max(140, Math.ceil(cssHeight / zoom));
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.imageSmoothingEnabled = false;
  if (camera) {
    camera.resize(width, height);
    camera.clampToWorld();
  }
  document.documentElement.style.setProperty("--art-zoom", String(zoom));
}

function drawLanternLight(cam, time) {
  const p = player.getLanternPosition();
  const x = p.x - cam.x + cam.viewW / 2;
  const y = p.y - cam.y + cam.viewH / 2;
  const flicker = 0.9 + Math.sin(time * 7.3) * 0.07 + Math.sin(time * 13.7) * 0.03;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // soft light pooled on the ground
  const pool = ctx.createRadialGradient(x, y + 12, 1, x, y + 12, 38);
  pool.addColorStop(0, `rgba(255, 206, 100, ${0.11 * flicker})`);
  pool.addColorStop(0.55, `rgba(255, 188, 78, ${0.04 * flicker})`);
  pool.addColorStop(1, "rgba(255, 180, 70, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(x - 40, y - 28, 80, 80);
  ctx.restore();
}

function drawLanternHalo(cam, time) {
  const p = player.getLanternPosition();
  const x = p.x - cam.x + cam.viewW / 2;
  const y = p.y - cam.y + cam.viewH / 2;
  const flicker = 0.9 + Math.sin(time * 7.3) * 0.07 + Math.sin(time * 13.7) * 0.03;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(x, y, 1, x, y, 28);
  halo.addColorStop(0, `rgba(255, 231, 156, ${0.26 * flicker})`);
  halo.addColorStop(0.35, `rgba(255, 204, 94, ${0.08 * flicker})`);
  halo.addColorStop(1, "rgba(255, 198, 84, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(x - 30, y - 30, 60, 60);
  ctx.restore();
}

function updateSmoke(dt) {
  for (let i = 0; i < world.smokeSources.length; i += 1) {
    const source = world.smokeSources[i];
    const dx = source.x - camera.x;
    const dy = source.y - camera.y;
    if (Math.abs(dx) > camera.viewW * 0.8 || Math.abs(dy) > camera.viewH * 0.9) continue;
    smokeTimers[i] = (smokeTimers[i] || 0) - dt;
    if (smokeTimers[i] <= 0) {
      smokeTimers[i] = source.rate * (0.8 + Math.random() * 0.45);
      particles.smoke(source.x, source.y, i === 0 ? 0.9 : 1.15);
    }
  }
}

function render() {
  const cam = camera;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#27452f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  world.drawGround(ctx, cam);
  world.drawWater(ctx, cam, state.time);

  // Ground-level lantern warmth is laid down before props.
  drawLanternLight(cam, state.time);

  const entries = [];
  for (const prop of world.getVisibleProps(cam)) {
    entries.push({ sortY: prop.sortY, kind: "prop", value: prop });
  }
  for (const bloom of world.blooms) {
    if (bloom.collected) continue;
    if (bloom.x < cam.x - cam.viewW / 2 - 30 || bloom.x > cam.x + cam.viewW / 2 + 30) continue;
    if (bloom.y < cam.y - cam.viewH / 2 - 40 || bloom.y > cam.y + cam.viewH / 2 + 40) continue;
    entries.push({ sortY: bloom.y, kind: "bloom", value: bloom });
  }
  entries.push({ sortY: player.sortY, kind: "player", value: player });
  entries.sort((a, b) => a.sortY - b.sortY);

  for (const entry of entries) {
    if (entry.kind === "prop") world.drawProp(ctx, entry.value, cam);
    else if (entry.kind === "bloom") world.drawBloom(ctx, entry.value, cam, state.time);
    else entry.value.draw(ctx, cam);
  }

  world.drawAmbient(ctx, cam, state.time);
  drawLanternHalo(cam, state.time);
  particles.draw(ctx, cam);
  particles.drawMotes(ctx, state.time, cam, reducedMotion);

  if (state.shrine > 0.005) {
    world.drawShrineBeam(ctx, cam, state.time, state.shrine);
    if (state.shrine > 0.3) {
      world.drawAmbient(ctx, cam, state.time);
    }
  }

  // A pale edge fog frames the valley without hiding the art.
  const fog = ctx.createLinearGradient(0, 0, 0, canvas.height);
  fog.addColorStop(0, "rgba(210, 226, 196, 0.045)");
  fog.addColorStop(0.2, "rgba(210, 226, 196, 0)");
  fog.addColorStop(0.82, "rgba(20, 36, 25, 0)");
  fog.addColorStop(1, "rgba(20, 36, 25, 0.08)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

let last = performance.now();

function frame(now) {
  const raw = (now - last) / 1000;
  last = now;
  const dt = Math.min(0.05, Math.max(0.0001, raw));
  state.time += dt;

  if (state.mode === "title") {
    camera.drift(dt, state.time);
    player.update(dt, { x: 0, y: 0 }, world);
  } else {
    const vector = input.getVector();
    player.update(dt, vector, world);
    camera.update(dt, player);
    checkPickups();

    if (player.justStepped) {
      particles.stepDust(player.x, player.y + 1);
      sound.step();
    }

    if (!reducedMotion) {
      lanternSparkle -= dt;
      if (lanternSparkle <= 0) {
        lanternSparkle = 0.7 + Math.random() * 0.6;
        const p = player.getLanternPosition();
        particles.spawn(p.x, p.y, { count: 1, speed: 5, life: 0.7, gravity: -10, colors: ["#ffdf8a", "#fff1b3"], size: 1 });
      }
    }

    if (state.winDelay > 0) {
      state.winDelay -= dt;
      if (state.winDelay <= 0 && !winBanner.classList.contains("visible")) {
        winBanner.classList.add("visible");
      }
    }
  }

  state.shrine += ((state.won ? 1 : 0) - state.shrine) * (1 - Math.exp(-1.6 * dt));

  if (state.toastTimer > 0) {
    state.toastTimer -= dt;
    if (state.toastTimer <= 0) toast.classList.remove("visible");
  }

  particles.update(dt);
  updateSmoke(dt);
  sound.update(dt);
  render();
  requestAnimationFrame(frame);
}

function setupEvents() {
  startButton.addEventListener("click", startGame);

  window.addEventListener("keydown", (event) => {
    if (state.mode === "title" && (event.code === "Enter" || event.code === "Space" || event.code.startsWith("Arrow") || ["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code))) {
      startGame();
    }
  });

  soundToggle.addEventListener("click", () => {
    if (!sound.ready) sound.start();
    const next = !sound.muted;
    sound.setMuted(next);
    soundToggle.classList.toggle("muted", next);
    soundToggle.setAttribute("aria-pressed", next ? "true" : "false");
    soundToggle.setAttribute("aria-label", next ? "Unmute sound" : "Mute sound");
    if (!next) sound.tone(660, 0.18, "sine", 0.03);
  });

  winDismiss.addEventListener("click", () => winBanner.classList.remove("visible"));

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => window.setTimeout(resize, 80));
  window.visualViewport?.addEventListener("resize", resize);

  document.addEventListener("visibilitychange", () => {
    last = performance.now();
  });
}

function boot() {
  try {
    if (soundToggle) {
      soundToggle.classList.toggle("muted", false);
    }
    world = new World();
    player = new Player(PLAYER.startX, PLAYER.startY);
    camera = new Camera(world);
    particles = new Particles();
    sound = new Sound();
    soundToggle.classList.toggle("muted", sound.muted);
    soundToggle.setAttribute("aria-pressed", sound.muted ? "true" : "false");
    soundToggle.setAttribute("aria-label", sound.muted ? "Unmute sound" : "Mute sound");
    input = new Input({
      joystick: document.getElementById("joystick"),
      knob: document.getElementById("joystick-knob"),
    });

    resize();
    camera.snapTo(WORLD.width / 2, 930);
    camera.x = WORLD.width / 2;
    camera.y = 930;
    camera.clampToWorld();
    buildHud();
    setupEvents();

    document.body.classList.add("is-title");
    smokeTimers = world.smokeSources.map(() => Math.random() * 0.4);

    // A tiny debug handle helps future expansion and automated visual checks.
    window.__hollowbrook = {
      world, player, camera, state,
      start: startGame,
      setPosition(x, y) {
        player.x = x;
        player.y = y;
        camera.snapTo(x, y);
      },
      gatherAll() {
        for (const bloom of world.blooms) {
          if (!bloom.collected) {
            player.x = bloom.x;
            player.y = bloom.y;
            checkPickups();
          }
        }
      },
    };

    requestAnimationFrame((time) => {
      last = time;
      requestAnimationFrame(frame);
    });
  } catch (error) {
    console.error(error);
    fatal.hidden = false;
    fatalMessage.textContent = error?.message || String(error);
  }
}

boot();
