# agentics-org

MCP plugin for Claude Code that exposes the public **agentics.org** website to agents.

## What you get

- **MCP server** (`agentics-org`) with three tools:
  - `fetch_page(path)` — fetch a page, return stripped text
  - `search_content(query)` — substring search across known pages
  - `list_pages()` — list routes (sitemap.xml or curated fallback)
- **MCP resources** — `agentics://home`, `agentics://about`, `agentics://community`, etc.
- **MCP prompts** — `summarize-section`, `answer-from-site`
- **Slash command** — `/agentics list|fetch|search|summarize|ask`
- **Skill** — `agentics-content` (auto-loaded when site content is relevant)
- **Agent** — `agentics-researcher` (Sonnet, for grounded research/summaries)

## Install

This plugin lives in `plugins/agentics-org/` of the agentics workspace.

```bash
# from the workspace root
claude --plugin-dir ./plugins/agentics-org
```

The MCP server is wired through `.mcp.json` and starts automatically.

### Dependencies

The server uses `@modelcontextprotocol/sdk`. Install once:

```bash
cd plugins/agentics-org && npm install
```

Node 18+ required.

## Configuration

Override the base URL via env in `.mcp.json` if you want to point at a staging
host (e.g. the v2 Cloud Run URL):

```json
{
  "mcpServers": {
    "agentics-org": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/server.js"],
      "env": { "AGENTICS_BASE_URL": "https://agentics-org-v2-667037737667.us-central1.run.app" }
    }
  }
}
```

## Caveats

`agentics.org` is a React SPA — JS-rendered content isn't visible to a raw HTTP fetch. The server returns the SSR shell, `<title>`, meta description, and any pre-rendered text, which covers navigation and SEO content but not dynamic dashboards. For full client-rendered output, layer a headless browser on top.

## Test

```bash
claude --plugin-dir ./plugins/agentics-org
> /agentics list
> /agentics fetch /about
> /agentics search community
```
