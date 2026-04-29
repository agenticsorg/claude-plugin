#!/usr/bin/env node
/**
 * agentics-events MCP server.
 *
 * Tools:
 *   - list_events(after?, before?, limit?) — upcoming events from Luma calendar
 *   - search_events(query, limit?)         — substring match across listed events
 *   - get_event(api_id)                    — event detail by Luma api_id
 *
 * Auth:
 *   LUMA_API_KEY env var (required for live data).
 *   Without it, the server falls back to fetching agentics.org/events HTML.
 *
 * Luma API ref: https://docs.lu.ma/reference
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const LUMA_BASE = (process.env.LUMA_BASE_URL || 'https://api.lu.ma/public/v1').replace(/\/$/, '');
const LUMA_KEY = process.env.LUMA_API_KEY || '';
const AGENTICS_BASE = (process.env.AGENTICS_BASE_URL || 'https://agentics.org').replace(/\/$/, '');
const UA = 'agentics-events-mcp/0.1';
const TIMEOUT = 15_000;

async function fetchJSON(url, init = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': UA, Accept: 'application/json', ...(init.headers || {}) },
      signal: ctl.signal,
    });
    const txt = await res.text();
    let json = null;
    try { json = JSON.parse(txt); } catch {}
    return { ok: res.ok, status: res.status, body: json, text: txt };
  } finally {
    clearTimeout(t);
  }
}

async function lumaListEvents({ after, before, limit }) {
  const u = new URL(`${LUMA_BASE}/calendar/list-events`);
  if (after) u.searchParams.set('after', after);
  if (before) u.searchParams.set('before', before);
  if (limit) u.searchParams.set('pagination_limit', String(limit));
  const r = await fetchJSON(u.toString(), { headers: { 'x-luma-api-key': LUMA_KEY } });
  if (!r.ok) throw new Error(`Luma list-events ${r.status}: ${r.text.slice(0, 200)}`);
  const entries = r.body?.entries || r.body?.events || [];
  return entries.map(e => {
    const ev = e.event || e;
    return {
      api_id: ev.api_id || e.api_id,
      name: ev.name,
      start_at: ev.start_at,
      end_at: ev.end_at,
      url: ev.url || (ev.api_id ? `https://lu.ma/${ev.api_id}` : undefined),
      timezone: ev.timezone,
      cover_url: ev.cover_url,
      meeting_url: ev.meeting_url,
      description: (ev.description_md || ev.description || '').slice(0, 400),
    };
  });
}

async function lumaGetEvent(api_id) {
  const u = new URL(`${LUMA_BASE}/event/get`);
  u.searchParams.set('api_id', api_id);
  const r = await fetchJSON(u.toString(), { headers: { 'x-luma-api-key': LUMA_KEY } });
  if (!r.ok) throw new Error(`Luma event/get ${r.status}: ${r.text.slice(0, 200)}`);
  return r.body;
}

async function fallbackEvents() {
  const r = await fetchJSON(`${AGENTICS_BASE}/events`);
  return [{
    source: 'agentics.org/events (fallback — no LUMA_API_KEY)',
    note: 'agentics.org is a SPA; this returns the page shell. Set LUMA_API_KEY for real event data.',
    page_status: r.status,
    page_size: r.text.length,
  }];
}

const server = new Server({ name: 'agentics-events', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_events',
      description: 'List upcoming Agentics events from Luma. Returns name, start time, URL, and a short description. Without LUMA_API_KEY, falls back to fetching agentics.org/events.',
      inputSchema: {
        type: 'object',
        properties: {
          after: { type: 'string', description: 'ISO 8601 date — only events after this time' },
          before: { type: 'string', description: 'ISO 8601 date — only events before this time' },
          limit: { type: 'number', default: 25, description: 'Max events to return' },
        },
      },
    },
    {
      name: 'search_events',
      description: 'Search upcoming events for a substring in the name or description. Lists events first then filters.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_event',
      description: 'Fetch full details for a single Luma event by api_id.',
      inputSchema: {
        type: 'object',
        properties: { api_id: { type: 'string' } },
        required: ['api_id'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (name === 'list_events') {
      if (!LUMA_KEY) {
        const fb = await fallbackEvents();
        return { content: [{ type: 'text', text: JSON.stringify({ events: fb, hint: 'Set LUMA_API_KEY in .mcp.json env for live event data' }, null, 2) }] };
      }
      const events = await lumaListEvents(args);
      return { content: [{ type: 'text', text: JSON.stringify({ count: events.length, events }, null, 2) }] };
    }
    if (name === 'search_events') {
      const q = String(args.query || '').toLowerCase();
      if (!q) throw new Error('query required');
      if (!LUMA_KEY) return { content: [{ type: 'text', text: 'LUMA_API_KEY not set — search requires live event data.' }] };
      const events = await lumaListEvents({ limit: 50 });
      const hits = events.filter(e => (e.name || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)).slice(0, args.limit ?? 10);
      return { content: [{ type: 'text', text: JSON.stringify({ query: args.query, count: hits.length, events: hits }, null, 2) }] };
    }
    if (name === 'get_event') {
      if (!LUMA_KEY) return { content: [{ type: 'text', text: 'LUMA_API_KEY not set — event details require API access.' }] };
      const e = await lumaGetEvent(args.api_id);
      return { content: [{ type: 'text', text: JSON.stringify(e, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${err?.message || String(err)}` }] };
  }
});

await server.connect(new StdioServerTransport());
process.stderr.write(`agentics-events MCP server connected (luma_key=${LUMA_KEY ? 'set' : 'unset'})\n`);
