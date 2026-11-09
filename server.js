import 'dotenv/config';
import http from 'http';
import publishHandler from './netlify/functions/publish-blog.js';
import unpublishHandler from './netlify/functions/unpublish-blog.js';

const PORT = process.env.PORT || 3001;

/**
 * Adapter to run Netlify Functions v2 (standard Request / Response)
 * in local Node http.createServer for local testing.
 */
async function handleNetlifyFunction(handler, req, res, bodyText) {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  // Construct standard Fetch Request
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        val.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, val);
      }
    }
  }

  const webReq = new Request(url.href, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : bodyText,
  });

  const webRes = await handler(webReq, {});

  res.statusCode = webRes.status;
  webRes.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });

  const resBody = await webRes.text();
  res.end(resBody);
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(204);
    res.end();
    return;
  }

  // Collect request body
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const bodyText = Buffer.concat(buffers).toString('utf-8');

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/publish-blog') {
    return handleNetlifyFunction(publishHandler, req, res, bodyText);
  }

  if (url.pathname === '/api/unpublish-blog') {
    return handleNetlifyFunction(unpublishHandler, req, res, bodyText);
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Endpoint not found.' }));
});

export { server };

server.listen(PORT, () => {
  console.log(`[Publishing API] Local publishing server running on http://localhost:${PORT}`);
});
