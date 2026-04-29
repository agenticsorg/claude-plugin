#!/usr/bin/env node
/**
 * agentics.org MCP server.
 *
 * Exposes the public agentics.org website to Claude Code via MCP:
 *   - tools:     fetch_page, search_content, list_pages
 *   - resources: agentics://<route> for known site sections
 *   - prompts:   summarize-section, answer-from-site
 *
 * The site is a SPA (React+Vite) — JS-rendered content is not visible to a
 * raw HTTP fetch. We strip HTML tags from the SSR shell + meta tags, which
 * is enough for navigation, titles, and any pre-rendered content. For
 * fully rendered output, layer a headless browser on top.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BASE_URL = (process.env.AGENTICS_BASE_URL || 'https://agentics.org').replace(/\/$/, '');
const USER_AGENT = 'agentics-org-mcp/0.1 (+https://agentics.org)';
const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 2_000_000;

const KNOWN_ROUTES = [
  { path: '/', title: 'Home', description: 'Landing page' },
  { path: '/about', title: 'About', description: 'About Agentics' },
  { path: '/community', title: 'Community', description: 'Community page' },
  { path: '/events', title: 'Events', description: 'Events listing' },
  { path: '/blog', title: 'Blog', description: 'Blog index' },
  { path: '/contact', title: 'Contact', description: 'Contact information' },
  { path: '/membership', title: 'Membership', description: 'Membership tiers' },
  { path: '/projects', title: 'Projects', description: 'Project showcase' },
];

function normalizePath(input) {
  if (!input) return '/';
  let p = String(input).trim();
  if (/^https?:\/\//i.test(p)) {
    const u = new URL(p);
    if (!u.hostname.endsWith('agentics.org')) {
      throw new Error(`Refusing to fetch off-site URL: ${u.hostname}`);
    }
    return u.pathname + u.search + u.hash;
  }
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

async function fetchText(path) {
  const url = BASE_URL + normalizePath(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
      signal: controller.signal,
      redirect: 'follow',
    });
    const reader = res.body?.getReader();
    if (!reader) {
      const txt = await res.text();
      return { url, status: res.status, contentType: res.headers.get('content-type') || '', body: txt.slice(0, MAX_BYTES) };
    }
    const chunks = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      chunks.push(value);
      if (total > MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      buf.set(c, offset);
      offset += c.byteLength;
    }
    const body = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    return { url, status: res.status, contentType: res.headers.get('content-type') || '', body };
  } finally {
    clearTimeout(timer);
  }
}

function htmlToText(html) {
  if (!html) return '';
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  const titleMatch = s.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = s.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const ogTitleMatch = s.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogDescMatch = s.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  s = s.replace(/\s+/g, ' ').trim();
  const meta = [];
  if (titleMatch) meta.push(`Title: ${titleMatch[1].trim()}`);
  if (ogTitleMatch && (!titleMatch || ogTitleMatch[1] !== titleMatch[1])) meta.push(`OG Title: ${ogTitleMatch[1].trim()}`);
  if (descMatch) meta.push(`Description: ${descMatch[1].trim()}`);
  if (ogDescMatch && (!descMatch || ogDescMatch[1] !== descMatch[1])) meta.push(`OG Description: ${ogDescMatch[1].trim()}`);
  return (meta.length ? meta.join('\n') + '\n\n' : '') + s;
}

async function fetchSitemap() {
  try {
    const r = await fetchText('/sitemap.xml');
    if (r.status === 200 && /<urlset|<sitemapindex/i.test(r.body)) {
      const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
      return locs.map(u => {
        try {
          return new URL(u).pathname;
        } catch {
          return null;
        }
      }).filter(Boolean);
    }
  } catch {}
  return null;
}

const server = new Server(
  { name: 'agentics-org', version: '0.1.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'fetch_page',
      description: 'Fetch a page from agentics.org and return its text (HTML stripped). Accepts a path like "/about" or a full agentics.org URL.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path (e.g. "/about") or full https://agentics.org URL' },
          format: { type: 'string', enum: ['text', 'html'], default: 'text', description: 'text strips HTML; html returns raw' },
        },
        required: ['path'],
      },
    },
    {
      name: 'search_content',
      description: 'Search across known agentics.org pages for a query string. Returns matching pages with surrounding context. Case-insensitive substring match on stripped page text.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term' },
          paths: { type: 'array', items: { type: 'string' }, description: 'Optional list of paths to search; defaults to all known routes + sitemap' },
          context_chars: { type: 'number', default: 160, description: 'Characters of context to include around each match' },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_pages',
      description: 'List known pages on agentics.org. Tries /sitemap.xml first, then falls back to a curated list of common routes.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (name === 'fetch_page') {
      const r = await fetchText(args.path);
      const out = (args.format === 'html') ? r.body : htmlToText(r.body);
      return {
        content: [
          { type: 'text', text: `URL: ${r.url}\nStatus: ${r.status}\nContent-Type: ${r.contentType}\n\n${out}` },
        ],
      };
    }
    if (name === 'search_content') {
      const q = String(args.query || '').toLowerCase();
      if (!q) throw new Error('query is required');
      const ctx = Math.max(20, Math.min(800, args.context_chars ?? 160));
      let paths = Array.isArray(args.paths) && args.paths.length ? args.paths : null;
      if (!paths) {
        const sm = await fetchSitemap();
        paths = sm && sm.length ? sm : KNOWN_ROUTES.map(r => r.path);
      }
      const results = [];
      for (const p of paths.slice(0, 25)) {
        try {
          const r = await fetchText(p);
          const text = htmlToText(r.body).toLowerCase();
          let idx = text.indexOf(q);
          if (idx === -1) continue;
          const matches = [];
          while (idx !== -1 && matches.length < 3) {
            const start = Math.max(0, idx - ctx);
            const end = Math.min(text.length, idx + q.length + ctx);
            matches.push(text.slice(start, end));
            idx = text.indexOf(q, idx + q.length);
          }
          results.push({ path: p, url: r.url, matches });
        } catch (e) {
          results.push({ path: p, error: String(e?.message || e) });
        }
      }
      const lines = [`Query: "${args.query}"`, `Searched: ${paths.length} pages`, `Hits: ${results.filter(r => r.matches?.length).length}`, ''];
      for (const r of results) {
        if (r.matches?.length) {
          lines.push(`## ${r.path}`, `URL: ${r.url}`);
          for (const m of r.matches) lines.push(`> …${m}…`);
          lines.push('');
        }
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }
    if (name === 'list_pages') {
      const sm = await fetchSitemap();
      const list = sm && sm.length
        ? sm.map(p => ({ path: p, source: 'sitemap.xml' }))
        : KNOWN_ROUTES.map(r => ({ path: r.path, title: r.title, description: r.description, source: 'curated' }));
      return { content: [{ type: 'text', text: JSON.stringify({ base: BASE_URL, count: list.length, pages: list }, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${err?.message || String(err)}` }] };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: KNOWN_ROUTES.map(r => ({
    uri: `agentics://${r.path === '/' ? 'home' : r.path.slice(1)}`,
    name: r.title,
    description: r.description,
    mimeType: 'text/plain',
  })),
}));

server.setRequestHandler(ReadResourceRequestSchema, async req => {
  const uri = req.params.uri;
  if (!uri.startsWith('agentics://')) throw new Error(`Unsupported URI scheme: ${uri}`);
  const slug = uri.slice('agentics://'.length);
  const path = slug === 'home' || slug === '' ? '/' : '/' + slug;
  const r = await fetchText(path);
  return {
    contents: [
      { uri, mimeType: 'text/plain', text: htmlToText(r.body) },
    ],
  };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'summarize-section',
      description: 'Summarize a section of agentics.org for a given audience',
      arguments: [
        { name: 'path', description: 'Path on agentics.org (e.g. "/about")', required: true },
        { name: 'audience', description: 'Audience for the summary (e.g. "executive", "engineer")', required: false },
      ],
    },
    {
      name: 'answer-from-site',
      description: 'Answer a question using agentics.org content as the source of truth',
      arguments: [
        { name: 'question', description: 'The question to answer', required: true },
      ],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async req => {
  const { name, arguments: args = {} } = req.params;
  if (name === 'summarize-section') {
    const path = args.path || '/';
    const audience = args.audience || 'general reader';
    return {
      description: `Summarize agentics.org${path} for ${audience}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Use the agentics-org MCP server to fetch_page("${path}"), then write a concise summary for a ${audience}. Include: purpose of the page, key points, and any calls to action. Cite the URL at the end.`,
          },
        },
      ],
    };
  }
  if (name === 'answer-from-site') {
    const question = args.question || '';
    return {
      description: 'Answer a question grounded in agentics.org content',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Answer this question using only content from agentics.org: ${question}\n\nUse the agentics-org MCP server: list_pages, then search_content to find evidence, then fetch_page on the most relevant URLs. Cite the source paths in your answer. If the site does not contain the answer, say so explicitly.`,
          },
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(`agentics-org MCP server connected (base=${BASE_URL})\n`);
