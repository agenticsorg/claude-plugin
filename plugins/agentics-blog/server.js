#!/usr/bin/env node
/**
 * agentics-blog MCP server.
 *
 * Tools:
 *   - list_posts(limit?)            — recent blog posts (RSS first, sitemap fallback)
 *   - search_posts(query, limit?)   — search across listed posts
 *   - get_post(path)                — fetch a post by path
 *
 * Strategy:
 *   1. Try /rss.xml — best signal, has titles, dates, summaries
 *   2. Fallback: /sitemap.xml filtered to /blog/* paths
 *   3. Each post fetched via HTTP, HTML stripped to text
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const BASE = (process.env.AGENTICS_BASE_URL || 'https://agentics.org').replace(/\/$/, '');
const BLOG_PATH = process.env.AGENTICS_BLOG_PATH || '/blog';
const RSS_PATH = process.env.AGENTICS_RSS_PATH || '/rss.xml';
const UA = 'agentics-blog-mcp/0.1';
const MAX_BYTES = 2_000_000;
const TIMEOUT = 15_000;

async function fetchText(path) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const url = path.startsWith('http') ? path : BASE + (path.startsWith('/') ? path : '/' + path);
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal, redirect: 'follow' });
    const txt = await res.text();
    return { ok: res.ok, status: res.status, url, body: txt.slice(0, MAX_BYTES) };
  } finally {
    clearTimeout(t);
  }
}

function stripHtml(s) {
  if (!s) return '';
  return s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function parseRss(xml) {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map(m => m[0]);
  return items.map(it => {
    const title = (it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.trim();
    const link = (it.match(/<link>([\s\S]*?)<\/link>/i) || [])[1]?.trim();
    const pubDate = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1]?.trim();
    const description = (it.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) || [])[1]?.trim();
    return { title, link, pubDate, description: description ? stripHtml(description).slice(0, 300) : undefined };
  }).filter(p => p.title);
}

function parseSitemapBlogEntries(xml) {
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
  return locs
    .filter(u => /\/blog(\/|$)/.test(u))
    .map(u => {
      try { return { link: u, path: new URL(u).pathname }; } catch { return null; }
    })
    .filter(Boolean);
}

async function listPosts(limit = 25) {
  const rss = await fetchText(RSS_PATH);
  if (rss.ok && /<rss|<feed/i.test(rss.body)) {
    const items = parseRss(rss.body);
    if (items.length) return { source: 'rss', items: items.slice(0, limit) };
  }
  const sm = await fetchText('/sitemap.xml');
  if (sm.ok) {
    const items = parseSitemapBlogEntries(sm.body);
    if (items.length) return { source: 'sitemap', items: items.slice(0, limit) };
  }
  return { source: 'none', items: [], note: 'No RSS feed or blog sitemap entries found. The blog may be empty or routes may differ.' };
}

const server = new Server({ name: 'agentics-blog', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_posts',
      description: 'List recent blog posts on agentics.org. Tries /rss.xml first, falls back to sitemap-filtered blog paths.',
      inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } },
    },
    {
      name: 'search_posts',
      description: 'Search recent blog posts for a query (title + RSS summary first; fetches post bodies on demand).',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
          deep: { type: 'boolean', default: false, description: 'When true, also fetch and search each post body (slower)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_post',
      description: 'Fetch and return a single blog post by path or full URL. HTML is stripped to text.',
      inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (name === 'list_posts') {
      const r = await listPosts(args.limit ?? 25);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    }
    if (name === 'search_posts') {
      const q = String(args.query || '').toLowerCase();
      if (!q) throw new Error('query required');
      const list = await listPosts(50);
      const shallow = list.items.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q),
      );
      let hits = shallow;
      if (args.deep) {
        const remaining = list.items.filter(p => !shallow.includes(p));
        for (const p of remaining.slice(0, 10)) {
          if (!p.link) continue;
          try {
            const r = await fetchText(p.link);
            if (stripHtml(r.body).toLowerCase().includes(q)) hits.push(p);
          } catch {}
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ query: args.query, source: list.source, count: hits.length, posts: hits.slice(0, args.limit ?? 10) }, null, 2) }] };
    }
    if (name === 'get_post') {
      const r = await fetchText(args.path);
      return { content: [{ type: 'text', text: `URL: ${r.url}\nStatus: ${r.status}\n\n${stripHtml(r.body)}` }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${err?.message || String(err)}` }] };
  }
});

await server.connect(new StdioServerTransport());
process.stderr.write(`agentics-blog MCP server connected (base=${BASE})\n`);
