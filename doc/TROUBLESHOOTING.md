# Troubleshooting Guide

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
