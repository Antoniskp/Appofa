# Security review — 24 September 2026

Update: the findings below record the pre-fix checkout. Local fixes and deployment requirements are recorded in [SECURITY_REMEDIATION_2026-09-24.md](SECURITY_REMEDIATION_2026-09-24.md). The original audit JSON is retained as before-fix evidence.

The current checkout needs security remediation before an unattended week. This is a source/dependency review, not a production penetration test or evidence of an existing compromise. No application code, dependencies, production configuration, or deployed services were changed.

## 1. Critical: vulnerable Next.js image optimization dependency

The lockfile contains Next.js 16.2.6 and sharp 0.34.2. `next.config.js` allows arbitrary HTTPS image hosts and enables AVIF output. The public image optimizer is therefore a priority exposure to investigate and patch. The advisory describes unauthenticated remote code execution when AVIF inputs are optimized; actual exploitability depends on the deployed native libraries and image-processing path. Merely removing AVIF from output formats is not a sufficient fix for malicious AVIF inputs.

- [Next.js advisory GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4): patched Next.js 16.x starts at 16.3.3.
- [sharp advisory GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c): audit reports versions below 0.35.4 as affected.
- Upgrade Next.js and both direct/transitive image-processing dependencies, rebuild the frontend, test image uploads/rendering, and deploy the rebuilt artifact. Confirm the deployed versions afterward.

## 2. High: stale sessions retain privileges

`src/middleware/auth.js:25` and `src/middleware/optionalAuth.js:16` verify the JWT and accept its embedded user/role claims without checking the current account. `checkRole` uses those claims. Sessions default to 30 days (`src/config/session.js:3`). Password changes/resets save the new password but do not invalidate existing JWTs; logout only clears browser cookies.

A local isolated check with an ephemeral signing secret confirmed that an admin token for a nonexistent account passes both authentication and the admin role check. This demonstrates the missing account lookup, not an ability to forge real tokens. A stolen legitimate token or a token issued before demotion/deletion can remain usable until expiry.

Remediation: load the current account and role on authenticated requests, reject deleted accounts, and introduce a session version/revocation mechanism checked by required authentication, optional authentication, and rate-limit authentication. Increment it on password reset/change and appropriate account-security actions. Test demotion, deletion, reset, and logout revocation explicitly.

## 3. High if used unchanged: Docker production defaults

`docker-compose.yml` embeds a publicly known JWT secret and database password, declares production mode, and publishes PostgreSQL and the API on all host interfaces. If deployed unchanged, the JWT secret enables forged administrator tokens; database exposure also depends on the host firewall.

Require externally supplied strong secrets, keep PostgreSQL on the private Docker network or loopback, and restrict API access to the reverse proxy. If these values were ever deployed, rotate them; editing the template alone does not rotate existing credentials. Changing PostgreSQL initialization variables does not change a password in an existing database volume.

## 4. Medium: pre-authentication WebSocket resource handling

`src/websocket/workerWsServer.js:175` upgrades connections before token validation and buffers messages without a byte/count bound while the database token check is pending. There is no explicit small payload limit or authentication deadline. The socket error listener is installed only after authentication succeeds, leaving errors during the await without that handler.

Authenticate before upgrade where possible; otherwise install error handling immediately and enforce a bounded queue, payload limit, authentication deadline, and connection limits. Production reachability of `/ws/workers` was not verified. No load or crash attack was performed.

## Dependency audit results

Fresh npm registry audit of this checkout:

| Scope | Critical | High | Moderate | Low | Total |
|---|---:|---:|---:|---:|---:|
| Production | 1 | 10 | 2 | 2 | 15 |
| All dependencies | 2 | 13 | 2 | 2 | 19 |

These are affected package counts, including transitive effects, not 15 independently proven exploitable flaws. Raw production findings are saved in `security-audit-production.json` at the repository root. Other priorities include multer 2.2.0 (multipart denial of service; audit indicates patch 2.3.0), axios 1.16.0, nodemailer, and transitive parsers. Some reported packages are build tooling despite being installed in the production dependency tree.

Do not use `npm audit fix --force` indiscriminately. Update deliberately, rerun the audit, test authentication/uploads/email and a production frontend build, then deploy. The sharp update crosses its current 0.x minor range and needs compatibility validation.

## Validation and limits

- Five existing Jest suites passed: security, security headers/environment, optional authentication, worker authentication, and worker WebSocket behavior — 28 tests total.
- Independently reproduced acceptance of stale/nonexistent-account admin claims at middleware level using an ephemeral test secret.
- `.env` is not tracked; only `.env.example` appeared in the tracked environment-file check. This is not a full secret-history scan.
- Existing GitHub security workflow schedules a Monday dependency audit, but its execution, notification delivery, and deployment-gating status were not verified.
- The older `doc/SECURITY.md` zero-vulnerability figures and 24-hour session description do not describe the current checkout.
- Did not inspect production installed versions, firewall rules, TLS renewal, active sessions, logs, database permissions, backup completion/restorability, or monitoring delivery. No exploit was sent to the live site.

## Before leaving

1. Patch and deploy Next.js/image processing and remaining high/critical production dependencies; verify the deployed artifact and smoke-test login and uploads.
2. Verify production uses unique strong secrets and that ports 5432, 3000, and 3001 are inaccessible from the public internet except through the intended proxy path.
3. Correct session privilege/revocation handling; review who currently has elevated access.
4. Confirm a recent off-server database/media backup and a tested restore procedure.
5. Confirm uptime/error/disk alerts reach someone who can respond during the week. A scheduled dependency scan alone is not operational monitoring.
