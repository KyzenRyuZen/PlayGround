#!/usr/bin/env bash
# Build and serve AETHERIA as a static site.
# The controller runs this in the foreground (tmux session app-server).
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PORT="${PORT:-${APP_PORT:-3000}}"
HOST="${HOST:-0.0.0.0}"
BUILD_DIR="$PROJECT_DIR/www"
META_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
export PORT HOST PROJECT_DIR BUILD_DIR META_DIR

# Time every setup command so startup failures are visible in app.log.
timed() {
  local label="$1"
  shift
  echo "==> $label"
  /usr/bin/time -p "$@"
}

dependency_hash() {
  sha256sum package.json package-lock.json | sha256sum | awk '{print $1}'
}

deps_stamp="$PROJECT_DIR/node_modules/.aetheria-dependencies"
deps_hash="$(dependency_hash)"
if [[ -d "$PROJECT_DIR/node_modules" && -f "$deps_stamp" && "$(cat "$deps_stamp")" == "$deps_hash" ]]; then
  echo "==> dependencies up to date"
else
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    timed "install dependencies" npm ci --no-audit --no-fund
  else
    timed "install dependencies" npm install --no-audit --no-fund
  fi
  mkdir -p "$PROJECT_DIR/node_modules"
  deps_hash="$(dependency_hash)"
  printf '%s\n' "$deps_hash" > "$deps_stamp"
fi

needs_build=false
if [[ ! -f "$BUILD_DIR/index.html" ]]; then
  needs_build=true
elif [[ -n "$(find \
  "$PROJECT_DIR/src" \
  "$PROJECT_DIR/icons" \
  "$PROJECT_DIR/index.html" \
  "$PROJECT_DIR/manifest.webmanifest" \
  "$PROJECT_DIR/sw.js" \
  "$PROJECT_DIR/tools/build-web.mjs" \
  -newer "$BUILD_DIR/index.html" -print -quit)" ]]; then
  needs_build=true
fi

if [[ "$needs_build" == true ]]; then
  timed "build static site" npm run build:web
else
  echo "==> build up to date"
fi

if [[ ! -f "$BUILD_DIR/index.html" ]]; then
  echo "Build did not produce $BUILD_DIR/index.html" >&2
  exit 1
fi

timed "write deployment metadata" node -e '
const fs = require("node:fs");
const path = require("node:path");
fs.mkdirSync(process.env.META_DIR, { recursive: true });
const output = {
  project: process.env.PROJECT_DIR,
  directory: process.env.BUILD_DIR,
};
fs.writeFileSync(
  path.join(process.env.META_DIR, "deployment-output.json"),
  JSON.stringify(output) + "\n",
);
'

echo "==> serving $BUILD_DIR at http://$HOST:$PORT/"
cd "$BUILD_DIR"
timed "static server" node "$PROJECT_DIR/tools/serve.mjs"
