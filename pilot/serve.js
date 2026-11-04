// MM-600 pilot — a tiny static server for the E2E tests and for trying the demo locally.
// Serves the repo root (one level up) on 127.0.0.1 only, so /pilot/index.html can
// load the existing ../src/lib/*.js files read-only, exactly as on GitHub Pages.
//   node serve.js            -> http://127.0.0.1:8160/pilot/index.html
//   PORT=9000 node serve.js
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8160;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(ROOT, '.' + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  if (file.split(path.sep).includes('node_modules')) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('MM-600 pilot demo: http://127.0.0.1:' + PORT + '/pilot/index.html');
});
