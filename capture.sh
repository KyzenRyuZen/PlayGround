#!/usr/bin/env bash
# Capture desktop and mobile screenshots of a deployed AETHERIA preview.
# Exit 75 for temporary browser/navigation infrastructure failures, 1 for
# capture-script or rendering defects.
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

: "${CAPTURE_URL:?CAPTURE_URL must be set}"
: "${CAPTURE_DIR:?CAPTURE_DIR must be set}"

if [[ "$CAPTURE_DIR" != /* ]]; then
  CAPTURE_DIR="$PROJECT_DIR/$CAPTURE_DIR"
fi
CAPTURE_DIR="${CAPTURE_DIR%/}"

case "$CAPTURE_DIR/" in
  "$PROJECT_DIR"/*)
    echo "CAPTURE_DIR must be outside the project source tree: $CAPTURE_DIR" >&2
    exit 1
    ;;
esac

export CAPTURE_URL CAPTURE_DIR

# Time every capture step. The browser work is one timed Node command so its
# exit status (1 or 75) is preserved exactly.
timed() {
  local label="$1"
  shift
  echo "==> $label"
  /usr/bin/time -p "$@"
}

timed "prepare capture directory" mkdir -p "$CAPTURE_DIR"

set +e
timed "browser capture" node --input-type=module - <<'NODE'
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;
if (!url || !output) {
  console.error('CAPTURE_URL and CAPTURE_DIR are required.');
  process.exit(1);
}
mkdirSync(output, { recursive: true });

const fail = (message, transient = false) => {
  const error = new Error(message);
  error.exitCode = transient ? 75 : 1;
  throw error;
};

let browser;
let exitCode = 0;
try {
  const runtime = process.env.PLAYWRIGHT_HOME
    || join(process.env.HOME || '', '.local/share/omgithub-playwright');
  const configPath = join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json');
  if (!existsSync(join(runtime, 'node_modules', 'playwright')) || !existsSync(configPath)) {
    fail(`Playwright runtime not found at ${runtime}`, true);
  }
  const require = createRequire(join(runtime, 'package.json'));
  const { chromium } = require('playwright');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (process.platform === 'linux' && !process.env.DISPLAY && existsSync(join(runtime, 'display'))) {
    process.env.DISPLAY = ':' + readFileSync(join(runtime, 'display'), 'utf8').trim();
  }

  try {
    browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 });
  } catch (error) {
    fail(`Browser launch failed: ${error.message}`, true);
  }

  const views = [
    ['desktop', 1440, 900, false],
    ['mobile', 390, 844, true],
  ];

  for (const [name, width, height, mobile] of views) {
    let context;
    try {
      context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: mobile ? 3 : 1,
        isMobile: mobile,
        hasTouch: mobile,
      });
    } catch (error) {
      fail(`Could not create ${name} browser context: ${error.message}`, true);
    }

    const page = await context.newPage().catch((error) => {
      fail(`Could not open ${name} page: ${error.message}`, true);
    });
    page.setDefaultTimeout(30000);

    const pageErrors = [];
    const httpErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      const status = response.status();
      if (status < 400) return;
      try {
        if (new URL(response.url()).origin === new URL(url).origin) {
          httpErrors.push(`HTTP ${status} ${response.url()}`);
        }
      } catch {
        // Ignore malformed response URLs.
      }
    });

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      .catch((error) => fail(`Navigation to ${url} failed: ${error.message}`, true));
    if (!response) fail(`No HTTP response for ${url}`, true);
    if (!response.ok()) {
      const status = response.status();
      fail(
        `HTTP ${status} loading ${url}`,
        status === 408 || status === 429 || status >= 500,
      );
    }

    // Wait until the boot splash is gone and the app screen has real content.
    try {
      await page.waitForFunction(() => {
        const boot = document.getElementById('boot');
        const screen = document.getElementById('screen');
        const text = (document.body?.innerText || '').trim();
        const bootVisible = Boolean(boot && boot.isConnected && getComputedStyle(boot).display !== 'none');
        return !bootVisible && Boolean(screen) && screen.children.length > 0 && text.length > 20;
      }, null, { timeout: 20000 });
    } catch (error) {
      fail(`App did not render at ${url}: ${error.message}`, false);
    }

    // Fonts are cosmetic; never let an external font CDN block capture.
    await page.evaluate(() => Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ])).catch(() => {});

    await page.waitForTimeout(800);

    try {
      await page.screenshot({
        path: join(output, `final-${name}.png`),
        timeout: 30000,
      });
    } catch (error) {
      fail(
        `Screenshot ${name} failed: ${error.message}`,
        !browser.isConnected() || error.name === 'TimeoutError',
      );
    }

    console.log(`Captured ${name} view -> ${join(output, `final-${name}.png`)}`);
    if (pageErrors.length) fail(`Page errors on ${name}: ${pageErrors.join('; ')}`, false);
    if (httpErrors.length) fail(`Same-origin HTTP errors on ${name}: ${httpErrors.join('; ')}`, false);

    await context.close().catch((error) => {
      console.error(`Warning: could not close ${name} context: ${error.message}`);
    });
  }
} catch (error) {
  console.error(error?.stack || String(error));
  exitCode = error?.exitCode === 75 ? 75 : 1;
} finally {
  if (browser) {
    try {
      await browser.close();
    } catch (error) {
      console.error(`Browser close failed: ${error.message}`);
      if (exitCode === 0) exitCode = 75;
    }
  }
}

process.exit(exitCode);
NODE
status=$?
set -e

if [[ "$status" -ne 0 ]]; then
  echo "Capture failed with exit code $status" >&2
fi
exit "$status"
