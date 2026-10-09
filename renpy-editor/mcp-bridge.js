// ═════════════════════════════════════════════════════════════════════
// Bridge for Claude Desktop, which starts local MCP servers as programs
// that talk through stdin/stdout. Every message is passed on to the MCP
// server of the open editor. Runs with the editor's own Electron in Node
// mode (ELECTRON_RUN_AS_NODE=1), so users don't need Node installed.
//   electron mcp-bridge.js <path of the editor's settings.json>
// Port and key are read from the settings on every message, so a new key
// or port works without touching Claude Desktop's configuration.
// ═════════════════════════════════════════════════════════════════════
const fs = require('fs');
const http = require('http');
const readline = require('readline');

const settingsPath = process.argv[2];

function connection() {
  try {
    const c = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')).claude || {};
    return { enabled: !!c.enabled, port: c.port || 47321, token: c.token || '' };
  } catch (e) {
    return { enabled: false, port: 47321, token: '' };
  }
}

const NOT_OPEN = 'Ren\'Py EDITOR is not open, or its connection with Claude is turned off. Ask the user to open the editor and turn on Settings › Connection with Claude.';

function post(body) {
  const { enabled, port, token } = connection();
  return new Promise((resolve, reject) => {
    if (!enabled || !token) return reject(new Error(NOT_OPEN));
    const data = Buffer.from(body, 'utf-8');
    const req = http.request({
      host: '127.0.0.1', port, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Length': data.length }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf-8') }));
    });
    req.on('error', () => reject(new Error(NOT_OPEN)));
    req.setTimeout(120000, () => req.destroy(new Error('The editor did not answer in time.')));
    req.end(data);
  });
}

const write = msg => process.stdout.write(JSON.stringify(msg) + '\n');

async function forward(line) {
  let msg;
  try { msg = JSON.parse(line); } catch (e) {
    return write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
  }
  const isRequest = msg && 'id' in msg && typeof msg.method === 'string';
  try {
    const res = await post(line);
    if (res.status === 202 || !res.text) return;
    write(JSON.parse(res.text));
  } catch (e) {
    if (!isRequest) return;
    // A tool call that can't reach the editor comes back as a tool error Claude can explain
    if (msg.method === 'tools/call') {
      write({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: e.message }], isError: true } });
    } else {
      write({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: e.message } });
    }
  }
}

// Answers go out in the same order the questions came in
let queue = Promise.resolve();
readline.createInterface({ input: process.stdin }).on('line', line => {
  if (!line.trim()) return;
  queue = queue.then(() => forward(line));
}).on('close', () => queue.then(() => process.exit(0)));
