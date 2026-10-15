#!/usr/bin/env node
/* 驾考通 本地预览服务器（正确支持中文/Unicode 路径，规避 Python http.server 在 Windows 的缺陷）
 * 用法：node serve.js [端口]   默认 8099
 * 然后浏览器打开 http://localhost:8099/
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT || process.argv[2] || '8099', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    // 还原百分号编码（含中文），并处理非 ASCII
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    urlPath = req.url.split('?')[0];
  }
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // 防目录穿越
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log('驾考通 预览已启动：');
  console.log('  👉 http://localhost:' + PORT + '/');
});
