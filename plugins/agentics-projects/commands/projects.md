---
name: projects
description: List, search, or open Agentics projects (GitHub repos and site partners)
---

Discover Agentics projects.

Usage:
- `/projects list` — top repos in agenticsorg by recent push
- `/projects search <query>` — repos matching a topic
- `/projects get <name>` — single repo details
- `/projects partners` — fetch the partners page

| Subcommand | Tool |
|------------|------|
| `list`     | `list_repos` |
| `search`   | `search_repos` |
| `get`      | `get_repo` |
| `partners` | `list_partners` |

Cite GitHub URLs in your output.

ARGUMENTS: $ARGUMENTS
