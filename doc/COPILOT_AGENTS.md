# Copilot Agents

This repository includes custom GitHub Copilot agents to specialize on key areas of the codebase. Agent configuration files live in `.github/agents`.

## Available Agents
- **backend-api-specialist**: Focused on the Node.js/Express API in `src/`.
- **frontend-ui-specialist**: Focused on the Next.js App Router UI in `app/` and `components/`.
- **database-data-specialist**: Focused on Sequelize models, migrations, and data scripts.
- **readme-creator**: Focused on README and documentation updates.

## Managing Agents
1. Edit or add agent files in `.github/agents/`.
2. Merge changes into the default branch to make agents available.
3. Validate the agent scope aligns with the file instructions in each agent file.
