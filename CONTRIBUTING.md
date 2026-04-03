# Contributing to Appofa

Welcome, and thank you for your interest in contributing to **Appofa**! This project is an application for news, education, and polls. We genuinely value community input and are excited to collaborate with developers who want to help improve it.

**Important:** Appofa is proprietary software (All Rights Reserved). By submitting a contribution you assign all intellectual property rights to the project owner per the [LICENSE](LICENSE) file. Please read the [License Note](#license-note) section before contributing.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Branching Strategy](#branching-strategy)
5. [Making Changes](#making-changes)
6. [Commit Messages](#commit-messages)
7. [Pull Request Process](#pull-request-process)
8. [Code Style](#code-style)
9. [Testing](#testing)
10. [Reporting Issues](#reporting-issues)
11. [Code of Conduct](#code-of-conduct)
12. [License Note](#license-note)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Appofa.git
   cd Appofa
   ```
3. **Add the upstream remote** so you can pull in future changes:
   ```bash
   git remote add upstream https://github.com/Antoniskp/Appofa.git
   ```

---

## Development Setup

### Local Development

```bash
npm install
cp .env.example .env          # edit with your DB credentials and JWT secret
npm run migrate               # apply all pending database migrations
npm run dev                   # start API server on port 3000
```

In a second terminal:

```bash
npm run frontend              # start Next.js frontend on port 3001
```

- API: `http://localhost:3000`
- Frontend: `http://localhost:3001`

> See [doc/OAUTH.md](doc/OAUTH.md) for GitHub and Google OAuth setup, and [doc/GOOGLE_ANALYTICS.md](doc/GOOGLE_ANALYTICS.md) for GA4 configuration.

### Docker

```bash
docker-compose up -d          # starts PostgreSQL (port 5432) + API (port 3000)
```

> **Note:** Docker Compose starts PostgreSQL and the API only. The Next.js frontend must still be started separately with `npm run frontend`.

---

## Project Structure

```
Appofa/
├── src/           # Express API — controllers, models, routes, services, migrations
├── app/           # Next.js App Router pages and layouts
├── components/    # Shared React components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries (frontend helpers)
├── config/        # Static configuration (e.g., articleCategories.json)
├── __tests__/     # Jest test suites
├── scripts/       # Deployment and seed scripts
├── public/        # Static assets
└── doc/           # Project documentation
```

---

## Branching Strategy

| Branch prefix | Purpose |
|---|---|
| `main` | Stable, production-ready code — always deployable |
| `feature/<name>` | New features or enhancements |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation-only changes |

Always branch off `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/my-new-feature
```

---

## Making Changes

- **Keep PRs focused** — one feature or fix per pull request.
- **Update documentation** — if your change affects functionality, API endpoints, or setup, update the relevant file(s) in `doc/` and/or `README.md`.
- **Add or update tests** — new behaviour should be covered by tests in `__tests__/`.
- **Run lint before committing:**
  ```bash
  npm run lint
  ```

---

## Commit Messages

Use **imperative mood** in the subject line (e.g. "Add", "Fix", "Update", not "Added" or "Fixes"):

```
Add poll export endpoint

Introduce a new GET /api/polls/:id/export route that returns
anonymised JSON suitable for public audit. Includes unit tests
and updates to doc/POLL_EXPORT_AUDIT.md.
```

- Keep the subject line under 72 characters.
- Leave a blank line between the subject and body.
- Use the body to explain *what* and *why*, not *how*.

---

## Pull Request Process

1. **Push** your branch to your fork:
   ```bash
   git push origin feature/my-new-feature
   ```
2. **Open a PR** against the `main` branch of `Antoniskp/Appofa`.
3. **Fill in the PR description** with:
   - What this PR changes and why
   - How to test it (steps to reproduce / verify)
   - Screenshots or recordings for UI changes
4. **Ensure CI passes** — all checks (lint, tests) must be green before a review is requested.
5. A maintainer will review your PR and may request changes. Please respond to review comments promptly.

---

## Code Style

### Backend (Express API)

- ESLint rules are defined in [`eslint.config.js`](eslint.config.js).
- Run the linter before every commit:
  ```bash
  npm run lint
  ```
- Fix any reported errors; warnings should be reviewed and addressed where possible.

### Frontend (Next.js / React)

- Prefer **functional components** and React hooks over class components.
- Keep components small and single-purpose.
- Use Tailwind CSS utility classes for styling — avoid inline `style` props.

### Database

- **Never modify the database schema directly in production.**
- All schema changes must go through **Sequelize migrations** in `src/migrations/`.
- Generate a new migration file for every schema change and test it with `npm run migrate`.

---

## Testing

Run the full test suite:

```bash
npm test                      # Jest + Supertest with coverage (in-memory SQLite)
```

Watch mode for active development:

```bash
npm run test:watch
```

Run a single test file:

```bash
npx jest __tests__/myFeature.test.js
```

**Guidelines:**
- Place new tests in `__tests__/` following the existing naming convention.
- Do not skip or comment out existing tests without a clear justification in the PR.
- Aim for meaningful coverage of new code paths, including error cases.

---

## Reporting Issues

### Bug Reports

Please include the following in your issue:

- **Title**: Short, descriptive summary of the problem
- **Description**: What you expected to happen vs. what actually happened
- **Reproduction steps**: Numbered list of steps to reproduce the issue
- **Logs / error output**: Relevant console errors, stack traces, or API responses
- **Environment**: OS, Node.js version, browser (if frontend), Appofa version / commit hash

### Security Vulnerabilities

**Do NOT open a public GitHub Issue for security vulnerabilities.** Please report them privately using [GitHub Security Advisories](https://github.com/Antoniskp/Appofa/security/advisories/new). This allows time for a fix to be prepared before public disclosure. If you are unsure whether an issue qualifies as a security vulnerability, err on the side of caution and report it privately.

### Feature Requests

Feature requests are welcome. Open a GitHub Issue with the `enhancement` label and describe:
- The problem you are trying to solve
- Your proposed solution or behaviour
- Any relevant examples or prior art

---

## Code of Conduct

We are committed to a welcoming and respectful community. All contributors are expected to:

- Be kind, patient, and constructive in all interactions.
- Assume good faith in others' contributions and questions.
- Accept feedback graciously and offer it thoughtfully.

**Zero tolerance** for harassment, discrimination, or personal attacks of any kind. The maintainer reserves the right to remove comments, close issues, or ban contributors who violate these principles at their sole discretion.

---

## License Note

By submitting a pull request, you confirm that:

1. You authored the contributed code and have the right to submit it.
2. You agree that your contribution becomes part of the Appofa codebase under the project's **All Rights Reserved** license.
3. You **assign all intellectual property rights** in your contribution to **Antoniskp** as described in the [LICENSE](LICENSE) file.

If you have questions about these terms, please open an issue or contact the maintainer before contributing.
