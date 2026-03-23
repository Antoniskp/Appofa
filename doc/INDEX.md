# Documentation Index

Welcome to the Appofa News Application documentation. All documentation files live in this `doc/` directory.

---

## Core Documentation

| File | Description |
|------|-------------|
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Holistic project overview: features, tech stack, role matrix, statistics |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, middleware, and component overview |
| [SECURITY.md](SECURITY.md) | Security features, audit history, and best practices |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute: branching, commits, PRs, code style |

---

## Features

| File | Description |
|------|-------------|
| [POLL_FEATURE.md](POLL_FEATURE.md) | Poll system: simple/complex polls, voting, Chart.js visualizations |
| [POLL_EXPORT_AUDIT.md](POLL_EXPORT_AUDIT.md) | Privacy-preserving poll data export endpoint |
| [LOCATION_MODEL.md](LOCATION_MODEL.md) | Hierarchical location system (International → Municipality) |
| [LOCATION_SECTIONS.md](LOCATION_SECTIONS.md) | Location Sections: section types, JSON shapes, moderator management, and extending |
| [OAUTH.md](OAUTH.md) | GitHub OAuth setup, account linking, and usage |
| [GOOGLE_ANALYTICS.md](GOOGLE_ANALYTICS.md) | Google Analytics GA4 integration guide |
| [MESSAGE_SYSTEM_IMPLEMENTATION.md](MESSAGE_SYSTEM_IMPLEMENTATION.md) | User-to-user messaging feature implementation |
| [VIDEO_EMBEDS.md](VIDEO_EMBEDS.md) | YouTube/TikTok video embed feature: usage, API, security |

---

## Deployment & Operations

| File | Description |
|------|-------------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Local, Docker, Heroku, and AWS deployment |
| [VPS_SETUP.md](VPS_SETUP.md) | Complete VPS deployment guide (Ubuntu/Debian, PM2, Nginx, SSL) |
| [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) | Application migration and upgrade procedures |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Google OAuth database migration guide |
| [MIGRATIONS.md](MIGRATIONS.md) | Database migration reference and commands |
| [NODE_UPGRADE_VPS.md](NODE_UPGRADE_VPS.md) | Node.js upgrade instructions for a running VPS |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and solutions |

---

## Development & Testing

| File | Description |
|------|-------------|
| [API_TESTING.md](API_TESTING.md) | API usage and testing examples (curl) |
| [POLL_TESTING.md](POLL_TESTING.md) | Poll system testing checklist |
| [POLL_EXPORT_AUDIT.md](POLL_EXPORT_AUDIT.md) | Poll audit export testing |
| [MESSAGE_SYSTEM_TESTING.md](MESSAGE_SYSTEM_TESTING.md) | Message system testing guide |
| [ARTICLE_TYPES_TESTING.md](ARTICLE_TYPES_TESTING.md) | Article type system testing |
| [DEPENDENCY_UPDATES.md](DEPENDENCY_UPDATES.md) | Dependency management and security audit history |
| [COPILOT_AGENTS.md](COPILOT_AGENTS.md) | AI Copilot agent configuration |

---

## Test Reports

| File | Description |
|------|-------------|
| [MIGRATION_017_TEST_REPORT.md](MIGRATION_017_TEST_REPORT.md) | Test report for migration 017 (add international location) |
| [INTERNATIONAL_LOCATION_TEST_REPORT.md](INTERNATIONAL_LOCATION_TEST_REPORT.md) | Integration test report for international location poll creation |

---

## Additional Resources

- [README.md](../README.md) – Project overview and quick start
- [postman_collection.json](postman_collection.json) – Postman API testing collection
- [.env.example](../.env.example) – Environment variable template
