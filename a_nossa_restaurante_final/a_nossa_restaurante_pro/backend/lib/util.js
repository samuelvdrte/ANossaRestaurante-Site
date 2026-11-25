const fs = require('fs');
const path = require('path');

const DADOS = path.join(__dirname, '..', 'dados');

class HttpError extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}

function ler(nome, padrao) {
  try { return JSON.parse(fs.readFileSync(path.join(DADOS, nome), 'utf8')); }
  catch (e) { return padrao; }
}

function gravar(nome, dados) {
  const arquivo = path.join(DADOS, nome);
  const tmp = arquivo + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2), 'utf8');
  fs.renameSync(tmp, arquivo); // gravação atômica
}

function lerCorpo(req, limite = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let tamanho = 0, excedeu = false;
    const partes = [];
    req.on('data', (c) => {
      tamanho += c.length;
      if (tamanho > limite) { excedeu = true; partes.length = 0; return; }
      if (!excedeu) partes.push(c);
    });
    req.on('end', () => {
      if (excedeu) return reject(new HttpError(413, 'Requisição grande demais.'));
      if (!partes.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(partes).toString('utf8'))); }
      catch (e) { reject(new HttpError(400, 'JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

function enviar(res, status, obj) {
  const corpo = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(corpo),
    'Cache-Control': 'no-store'
  });
  res.end(corpo);
}

module.exports = { DADOS, HttpError, ler, gravar, lerCorpo, enviar };
