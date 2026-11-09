import 'dotenv/config';
import http from 'http';
import publishHandler from './api/publish-blog.js';
import unpublishHandler from './api/unpublish-blog.js';

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse body
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const bodyText = Buffer.concat(buffers).toString();
  if (bodyText) {
    try {
      req.body = JSON.parse(bodyText);
    } catch {
      req.body = bodyText;
    }
  } else {
    req.body = {};
  }

  // Adapter for Vercel req/res style
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/publish-blog') {
    return publishHandler(req, res);
  }

  if (url.pathname === '/api/unpublish-blog') {
    return unpublishHandler(req, res);
  }

  res.status(404).json({ error: 'Endpoint not found.' });
});

server.listen(PORT, () => {
  console.log(`[Publishing API] Local publishing server running on http://localhost:${PORT}`);
});
