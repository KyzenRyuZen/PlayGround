/** Game orchestration: world, loop, discoveries, and UI. */
import { World } from "./world.js";
import { Renderer } from "./renderer.js";
import { Camera } from "./camera.js";
import { Player } from "./player.js";
import { Ambient } from "./ambient.js";
import { Input } from "./input.js";

export class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.joystick = document.getElementById("joystick");
    this.hint = document.querySelector(".hint");
    this.toast = document.getElementById("toast");
    this.toastTitle = document.getElementById("toast-title");
    this.toastKicker = this.toast.querySelector(".toast-kicker");
    this.foundCount = document.getElementById("found-count");
    this.foundCard = document.querySelector(".found-card");
    this.intro = document.getElementById("intro");

    this.world = new World();
    this.renderer = new Renderer(this.canvas, this.world);
    this.camera = new Camera(this.world);
    this.player = new Player(this.world);
    this.ambient = new Ambient(this.world);
    this.input = new Input(this.joystick);

    this.camera.resize(this.renderer.viewW, this.renderer.viewH);
    this.camera.snap(this.player.x, this.player.y - 8);

    this.time = 0;
    this.lastTimestamp = 0;
    this.running = false;
    this.toastTimer = 0;
    this.lastStepPulse = 0;
    this.stepAccumulator = 0;
    this.completeShown = false;

    this.input.onFirstMove = () => {
      window.setTimeout(() => this.hint?.classList.add("is-hidden"), 1300);
      window.setTimeout(() => this.dismissIntro(), 900);
    };

    // Reveal the chapter title after the first frame, then let it linger.
    requestAnimationFrame(() => this.intro?.classList.add("is-visible"));
    this.introTimer = window.setTimeout(() => this.dismissIntro(), 10000);

    this.onResize = this.onResize.bind(this);
    this.frame = this.frame.bind(this);
    window.addEventListener("resize", this.onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", this.onResize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      this.lastTimestamp = 0;
    });

    this.updateHud();
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  onResize() {
    this.renderer.resize();
    this.camera.resize(this.renderer.viewW, this.renderer.viewH);
  }

  frame(now) {
    if (!this.running) return;
    if (!this.lastTimestamp) this.lastTimestamp = now;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastTimestamp) / 1000));
    this.lastTimestamp = now;
    this.update(dt);
    this.renderer.render(this.camera, this.player, this.ambient, this.time);
    requestAnimationFrame(this.frame);
  }

  update(dt) {
    this.time += dt;
    const vector = this.input.vector;
    this.player.update(dt, vector);
    this.ambient.update(dt, this.player);
    this.camera.update(dt, this.player);

    // Kick up a little dust in time with the walk cycle.
    const pulse = this.player.stepPulse - this.lastStepPulse;
    this.lastStepPulse = this.player.stepPulse;
    if (this.player.moving) this.stepAccumulator += pulse;
    if (this.stepAccumulator > 13) {
      this.stepAccumulator = 0;
      this.ambient.footstep(this.player.x, this.player.y, this.player.facing);
    }

    this.checkLandmarks();
  }

  checkLandmarks() {
    // Give the opening tableau a beat before discoveries begin.
    if (this.player.movingDistance < 10) return;
    for (const landmark of this.world.landmarks) {
      if (landmark.found) continue;
      const dx = this.player.x - landmark.x;
      const dy = this.player.y - landmark.y;
      if (dx * dx + dy * dy <= landmark.radius * landmark.radius) {
        landmark.found = true;
        this.updateHud();
        this.showToast("Landmark discovered", landmark.title);
        if (this.world.landmarks.every((item) => item.found) && !this.completeShown) {
          this.completeShown = true;
          this.foundCard?.classList.add("is-complete");
          window.setTimeout(() => {
            this.showToast("Every landmark found", "The vale is yours to wander", 4600);
          }, 3800);
        }
        break;
      }
    }
  }

  updateHud() {
    const found = this.world.landmarks.filter((landmark) => landmark.found).length;
    if (this.foundCount) this.foundCount.textContent = String(found);
    this.foundCard?.classList.toggle("is-complete", found === this.world.landmarks.length);
  }

  dismissIntro() {
    window.clearTimeout(this.introTimer);
    this.intro?.classList.remove("is-visible");
    this.intro?.classList.add("is-hidden");
  }

  showToast(kicker, title, duration = 3400) {
    if (!this.toast) return;
    this.toastKicker.textContent = kicker;
    this.toastTitle.textContent = title;
    this.toast.classList.add("is-visible");
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove("is-visible");
    }, duration);
  }
}
