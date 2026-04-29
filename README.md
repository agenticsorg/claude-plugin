# agenticsorg/claude-plugin

Claude Code marketplace for the Agentics Foundation.

## Install

```bash
claude /plugin marketplace add agenticsorg/claude-plugin
claude /plugin install agentics-org@agenticsorg
```

## Plugins in this marketplace

| Plugin | Description |
|--------|-------------|
| [`agentics-org`](./plugins/agentics-org) | MCP access to agentics.org — fetch pages, search content, list routes, read sections as resources. Ships `/agentics` command, `agentics-content` skill, and `agentics-researcher` agent. |

## Layout

```
.
├── .claude-plugin/
│   └── marketplace.json       # marketplace manifest
├── plugins/
│   └── agentics-org/          # individual plugin
│       ├── .claude-plugin/plugin.json
│       ├── .mcp.json
│       ├── server.js          # MCP server (Node 18+)
│       ├── package.json
│       ├── skills/agentics-content/SKILL.md
│       ├── commands/agentics.md
│       ├── agents/agentics-researcher.md
│       └── README.md
└── README.md
```

## Local testing

```bash
git clone https://github.com/agenticsorg/claude-plugin
cd claude-plugin/plugins/agentics-org
npm install
claude --plugin-dir .
> /agentics list
```

## License

MIT
