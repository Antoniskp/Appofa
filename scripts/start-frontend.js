#!/usr/bin/env node
'use strict';

/**
 * Smart Next.js frontend startup script.
 *
 * Checks whether the production build in .next/ is present and was created
 * with the currently-installed version of Next.js AND the current git commit.
 * If the build is absent or stale (i.e. `npm ci` installed a newer Next.js
 * after the last build, or new code was deployed via `git pull`) it triggers
 * `npm run frontend:build` automatically before starting the server.
 *
 * This prevents the 502 Bad Gateway errors that occur when `next start` is
 * restarted after a Next.js version bump or a code change without a fresh build.
 *
 * Usage (via npm):  npm run frontend:start
 * Direct usage:     node scripts/start-frontend.js
 * Custom port:      PORT=3001 node scripts/start-frontend.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_PORT = 3001;
// BUILD_ID is written at the very end of a successful `next build` run.
// Its mtime therefore reliably indicates when the last build finished.
const BUILD_ID_PATH = path.join(ROOT, '.next', 'BUILD_ID');
// next/package.json mtime advances whenever npm (re)installs the package.
const NEXT_PKG_PATH = path.join(ROOT, 'node_modules', 'next', 'package.json');
// Stores the git commit hash that was current when the last build was created.
const BUILD_GIT_REF_PATH = path.join(ROOT, '.next', 'BUILD_GIT_REF');

/**
 * Returns the current git HEAD commit hash, or null if git is unavailable.
 */
function getGitHead() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

/**
 * Returns true when the .next build is absent or stale.
 * Staleness is determined by:
 *   1. Missing BUILD_ID (no build at all).
 *   2. The git HEAD has changed since the last build (new code deployed).
 *   3. The installed Next.js package is newer than the last build
 *      (Next.js was upgraded via npm ci).
 */
function buildIsStale() {
  if (!fs.existsSync(BUILD_ID_PATH)) {
    return true;
  }

  // Check whether the source code has changed since the last build.
  const currentHead = getGitHead();
  if (currentHead) {
    if (!fs.existsSync(BUILD_GIT_REF_PATH)) {
      // No saved git ref — treat as stale so we get a reliable build.
      return true;
    }
    const builtHead = fs.readFileSync(BUILD_GIT_REF_PATH, 'utf8').trim();
    if (builtHead !== currentHead) {
      return true;
    }
  }

  // Fall back to comparing next package mtime vs build mtime.
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
    // Save the git HEAD so we can detect future code changes.
    const currentHead = getGitHead();
    if (currentHead) {
      fs.writeFileSync(BUILD_GIT_REF_PATH, currentHead);
    }
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
