---
name: agentics-projects
description: Discover Agentics open-source projects and partners. Cross-references agentics.org/partners with the agenticsorg GitHub org via the agentics-projects MCP server. Use when a user asks about Agentics projects, repos, partners, or where the source code lives.
allowed-tools: mcp__agentics-projects__list_repos mcp__agentics-projects__get_repo mcp__agentics-projects__search_repos mcp__agentics-projects__list_partners
---

# Agentics Projects

Discover Agentics projects across the website and GitHub.

## When to use

- "What projects does Agentics maintain?"
- "Show me Agentics repos about <topic>"
- "Who are the Agentics partners?"
- "Where's the source for <project>?"

## Tools

- `list_repos(limit?, type?)` — repos in the `agenticsorg` GitHub org
- `get_repo(name)` — single repo metadata
- `search_repos(query)` — substring match on name/description
- `list_partners()` — fetch agentics.org/partners

## Workflow

1. For repo discovery, `list_repos` (sorted by recent push)
2. For topic searches, `search_repos`
3. For partners, `list_partners` then cross-reference each partner against `search_repos`
4. When summarizing a project, return: name, description, language, stars, URL

## Rate limits

Without `GITHUB_TOKEN`, GitHub allows 60 requests/hour anonymously. Set a token in `.mcp.json` env to raise it.
