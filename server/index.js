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

const ROOT = path.resolve(process.cwd());
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

  // Google Calendar endpoints
  if (pathname === '/api/calendar/status' && req.method === 'GET') {
    const tokens = await getGoogleTokens();
    return send(res, 200, { connected: !!tokens?.access_token });
  }

  if (pathname === '/api/calendar/auth' && req.method === 'POST') {
    return handleGoogleAuth(req, res);
  }

  if (pathname === '/api/calendar/events' && req.method === 'GET') {
    return handleGoogleCalendar(req, res, 'get');
  }

  if (pathname === '/api/calendar/events' && req.method === 'POST') {
    return handleGoogleCalendarEvent(req, res, 'create');
  }

  // Vehicle lookup by VIN / plate (external free databases + local data)
  if (pathname.startsWith('/api/vehicle-lookup/vin/') && req.method === 'GET') {
    const vin = pathname.slice('/api/vehicle-lookup/vin/'.length);
    return handleVinLookup(req, res, vin);
  }

  if (pathname.startsWith('/api/vehicle-lookup/plate/') && req.method === 'GET') {
    const plate = pathname.slice('/api/vehicle-lookup/plate/'.length);
    return handlePlateLookup(req, res, plate);
  }

  // Serve uploaded PDFs (GET/HEAD only; upload is POST and handled above)
  if (pathname.startsWith('/api/pdf/') && (req.method === 'GET' || req.method === 'HEAD')) {
    return serveStatic(req, res, pathname);
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

// Split text into chunks no larger than maxSize, preferring line boundaries.
// Each chunk records the separator that followed it in the original text ('\n'
// for line-boundary splits, '' for mid-line hard splits) so the translated
// output can be reassembled with the original formatting intact.
function splitTextChunks(text, maxSize = 4500) {
  if (text.length <= maxSize) return [{ text, sep: '' }];

  const chunks = [];
  const lines = text.split('\n');
  let current = '';

  const push = (sep) => {
    if (current) chunks.push({ text: current, sep });
    current = '';
  };

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const followedByNewline = li < lines.length - 1;

    // A single line longer than maxSize must be hard-split
    if (line.length > maxSize) {
      push('\n');
      for (let i = 0; i < line.length; i += maxSize) {
        const isLast = i + maxSize >= line.length;
        chunks.push({ text: line.slice(i, i + maxSize), sep: isLast && followedByNewline ? '\n' : '' });
      }
      continue;
    }

    const candidate = current ? current + '\n' + line : line;
    if (candidate.length > maxSize && current) {
      push('\n');
      current = line;
    } else {
      current = candidate;
    }
  }

  push('');
  return chunks;
}

