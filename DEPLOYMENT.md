# Deployment Guide

This guide covers deploying the Appofa News Application on a VPS with Nginx as a reverse proxy and PM2 as the process manager.

For a full step-by-step VPS setup from scratch, see [doc/VPS_SETUP.md](doc/VPS_SETUP.md).

## Port Layout

| Service | Port | PM2 name |
|---|---|---|
| Express API (backend) | 3000 | `newsapp-backend` |
| Next.js frontend | 3001 | `newsapp-frontend` |

Nginx listens on ports 80 and 443 and reverse-proxies to these two services.

## Nginx Configuration

The Nginx config template is located at [`config/nginx/appofasi.gr.conf`](config/nginx/appofasi.gr.conf).

Key rules:
- `location /api/` → proxied to `http://localhost:3000` (Express backend)
- `location /` → proxied to `http://localhost:3001` (Next.js frontend)
- HTTP (port 80) redirects to HTTPS (port 443)

### Installing the config

```bash
sudo cp config/nginx/appofasi.gr.conf /etc/nginx/sites-available/appofasi.gr
sudo ln -s /etc/nginx/sites-available/appofasi.gr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Verifying Nginx proxies the API correctly

After deployment, confirm the backend is reachable through Nginx:

```bash
curl https://appofasi.gr/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

## Deployment Process

**Always use `scripts/deploy.sh`** after pulling new code. Do not restart PM2 manually without rebuilding, as this can leave stale Next.js build artifacts causing "Failed to find Server Action" errors.

```bash
bash scripts/deploy.sh
```

The script:
1. Stops PM2 processes
2. Pulls the latest code from Git (`main` branch)
3. Installs/updates Node.js dependencies
4. Runs database migrations
5. **Cleans the `.next` build directory** (`rm -rf .next`) — prevents stale Server Action manifest errors
6. Builds the Next.js frontend (`npm run frontend:build`)
7. Restarts PM2 processes (`newsapp-backend`, `newsapp-frontend`)

### Environment variables

```bash
APP_DIR=/var/www/Appofa   # Application directory (default)
BRANCH=main               # Git branch to deploy
SKIP_GIT_PULL=0           # Set to 1 to skip git pull
RUN_SEEDS=0               # Set to 1 to run database seeds
FAST_STARTUP=0            # Set to 1 to skip npm ci when package-lock is unchanged
```

## Why `.next` must be cleaned before rebuilding

Next.js Server Actions are identified by a hash computed at build time. When the application is redeployed without cleaning the old `.next` directory, the running server may serve pages referencing Server Action hashes from the **previous** build. Any browser tab that was open before the redeploy will send requests for those old hashes, causing:

```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
```

This also causes the PM2 `newsapp-frontend` process to restart repeatedly (potentially hundreds of times). Removing `.next` before every build ensures a clean, consistent manifest.

## Health Check

The backend exposes `GET /api/health` which returns HTTP 200 and `{"status":"ok","timestamp":"..."}`. Use this to verify the backend is running and reachable through Nginx after any deployment:

```bash
# Direct (bypassing Nginx)
curl http://localhost:3000/api/health

# Through Nginx
curl https://appofasi.gr/api/health
```

If the direct call succeeds but the Nginx call returns 502, the problem is in the Nginx `location /api/` block — verify the config matches [`config/nginx/appofasi.gr.conf`](config/nginx/appofasi.gr.conf).
