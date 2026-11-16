const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const guestsHandler = require('./api/guests');
const wishesHandler = require('./api/wishes');

const PORT = process.env.PORT || 8080;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg'
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.css', '.js', '.json', '.txt', '.md', '.xml', '.svg']);
const IMMUTABLE_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp3']);

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

  // 2. AI Agent Content Negotiation: Serve /llms.txt when client requests text/markdown
  const acceptHeader = String(req.headers['accept'] || '').toLowerCase();
  if ((rawPathname === '/' || rawPathname === '') && acceptHeader.includes('text/markdown')) {
    const llmsPath = path.join(__dirname, 'llms.txt');
    if (fs.existsSync(llmsPath)) {
      const mdContent = fs.readFileSync(llmsPath);
      res.writeHead(200, {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(mdContent);
    }
  }

  // 3. Admin Dashboard & Dynamic Guest Slug Routing
  let reqPath = rawPathname;
  if (reqPath === '/admin' || reqPath === '/admin/' || reqPath === '/dashboard') {
    reqPath = '/admin.html';
  } else if (reqPath === '/' || reqPath === '' || !path.extname(reqPath)) {
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
      return;
    }

    const cacheControl = IMMUTABLE_EXTS.has(ext)
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate';

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    };

    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes('gzip')) {
      zlib.gzip(content, (gzipErr, compressed) => {
        if (!gzipErr) {
          headers['Content-Encoding'] = 'gzip';
          headers['Vary'] = 'Accept-Encoding';
          res.writeHead(200, headers);
          res.end(compressed);
        } else {
          res.writeHead(200, headers);
          res.end(content);
        }
      });
    } else {
      res.writeHead(200, headers);
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`- Contoh Dynamic Routing: http://localhost:${PORT}/andi`);
  console.log(`- Dashboard Admin Tamu:   http://localhost:${PORT}/admin`);
  console.log(`- AI Discovery (LLMs):    http://localhost:${PORT}/llms.txt`);
});
