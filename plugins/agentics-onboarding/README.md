# agentics-onboarding

Guided onboarding for new Agentics members.

## What you get

- `onboarding-flow` skill — 4-step path from signup to first event
- `/onboard` slash command
- `onboarding-guide` agent (Sonnet)

## Install

```
/plugin marketplace add agenticsorg/claude-plugin
/plugin install agentics-onboarding@agenticsorg
```

## Try it

```
/onboard
```

The agent walks the user through one step at a time, fetching real content from agentics.org via the `agentics-org` MCP plugin (recommended companion).

## Recommended companion plugins

- `agentics-org` — required for live page fetches
- `agentics-events` — required for Step 4 (registering for next event)
- `agentics-tutorials` — used in Step 3 (starter project path)

## License

MIT
