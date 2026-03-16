# Contributing Guide

Thank you for your interest in contributing to the Appofa News Application!

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Appofa.git
   cd Appofa
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Antoniskp/Appofa.git
   ```

---

## Development Setup

Follow the **Quick Start** instructions in the [README](../README.md) to set up your local environment.

Key steps:
```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev        # Start API server (port 3000)
npm run frontend   # Start Next.js frontend (port 3001)
```

---

## Branching Strategy

- `main` – stable production branch; all PRs target this branch
- Feature branches should be named descriptively: `feature/<short-description>`
- Bug-fix branches: `fix/<short-description>`
- Documentation branches: `docs/<short-description>`

Always branch off `main`:
```bash
git checkout main
git pull upstream main
git checkout -b feature/my-new-feature
```

---

## Making Changes

- Keep changes focused. One logical change per pull request.
- Update or add documentation in `doc/` if your change affects functionality, configuration, or setup.
- Add or update tests for any new or modified behaviour (see [Testing](#testing)).
- Run the linter before committing:
  ```bash
  npm run lint
  ```

---

## Commit Messages

Use clear, concise commit messages in the imperative mood:

```
Add poll export endpoint
Fix rate limiter trust-proxy configuration
Update Node.js prerequisite to 22+
```

For larger changes, include a short body after a blank line explaining *why* the change was made.

---

## Pull Requests

1. Push your branch to your fork:
   ```bash
   git push origin feature/my-new-feature
   ```
2. Open a pull request against `Antoniskp/Appofa:main`.
3. Fill in the PR description with:
   - **What** was changed and **why**
   - Steps to test the change
   - Any relevant screenshots (for UI changes)
4. Ensure all CI checks pass before requesting a review.

---

## Code Style

- **Backend (Node.js/Express)**: Follow the ESLint rules defined in `eslint.config.js`.
  ```bash
  npm run lint
  ```
- **Frontend (Next.js/React)**: Follow the same ESLint configuration; prefer functional components and hooks.
- **Database**: Use Sequelize migrations for all schema changes (never modify the database directly in production).

---

## Testing

Run the full test suite before opening a PR:
```bash
npm test
```

- Tests live in `__tests__/` and use **Jest** + **Supertest**.
- Use an in-memory SQLite database for tests (configured automatically via `jest.setup.js`).
- Do not remove or skip existing tests. If a test fails because of your change, update it and explain why in the PR description.

For a targeted run:
```bash
npm test -- __tests__/polls.test.js
```

---

## Reporting Issues

When opening a bug report, please include:

1. A clear title and description
2. Steps to reproduce
3. Expected vs. actual behaviour
4. Relevant log output (from `pm2 logs` or the terminal)
5. Environment details: Node.js version, OS, PostgreSQL version

Security vulnerabilities should be reported privately — do **not** open a public issue. Contact the maintainer directly.

---

**Thank you for contributing!**
