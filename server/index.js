#!/usr/bin/env node
'use strict';

/*
 * HolaMotor server: serves the built Angular app, a small JSON API and live change events.
 * No npm dependencies, so it runs on any Orange Pi with Node.js >= 18.
 *
 * Env vars:
 *   PORT           (default 8080)
 *   HOST           (default 0.0.0.0)
 *   DATA_DIR       (default ./data)  collections are stored as JSON files here
 *   STATIC_DIR     (default ./dist/holamotor-taller)
 *   HOLAMOTOR_LANG (default es)      language for logs and default API messages: es | ru | uk
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
const PDF_DIR = path.join(DATA_DIR, 'pdfs');
const MAX_BODY = 20 * 1024 * 1024;
const KEY_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

const MESSAGES = {
  es: {
    notFound: 'No encontrado',
    methodNotAllowed: 'Método no permitido',
    invalidKey: 'Clave no válida',
    payloadTooLarge: 'Datos demasiado grandes',
    invalidJson: 'JSON no válido',
    internalError: 'Error interno del servidor',
    forbidden: 'Acceso denegado',
    notBuilt: 'La aplicación no está compilada. Ejecuta "npm run build" primero.',
    running: 'HolaMotor funcionando en',
    data: 'datos',
    static: 'web',
    saved: 'guardado',
    deleted: 'eliminado',
    error: 'error',
    shutdown: 'Apagando el servidor...'
  },
  ru: {
    notFound: 'Не найдено',
    methodNotAllowed: 'Метод не разрешён',
    invalidKey: 'Недопустимый ключ',
    payloadTooLarge: 'Слишком большой объём данных',
    invalidJson: 'Некорректный JSON',
    internalError: 'Внутренняя ошибка сервера',
    forbidden: 'Доступ запрещён',
    notBuilt: 'Приложение не собрано. Сначала выполните "npm run build".',
    running: 'HolaMotor запущен на',
    data: 'данные',
    static: 'веб',
    saved: 'сохранено',
    deleted: 'удалено',
    error: 'ошибка',
    shutdown: 'Остановка сервера...'
  },
  uk: {
    notFound: 'Не знайдено',
    methodNotAllowed: 'Метод не дозволено',
    invalidKey: 'Недопустимий ключ',
    payloadTooLarge: 'Занадто великий обсяг даних',
    invalidJson: 'Некоректний JSON',
    internalError: 'Внутрішня помилка сервера',
    forbidden: 'Доступ заборонено',
    notBuilt: 'Застосунок не зібрано. Спочатку виконайте "npm run build".',
    running: 'HolaMotor запущено на',
    data: 'дані',
    static: 'веб',
    saved: 'збережено',
    deleted: 'видалено',
    error: 'помилка',
    shutdown: 'Зупинка сервера...'
  }
};

const DEFAULT_LANG = MESSAGES[process.env.HOLAMOTOR_LANG] ? process.env.HOLAMOTOR_LANG : 'es';
const log = MESSAGES[DEFAULT_LANG];

/** Language for a response: X-Lang header (sent by the app), then Accept-Language, then HOLAMOTOR_LANG. */
function langOf(req) {
  const explicit = String(req.headers['x-lang'] || '').toLowerCase();
  if (MESSAGES[explicit]) return explicit;
  for (const part of String(req.headers['accept-language'] || '').split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (MESSAGES[code]) return code;
  }
  return DEFAULT_LANG;
}

class HttpError extends Error {
  constructor(status, key) {
    super(key);
    this.status = status;
    this.key = key;
  }
}

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
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(PDF_DIR, { recursive: true });

// ---------- Storage ----------

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

// ---------- Live updates (Server-Sent Events) ----------

const subscribers = new Set();

function subscribe(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\n\n');
  subscribers.add(res);
  req.on('close', () => subscribers.delete(res));
}

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of subscribers) res.write(payload);
}

setInterval(() => {
  for (const res of subscribers) res.write(': ping\n\n');
}, 25000).unref();

// ---------- HTTP ----------

