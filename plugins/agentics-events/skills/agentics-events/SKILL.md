---
name: agentics-events
description: List, search, and fetch Agentics community events from Luma via the agentics-events MCP server. Use when a user asks about upcoming events, meetups, workshops, or "what's happening at Agentics".
allowed-tools: mcp__agentics-events__list_events mcp__agentics-events__search_events mcp__agentics-events__get_event
---

# Agentics Events

Read upcoming Agentics events through the `agentics-events` MCP server.

## When to use

- "What events are coming up?"
- "Is there an Agentics workshop on MCP?"
- "When's the next meetup?"
- Onboarding flow Step 4 (registering for first event)

## Tools

- `list_events(after?, before?, limit?)` — upcoming events
- `search_events(query, limit?)` — match name/description
- `get_event(api_id)` — full event details

## Workflow

1. For "what's next", call `list_events` with no args
2. For topic queries, call `search_events`
3. Pick the most relevant event; call `get_event` for full description, location, RSVP link
4. Always cite the Luma URL so the user can register

## Configuration

Set `LUMA_API_KEY` in `.mcp.json` env to pull live data. Without it, the server returns a fallback note.
