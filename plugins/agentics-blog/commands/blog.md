---
name: blog
description: List, search, or open Agentics blog posts
---

Query the Agentics blog.

Usage:
- `/blog list` — recent posts
- `/blog search <query>` — find posts on a topic
- `/blog get <path-or-url>` — fetch a specific post

| Subcommand | Tool |
|------------|------|
| `list`   | `list_posts` |
| `search` | `search_posts` (use `deep: true` if shallow returns nothing) |
| `get`    | `get_post` |

Cite the URL of any post you summarize.

ARGUMENTS: $ARGUMENTS
