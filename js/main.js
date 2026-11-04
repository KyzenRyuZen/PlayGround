import { Game } from "./game.js";

function boot() {
  try {
    const game = new Game();
    // Handy for tinkering in the console; the game is intentionally easy to extend.
    window.mosswold = game;
  } catch (error) {
    console.error(error);
    const message = document.createElement("div");
    message.className = "noscript";
    message.textContent = "The vale could not wake. Please reload the page.";
    document.getElementById("app")?.appendChild(message);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
