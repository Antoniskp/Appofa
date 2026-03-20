# Troubleshooting Guide

## 502 Bad Gateway — Entire Site Unavailable

**Symptoms:** Every page returns a 502 error (not just API calls), including `/` and `/favicon.ico`.

**Cause:** nginx cannot reach the Next.js frontend on port 3001. The most common trigger after an update is:
- A stale or missing `.next` build (e.g. after the Next.js package was updated via `npm ci`), or
- Missing database migrations causing the backend to crash.

**Quick fix:**

The `npm run frontend:start` script now detects a missing or stale build and rebuilds automatically. In most cases simply restarting the frontend is enough:

```bash
cd /var/www/Appofa

# 1. Restart the frontend — it will auto-rebuild if the build is stale
pm2 restart newsapp-frontend

# 2. Run any pending migrations and restart the backend
npm run migrate
pm2 restart newsapp-backend

pm2 save
```

Check PM2 status after:
```bash
pm2 status   # both processes must show "online"
```

If the automatic rebuild fails (check `pm2 logs newsapp-frontend --err`), force a clean rebuild:
```bash
pm2 stop newsapp-frontend
rm -rf .next
NODE_ENV=production npm run frontend:build
pm2 restart newsapp-frontend newsapp-backend
pm2 save
```

For full diagnostic steps and additional fix scenarios, see [VPS Setup — Troubleshooting: 502 Bad Gateway](VPS_SETUP.md#troubleshooting-502-bad-gateway).

---

## Common Browser Console Errors

### `webpage_content_reporter.js` SyntaxError

**Error Message:**
```
webpage_content_reporter.js:1 Uncaught SyntaxError: Unexpected token 'export'
```

**Cause:**
This error is **not caused by the Appofa application code**. The file `webpage_content_reporter.js` does not exist in our codebase. This error typically occurs when:

1. **Browser Extension Injection**: A browser extension (commonly ad blockers, content readers, or page analyzers) is injecting JavaScript into the page
2. **Third-party Script**: Some external service or tool is attempting to load a script that uses ES6 module syntax without proper configuration

**Solution:**
- **For Users**: This error does not affect the functionality of the Appofa application. You can safely ignore it, or try:
  - Disable browser extensions one by one to identify which one is causing the issue
  - Use browser incognito/private mode to test if extensions are the cause
  - Check browser developer tools to see which extension is injecting the script

- **For Developers**: No code changes are needed in the Appofa application. This is an external issue.

### Missing Favicon (404 Error)

**Error Message:**
```
GET https://appofasi.gr/favicon.ico 404 (Not Found)
```

**Status:** ✅ Fixed

The favicon has been added to the application at `app/favicon.ico` and is properly referenced in the layout metadata. This error should no longer appear after the latest deployment.

## Additional Resources

For other issues, please check:
- [Project Summary](PROJECT_SUMMARY.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [Security Guidelines](SECURITY.md)

## npm Install Warnings

### Deprecated Package Warnings During `npm install`

**Warnings:**
```
npm warn deprecated @npmcli/move-file@1.1.2: This functionality has been moved to @npmcli/fs
npm warn deprecated npmlog@6.0.2: This package is no longer supported.
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead for a more spec-conformant...
npm warn deprecated are-we-there-yet@3.0.1: This package is no longer supported.
npm warn deprecated gauge@4.0.4: This package is no longer supported.
```

**Cause:**
These warnings come from transitive dependencies of the `sqlite3` **dev dependency**, which is used only for local testing. The packages (`npmlog`, `gauge`, `are-we-there-yet`, `@npmcli/move-file`) are pulled in by `node-gyp` (the native module builder used by `sqlite3`). They do **not** affect the production application.

**Status:** These are upstream warnings that will be resolved when `sqlite3` updates its `node-gyp` dependency. No action is required on the application side.

**To suppress these warnings** (suppresses all deprecation warnings during install):
```bash
npm install --no-warnings
```

### npm Audit Vulnerabilities (Post-Install)

After `npm install` you may see deprecation warnings from transitive dependencies of `sqlite3` (dev-only). These do **not** affect production.

To confirm zero production vulnerabilities, run:

```bash
npm audit --omit=dev
```

All known high- and moderate-severity vulnerabilities have been resolved. See [Security Guidelines](SECURITY.md) for full details.
