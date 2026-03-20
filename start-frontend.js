#!/usr/bin/env node
'use strict';

/**
 * Smart Next.js frontend startup script.
 *
 * Checks whether the production build in .next/ is present and was created
 * with the currently-installed version of Next.js.  If the build is absent or
 * stale (i.e. `npm ci` installed a newer Next.js after the last build) it
 * triggers `npm run frontend:build` automatically before starting the server.
 *
 * This prevents the 502 Bad Gateway errors that occur when `next start` is
 * restarted after a Next.js version bump without a fresh build.
 *
 * Usage (via npm):  npm run frontend:start
 * Direct usage:     node start-frontend.js
 * Custom port:      PORT=3001 node start-frontend.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DEFAULT_PORT = 3001;
// BUILD_ID is written at the very end of a successful `next build` run.
// Its mtime therefore reliably indicates when the last build finished.
const BUILD_ID_PATH = path.join(ROOT, '.next', 'BUILD_ID');
// next/package.json mtime advances whenever npm (re)installs the package.
const NEXT_PKG_PATH = path.join(ROOT, 'node_modules', 'next', 'package.json');

/**
 * Returns true when the .next build is absent or was created before the
 * currently-installed Next.js package was (re)installed.
 */
function buildIsStale() {
  if (!fs.existsSync(BUILD_ID_PATH)) {
    return true;
  }
  try {
    const nextMtime = fs.statSync(NEXT_PKG_PATH).mtimeMs;
    const buildMtime = fs.statSync(BUILD_ID_PATH).mtimeMs;
    return nextMtime > buildMtime;
  } catch {
    // If either file cannot be stat-ed, rebuild to be safe.
    return true;
  }
}

if (buildIsStale()) {
  console.log('[start-frontend] Build is missing or outdated. Rebuilding…');
  try {
    execSync('npm run frontend:build', {
      stdio: 'inherit',
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: 'production' },
    });
  } catch (err) {
    console.error('[start-frontend] Build failed:', err.message);
    process.exit(1);
  }
}

const port = String(process.env.PORT || DEFAULT_PORT);
const nextBin = path.join(ROOT, 'node_modules', '.bin', 'next');

const child = spawn(nextBin, ['start', '-p', port], {
  stdio: 'inherit',
  cwd: ROOT,
  env: process.env,
});

// Forward termination signals so PM2 / Docker can shut the server down cleanly.
for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => child.kill(sig));
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
