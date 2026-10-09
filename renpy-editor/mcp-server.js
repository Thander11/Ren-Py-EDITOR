// ═════════════════════════════════════════════════════════════════════
// MCP SERVER — lets the user's own Claude (Claude Code / Claude Desktop)
// work with the editor. Streamable HTTP transport, JSON responses only,
// listening on 127.0.0.1 and protected by a bearer token.
// ═════════════════════════════════════════════════════════════════════
const http = require('http');
const crypto = require('crypto');

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_BODY = 4 * 1024 * 1024;

// tools: [{ name, title, description, inputSchema, annotations?, handler(args) -> any }]
// onEvent({ type: 'connected' | 'call', ... }) reports activity to the app
function createMcpServer({ serverInfo, instructions, tools, onEvent = () => {} }) {
  let server = null;
  let token = '';
  let port = 0;

  const toolMap = new Map(tools.map(t => [t.name, t]));

  function sameToken(given) {
    const a = Buffer.from(String(given || ''));
    const b = Buffer.from(token);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // Only local clients: no browser page from another site can talk to the server
  function allowedRequest(req) {
    const host = (req.headers.host || '').replace(/:\d+$/, '');
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) return false;
    const origin = req.headers.origin;
    if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin)) return false;
    return true;
  }

  function send(res, status, body, headers = {}) {
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(body === undefined ? '' : JSON.stringify(body));
  }

  const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

  async function handleMessage(msg) {
    if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      return msg && 'id' in msg && !('method' in msg) ? null : rpcError(msg && msg.id, -32600, 'Invalid request');
    }
    const isNotification = !('id' in msg);
    const { id, method, params = {} } = msg;
    if (isNotification) return null;

    switch (method) {
      case 'initialize': {
        const asked = params.protocolVersion;
        onEvent({ type: 'connected', client: params.clientInfo || {} });
        return {
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
            capabilities: { tools: { listChanged: false } },
            serverInfo, instructions
          }
        };
      }
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };
      case 'tools/list':
        return {
          jsonrpc: '2.0', id,
          result: {
            tools: tools.map(({ name, title, description, inputSchema, annotations }) =>
              ({ name, title, description, inputSchema, ...(annotations ? { annotations } : {}) }))
          }
        };
      case 'tools/call': {
        const tool = toolMap.get(params.name);
        if (!tool) return rpcError(id, -32602, `Unknown tool: ${params.name}`);
        onEvent({ type: 'call', tool: tool.name });
        try {
          const out = await tool.handler(params.arguments || {});
          const content = Array.isArray(out && out.content) ? out.content
            : [{ type: 'text', text: typeof out === 'string' ? out : JSON.stringify(out, null, 2) }];
          return { jsonrpc: '2.0', id, result: { content } };
        } catch (e) {
          // Tool errors go back to Claude as a result so it can react to them
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: String(e && e.message || e) }], isError: true } };
        }
      }
      default:
        return rpcError(id, -32601, `Method not found: ${method}`);
    }
  }

  async function onRequest(req, res) {
    if (!allowedRequest(req)) return send(res, 403, rpcError(null, -32000, 'Forbidden'));
    if (req.url.split('?')[0] !== '/mcp') return send(res, 404, rpcError(null, -32000, 'Not found'));
    const auth = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
    if (!auth || !sameToken(auth[1].trim())) {
      return send(res, 401, rpcError(null, -32001, 'Unauthorized: wrong or missing token'));
    }
    // No server-initiated stream and no session state to end
    if (req.method === 'GET') return send(res, 405, undefined, { Allow: 'POST' });
    if (req.method === 'DELETE') return send(res, 200);
    if (req.method !== 'POST') return send(res, 405, undefined, { Allow: 'POST' });

    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', async () => {
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf-8')); } catch (e) {
        return send(res, 400, rpcError(null, -32700, 'Parse error'));
      }
      const batch = Array.isArray(body);
      const replies = (await Promise.all((batch ? body : [body]).map(handleMessage))).filter(Boolean);
      if (!replies.length) return send(res, 202);
      send(res, 200, batch ? replies : replies[0]);
    });
  }

  return {
    start(newPort, newToken) {
      return new Promise((resolve, reject) => {
        this.stop();
        token = newToken;
        port = newPort;
        server = http.createServer((req, res) => {
          onRequest(req, res).catch(() => { try { send(res, 500, rpcError(null, -32603, 'Internal error')); } catch (e) { /* closed */ } });
        });
        server.once('error', err => { server = null; reject(err); });
        server.listen(port, '127.0.0.1', () => resolve());
      });
    },
    stop() {
      if (server) { server.close(); server = null; }
    },
    get running() { return !!server; },
    get port() { return port; }
  };
}

module.exports = { createMcpServer };
