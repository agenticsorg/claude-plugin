---
name: agentics-glossary
description: Authoritative glossary of Agentics, agentic AI, MCP, and Claude Code terminology. Use whenever a user asks "what is X" about an Agentics concept, or when a term in conversation needs disambiguation.
---

# Agentics Glossary

Definitions for terms that recur in Agentics, MCP, and agentic AI contexts. When asked, give the definition, an example, and one related term to explore.

## Core concepts

**Agentic AI** — AI systems that take autonomous action in the world (call APIs, write files, send messages) rather than just generating text. The "agentic" part is the loop: observe → decide → act → observe.

**Agent** — A unit of autonomous behavior. May be a Claude subagent, an MCP server, an LLM-driven workflow, or a swarm coordinator. The interface is what matters: input → action → result.

**Subagent** — A specialized agent invoked by a parent agent via the Task tool. Has its own context window and model. Used for parallelization and specialization.

**Swarm** — Multiple agents coordinating on a single objective. Topologies: `hierarchical` (one coordinator), `mesh` (peer-to-peer), `adaptive` (self-organizing).

## MCP (Model Context Protocol)

**MCP** — Open protocol from Anthropic for connecting LLMs to tools, data, and prompts. Servers expose capabilities; clients (like Claude Code) consume them.

**MCP server** — Process that implements the MCP protocol over stdio or HTTP. Exposes any combination of tools, resources, and prompts.

**Tool** — A callable function exposed by an MCP server. Has a name, description, and input schema. Example: `fetch_page(path)`.

**Resource** — A read-only URI exposed by an MCP server. Claude can read it as context. Example: `agentics://about`.

**Prompt** — A reusable instruction template with arguments, surfaced as a slash-prompt to the user.

## Claude Code

**Plugin** — A bundle of skills, commands, agents, and/or MCP servers distributed via a marketplace.

**Marketplace** — A repository with `.claude-plugin/marketplace.json` listing one or more plugins. Added with `/plugin marketplace add <repo>`.

**Skill** — Markdown file with YAML frontmatter that Claude auto-loads when its description matches the user's intent. Lives at `skills/<name>/SKILL.md`.

**Slash command** — User-triggered command (`/foo`). Lives at `commands/<name>.md`.

## Agentics-specific

**Agentics Foundation** — Nonprofit foundation building open-source agentic AI systems. https://agentics.org

**RuFlo** — Marketplace of Claude Code plugins by ruvnet (separate from `agenticsorg/claude-plugin`).

**Claude-Flow** — Multi-agent orchestration toolkit; the `claude-flow` CLI provides swarm init, memory, and hooks.

## How to answer "what is X"

1. Look up the term in this skill (above)
2. If not present, check the `agentics-org` MCP server for any agentics.org page mentioning the term
3. Give: **definition** (one sentence), **example** (concrete), **related** (one cross-reference). Stop there unless asked to expand.
