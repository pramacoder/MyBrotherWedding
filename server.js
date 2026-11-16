const http = require('http');
const fs = require('fs');
const path = require('path');

const guestsHandler = require('./api/guests');
const wishesHandler = require('./api/wishes');

const PORT = process.env.PORT || 8080;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg'
};

function collectRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      req.rawBody = body;
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }
      resolve();
    });
  });
}

const server = http.createServer(async (req, res) => {
  const rawPathname = decodeURI(req.url.split('?')[0]);

  // 1. API Routes (/api/guests & /api/wishes)
  if (rawPathname === '/api/guests' || rawPathname.startsWith('/api/guests/')) {
    await collectRequestBody(req);
    return guestsHandler(req, res);
  }

  if (rawPathname === '/api/wishes' || rawPathname.startsWith('/api/wishes/')) {
    await collectRequestBody(req);
    return wishesHandler(req, res);
  }

  // 2. Admin Dashboard Route (/admin)
  let reqPath = rawPathname;
  if (reqPath === '/admin' || reqPath === '/admin/' || reqPath === '/dashboard') {
    reqPath = '/admin.html';
  } else if (reqPath === '/' || reqPath === '' || !path.extname(reqPath)) {
    // 3. Dynamic Guest Slug Routing (e.g. /andi, /keluarga-besar -> /index.html)
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + reqPath);
      } else {
        res.writeHead(500);
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`- Contoh Dynamic Routing: http://localhost:${PORT}/andi`);
  console.log(`- Dashboard Admin Tamu:   http://localhost:${PORT}/admin`);
});
