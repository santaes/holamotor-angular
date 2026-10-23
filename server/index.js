#!/usr/bin/env node
'use strict';

/*
 * HolaMotor server: serves the built Angular app and a small JSON API.
 * No npm dependencies, so it runs on any Orange Pi with Node.js >= 18.
 *
 * Env vars:
 *   PORT       (default 8080)
 *   HOST       (default 0.0.0.0)
 *   DATA_DIR   (default ./data)  collections are stored as JSON files here
 *   STATIC_DIR (default ./dist/holamotor-taller)
 */

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const STATIC_DIR = path.resolve(ROOT, process.env.STATIC_DIR || 'dist/holamotor-taller');
const MAX_BODY = 20 * 1024 * 1024;
const KEY_RE = /^[a-zA-Z0-9_-]{1,64}$/;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

fs.mkdirSync(DATA_DIR, { recursive: true });

// Serialize writes per key so concurrent saves never interleave.
const writeQueues = new Map();

const fileFor = key => path.join(DATA_DIR, `${key}.json`);

async function readKey(key) {
  try {
    return JSON.parse(await fsp.readFile(fileFor(key), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return undefined;
    throw err;
  }
}

function writeKey(key, value) {
  const run = async () => {
    const file = fileFor(key);
    const tmp = `${file}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(value, null, 2));
    await fsp.copyFile(file, `${file}.bak`).catch(err => {
      if (err.code !== 'ENOENT') throw err;
    });
    await fsp.rename(tmp, file);
  };
  const next = (writeQueues.get(key) || Promise.resolve()).then(run, run);
  writeQueues.set(key, next.catch(() => {}));
  return next;
}

async function readAll() {
  const result = {};
  for (const name of await fsp.readdir(DATA_DIR)) {
    const key = name.slice(0, -5);
    if (name.endsWith('.json') && KEY_RE.test(key)) result[key] = await readKey(key);
  }
  return result;
}

function send(res, status, body) {
  const isJson = typeof body !== 'string';
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/health') {
    return send(res, 200, { ok: true, uptime: Math.round(process.uptime()) });
  }

  if (pathname === '/api/data') {
    return req.method === 'GET' ? send(res, 200, await readAll()) : send(res, 405, { error: 'Method not allowed' });
  }

  const match = pathname.match(/^\/api\/data\/([^/]+)$/);
  if (!match) return send(res, 404, { error: 'Not found' });

  const key = match[1];
  if (!KEY_RE.test(key)) return send(res, 400, { error: 'Invalid key' });

  switch (req.method) {
    case 'GET': {
      const value = await readKey(key);
      return value === undefined ? send(res, 404, { error: 'Not found' }) : send(res, 200, value);
    }
    case 'PUT':
      await writeKey(key, await readBody(req));
      return send(res, 204, '');
    case 'DELETE':
      await fsp.rm(fileFor(key), { force: true });
      return send(res, 204, '');
    default:
      return send(res, 405, { error: 'Method not allowed' });
  }
}

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

  let file = path.join(STATIC_DIR, path.normalize(pathname));
  if (!file.startsWith(STATIC_DIR)) return send(res, 403, 'Forbidden');

  let stat = await fsp.stat(file).catch(() => null);
  if (!stat || stat.isDirectory()) {
    if (path.extname(pathname)) return send(res, 404, 'Not found');
    // SPA fallback: let the Angular router handle the route.
    file = path.join(STATIC_DIR, 'index.html');
    stat = await fsp.stat(file).catch(() => null);
    if (!stat) return send(res, 503, 'App not built. Run "npm run build" first.');
  }

  const isIndex = path.basename(file) === 'index.html';
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': stat.size,
    // Angular bundles are content-hashed; index.html must always be fresh.
    'Cache-Control': isIndex ? 'no-cache' : 'public, max-age=86400'
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
    } else {
      await serveStatic(req, res, pathname);
    }
  } catch (err) {
    console.error(`[error] ${req.method} ${pathname}: ${err.message}`);
    if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'Internal error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`HolaMotor running on http://${HOST}:${PORT}`);
  console.log(`  data:   ${DATA_DIR}`);
  console.log(`  static: ${STATIC_DIR}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
