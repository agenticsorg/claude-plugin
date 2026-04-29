#!/usr/bin/env node
/**
 * Drive each MCP server in this marketplace through initialize → tools/list → tools/call
 * for one representative tool.  Returns non-zero exit if any plugin fails the protocol.
 */
import { spawn } from 'child_process';
import { join } from 'path';

const ROOT = '/tmp/claude-plugin-marketplace/plugins';
const PLUGINS = [
  { dir: 'agentics-org',      tool: 'list_pages',  args: {} },
  { dir: 'agentics-events',   tool: 'list_events', args: {} },
  { dir: 'agentics-blog',     tool: 'list_posts',  args: { limit: 5 } },
  { dir: 'agentics-projects', tool: 'list_repos',  args: { limit: 3 } },
];

function drive(plugin) {
  return new Promise(resolve => {
    const proc = spawn('node', ['server.js'], { cwd: join(ROOT, plugin.dir), stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = '';
    const pending = new Map();
    let nextId = 1;
    const result = { plugin: plugin.dir, ok: false };
    const timer = setTimeout(() => { result.error = 'timeout'; proc.kill(); resolve(result); }, 25000);

    proc.stdout.on('data', c => {
      buf += c.toString();
      let i;
      while ((i = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        try {
          const m = JSON.parse(line);
          if (m.id != null && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
        } catch {}
      }
    });
    proc.stderr.on('data', () => {});

    const send = (method, params) => new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, m => m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result));
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
    const notify = (method, params) => proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

    (async () => {
      try {
        const init = await send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '1' } });
        notify('notifications/initialized', {});
        const tools = await send('tools/list', {});
        const call = await send('tools/call', { name: plugin.tool, arguments: plugin.args });
        result.ok = true;
        result.server = init.serverInfo;
        result.tools = tools.tools.map(t => t.name);
        result.callIsError = !!call.isError;
        result.callPreview = (call.content?.[0]?.text || '').slice(0, 240).replace(/\s+/g, ' ');
      } catch (e) {
        result.error = e.message;
      } finally {
        clearTimeout(timer);
        proc.kill();
        resolve(result);
      }
    })();
  });
}

const results = [];
for (const p of PLUGINS) results.push(await drive(p));

let pass = 0, fail = 0;
for (const r of results) {
  const ok = r.ok && !r.callIsError;
  if (ok) pass++; else fail++;
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${r.plugin}`);
  if (r.server) console.log(`  server: ${r.server.name}@${r.server.version}`);
  if (r.tools) console.log(`  tools:  ${r.tools.join(', ')}`);
  if (r.error) console.log(`  error:  ${r.error}`);
  if (r.callIsError) console.log(`  tool returned isError=true (still a valid protocol response)`);
  if (r.callPreview) console.log(`  preview: ${r.callPreview}…`);
}
console.log(`\n${pass}/${results.length} plugins passed`);
process.exit(fail > 0 && pass === 0 ? 1 : 0);
