# Dependency Updates Guide

This document describes how to keep dependencies up to date, run security audits, and handle common upgrade tasks for this project.

## Checking for Vulnerabilities

```bash
npm audit
```

To automatically fix vulnerabilities that don't require breaking changes:

```bash
npm audit fix
```

To fix all vulnerabilities, including those that require major version bumps (review output carefully before applying):

```bash
npm audit fix --force
```

## Checking for Outdated Packages

```bash
npm outdated
```

This lists all packages where a newer version is available compared to what is installed (and what is specified in `package.json`).

## Updating Direct Dependencies

To update a specific package to its latest compatible version (respecting semver ranges in `package.json`):

```bash
npm update <package-name>
```

To update all direct dependencies to their latest compatible versions:

```bash
npm update
```

To upgrade a specific package beyond the current semver range (e.g., to a new major version):

```bash
npm install <package-name>@latest
```

## Package Overrides

The `package.json` contains an `overrides` section that forces specific versions of transitive
dependencies to address known vulnerabilities:

```json
"overrides": {
  "tar": "^7.5.8",
  "glob": "^13.0.0",
  "rimraf": "^6.0.1"
}
```

These should be reviewed periodically and removed once the parent packages have updated their own
dependency ranges.

## ESLint Configuration

This project uses **ESLint v9** with the [flat config](https://eslint.org/docs/latest/use/configure/configuration-files)
format (`eslint.config.js`). The previous `.eslintrc.js` format is not used.

If you need to add new ESLint plugins or rules, edit `eslint.config.js` directly.  The `@eslint/js`
package (bundled with ESLint v9) provides `js.configs.recommended`, and the `globals` package
provides language-specific global variables.

To run the linter:

```bash
npm run lint
```

## History of Significant Updates

### 2026-03 — Security & Deprecation Fixes

**Vulnerabilities resolved (7 total: 1 moderate, 6 high):**

| Package       | Severity | Advisory                     | Fix                                  |
|---------------|----------|------------------------------|--------------------------------------|
| `dottie`      | moderate | GHSA-r5mx-6wc6-7h9w          | Updated to 2.0.7 via `npm audit fix` |
| `minimatch`   | high     | GHSA-3ppc-4f35-3m26 (× 3)   | Updated to safe version via `npm audit fix` |
| `tar`         | high     | GHSA-83g3-92jg-28cx          | Forced to `^7.5.8` via `overrides` in `package.json` |

**Commands used:**

```bash
npm audit fix          # resolved all 7 vulnerabilities
```

**Deprecation warnings addressed:**

| Deprecated Package                    | Replacement / Action                           |
|---------------------------------------|------------------------------------------------|
| `eslint@8.57.1`                       | Upgraded to `eslint@^9.x`                     |
| `@humanwhocodes/config-array@0.13.0`  | Resolved by upgrading eslint (transitive dep)  |
| `@humanwhocodes/object-schema@2.0.3`  | Resolved by upgrading eslint (transitive dep)  |
| `@npmcli/move-file@1.1.2`             | Transitive dep of npm tooling; not addressable |
| `are-we-there-yet@3.0.1`             | Transitive dep of npm tooling; not addressable |
| `gauge@4.0.4`                         | Transitive dep of npm tooling; not addressable |
| `npmlog@6.0.2`                        | Transitive dep of npm tooling; not addressable |
| `whatwg-encoding@3.1.1`              | Transitive dep of npm tooling; not addressable |

**Breaking changes from eslint v8 → v9:**

- Configuration format changed from `.eslintrc.js` to `eslint.config.js` (flat config).
- `.eslintrc.js` has been removed; `eslint.config.js` is now the single source of ESLint configuration.
- The `globals` package (`^16.x`) was added as a dev dependency to supply environment globals
  (`node`, `es2021`, `jest`) in the new flat config format.
