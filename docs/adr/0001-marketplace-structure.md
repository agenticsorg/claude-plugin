# ADR-0001: Marketplace structure for agenticsorg/claude-plugin

- **Status:** Accepted
- **Date:** 2026-04-29
- **Supersedes:** —

## Context

We need to distribute multiple Claude Code plugins related to the Agentics Foundation:

- One MCP server exposing agentics.org content (`agentics-org`)
- Skill-only content plugins (`agentics-tutorials`, `agentics-onboarding`, `agentics-glossary`)
- Live MCP integrations (`agentics-events` via Luma API, `agentics-blog` via RSS, `agentics-projects` via GitHub)

Three viable layouts existed:

1. **One repo per plugin** — clean isolation, but 7+ repos to maintain, no shared marketplace metadata, harder cross-plugin coordination.
2. **Single fat plugin** — bundle everything as one plugin. Loses composability; users can't pick subsets; the MCP server becomes a god-object.
3. **Marketplace monorepo** — one repo with `.claude-plugin/marketplace.json` listing N plugins, each in `plugins/<name>/`. Pattern matches `ruvnet/ruflo` and other established Claude Code marketplaces.

## Decision

Adopt the **marketplace monorepo** pattern.

```
agenticsorg/claude-plugin/
├── .claude-plugin/
│   └── marketplace.json        # one entry per plugin
├── docs/adr/                   # decision records
├── plugins/
│   ├── agentics-org/           # self-contained plugin
│   │   ├── .claude-plugin/plugin.json
│   │   ├── .mcp.json           # if shipping an MCP server
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── skills/<name>/SKILL.md
│   │   ├── commands/<name>.md
│   │   ├── agents/<name>.md
│   │   └── README.md
│   └── … (other plugins)
└── README.md                   # marketplace index
```

Rules:

1. Each plugin under `plugins/<name>/` is self-contained: own `plugin.json`, own `package.json`, own `node_modules`, own `README.md`.
2. The marketplace `README.md` is an index; per-plugin docs live with each plugin.
3. `.claude-plugin/plugin.json` must NOT include `skills`/`commands`/`agents` arrays — those are auto-discovered by Claude Code from directory structure.
4. MCP plugins use `${CLAUDE_PLUGIN_ROOT}` in `.mcp.json` to make the path portable.
5. Secrets (API keys) go in `env` blocks of the user's local `.mcp.json`, never in the committed file. The committed file documents which env vars are expected.
6. Each MCP plugin must degrade gracefully when its required env var is missing (return a fallback note, not crash).
7. Decision records go in `docs/adr/NNNN-title.md`, numbered sequentially.

## Consequences

**Positive:**
- Users add the marketplace once (`/plugin marketplace add agenticsorg/claude-plugin`) and pick which plugins to install.
- Cross-plugin coordination is easy: `agentics-onboarding` references `agentics-events` and `agentics-org` skills directly.
- One issue tracker, one PR queue, one CI pipeline.
- Validates the plugins-as-Claude-Code-extensions model — each plugin can be installed standalone via `claude --plugin-dir plugins/<name>`.

**Negative:**
- Each MCP plugin has its own `node_modules` (~3 MB × N = real disk cost). Acceptable for the small plugin count; revisit with workspaces if it grows past ~20.
- A bug in marketplace.json blocks installation of all plugins. Mitigated by ADR-mandated validation in CI (future).
- Versioning: the marketplace doesn't yet version plugins independently. Each plugin tracks its own `version` in `plugin.json`; a future ADR will define a release process.

## Alternatives considered

- **Git submodules per plugin** — rejected; submodule UX is hostile and `/plugin install` doesn't recurse.
- **npm workspaces** — deferred; would simplify deps but couples the plugins to a Node-only toolchain. Some future plugins may use Bun, Python, or Deno.
- **External plugin registries (npm/JSR)** — premature. The Claude Code marketplace pattern is the established distribution channel.

## References

- Claude Code plugin docs: https://docs.claude.com/en/docs/claude-code/plugins
- Reference marketplace: `ruvnet/ruflo`
- Plugin authoring guide: `ruflo-plugin-creator` skill
