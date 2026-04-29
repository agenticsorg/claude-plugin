# agentics-blog

MCP access to the Agentics blog (RSS-first, sitemap fallback).

## Tools

- `list_posts(limit?)` — recent posts
- `search_posts(query, deep?)` — search title/summary, optionally deep into bodies
- `get_post(path)` — fetch and strip one post

## Install

```
/plugin marketplace add agenticsorg/claude-plugin
/plugin install agentics-blog@agenticsorg
```

Then `cd plugins/agentics-blog && npm install`.

## Try it

```
/blog list
/blog search MCP
/blog get /blog/welcome
```

## License

MIT
