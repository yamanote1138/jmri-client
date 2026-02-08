#!/usr/bin/env node
/**
 * Simple HTTP server for browser testing
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json'
};

const server = createServer(async (req, res) => {
  // Handle root
  let filePath = req.url === '/' ? '/reconnection-test.html' : req.url;

  // Remove query string
  filePath = filePath.split('?')[0];

  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(400);
    res.end('Invalid path');
    return;
  }

  // Resolve file path relative to project root
  const fullPath = join(__dirname, '../..', filePath);

  try {
    const content = await readFile(fullPath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);

    console.log(`✓ Served: ${filePath}`);
  } catch (error) {
    res.writeHead(404);
    res.end('File not found');
    console.log(`✗ Not found: ${filePath}`);
  }
});

server.listen(PORT, () => {
  console.log('\n🌐 JMRI Client Browser Test Server');
  console.log(`\n   http://localhost:${PORT}/tests/browser/reconnection-test.html\n`);
  console.log('📝 Instructions:');
  console.log('   1. Open the URL above in your browser');
  console.log('   2. Open DevTools (F12) → Network tab → Filter by "WS"');
  console.log('   3. Follow the on-screen test instructions\n');
  console.log('Press Ctrl+C to stop\n');
});
