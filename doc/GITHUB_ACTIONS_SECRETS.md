# GitHub Actions Secrets Setup Guide

This guide explains how to configure GitHub Actions secrets for automated staging deployments.

## Required Secrets

The staging deployment workflow requires the following secrets to be configured in your GitHub repository:

| Secret Name | Description | Required |
|------------|-------------|----------|
| `VPS_HOST` | VPS IP address or hostname | Yes |
| `VPS_USERNAME` | SSH username for the VPS | Yes |
| `VPS_SSH_KEY` | Private SSH key for authentication | Yes |
| `VPS_PORT` | SSH port (default: 22) | No |

## Step-by-Step Setup

### Step 1: Generate SSH Key Pair

On your local machine or VPS, generate a new SSH key pair specifically for GitHub Actions:

```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -C "github-actions-staging" -f ~/.ssh/github_actions_staging

# Or generate RSA key (alternative)
ssh-keygen -t rsa -b 4096 -C "github-actions-staging" -f ~/.ssh/github_actions_staging
```

**Important:** Do not set a passphrase when prompted (just press Enter), as GitHub Actions cannot interactively provide passphrases.

This creates two files:
- `~/.ssh/github_actions_staging` (private key - keep this secret!)
- `~/.ssh/github_actions_staging.pub` (public key - safe to share)

### Step 2: Add Public Key to VPS

Copy the public key to your VPS to authorize the GitHub Actions runner:

```bash
# Option 1: Using ssh-copy-id (recommended)
ssh-copy-id -i ~/.ssh/github_actions_staging.pub your-username@your-vps-ip

# Option 2: Manual copy
cat ~/.ssh/github_actions_staging.pub | ssh your-username@your-vps-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Verify the key works:**

```bash
ssh -i ~/.ssh/github_actions_staging your-username@your-vps-ip
```

You should be able to log in without entering a password.

### Step 3: Add Secrets to GitHub Repository

1. **Navigate to your repository on GitHub**
   - Go to https://github.com/Antoniskp/Appofa

2. **Open Settings**
   - Click on "Settings" tab in the repository

3. **Navigate to Secrets**
   - Click "Secrets and variables" → "Actions" in the left sidebar

4. **Add Repository Secrets**
   - Click "New repository secret" button

#### Add VPS_HOST

- **Name:** `VPS_HOST`
- **Value:** Your VPS IP address (e.g., `185.92.192.81`) or hostname
- Click "Add secret"

#### Add VPS_USERNAME

- **Name:** `VPS_USERNAME`
- **Value:** Your SSH username (e.g., `root`, `ubuntu`, or your custom username)
- Click "Add secret"

#### Add VPS_SSH_KEY

- **Name:** `VPS_SSH_KEY`
- **Value:** The contents of your **private key** file

To get the private key value:

```bash
cat ~/.ssh/github_actions_staging
```

Copy the entire output including the header and footer:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all the key content...
-----END OPENSSH PRIVATE KEY-----
```

- Paste this into the secret value field
- Click "Add secret"

#### Add VPS_PORT (Optional)

Only add this if your SSH server runs on a non-standard port:

- **Name:** `VPS_PORT`
- **Value:** Your SSH port number (e.g., `2222`)
- Click "Add secret"

**Note:** If not set, the workflow defaults to port 22.

### Step 4: Verify Secrets Are Configured

After adding all secrets, you should see them listed:

- ✅ `VPS_HOST`
- ✅ `VPS_USERNAME`
- ✅ `VPS_SSH_KEY`
- ✅ `VPS_PORT` (if applicable)

**Important:** GitHub never shows secret values after they're saved. You can only update or delete them.

## Security Best Practices

1. **Dedicated SSH Key**
   - Use a separate SSH key specifically for GitHub Actions
   - Never reuse personal SSH keys

2. **Limited Permissions**
   - The VPS user should have minimal required permissions
   - Consider using a dedicated deployment user with restricted access

3. **Key Rotation**
   - Periodically rotate SSH keys (e.g., every 6-12 months)
   - Update the secret in GitHub when rotating

4. **Monitor Access**
   - Review SSH login logs on your VPS regularly
   - Check GitHub Actions workflow run logs for suspicious activity

5. **Protect Your Private Key**
   - Never commit private keys to git
   - Delete local copies of private keys after adding to GitHub Secrets
   - Store backups securely (encrypted password manager)

## Testing the Setup

After configuring secrets, test the workflow:

### Option 1: Automatic Trigger (Push to Main)

```bash
# Make a small change and push to main branch
git checkout main
git pull
echo "# Testing staging deployment" >> README.md
git add README.md
git commit -m "Test staging deployment"
git push origin main
```

### Option 2: Manual Trigger

1. Go to GitHub repository → "Actions" tab
2. Select "Deploy to Staging" workflow
3. Click "Run workflow" button
4. Select `main` branch
5. Click "Run workflow"

### Monitor the Deployment

1. Go to "Actions" tab in your repository
2. Click on the running workflow
3. Click on the "Deploy to Staging Environment" job
4. Expand "Deploy to VPS" step to see deployment logs

**Successful deployment shows:**
```
Starting Staging Deployment
...
Staging Deployment Complete!
URL: https://staging.appofasi.gr
```

## Troubleshooting

### Error: Permission denied (publickey)

**Problem:** The SSH key authentication failed.

**Solutions:**

1. Verify the public key is in `~/.ssh/authorized_keys` on the VPS:
   ```bash
   ssh your-username@your-vps-ip "cat ~/.ssh/authorized_keys"
   ```

2. Check file permissions on VPS:
   ```bash
   ssh your-username@your-vps-ip "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
   ```

3. Verify you copied the **private key** (not public key) to `VPS_SSH_KEY` secret

4. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/github_actions_staging your-username@your-vps-ip
   ```

### Error: Connection refused

**Problem:** Cannot connect to VPS.

**Solutions:**

1. Verify VPS_HOST is correct (try pinging it)
   ```bash
   ping your-vps-ip
   ```

2. Check if SSH service is running on VPS:
   ```bash
   systemctl status ssh
   ```

3. Verify firewall allows SSH connections:
   ```bash
   sudo ufw status
   sudo ufw allow ssh
   ```

4. If using non-standard port, ensure `VPS_PORT` secret is set correctly

### Error: Host key verification failed

**Problem:** GitHub Actions runner doesn't recognize the VPS host key.

**Solution:** This is handled automatically by the `appleboy/ssh-action` used in the workflow. If you still encounter this, you can add `StrictHostKeyChecking=no` to SSH options (less secure but functional).

### Workflow Doesn't Trigger

**Problem:** Pushing to main doesn't trigger the workflow.

**Solutions:**

1. Verify the workflow file exists: `.github/workflows/deploy-staging.yml`

2. Check if workflow is enabled:
   - Go to Actions tab
   - Look for "Deploy to Staging" workflow
   - Enable it if disabled

3. Try manual trigger instead

## Related Documentation

- [Staging Deployment Guide](STAGING_DEPLOYMENT.md) - Complete staging setup guide
- [VPS Deployment Guide](VPS_DEPLOYMENT.md) - Production deployment reference
- [GitHub Actions Documentation](https://docs.github.com/en/actions) - Official GitHub Actions docs
- [SSH Key Authentication](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) - GitHub SSH guide

## Support

If you encounter issues not covered here:

1. Check the workflow run logs in GitHub Actions
2. Review VPS logs: `pm2 logs newsapp-staging-backend`
3. Verify staging setup: `pm2 status` on VPS
4. Check SSH connection manually before debugging the workflow
