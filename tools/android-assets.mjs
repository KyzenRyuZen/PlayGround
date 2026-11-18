// Regenerates Android launcher icons and splash screens from the AETHERIA sigil.
// Usage: node tools/android-assets.mjs
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = join(process.env.HOME, '.local/share/omgithub-playwright');
const require = createRequire(join(runtime, 'package.json'));
const { chromium } = require('playwright');
const config = JSON.parse(readFileSync(join(runtime, 'linux.json'), 'utf8'));
process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim();

const sigil = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2ca"/><stop offset=".45" stop-color="#e3c27d"/>
      <stop offset=".78" stop-color="#a07836"/><stop offset="1" stop-color="#6f5124"/>
    </linearGradient>
  </defs>
  <g transform="translate(256 256)">
    <circle r="176" fill="none" stroke="url(#gold)" stroke-width="4" opacity=".6"/>
    <circle r="150" fill="none" stroke="url(#gold)" stroke-width="2.5" opacity=".32" stroke-dasharray="5 12"/>
    <path d="M0 -152 L30 -48 L134 -18 L30 12 L0 116 L-30 12 L-134 -18 L-30 -48 Z" fill="none" stroke="url(#gold)" stroke-width="6"/>
    <path d="M0 -92 L18 -30 L76 -18 L18 -6 L0 52 L-18 -6 L-76 -18 L-18 -30 Z" fill="url(#gold)" opacity=".92"/>
    <circle r="8" fill="#fff6dd"/>
  </g>
</svg>`;

const splashHtml = (w, h, scale) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:radial-gradient(circle at 50% 42%,#1a1526,#08080d 62%,#040406);}
  .wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(18 * scale)}px;}
  .sig{width:${Math.round(Math.min(w, h) * 0.34)}px;height:${Math.round(Math.min(w, h) * 0.34)}px;}
  h1{font-family:Georgia,'Times New Roman',serif;letter-spacing:${Math.round(8 * scale)}px;font-size:${Math.round(Math.min(w, h) * 0.075)}px;color:#f3e3bd;margin:0;text-indent:${Math.round(8 * scale)}px;font-weight:600;}
  p{font-family:Arial,sans-serif;letter-spacing:${Math.round(3 * scale)}px;font-size:${Math.round(Math.min(w, h) * 0.022)}px;color:#8e8471;margin:0;text-transform:uppercase;}
</style></head><body><div class="wrap"><div class="sig">${sigil}</div><h1>AETHERIA</h1><p>The Shards of Eternity</p></div></body></html>`;

const browser = await chromium.launch(config.browser.launchOptions);
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

async function renderIcon(size, out, { background = null, pad = 1 } = {}) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * pad);
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '';
  const svg = sigil.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${inner}" height="${inner}">`);
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;margin:${Math.round((size - inner) / 2)}px}</style>${bg}${svg}`, { waitUntil: 'load' });
  await page.screenshot({ path: out, omitBackground: !background });
}

async function renderSplash(w, h, out) {
  await page.setViewportSize({ width: w, height: h });
  const scale = Math.min(w / 390, h / 844) || 1;
  await page.setContent(splashHtml(w, h, Math.max(0.6, scale)), { waitUntil: 'load' });
  await page.screenshot({ path: out });
}

const res = join(root, 'android/app/src/main/res');
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [dens, mul] of Object.entries(DENSITIES)) {
  const dir = join(res, `mipmap-${dens}`);
  const legacy = Math.round(48 * mul);
  const adaptive = Math.round(108 * mul);
  await renderIcon(legacy, join(dir, 'ic_launcher.png'), { background: '#08080d' });
  await renderIcon(legacy, join(dir, 'ic_launcher_round.png'), { background: '#08080d' });
  await renderIcon(adaptive, join(dir, 'ic_launcher_foreground.png'), { pad: 0.68 });
  console.log('icons', dens, legacy, adaptive);
}

for (const dir of readdirSync(res)) {
  const full = join(res, dir);
  if (!dir.startsWith('drawable') || !statSync(full).isDirectory()) continue;
  for (const file of readdirSync(full)) {
    if (!file.startsWith('splash') || !file.endsWith('.png')) continue;
    const path = join(full, file);
    const buf = readFileSync(path);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    await renderSplash(w, h, path);
    console.log('splash', dir + '/' + file, w + 'x' + h);
  }
}

await browser.close();
console.log('Android assets regenerated.');
