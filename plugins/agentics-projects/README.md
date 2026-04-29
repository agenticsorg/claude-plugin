# agentics-projects

MCP access to Agentics projects: GitHub repos in the `agenticsorg` org plus the public `agentics.org/partners` page.

## Tools

- `list_repos(limit?, type?)`
- `get_repo(name)`
- `search_repos(query)`
- `list_partners()`

## Install

```
/plugin marketplace add agenticsorg/claude-plugin
/plugin install agentics-projects@agenticsorg
```

Then `cd plugins/agentics-projects && npm install`.

## Configuration

Set `GITHUB_TOKEN` in `.mcp.json` env to raise the GitHub API rate limit (60/hr anon → 5000/hr authenticated):

```json
{
  "mcpServers": {
    "agentics-projects": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/server.js"],
      "env": {
        "GITHUB_ORG": "agenticsorg",
        "GITHUB_TOKEN": "<github_pat>"
      }
    }
  }
}
```

## Try it

```
/projects list
/projects search MCP
/projects get claude-plugin
/projects partners
```

## License

MIT
