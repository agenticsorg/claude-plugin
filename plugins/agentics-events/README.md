# agentics-events

MCP access to Agentics community events via the Luma API.

## Tools

- `list_events(after?, before?, limit?)` — upcoming events
- `search_events(query, limit?)` — match name/description
- `get_event(api_id)` — full event details

## Install

```
/plugin marketplace add agenticsorg/claude-plugin
/plugin install agentics-events@agenticsorg
```

Then `cd plugins/agentics-events && npm install`.

## Configuration

Set `LUMA_API_KEY` to enable live data. In `.mcp.json`:

```json
{
  "mcpServers": {
    "agentics-events": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/server.js"],
      "env": { "LUMA_API_KEY": "<your-luma-public-api-key>" }
    }
  }
}
```

Without a key, the server returns a fallback note and points you at `agentics.org/events`.

## Try it

```
/events list
/events search MCP
/events next
```

## License

MIT
