# Deployment

See [doc/VPS_SETUP.md](doc/VPS_SETUP.md) for the complete VPS deployment guide including Nginx configuration, PM2 setup, port layout, deploy.sh usage, and `.next` build artifact notes.

For local, Docker, and cloud platform deployments, see [doc/DEPLOYMENT_GUIDE.md](doc/DEPLOYMENT_GUIDE.md).

## Automatic VPS deploys

The `Deploy` GitHub Actions workflow runs automatically whenever code is pushed to `main`. A merged PR triggers it, and a normal GitHub revert also triggers it because the revert is a new commit on `main`.

It can also be started manually from GitHub with **Actions > Deploy > Run workflow**.

Configure these repository secrets before using it:

- `VPS_HOST`: server hostname or IP address
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: private key for the deploy user
- `VPS_PORT`: SSH port, optional; defaults to `22`
- `VPS_SSH_KNOWN_HOSTS`: known hosts entry, optional; if omitted, the workflow uses `ssh-keyscan`

The workflow runs this command on the server:

```bash
cd /var/www/Appofa && ./scripts/deploy.sh
```

Smoke test note: merging a docs-only PR should still trigger the automatic deploy workflow on `main`.
