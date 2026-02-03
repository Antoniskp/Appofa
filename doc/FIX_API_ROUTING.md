# Fix: API Routing and 502 Errors

## Problem

After PR #65, the `/api/auth/profile` endpoint (and potentially other API endpoints) could return 502 errors and HTML responses instead of proper JSON responses when accessed through the Next.js frontend server.

## Root Cause

The issue was in `next.config.js`, which contained a rewrite rule:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
    },
  ];
}
```

### Why This Caused Issues

1. **Rewrite loops**: Next.js rewrites are designed for internal Next.js API routes, not for proxying to external Express servers. When the destination URL contained the same path (`/api/:path*`), it could create infinite rewrite loops.

2. **Unnecessary complexity**: The rewrite was redundant because:
   - In **development**: The frontend code (`lib/api.js`) makes direct fetch calls to the backend using `NEXT_PUBLIC_API_URL`
   - In **production**: Nginx reverse proxy handles routing `/api/*` requests to the backend server

3. **502 Errors**: The rewrite loop or misrouting could cause 502 Bad Gateway errors when Next.js tried to proxy requests that should go directly to the backend.

## Solution

Removed the rewrite configuration from `next.config.js`. The correct architecture is:

### Development (No Nginx)
```
Frontend (localhost:3001) --[direct fetch]--> Backend API (localhost:3000)
```
- Frontend uses `lib/api.js` with `NEXT_PUBLIC_API_URL=http://localhost:3000`
- Direct HTTP requests from browser to backend API
- No rewrites needed

### Production (With Nginx)
```
Browser --> Nginx --> Backend API (localhost:3000) for /api/*
        --> Nginx --> Frontend (localhost:3001) for everything else
```
- Nginx configuration routes `/api/*` to backend
- Nginx routes all other requests to frontend
- No Next.js rewrites needed

## Files Changed

- `next.config.js`: Removed the `rewrites()` function and unnecessary proxy configuration

## Testing

All tests pass (106/109, 3 skipped):
```bash
npm test
```

The backend API endpoints work correctly when accessed directly:
- `GET /api/auth/profile` returns JSON (with authentication)
- Error responses are properly formatted as JSON
- No HTML responses from API endpoints

## Prevention

To prevent similar issues:

1. **Direct API calls**: Always use direct fetch calls to the backend API URL (configured via `NEXT_PUBLIC_API_URL`)
2. **No Next.js rewrites for external APIs**: Don't use Next.js rewrites to proxy to external Express servers
3. **Nginx for production**: Use Nginx or similar reverse proxy for production routing
4. **Test both servers**: Test that both frontend and backend work independently

## References

- [Next.js Rewrites Documentation](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
- [VPS Deployment Guide](./VPS_DEPLOYMENT.md) - Nginx configuration
- [Architecture Documentation](./ARCHITECTURE.md)
