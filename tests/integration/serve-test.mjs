#!/usr/bin/env node
/**
 * Simple HTTP server to serve the browser reconnection test
 * Run: node tests/integration/serve-test.mjs
 * Then open: http://localhost:8080
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
};

const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  let filePath = req.url === '/'
    ? join(__dirname, 'browser-reconnection.test.html')
    : join(dirname(__dirname), '..', req.url);

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (error) {
    console.error(`Error serving ${filePath}:`, error.message);
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🧪 Browser Reconnection Test Server`);
  console.log(`\n   Open: http://localhost:${PORT}\n`);
  console.log(`   Press Ctrl+C to stop\n`);
});
