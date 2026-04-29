---
name: tutorial
description: Open an Agentics tutorial — list available tutorials or load one by name
---

Open or list Agentics tutorials.

Usage:
- `/tutorial list` — list all available tutorials
- `/tutorial getting-started` — open the beginner orientation
- `/tutorial build-agent` — walkthrough for building your first agent
- `/tutorial mcp-integration` — MCP server integration guide

Available tutorials are skills under this plugin:
- `getting-started` — what Agentics is, how to join, where to start
- `build-agent` — Claude Code agents, MCP servers, multi-agent orchestration
- `mcp-integration` — Model Context Protocol server walkthrough

Load the matching skill and walk the user through it one step at a time. Pause for questions between sections. Cite agentics.org URLs (use the `agentics-org` plugin) when grounding examples in real content.

ARGUMENTS: $ARGUMENTS
