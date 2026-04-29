---
name: build-agent
description: Tutorial for building your first agent in the Agentics ecosystem. Covers Claude Code agents, MCP servers, and orchestrating multi-agent swarms. Use when a user asks how to build, design, or deploy an agent.
---

# Build Your First Agent

A walkthrough for building an agent that does useful work.

## Choose the agent shape

Three common shapes:

| Shape | Use when | Example |
|-------|----------|---------|
| **Skill** | Stateless guidance Claude follows | "How to deploy to GCP" |
| **Slash command** | One-shot user-triggered action | `/events list` |
| **Subagent** | Specialized model with own context | Code reviewer, research agent |
| **MCP server** | Programmatic tools (fetch, query, mutate) | `agentics-org`, `agentics-events` |

Most useful agents combine these: an MCP server provides tools, a skill teaches Claude when to call them, and a subagent owns a specialized workflow.

## Minimal Claude Code agent (5 minutes)

```
plugins/my-agent/
├── .claude-plugin/plugin.json    # name, version, description
├── agents/my-agent.md            # frontmatter: name, description, model
└── skills/my-skill/SKILL.md      # frontmatter: name, description
```

Then test with `claude --plugin-dir ./plugins/my-agent`.

## Add tools with an MCP server

When you need real-world I/O (HTTP, files, APIs), wrap them in an MCP server:

1. Add `.mcp.json` to wire the server
2. Write `server.js` using `@modelcontextprotocol/sdk`
3. Reference the tools in `allowed-tools:` of your skill

The `agentics-org` plugin in this marketplace is a working reference. Read its `server.js`.

## Orchestrate multiple agents

For complex jobs, spawn parallel agents using the Task tool:
- One message, multiple Task calls = parallel execution
- Each agent runs in isolation with its own context window
- Use a coordinator agent to merge results

See the `swarm-orchestration` skill for advanced patterns.

## Output style

Lead with a working minimal example. Resist over-explaining theory. Drop them into a working scaffold first, then explain why each piece exists.
