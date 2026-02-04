# Nginx Configuration Files

This directory contains nginx configuration templates for the Appofa application.

## Files

### staging.conf

Nginx configuration for the **STAGING/NON-PRODUCTION** environment.

- **Domain:** staging.appofasi.gr
- **Backend Port:** 3002 (Express API)
- **Frontend Port:** 3003 (Next.js)
- **Location:** Copy to `/etc/nginx/sites-available/newsapp-staging` on VPS

**Installation:**

```bash
# Copy the configuration file
sudo cp config/nginx/staging.conf /etc/nginx/sites-available/newsapp-staging

# Enable the site
sudo ln -s /etc/nginx/sites-available/newsapp-staging /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Configuration Details

The nginx configuration implements a reverse proxy setup with three routing rules:

### 1. API Routes (`/api/`)

Routes all API requests to the Express backend server:

```nginx
location /api/ {
    proxy_pass http://localhost:3002;
    ...
}
```

**Examples:**
- `https://staging.appofasi.gr/api/auth/login` → `http://localhost:3002/api/auth/login`
- `https://staging.appofasi.gr/api/articles` → `http://localhost:3002/api/articles`

### 2. Next.js Static Assets (`/_next/`)

Routes Next.js static assets (JavaScript, CSS, images) to the frontend server:

```nginx
location /_next/ {
    proxy_pass http://localhost:3003;
    ...
}
```

**Examples:**
- `https://staging.appofasi.gr/_next/static/chunks/main.js` → `http://localhost:3003/_next/static/chunks/main.js`
- `https://staging.appofasi.gr/_next/static/css/app.css` → `http://localhost:3003/_next/static/css/app.css`

**Critical:** Without this routing, Next.js static assets will fail to load, breaking client-side functionality.

### 3. All Other Routes (`/`)

Routes all other requests (pages, public assets) to the Next.js frontend server:

```nginx
location / {
    proxy_pass http://localhost:3003;
    ...
}
```

**Examples:**
- `https://staging.appofasi.gr/` → `http://localhost:3003/`
- `https://staging.appofasi.gr/login` → `http://localhost:3003/login`
- `https://staging.appofasi.gr/articles/123` → `http://localhost:3003/articles/123`

## Proxy Headers

All locations include the following proxy headers for proper operation:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

These headers ensure:
- WebSocket support (if needed in the future)
- Proper host header forwarding
- Client IP address preservation
- Protocol information (HTTP/HTTPS)

## Port Configuration

### Staging Environment

| Service | Port | PM2 Process Name |
|---------|------|------------------|
| Backend | 3002 | newsapp-staging-backend |
| Frontend | 3003 | newsapp-staging-frontend |

### Production Environment (Reference)

| Service | Port | PM2 Process Name |
|---------|------|------------------|
| Backend | 3000 | newsapp-backend |
| Frontend | 3001 | newsapp-frontend |

**Note:** Different ports prevent conflicts when both environments run on the same VPS.

## SSL/TLS Configuration

The configuration files show HTTP (port 80) setup. After deploying, use Let's Encrypt with certbot to add HTTPS:

```bash
sudo certbot --nginx -d staging.appofasi.gr
```

Certbot will automatically modify the nginx configuration to:
- Listen on port 443 with SSL
- Redirect HTTP to HTTPS
- Include SSL certificate paths
- Add security headers

## Troubleshooting

### 404 Errors for Static Assets

**Problem:** Browser shows 404 errors for files like `/_next/static/chunks/main.js`

**Cause:** The `/_next/` location block is missing or routing to the wrong port

**Solution:**
1. Verify the configuration includes the `/_next/` location
2. Ensure it routes to the frontend port (3003 for staging)
3. Test nginx config: `sudo nginx -t`
4. Reload nginx: `sudo systemctl reload nginx`

### API Requests Return HTML Instead of JSON

**Problem:** API calls return HTML (Next.js page) instead of JSON responses

**Cause:** The `/api/` location block is missing or routing to the wrong port

**Solution:**
1. Verify the configuration includes the `/api/` location
2. Ensure it routes to the backend port (3002 for staging)
3. Test nginx config: `sudo nginx -t`
4. Reload nginx: `sudo systemctl reload nginx`

### Nginx Test Fails

**Problem:** `sudo nginx -t` shows syntax errors

**Common Issues:**
- Missing semicolons at end of directives
- Unclosed braces `{}`
- Typos in directive names

**Solution:**
1. Check the error message for line number
2. Compare with the template in this directory
3. Ensure all `{` have matching `}`
4. Ensure all directives end with `;`

### Connection Refused Errors

**Problem:** Nginx returns "502 Bad Gateway" or "Connection refused"

**Cause:** Backend or frontend PM2 process is not running

**Solution:**
```bash
# Check PM2 status
pm2 status

# Start missing processes
pm2 start src/index.js --name newsapp-staging-backend
pm2 start npm --name newsapp-staging-frontend -- run frontend:start -- -p 3003

# Verify services are listening
netstat -tlnp | grep -E '3002|3003'
```

## Related Documentation

- [Staging Deployment Guide](../STAGING_DEPLOYMENT.md) - Complete staging setup
- [VPS Deployment Guide](../VPS_DEPLOYMENT.md) - Production deployment reference
- [Nginx Official Documentation](https://nginx.org/en/docs/) - Nginx docs

## Security Considerations

1. **HTTPS Only:** Always use HTTPS in production/staging (via Let's Encrypt)
2. **Rate Limiting:** Consider adding rate limiting for API endpoints
3. **Access Control:** Consider restricting staging access via:
   - nginx `auth_basic` (HTTP basic authentication)
   - Firewall rules (allow only specific IPs)
   - VPN access

**Example: Add basic authentication to staging:**

```nginx
location / {
    auth_basic "Staging Environment";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:3003;
    ...
}
```

Create password file:
```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd staging_user
```
