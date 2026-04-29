---
name: agentics-content
description: Retrieve, search, and reason over content on agentics.org via the agentics-org MCP server. Use when a question references agentics.org, the Agentics community, membership, events, or projects, or when content from the public site is needed as ground truth.
allowed-tools: mcp__agentics-org__fetch_page mcp__agentics-org__search_content mcp__agentics-org__list_pages
---

# Agentics Content

Read and search the public agentics.org website through the `agentics-org` MCP server.

## When to use

- The user asks about agentics.org pages, content, navigation, or copy
- Questions about Agentics community, membership tiers, events, projects, or contact info
- A task needs current site content as the source of truth (e.g., "what does the about page say?")

## Available MCP tools

- `fetch_page(path, format?)` — fetch a single page; returns stripped text by default
- `search_content(query, paths?, context_chars?)` — search across pages for a substring; returns hits with surrounding context
- `list_pages()` — list known routes (sitemap.xml if available, else curated)

## Available resources

`agentics://<slug>` URIs for `home`, `about`, `community`, `events`, `blog`, `contact`, `membership`, `projects`.

## Available prompts

- `summarize-section` — summarize a page for a given audience
- `answer-from-site` — answer a question using agentics.org content as ground truth

## Workflow

1. If the user's request is open-ended ("what's on agentics.org?"), call `list_pages` first
2. For specific topic searches, call `search_content` with the topic; it returns matching paths
3. For full content, call `fetch_page` on the relevant path
4. Cite the URL in your response so the user can verify

## Caveats

agentics.org is a SPA — JS-rendered content is not visible to plain HTTP fetch. The MCP server returns the SSR shell + meta tags + any pre-rendered text. If a page comes back nearly empty, that content is rendered client-side; tell the user and suggest opening the page directly.