function send(res, status, body) {
  const isJson = typeof body !== 'string';
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function sendError(req, res, status, key) {
  const lang = langOf(req);
  send(res, status, { error: MESSAGES[lang][key], code: key, lang });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'payloadTooLarge'));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'));
      } catch {
        reject(new HttpError(400, 'invalidJson'));
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/health') {
    return send(res, 200, { ok: true, uptime: Math.round(process.uptime()), clients: subscribers.size, lang: langOf(req) });
  }

  if (pathname === '/api/events') {
    return req.method === 'GET' ? subscribe(req, res) : sendError(req, res, 405, 'methodNotAllowed');
  }

  if (pathname === '/api/data') {
    return req.method === 'GET' ? send(res, 200, await readAll()) : sendError(req, res, 405, 'methodNotAllowed');
  }

  // PDF upload endpoint
  if (pathname === '/api/pdf/upload' && req.method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return sendError(req, res, 400, 'invalidJson');
    }

    return handlePdfUpload(req, res);
  }

  // Translation endpoint
  if (pathname === '/api/translate' && req.method === 'POST') {
    return handleTranslation(req, res);
  }

  const match = pathname.match(/^\/api\/data\/([^/]+)$/);
  if (!match) return sendError(req, res, 404, 'notFound');

  const key = match[1];
  if (!KEY_RE.test(key)) return sendError(req, res, 400, 'invalidKey');
  const origin = String(req.headers['x-client-id'] || '');

  switch (req.method) {
    case 'GET': {
      const value = await readKey(key);
      return value === undefined ? sendError(req, res, 404, 'notFound') : send(res, 200, value);
    }
    case 'PUT':
      await writeKey(key, await readBody(req));
      broadcast({ key, origin });
      console.log(`${new Date().toISOString()} ${key} ${log.saved}`);
      return send(res, 204, '');
    case 'DELETE':
      await fsp.rm(fileFor(key), { force: true });
      broadcast({ key, origin, deleted: true });
      console.log(`${new Date().toISOString()} ${key} ${log.deleted}`);
      return send(res, 204, '');
    default:
      return sendError(req, res, 405, 'methodNotAllowed');
  }
}

// ---------- PDF Upload Handler ----------

async function handlePdfUpload(req, res) {
  const boundary = req.headers['content-type'].split('boundary=')[1];
  let chunks = [];
  let fileName = '';
  let fileSize = 0;

  for await (const chunk of req) {
    fileSize += chunk.length;
    if (fileSize > 50 * 1024 * 1024) { // 50MB limit
      return sendError(req, res, 413, 'payloadTooLarge');
    }
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const parts = buffer.toString('binary').split(`--${boundary}`);

  for (const part of parts) {
    if (part.includes('filename=')) {
      const filenameMatch = part.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        fileName = filenameMatch[1];
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const contentEnd = part.lastIndexOf('\r\n');
        const content = part.slice(contentStart, contentEnd);

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueName = `${timestamp}-${fileName}`;
        const filePath = path.join(PDF_DIR, uniqueName);

        await fsp.writeFile(filePath, Buffer.from(content, 'binary'));

        return send(res, 200, {
          success: true,
          filename: uniqueName,
          originalName: fileName,
          url: `/api/pdf/${uniqueName}`
        });
      }
    }
  }

  return sendError(req, res, 400, 'invalidJson');
}

// ---------- Translation Handler ----------

async function handleTranslation(req, res) {
  try {
    const body = await readBody(req);
    const { text, source = 'auto', target = 'en' } = body;

    if (!text || !target) {
      return sendError(req, res, 400, 'invalidJson');
    }

    // Call LibreTranslate API
    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: source,
        target: target,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error('Translation service error');
    }

    const result = await response.json();
    return send(res, 200, {
      translatedText: result.translatedText,
      source: result.detected_language?.language || source,
      target: target
    });
  } catch (err) {
    console.error('Translation error:', err);
    return sendError(req, res, 500, 'internalError');
  }
}

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendError(req, res, 405, 'methodNotAllowed');

  // Serve uploaded PDFs
  if (pathname.startsWith('/api/pdf/')) {
    const filename = pathname.replace('/api/pdf/', '');
    const file = path.join(PDF_DIR, filename);
    if (!file.startsWith(PDF_DIR)) return sendError(req, res, 403, 'forbidden');

    const stat = await fsp.stat(file).catch(() => null);
    if (!stat) return sendError(req, res, 404, 'notFound');

    const headers = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'no-cache',
      'Content-Disposition': `inline; filename="${filename}"`
    };
    res.writeHead(200, { ...headers, 'Content-Length': stat.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
    return;
  }

  let file = path.join(STATIC_DIR, path.normalize(pathname));
  if (!file.startsWith(STATIC_DIR)) return sendError(req, res, 403, 'forbidden');

  let stat = await fsp.stat(file).catch(() => null);
  if (!stat || stat.isDirectory()) {
    if (path.extname(pathname)) return sendError(req, res, 404, 'notFound');
    // SPA fallback: let the Angular router handle the route.
    file = path.join(STATIC_DIR, 'index.html');
    stat = await fsp.stat(file).catch(() => null);
    if (!stat) return send(res, 503, MESSAGES[langOf(req)].notBuilt);
  }

  // Content-hashed bundles (main.1a2b3c4d5e6f7a8b.js) never change; everything else is revalidated
  // so browsers always pick up a new version after an update.
  const hashed = /\.[0-9a-f]{16,}\./.test(path.basename(file));
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const headers = {
    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    ETag: etag
  };
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
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
    if (!(err instanceof HttpError)) console.error(`[${log.error}] ${req.method} ${pathname}: ${err.message}`);
    if (!res.headersSent) sendError(req, res, err.status || 500, err.key || 'internalError');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`${log.running} http://${HOST}:${PORT}`);
  console.log(`  ${log.data}: ${DATA_DIR}`);
  console.log(`  ${log.static}: ${STATIC_DIR}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(log.shutdown);
    for (const res of subscribers) res.end();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
