---
name: mcp-integration
description: Tutorial for integrating Model Context Protocol (MCP) servers with Claude Code. Covers stdio transport, tool/resource/prompt schemas, and packaging as a Claude Code plugin. Use when the user asks about MCP, custom tools, or extending Claude with external APIs.
---

# MCP Integration Tutorial

Build a Claude Code MCP server in 15 minutes.

## What MCP gives you

Three primitives:
- **Tools** — callable functions (`fetch_page(path)`)
- **Resources** — read-only URIs Claude can pull as context (`agentics://about`)
- **Prompts** — reusable instruction templates with arguments

A single server can expose any combination.

## Minimal MCP server (Node)

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'my-server', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{ name: 'hello', description: 'Say hi', inputSchema: { type: 'object' } }],
}));

server.setRequestHandler(CallToolRequestSchema, async req => ({
  content: [{ type: 'text', text: `Hello from ${req.params.name}` }],
}));

await server.connect(new StdioServerTransport());
```

## Wire it into a plugin

Create `.mcp.json` at the plugin root:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/server.js"]
    }
  }
}
```

Test it locally: `claude --plugin-dir ./plugins/my-plugin`

## Test the protocol directly

Drive the server with raw JSON-RPC over stdio:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' | node server.js
```

You should see an `initialize` response with `serverInfo` and `capabilities`.

## Common pitfalls

- **`stdio` only**: log to `stderr`, never `stdout` — stdout is the JSON-RPC channel
- **Initialization order**: client sends `initialize`, then `notifications/initialized`, then can call tools
- **Schemas matter**: tools without `inputSchema` will be rejected by some clients
- **`isError`**: return `{ isError: true, content: [...] }` for tool errors instead of throwing — Claude can handle them gracefully

## Reference

The `agentics-org`, `agentics-events`, `agentics-blog`, and `agentics-projects` plugins in this marketplace are all working MCP servers with different patterns (web scraping, REST API, GitHub graph). Read their `server.js` files.
