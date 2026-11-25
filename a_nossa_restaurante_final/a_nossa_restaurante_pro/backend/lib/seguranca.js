const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DADOS, ler, gravar } = require('./util');

/* ---------- Senhas (scrypt + salt) ---------- */
function hashSenha(senha) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(senha), salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

const HASH_FALSO = hashSenha('senha-falsa-para-igualar-tempo');

function conferirSenha(senha, guardado) {
  const [alg, saltHex, hashHex] = String(guardado || HASH_FALSO).split('$');
  if (alg !== 'scrypt') return false;
  const calculado = crypto.scryptSync(String(senha), Buffer.from(saltHex, 'hex'), 64);
  const esperado = Buffer.from(hashHex, 'hex');
  return calculado.length === esperado.length && crypto.timingSafeEqual(calculado, esperado);
}

/* ---------- Tokens assinados (HMAC-SHA256) ---------- */
function carregarSegredo() {
  if (process.env.ANOSSA_SEGREDO) return process.env.ANOSSA_SEGREDO;
  const arq = path.join(DADOS, '.segredo');
  try { return fs.readFileSync(arq, 'utf8').trim(); }
  catch (e) {
    const novo = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(arq, novo, { mode: 0o600 });
    return novo;
  }
}
const SEGREDO = carregarSegredo();
const VALIDADE_MS = 12 * 60 * 60 * 1000;

const b64 = (b) => Buffer.from(b).toString('base64url');
const assinar = (txt) => crypto.createHmac('sha256', SEGREDO).update(txt).digest('base64url');

function criarToken(usuario) {
  const corpo = b64(JSON.stringify({ u: usuario, exp: Date.now() + VALIDADE_MS }));
  return `${corpo}.${assinar(corpo)}`;
}

function lerToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [corpo, assinatura] = token.split('.');
  const esperado = assinar(corpo);
  const a = Buffer.from(assinatura), b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'));
    return dados.exp > Date.now() ? dados : null;
  } catch (e) { return null; }
}

/* ---------- Usuários ---------- */
const lerUsuarios = () => ler('usuarios.json', []);
const gravarUsuarios = (u) => gravar('usuarios.json', u);

// Garante a conta do administrador (usuário: admin / senha: 12345)
function garantirAdmin() {
  const usuarios = lerUsuarios();
  if (!usuarios.some((u) => u.usuario === 'admin')) {
    usuarios.push({
      usuario: 'admin',
      nome: 'Administrador',
      papel: 'admin',
      senha: hashSenha(process.env.ADMIN_SENHA || '12345'),
      criadoEm: new Date().toISOString()
    });
    gravarUsuarios(usuarios);
  }
}

// Identifica quem está fazendo a requisição (papel sempre vem do arquivo, nunca do token)
function usuarioDaRequisicao(req) {
  const h = req.headers['authorization'] || '';
  const dados = lerToken(h.startsWith('Bearer ') ? h.slice(7) : '');
  if (!dados) return null;
  return lerUsuarios().find((u) => u.usuario === dados.u) || null;
}

/* ---------- Limite de tentativas de login ---------- */
const tentativas = new Map();
const MAX_FALHAS = 5, BLOQUEIO_MS = 60 * 1000;
function bloqueado(chave) {
  const t = tentativas.get(chave);
  if (t && t.ate && t.ate > Date.now()) return Math.ceil((t.ate - Date.now()) / 1000);
  return 0;
}
function registrarFalha(chave) {
  const t = tentativas.get(chave) || { falhas: 0, ate: 0 };
  t.falhas += 1;
  if (t.falhas >= MAX_FALHAS) { t.ate = Date.now() + BLOQUEIO_MS; t.falhas = 0; }
  tentativas.set(chave, t);
}
const limparFalhas = (chave) => tentativas.delete(chave);

module.exports = {
  hashSenha, conferirSenha, criarToken, garantirAdmin, lerUsuarios, gravarUsuarios,
  usuarioDaRequisicao, bloqueado, registrarFalha, limparFalhas
};