async function handleTranslation(req, res) {
  try {
    const body = await readBody(req);
    const { text, source = 'auto', target = 'en' } = body;

    if (!text || !target) {
      return sendError(req, res, 400, 'invalidJson');
    }

    // Create a timeout for fetch requests
    const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    // Function to translate a single chunk using Google Translate (gtx).
    // Retries with backoff — the endpoint rate-limits bursts and returns
    // errors for very long URL-encoded queries.
    const translateChunk = async (chunk, attempt = 0) => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(chunk)}`;
        const response = await fetchWithTimeout(url, {}, 15000);

        if (response.ok) {
          const result = await response.json();
          if (result && result[0]) {
            const translated = result[0].map(item => item[0]).join('');
            if (translated && translated.trim()) return translated;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (err) {
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          return translateChunk(chunk, attempt + 1);
        }
        console.log('Chunk translation failed after retries:', err.message);
        return chunk; // Return original only after all retries exhausted
      }
    };

    // Split into smaller chunks — Cyrillic percent-encodes ~3x, so 2000 chars
    // keeps the request URL within safe limits.
    const chunks = splitTextChunks(text, 2000);

    console.log(`Translating ${chunks.length} chunks (${text.length} chars total)...`);

    // Translate with limited concurrency (2 at a time) to avoid rate limiting
    const translatedChunks = new Array(chunks.length);
    const CONCURRENCY = 2;
    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const batch = chunks.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(c => translateChunk(c.text)));
      results.forEach((r, j) => { translatedChunks[i + j] = r; });
    }

    // Reassemble using the original separators so line breaks are preserved
    const translatedText = translatedChunks.map((tr, i) => tr + chunks[i].sep).join('');

    console.log('Translation complete');

    return send(res, 200, {
      translatedText: translatedText,
      source: source,
      target: target
    });
  } catch (err) {
    console.error('Translation error:', err);
    // Return original text on error instead of 500
    const body = await readBody(req);
    return send(res, 200, {
      translatedText: body.text,
      source: body.source || 'auto',
      target: body.target || 'en'
    });
  }
}

// ---------- Google Calendar API ----------

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4200/calendar/callback';
const CALENDAR_TOKENS_FILE = path.join(DATA_DIR, 'google-calendar-tokens.json');

async function handleGoogleAuth(req, res) {
  const { code } = await readBody(req);
  if (!code) return sendError(req, res, 400, 'invalidJson');

  // Diagnostics: auth codes are single-use and must arrive uncorrupted.
  console.log(`[google-auth] code length=${code.length} hasSpace=${/\s/.test(code)} hasPlus=${code.includes('+')} prefix=${code.slice(0, 10)}…`);

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Google OAuth error:', error);
      return send(res, 400, { error: 'googleOAuth', detail: error });
    }

    const tokens = await tokenResponse.json();
    if (tokens.expires_in) {
      tokens.expiry_date = Date.now() + (tokens.expires_in * 1000);
    }
    await fsp.writeFile(CALENDAR_TOKENS_FILE, JSON.stringify(tokens, null, 2));

    return send(res, 200, { success: true });
  } catch (err) {
    console.error('Google auth error:', err);
    return sendError(req, res, 500, 'internalError');
  }
}

async function getGoogleTokens() {
  let raw;
  try {
    raw = await fsp.readFile(CALENDAR_TOKENS_FILE, 'utf8');
  } catch {
    return null;
  }
  let tokens;
  try {
    tokens = JSON.parse(raw);
  } catch {
    console.error('Google Calendar tokens file is corrupt, reconnect required');
    return null;
  }

  // Refresh token if expired (or within 60s of expiring)
  const isExpired = !tokens.expiry_date || Date.now() >= (tokens.expiry_date - 60000);
  if (isExpired && tokens.refresh_token) {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: tokens.refresh_token,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    });

    if (refreshResponse.ok) {
      const newTokens = await refreshResponse.json();
      if (newTokens.expires_in) {
        newTokens.expiry_date = Date.now() + (newTokens.expires_in * 1000);
      }
      Object.assign(tokens, newTokens);
      await fsp.writeFile(CALENDAR_TOKENS_FILE, JSON.stringify(tokens, null, 2));
    } else {
      const detail = await refreshResponse.text().catch(() => '');
      console.error(`Google token refresh failed: ${refreshResponse.status} ${detail.slice(0, 300)}`);
    }
  }

  return tokens;
}

async function handleGoogleCalendar(req, res, action) {
  try {
    const tokens = await getGoogleTokens();
    if (!tokens) return send(res, 200, []);

    const query = new URL(req.url, 'http://localhost').searchParams;
    const params = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime' });
    for (const key of ['timeMin', 'timeMax', 'q', 'maxResults']) {
      const value = query.get(key);
      if (value) params.set(key, value);
    }

    const calendarResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!calendarResponse.ok) {
      const detail = await calendarResponse.text().catch(() => '');
      console.error(`Google Calendar API error: ${calendarResponse.status} ${detail.slice(0, 500)}`);
      return send(res, calendarResponse.status, { error: 'googleCalendar', status: calendarResponse.status, detail: detail.slice(0, 300) });
    }

    const events = await calendarResponse.json();
    return send(res, 200, events.items || []);
  } catch (err) {
    console.error('Google Calendar error:', err);
    return sendError(req, res, 500, 'internalError');
  }
}

async function handleGoogleCalendarEvent(req, res, action) {
  try {
    const tokens = await getGoogleTokens();
    if (!tokens) return sendError(req, res, 401, 'forbidden');
    const body = await readBody(req);
    if (!body) return sendError(req, res, 400, 'invalidJson');

    // Accept both "2026-01-01T10:00:00" strings and { dateTime, timeZone } objects
    const startValue = typeof body.start === 'string' ? body.start : body.start?.dateTime;
    const endValue = typeof body.end === 'string' ? body.end : body.end?.dateTime;
    const startZone = typeof body.start === 'object' ? body.start?.timeZone : undefined;
    const endZone = typeof body.end === 'object' ? body.end?.timeZone : undefined;

    if (!startValue || !endValue) return sendError(req, res, 400, 'invalidJson');

    const event = {
      summary: body.summary,
      description: body.description,
      start: {
        dateTime: startValue,
        timeZone: startZone || 'Europe/Madrid'
      },
      end: {
        dateTime: endValue,
        timeZone: endZone || 'Europe/Madrid'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Calendar event error:', error);
      return sendError(req, res, 500, 'internalError');
    }

    const createdEvent = await response.json();
    return send(res, 200, createdEvent);
  } catch (err) {
    console.error('Google Calendar event error:', err);
    return sendError(req, res, 500, 'internalError');
  }
}

// ---------- Vehicle Lookup ----------

// Optional external plate-lookup provider (e.g. APIVehículo).
// VEHICLE_PLATE_API_URL is a URL template where {plate} is replaced, e.g.
//   https://api.apivehiculo.com/v1/vehicles/lookup?plate={plate}&country=ES
// VEHICLE_PLATE_API_KEY is sent as "Authorization: Bearer <key>".
const VEHICLE_PLATE_API_URL = process.env.VEHICLE_PLATE_API_URL || '';
const VEHICLE_PLATE_API_KEY = process.env.VEHICLE_PLATE_API_KEY || '';

async function fetchJson(url, headers = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickField(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
}

function toYear(value) {
  const year = Number(value);
  return Number.isFinite(year) && year >= 1900 && year <= new Date().getFullYear() + 2 ? year : null;
}

async function handleVinLookup(req, res, rawVin) {
  const vin = String(rawVin || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (vin.length < 11 || vin.length > 17) {
    return sendError(req, res, 400, 'invalidJson');
  }

  // Two free, key-less VIN decoders queried in parallel:
  //  - db.vin: richer data (color, fuel, body type, version)
  //  - NHTSA vPIC: authoritative US government decoder
  const [dbvin, nhtsa] = await Promise.all([
    fetchJson(`https://db.vin/api/v1/vin/${vin}`),
    fetchJson(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`)
  ]);

  const nhtsaResult = nhtsa?.Results?.[0] || {};

  // NHTSA vPIC is the authoritative decoder for make/model/year; db.vin fills
  // gaps and adds color. db.vin is only a fallback because it is sometimes wrong.
  const result = {
    vin,
    found: false,
    marca: pickField(nhtsaResult, 'Make') || pickField(dbvin, 'brand'),
    modelo: pickField(nhtsaResult, 'Model') || pickField(dbvin, 'model'),
    version: pickField(nhtsaResult, 'Trim') || pickField(dbvin, 'version'),
    anio: toYear(pickField(nhtsaResult, 'ModelYear') ?? pickField(dbvin, 'year')),
    color: pickField(dbvin, 'color'),
    combustible: pickField(nhtsaResult, 'FuelTypePrimary') || pickField(dbvin, 'fuelType'),
    carroceria: pickField(nhtsaResult, 'BodyClass') || pickField(dbvin, 'bodyType'),
    pais: pickField(dbvin, 'registrationCountry') || pickField(nhtsaResult, 'PlantCountry'),
    fuente: []
  };

  if (pickField(dbvin, 'brand') || pickField(dbvin, 'model')) result.fuente.push('db.vin');
  if (pickField(nhtsaResult, 'Make') || pickField(nhtsaResult, 'Model')) result.fuente.push('nhtsa');

  result.found = !!(result.marca && result.modelo);
  return send(res, 200, result);
}

function normalizePlateVehicle(raw, plate) {
  // Accepts APIVehículo-style payloads ({ data: {...} } or flat) and generic
  // shapes; every field falls back through common naming variants.
  const data = raw?.data && typeof raw.data === 'object' ? raw.data : (raw || {});
  const firstReg = pickField(data, 'firstRegistrationDate', 'first_registration', 'registrationDate');
  const year = toYear(pickField(data, 'year', 'anio', 'año'))
    || toYear(firstReg ? String(firstReg).slice(0, 4) : undefined);

  return {
    plate,
    found: !!(pickField(data, 'brand', 'marca', 'make') && pickField(data, 'model', 'modelo')),
    marca: pickField(data, 'brand', 'marca', 'make'),
    modelo: pickField(data, 'model', 'modelo'),
    version: pickField(data, 'version', 'trim', 'versionName'),
    anio: year,
    color: pickField(data, 'color', 'colour'),
    vin: pickField(data, 'vin', 'bastidor', 'chasis', 'VIN'),
    combustible: pickField(data, 'fuelType', 'combustible', 'fuel'),
    carroceria: pickField(data, 'bodyType', 'carroceria', 'body'),
    potencia: pickField(data, 'powerHP', 'powerKw', 'potencia'),
    motor: pickField(data, 'engineCode', 'motorCode', 'engine'),
    cilindrada: pickField(data, 'displacementCcm', 'cilindrada', 'displacement'),
    cambio: pickField(data, 'gearboxType', 'transmission', 'cambio'),
    pais: pickField(data, 'country', 'pais')
  };
}

async function handlePlateLookup(req, res, rawPlate) {
  const plate = String(rawPlate || '').replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(plate)) {
    return sendError(req, res, 400, 'invalidJson');
  }

  // 1) Local workshop data: the plate may already be registered to a customer.
  const customers = await readKey('customers').catch(() => undefined);
  const localMatches = [];
  for (const customer of Array.isArray(customers) ? customers : []) {
    for (const vehicle of customer.vehiculos || []) {
      const localPlate = String(vehicle.placa || '').replace(/[\s-]/g, '').toUpperCase();
      if (localPlate === plate) {
        localMatches.push({
          customerId: customer.id,
          customerName: `${customer.nombre || ''} ${customer.apellido || ''}`.trim(),
          vehicleId: vehicle.id,
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          anio: vehicle.anio,
          color: vehicle.color,
          vin: vehicle.vin,
          kilometraje: vehicle.kilometraje
        });
      }
    }
  }

  // 2) External registry lookup, only when a provider is configured via env.
  if (VEHICLE_PLATE_API_URL) {
    const url = VEHICLE_PLATE_API_URL.replace('{plate}', encodeURIComponent(plate));
    const headers = VEHICLE_PLATE_API_KEY ? { Authorization: `Bearer ${VEHICLE_PLATE_API_KEY}` } : {};
    const raw = await fetchJson(url, headers);
    if (raw) {
      const external = normalizePlateVehicle(raw, plate);
      if (external.found) {
        return send(res, 200, { ...external, source: 'external', localMatches });
      }
    }
  }

  return send(res, 200, {
    plate,
    found: localMatches.length > 0,
    source: localMatches.length > 0 ? 'local' : null,
    marca: localMatches[0]?.marca,
    modelo: localMatches[0]?.modelo,
    anio: localMatches[0]?.anio,
    color: localMatches[0]?.color,
    vin: localMatches[0]?.vin,
    localMatches
  });
}

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendError(req, res, 405, 'methodNotAllowed');

  // Serve uploaded PDFs
  if (pathname.startsWith('/api/pdf/')) {
    const filename = pathname.replace('/api/pdf/', '');
    const file = path.resolve(PDF_DIR, filename);
    if (path.relative(PDF_DIR, file).startsWith('..') || path.isAbsolute(path.relative(PDF_DIR, file))) {
      return sendError(req, res, 403, 'forbidden');
    }

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
