# Security remediation — 24 September 2026

The four source/dependency findings from the security review have been addressed locally. Production has not been modified or verified.

## Changes

- Updated Next.js to 16.3.3, sharp to 0.35.4 and Axios to 1.20.0. Refreshed compatible vulnerable dependencies, including multer 2.4.0 and nodemailer 9.1.1. The final full dependency audit reports zero vulnerabilities; see `security-audit-after.json` at the repository root. Installation used `--ignore-scripts`; actual native image processing and the frontend build were tested afterward.
- Required authentication, optional authentication, rate-limit exemptions, and analytics attribution now resolve sessions against the current account and persisted session version. Deleted accounts are rejected and role changes take effect on the next request. Session resolution is shared within one request only, with no cross-request privilege cache. JWT algorithms are restricted to HS256. Database lookup failures fail closed.
- Password updates rotate the session version. Password resets invalidate prior sessions; normal password changes issue fresh cookies to the current browser. Logout revokes all sessions on all devices. Legacy JWTs remain accepted only while an account's version is the initial `0`, and are invalidated by the same revocation events.
- Docker requires externally supplied secrets and binds the database/API published ports to loopback. Production API startup rejects missing/placeholder JWT secrets and weak database passwords (minimum lengths 32 and 16 respectively).
- Worker WebSocket connections have a 1 MiB message limit, an 8-message/64 KiB pre-authentication queue, a five-second authentication deadline, at most 32 pending token checks and 64 connected sockets. Error handling is attached before authentication begins. Legitimate workers can still send their initial registration immediately upon opening.
- Replaced malformed PNG fixtures rejected by the updated image decoder. Updated the integration fixture to use a newly issued admin token after password changes instead of continuing with a revoked token.

## Deployment sequence

1. Back up the production database and uploaded media; retain the current release for rollback. Confirm operational monitoring and an available responder for the unattended week.
2. Ensure production has unique strong secrets meeting the new startup requirements. If rotating the database password, change the actual database role password as well as the environment configuration. Changing Docker environment variables alone does not rotate passwords in an existing volume. Rotating JWT_SECRET signs everyone out.
3. Install from the updated lockfile (`npm ci`). Run `npm run migrate` to add `Users.sessionVersion` **before** starting the updated API. The migration is additive and backfills existing accounts with `0`; it was checked for repeatability and rollback against an isolated database.
4. Build the frontend (`npm run frontend:build`) and restart the API and frontend with the intended production environment. Do not serve an older `.next` artifact with the updated Next.js package.
5. Smoke-test login, password change, logout, uploads, and worker registration. Confirm deployed dependency versions, firewall restrictions, successful backups, alert delivery, and health endpoints. The local changes do not prove those production controls are active.

Existing public hostnames/reverse-proxy routing were not changed. Docker loopback bindings assume the reverse proxy runs on the host; a containerized proxy should reach the API through its private Docker network instead.

## Validation

- Fresh full npm audit: zero known vulnerabilities.
- Production Next.js build: passed using `.next-security-review` to preserve the existing local preview build.
- ESLint and migration filename checks: passed with existing lint warnings.
- Regression tests cover current role enforcement, deleted accounts, password changes/resets, logout, unavailable database, rate-limit exemptions, migration backfill, production secrets, and bounded worker authentication.
- Final full suite: **167 suites passed, 2 failed; 1,974 tests passed, 3 failed**. Remaining failures are two homepage copy/participation expectations in `__tests__/frontend.test.js` and the Romanian language button expectation in `__tests__/i18n-romanian-support.test.js`. Their implementation and assertions were not modified by this security work. All security, API, session, migration, upload, and worker regression suites passed.
- The full run explicitly set API_URL and NEXT_PUBLIC_API_URL to `http://localhost:3000`, matching proxy test expectations instead of inheriting the developer preview's port from `.env`.
