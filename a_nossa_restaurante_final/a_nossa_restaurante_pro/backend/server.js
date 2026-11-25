const http = require('http');
const fs = require('fs');
const path = require('path');
const { HttpError, enviar } = require('./lib/util');
const { garantirAdmin } = require('./lib/seguranca');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const FRONT = path.join(__dirname, '..', 'frontend');

garantirAdmin();

const rotas = [
  { metodo: 'GET', caminho: '/api/saude', async tratar(req, res) { enviar(res, 200, { status: 'ok', versao: '2.0.0' }); } },
  ...require('./rotas/auth'),
  ...require('./rotas/produtos'),
  ...require('./rotas/pedidos')
];

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json'
};

const CSP = "default-src 'self'; img-src 'self' https: data:; style-src 'self' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'";

function servirArquivo(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  try { rel = decodeURIComponent(rel); } catch (e) { return enviar(res, 400, { error: 'Requisição inválida.' }); }
  const arquivo = path.normalize(path.join(FRONT, rel));
  if (!arquivo.startsWith(FRONT + path.sep) || path.basename(arquivo).startsWith('.')) return enviar(res, 404, { error: 'Não encontrado.' });
  fs.readFile(arquivo, (err, dados) => {
    if (err) return enviar(res, 404, { error: 'Não encontrado.' });
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Content-Security-Policy': CSP, 'Cache-Control': 'no-cache' });
    res.end(dados);
  });
}

const servidor = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (!pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Método não permitido.');
      return servirArquivo(req, res, pathname);
    }
    for (const r of rotas) {
      if (r.metodo !== req.method) continue;
      const m = typeof r.caminho === 'string' ? (r.caminho === pathname ? [] : null) : pathname.match(r.caminho);
      if (m) return await r.tratar(req, res, Array.isArray(m) ? m.slice(1) : []);
    }
    throw new HttpError(404, 'Rota não encontrada.');
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    if (!res.headersSent) enviar(res, e.status || 500, { error: e.status ? e.message : 'Erro interno do servidor.' });
  }
});

servidor.listen(PORT, HOST, () => {
  console.log(`\n  A Nossa Restaurante rodando!\n  Site + API: http://localhost:${PORT}\n`);
});
