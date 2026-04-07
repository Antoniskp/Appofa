# Copilot Agents

This repository includes custom GitHub Copilot agents to specialize on key areas of the codebase. Agent configuration files live in `.github/agents`.

## How AI Reads & Updates Documentation

| File | Auto-read? | Purpose | Updated when? |
|------|-----------|---------|---------------|
| `.github/copilot-instructions.md` | ✅ Always (by Copilot) | Compact conventions & pointers | When patterns/conventions change |
| `doc/REPOSITORY_MAP.md` | Read when referenced | Full map: models, routes, pages, components | Every structural change |
| `AI_INSTRUCTIONS.md` | Read by some AI tools | Full coding standards & workflows | When standards change |
| `.github/agents/*.agent.md` | When agent is invoked | Domain-specific instructions | When that domain changes |

All files contain self-update instructions. After completing any task that changes the codebase structure, AI agents will update the relevant files.

## Available Agents
- **backend-api-specialist**: Focused on the Node.js/Express API in `src/`.
- **frontend-ui-specialist**: Focused on the Next.js App Router UI in `app/` and `components/`.
- **database-data-specialist**: Focused on Sequelize models, migrations, and data scripts.
- **documentation-specialist**: Focused on creating and maintaining documentation in `doc/` and README files.

## Managing Agents
1. Edit or add agent files in `.github/agents/`.
2. Merge changes into the default branch to make agents available.
3. Validate the agent scope aligns with the file instructions in each agent file.
