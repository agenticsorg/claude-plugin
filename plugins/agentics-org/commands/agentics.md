---
name: agentics
description: Query agentics.org via MCP — fetch a page, search content, or list routes
---

Query agentics.org through the agentics-org MCP server.

Usage:

- `/agentics list` — list known pages on agentics.org
- `/agentics fetch <path>` — fetch and return a page (e.g. `/agentics fetch /about`)
- `/agentics search <query>` — search across pages for a term
- `/agentics summarize <path>` — summarize a page (uses the `summarize-section` prompt)
- `/agentics ask <question>` — answer a question using site content (uses the `answer-from-site` prompt)

Pick the matching MCP tool based on the subcommand:

| Subcommand | MCP tool/prompt |
|------------|-----------------|
| `list`     | `list_pages` |
| `fetch`    | `fetch_page` |
| `search`   | `search_content` |
| `summarize`| `summarize-section` prompt |
| `ask`      | `answer-from-site` prompt |

Cite the URL of any page you reference.

ARGUMENTS: $ARGUMENTS
