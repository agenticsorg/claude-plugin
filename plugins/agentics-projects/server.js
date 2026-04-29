#!/usr/bin/env node
/**
 * agentics-projects MCP server.
 *
 * Tools:
 *   - list_repos(limit?, type?)         — public repos in the agenticsorg GitHub org
 *   - get_repo(name)                    — repo details (description, stars, language, topics)
 *   - search_repos(query, limit?)       — substring match across repo names/descriptions
 *   - list_partners()                   — fetch agentics.org/partners and return stripped text
 *
 * Auth:
 *   GITHUB_TOKEN env (optional) — increases rate limit and exposes private metadata.
 *   Without a token, uses anonymous GitHub API (60 req/hr).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const BASE = (process.env.AGENTICS_BASE_URL || 'https://agentics.org').replace(/\/$/, '');
const ORG = process.env.GITHUB_ORG || 'agenticsorg';
const TOKEN = process.env.GITHUB_TOKEN || '';
const UA = 'agentics-projects-mcp/0.1';
const TIMEOUT = 15_000;

async function gh(path, params = {}) {
  const url = new URL(`https://api.github.com${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const headers = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };
    if (TOKEN) headers.Authorization = `token ${TOKEN}`;
    const res = await fetch(url, { headers, signal: ctl.signal });
    const txt = await res.text();
    let body = null;
    try { body = JSON.parse(txt); } catch {}
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${body?.message || txt.slice(0, 200)}`);
    return body;
  } finally {
    clearTimeout(t);
  }
}

function compactRepo(r) {
  return {
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    url: r.html_url,
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    topics: r.topics,
    archived: r.archived,
    pushed_at: r.pushed_at,
    homepage: r.homepage,
  };
}

async function fetchText(path) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(BASE + path, { headers: { 'User-Agent': UA }, signal: ctl.signal });
    return { ok: res.ok, status: res.status, body: (await res.text()).slice(0, 500_000) };
  } finally {
    clearTimeout(t);
  }
}

const server = new Server({ name: 'agentics-projects', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_repos',
      description: `List public repositories in the ${ORG} GitHub org. Sorted by recent push.`,
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 30 },
          type: { type: 'string', enum: ['all', 'public', 'sources', 'forks'], default: 'public' },
        },
      },
    },
    {
      name: 'get_repo',
      description: `Fetch a single ${ORG} repo by name (e.g., "claude-plugin").`,
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
    {
      name: 'search_repos',
      description: `Search ${ORG} repos by name or description substring (case-insensitive).`,
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' }, limit: { type: 'number', default: 15 } },
        required: ['query'],
      },
    },
    {
      name: 'list_partners',
      description: 'Fetch the agentics.org/partners page and return stripped text. Useful for cross-referencing partners with GitHub repos.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (name === 'list_repos') {
      const repos = await gh(`/orgs/${ORG}/repos`, { per_page: Math.min(100, args.limit ?? 30), sort: 'pushed', type: args.type ?? 'public' });
      return { content: [{ type: 'text', text: JSON.stringify({ org: ORG, count: repos.length, repos: repos.map(compactRepo) }, null, 2) }] };
    }
    if (name === 'get_repo') {
      if (!args.name) throw new Error('name required');
      const r = await gh(`/repos/${ORG}/${args.name}`);
      return { content: [{ type: 'text', text: JSON.stringify(compactRepo(r), null, 2) }] };
    }
    if (name === 'search_repos') {
      const q = String(args.query || '').toLowerCase();
      if (!q) throw new Error('query required');
      const repos = await gh(`/orgs/${ORG}/repos`, { per_page: 100, sort: 'pushed' });
      const hits = repos
        .filter(r => (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
        .slice(0, args.limit ?? 15)
        .map(compactRepo);
      return { content: [{ type: 'text', text: JSON.stringify({ org: ORG, query: args.query, count: hits.length, repos: hits }, null, 2) }] };
    }
    if (name === 'list_partners') {
      const r = await fetchText('/partners');
      const text = r.body
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim();
      return { content: [{ type: 'text', text: `URL: ${BASE}/partners\nStatus: ${r.status}\n\n${text.slice(0, 8000)}` }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${err?.message || String(err)}` }] };
  }
});

await server.connect(new StdioServerTransport());
process.stderr.write(`agentics-projects MCP server connected (org=${ORG}, token=${TOKEN ? 'set' : 'unset'})\n`);
