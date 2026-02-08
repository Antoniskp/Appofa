# Upgrading Node.js on VPS from Node 20 to Node 22

## Prerequisites
- SSH access to your VPS
- Current Node.js 20 installation (verify with `node -v`)

## Upgrade Steps

### 1. Backup Current Setup (Optional but Recommended)
```bash
# Check current Node version
node -v

# Check current npm version
npm -v

# List globally installed packages (to reinstall if needed)
npm list -g --depth=0 > ~/npm-global-packages-backup.txt
```

### 2. Install Node.js 22 via NodeSource

```bash
# Download and run NodeSource setup script for Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js 22
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v22.x.x
npm -v   # Should show v10.x.x or higher
```

### 3. Reinstall Global Packages

PM2 and other global packages should still be installed, but if needed:

```bash
# Reinstall PM2 if necessary
sudo npm install -g pm2

# Verify PM2 works
pm2 list
```

### 4. Update Application Dependencies

```bash
# Navigate to your application directory
cd /var/www/Appofa

# Remove old node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clean npm cache
npm cache clean --force

# Install dependencies with Node 22
npm install

# Rebuild Next.js
npm run frontend:build
```

### 5. Restart Application

```bash
# Restart the application with PM2
pm2 restart all

# Check application status
pm2 status

# View logs to ensure everything is working
pm2 logs --lines 50
```

### 6. Verify Everything Works

```bash
# Check if backend is responding
curl http://localhost:3000/api/health || curl http://localhost:3000

# Check if frontend is responding
curl http://localhost:3001

# Check PM2 status
pm2 status

# Check for any errors in logs
pm2 logs --err --lines 20
```

## Rollback (If Something Goes Wrong)

If you encounter issues, you can rollback to Node 20:

```bash
# Remove Node 22
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify rollback
node -v  # Should show v20.x.x

# Reinstall dependencies
cd /var/www/Appofa
rm -rf node_modules package-lock.json
npm install
npm run frontend:build

# Restart application
pm2 restart all
```

## Expected Outcome

After upgrade:
- ✅ `node -v` shows v22.x.x
- ✅ `npm -v` shows v10.x.x or higher
- ✅ Application runs without errors
- ✅ PM2 shows all processes running
- ✅ No deprecation warnings from npm packages

## Troubleshooting

### Issue: npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules package-lock.json`
- Try again: `npm install`

### Issue: PM2 not working
- Reinstall PM2: `sudo npm install -g pm2`
- Restore PM2 startup: `pm2 startup` and follow instructions

### Issue: Application won't start
- Check logs: `pm2 logs`
- Check Node version: `node -v` (should be 22.x.x)
- Verify all environment variables in `.env` are still correct

## Timeline

Estimated downtime: **5-10 minutes**

Recommended time: During low-traffic period
