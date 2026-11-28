#!/bin/bash
set -euo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo 'Usage: bash scripts/deploy.sh <appofa-release.tar.gz>' >&2
  exit 2
fi

ARCHIVE=$(realpath -- "$1")
APP_DIR=$(cd "${APP_DIR:-/var/www/Appofa}" && pwd -P)
DEPLOY_DIR="$APP_DIR/.deploy"
RELEASES_DIR="$DEPLOY_DIR/releases"
CURRENT="$DEPLOY_DIR/current"
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-3001}
export NODE_ENV=production

command -v pm2 >/dev/null
mkdir -p "$RELEASES_DIR" "$APP_DIR/uploads"
exec 9>"$DEPLOY_DIR/deploy.lock"
flock 9

previous=''
if [[ -L "$CURRENT" ]]; then
  previous=$(realpath -e -- "$CURRENT")
  if [[ "$previous" != "$RELEASES_DIR"/release.* || ! -s "$previous/.next/BUILD_ID" ]]; then
    echo "Invalid active release: $previous" >&2
    exit 1
  fi
elif [[ -s "$APP_DIR/.next/BUILD_ID" && -f "$APP_DIR/node_modules/next/package.json" ]]; then
  # First release deployment can roll back to the existing in-place install.
  previous=$APP_DIR
elif pm2 describe newsapp-backend >/dev/null 2>&1 || pm2 describe newsapp-frontend >/dev/null 2>&1; then
  echo 'Existing PM2 services have no usable release to restore.' >&2
  exit 1
fi

release=$(mktemp -d "$RELEASES_DIR/release.XXXXXXXX")
next_link="$DEPLOY_DIR/.current-${release##*/}"
maintenance_started=0

remove_services() {
  local service
  for service in newsapp-frontend newsapp-backend; do
    if pm2 describe "$service" >/dev/null 2>&1; then
      pm2 delete "$service" || return 1
    fi
  done
}

start_services() (
  cd "$1" || return 1
  PORT="$BACKEND_PORT" pm2 start src/index.js --name newsapp-backend || return 1
  if [[ "$1" == "$APP_DIR" ]]; then
    PORT="$FRONTEND_PORT" pm2 start npm --name newsapp-frontend -- run frontend:start
  else
    NEXT_DIST_DIR=.next pm2 start node_modules/next/dist/bin/next \
      --name newsapp-frontend -- start -p "$FRONTEND_PORT"
  fi
)

wait_for_services() {
  local deadline=$((SECONDS + 60))
  local backend_error frontend_error
  local -a curl_args=(--disable --noproxy '*' --fail --silent --show-error
    --connect-timeout 2 --max-time 10 --output /dev/null)

  while true; do
    backend_error=$(curl "${curl_args[@]}" "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1) || backend_error=${backend_error:-"curl exited with status $?"}
    frontend_error=$(curl "${curl_args[@]}" "http://127.0.0.1:$FRONTEND_PORT/" 2>&1) || frontend_error=${frontend_error:-"curl exited with status $?"}
    if [[ -z "$backend_error" && -z "$frontend_error" ]]; then
      return 0
    fi
    if (( SECONDS >= deadline )); then
      printf 'Backend health check on port %s: %s\n' "$BACKEND_PORT" "${backend_error:-OK}" >&2
      printf 'Frontend health check on port %s: %s\n' "$FRONTEND_PORT" "${frontend_error:-OK}" >&2
      return 1
    fi
    sleep 1
  done
}

cleanup() {
  local status=$?
  rm -f -- "$next_link"
  if (( status == 0 )) || [[ $(readlink -- "$CURRENT") == "$release" ]]; then
    return
  fi
  cd "$APP_DIR" || return
  if (( maintenance_started )); then
    if [[ -n "$previous" ]]; then
      echo "Deployment failed. Restoring $previous." >&2
      if ! (remove_services && start_services "$previous" && wait_for_services && pm2 save); then
        echo 'Automatic recovery failed. Check PM2 logs and database migration status.' >&2
        return
      fi
      echo "Restored healthy release: $previous" >&2
    elif ! (remove_services && pm2 save --force); then
      echo 'Could not clear the failed release from PM2.' >&2
      return
    fi
  fi
  rm -rf -- "$release"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Unpacking $release before stopping services."
tar -xzf "$ARCHIVE" -C "$release" --no-same-owner
cd "$release"
if [[ ! -s .next/BUILD_ID || ! -s .next/routes-manifest.json || ! -d .next/static || ! -s .next/appofa-release.json ]]; then
  echo 'The release is missing the prebuilt Next.js application.' >&2
  exit 1
fi

for env_file in .env .env.local .env.production .env.production.local; do
  if [[ -f "$APP_DIR/$env_file" ]]; then
    ln -s "$APP_DIR/$env_file" "$env_file"
  fi
done
ln -s "$APP_DIR/uploads" uploads

echo 'Stopping services before installing dependencies and building the release.'
maintenance_started=1
remove_services

npm ci --omit=dev
mismatched_build_vars=$(node <<'NODE'
const { loadEnvConfig } = require('@next/env');
const { validateProductionConfig } = require('./src/config/validateProductionConfig');
const { nextVersion, buildEnv } = require('./.next/appofa-release.json');
if (nextVersion !== require('next/package.json').version) {
  throw new Error('The installed Next.js version differs from the CI build.');
}

const { parsed } = require('dotenv').config({ processEnv: {}, quiet: true });
validateProductionConfig({ ...parsed, ...process.env });
loadEnvConfig(process.cwd());
const names = [
  'API_URL', 'SITE_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_GA_MEASUREMENT_ID', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
];
const mismatched = names.filter(name =>
  (process.env[name] || '') !== (buildEnv[name] || '')
);
process.stdout.write(mismatched.join(', '));
NODE
)

if [[ -n "$mismatched_build_vars" ]]; then
  echo "Rebuilding the frontend with VPS settings for: $mismatched_build_vars"
  rm -rf -- .next
  NEXT_DIST_DIR=.next npm run frontend:build
fi

# Keep optimized images across releases and during a first-deploy rollback.
mkdir -p .next/cache "$APP_DIR/.next/cache/images"
rm -rf -- .next/cache/images
ln -sT "$APP_DIR/.next/cache/images" .next/cache/images

ln -s "$release" "$next_link"
# Migrations may be incompatible with the previous application version.
npm run migrate
node <<'NODE'
const db = require('./src/config/database');
db.query(`ALTER TYPE "enum_Articles_type" ADD VALUE IF NOT EXISTS 'analysis'`)
  .then(() => console.log('Analysis article type is available.'))
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => db.close());
NODE

if [[ ${RUN_SEEDS:-0} == 1 ]]; then
  npm run seed:locations
  npm run seed
fi

start_services "$release"
wait_for_services
pm2 save
mv -Tf -- "$next_link" "$CURRENT"
maintenance_started=0

# Retain the active and immediately previous releases for rollback.
for old_release in "$RELEASES_DIR"/release.*; do
  if [[ -d "$old_release" && ! -L "$old_release" && "$old_release" != "$release" && "$old_release" != "$previous" ]]; then
    rm -rf -- "$old_release" || echo "Could not prune $old_release." >&2
  fi
done
echo "Deployment is healthy: $release"
