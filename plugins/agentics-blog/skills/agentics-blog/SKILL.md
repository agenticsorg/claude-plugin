---
name: agentics-blog
description: List, search, and read posts from the Agentics blog via the agentics-blog MCP server. Use when a user asks for blog posts, articles, or written content from agentics.org.
allowed-tools: mcp__agentics-blog__list_posts mcp__agentics-blog__search_posts mcp__agentics-blog__get_post
---

# Agentics Blog

Pull blog posts from agentics.org via RSS (preferred) or sitemap fallback.

## When to use

- "What did Agentics post recently?"
- "Has Agentics written about <topic>?"
- "Summarize the latest Agentics post"

## Tools

- `list_posts(limit?)` — recent posts with title, link, date, summary
- `search_posts(query, deep?, limit?)` — title+summary search; pass `deep: true` to also search post bodies
- `get_post(path)` — fetch and strip a single post

## Workflow

1. Start with `list_posts` for orientation
2. For specific topics, `search_posts` shallow first, then `deep: true` if no hits
3. `get_post` to read a full post when summarizing

Cite the post URL when answering.
