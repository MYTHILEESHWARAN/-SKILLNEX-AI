/**
 * SKILLNEX AI — Simple Frontend Server
 * Serves static HTML, CSS, and JS files on port 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const FRONTEND_DIR = __dirname;

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Handle root path
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query strings
  filePath = filePath.split('?')[0];
  
  // Full file path
  const fullPath = path.join(FRONTEND_DIR, filePath);
  
  // Security: prevent directory traversal
  if (!fullPath.startsWith(FRONTEND_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // Try to read the file
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, try index.html for SPA-like behavior
        fs.readFile(path.join(FRONTEND_DIR, 'index.html'), (err2, indexContent) => {
          if (err2) {
            res.statusCode = 404;
            res.end('404 Not Found');
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(indexContent);
          }
        });
      } else {
        res.statusCode = 500;
        res.end('Server Error');
      }
      return;
    }

    // Get file extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Set headers and send file
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(content);
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║          SKILLNEX AI — Frontend Server Running                  ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📝 Entry Point: index.html`);
  console.log(`📁 Directory: ${FRONTEND_DIR}`);
  console.log(`\n✅ Press Ctrl+C to stop the server\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

