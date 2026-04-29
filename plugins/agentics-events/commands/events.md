---
name: events
description: List, search, or open Agentics events via Luma
---

Query Agentics events.

Usage:
- `/events list` — upcoming events
- `/events next` — the very next event (first item from list_events)
- `/events search <query>` — events matching a topic
- `/events get <api_id>` — full event details

Pick the matching MCP tool:

| Subcommand | Tool |
|------------|------|
| `list` / `next` | `list_events` |
| `search`        | `search_events` |
| `get`           | `get_event` |

Always include the Luma URL in your response so the user can RSVP.

ARGUMENTS: $ARGUMENTS
