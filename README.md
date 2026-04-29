# agenticsorg/claude-plugin

Claude Code marketplace for the **Agentics Foundation** — plugins for the Agentics community, MCP integrations with agentics.org services, and educational content.

## Install the marketplace

```
/plugin marketplace add agenticsorg/claude-plugin
```

Then install whichever plugins you want:

```
/plugin install agentics-org@agenticsorg
/plugin install agentics-tutorials@agenticsorg
/plugin install agentics-events@agenticsorg
```

## Plugins

| Plugin | Type | What it does |
|--------|------|--------------|
| [`agentics-org`](./plugins/agentics-org) | MCP | Fetch pages, search content, list routes; resources + prompts for agentics.org |
| [`agentics-tutorials`](./plugins/agentics-tutorials) | Content | Step-by-step tutorials: getting started, building agents, MCP integration |
| [`agentics-onboarding`](./plugins/agentics-onboarding) | Content | Guided 4-step onboarding: signup → community → starter project → first event |
| [`agentics-glossary`](./plugins/agentics-glossary) | Content | `/glossary <term>` lookup for Agentics, MCP, and agentic AI terminology |
| [`agentics-events`](./plugins/agentics-events) | MCP | List/search/fetch Agentics events via the Luma API (with fallback) |
| [`agentics-blog`](./plugins/agentics-blog) | MCP | List/search/read Agentics blog posts (RSS-first, sitemap fallback) |
| [`agentics-projects`](./plugins/agentics-projects) | MCP | Browse `agenticsorg` GitHub repos and the agentics.org/partners page |

**Type legend:** `MCP` = ships an MCP server (needs `npm install`). `Content` = pure skills/commands/agents.

## How they compose

```
                ┌──────────────────────┐
                │  agentics-onboarding │
                │   (4-step flow)      │
                └─────────┬────────────┘
                          │ uses
              ┌───────────┴──────────────┐
              │                          │
              ▼                          ▼
     ┌────────────────┐         ┌───────────────────┐
     │  agentics-org  │         │  agentics-events  │
     │  (live pages)  │         │  (Luma API)       │
     └────────────────┘         └───────────────────┘
              ▲                          ▲
              │                          │
     ┌────────┴────────┐                 │
     │ agentics-       │                 │
     │ tutorials       │─────────────────┘
     │ (curriculum)    │      references events for hands-on workshops
     └─────────────────┘
```

`agentics-glossary`, `agentics-blog`, and `agentics-projects` stand alone; the others reinforce each other.

## Layout

```
.
├── .claude-plugin/
│   └── marketplace.json       # registers all plugins
├── docs/adr/
│   └── 0001-marketplace-structure.md
├── plugins/
│   ├── agentics-org/
│   ├── agentics-tutorials/
│   ├── agentics-onboarding/
│   ├── agentics-glossary/
│   ├── agentics-events/
│   ├── agentics-blog/
│   └── agentics-projects/
└── README.md
```

See [ADR-0001](./docs/adr/0001-marketplace-structure.md) for the architecture decision behind this layout.

## Local development

Test a single plugin without installing the marketplace:

```bash
git clone https://github.com/agenticsorg/claude-plugin
cd claude-plugin/plugins/<name>
npm install        # only for MCP plugins
claude --plugin-dir .
```

Test all four MCP servers end-to-end:

```bash
node test-all-mcp.js
```

## Configuration

Plugins read configuration from `env` blocks in `.mcp.json`. Each plugin's README documents which env vars are supported. Plugins degrade gracefully when optional env vars are unset (e.g., `agentics-events` falls back to the public `/events` page when `LUMA_API_KEY` is missing).

## Contributing

1. New plugins go under `plugins/<name>/` following the conventions in [ADR-0001](./docs/adr/0001-marketplace-structure.md)
2. Add an entry to `.claude-plugin/marketplace.json`
3. MCP plugins must pass `node test-all-mcp.js` (extend `PLUGINS` array if adding a new server)
4. Each plugin needs its own `README.md`

## License

MIT — see individual plugin directories for any deviations.
