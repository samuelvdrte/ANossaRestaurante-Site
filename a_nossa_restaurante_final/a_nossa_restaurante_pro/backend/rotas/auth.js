const { HttpError, enviar, lerCorpo } = require('../lib/util');
const seg = require('../lib/seguranca');

const publico = (u) => ({ usuario: u.usuario, nome: u.nome, papel: u.papel });
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

module.exports = [
  {
    metodo: 'POST', caminho: '/api/auth/registrar',
    async tratar(req, res) {
      const c = await lerCorpo(req, 10 * 1024);
      const nome = texto(c.nome), usuario = texto(c.usuario).toLowerCase(), senha = typeof c.senha === 'string' ? c.senha : '';
      if (nome.length < 2 || nome.length > 60) throw new HttpError(400, 'Informe seu nome (2 a 60 caracteres).');
      if (!/^[a-z0-9_.-]{3,20}$/.test(usuario)) throw new HttpError(400, 'Usuário: 3 a 20 caracteres (letras, números, ponto, hífen ou _).');
      if (usuario === 'admin') throw new HttpError(400, 'Este nome de usuário não está disponível.');
      if (senha.length < 6 || senha.length > 72) throw new HttpError(400, 'A senha precisa ter de 6 a 72 caracteres.');
      const usuarios = seg.lerUsuarios();
      if (usuarios.some((u) => u.usuario === usuario)) throw new HttpError(409, 'Este nome de usuário já está em uso.');
      const novo = { usuario, nome, papel: 'cliente', senha: seg.hashSenha(senha), criadoEm: new Date().toISOString() };
      usuarios.push(novo);
      seg.gravarUsuarios(usuarios);
      enviar(res, 201, { token: seg.criarToken(usuario), usuario: publico(novo) });
    }
  },
  {
    metodo: 'POST', caminho: '/api/auth/login',
    async tratar(req, res) {
      const c = await lerCorpo(req, 10 * 1024);
      const usuario = texto(c.usuario).toLowerCase(), senha = typeof c.senha === 'string' ? c.senha : '';
      const chave = `${req.socket.remoteAddress}:${usuario}`;
      const espera = seg.bloqueado(chave);
      if (espera) throw new HttpError(429, `Muitas tentativas. Aguarde ${espera}s e tente de novo.`);
      const u = seg.lerUsuarios().find((x) => x.usuario === usuario);
      const ok = seg.conferirSenha(senha, u && u.senha) && !!u;
      if (!ok) { seg.registrarFalha(chave); throw new HttpError(401, 'Usuário ou senha incorretos.'); }
      seg.limparFalhas(chave);
      enviar(res, 200, { token: seg.criarToken(u.usuario), usuario: publico(u) });
    }
  },
  {
    metodo: 'GET', caminho: '/api/auth/eu',
    async tratar(req, res) {
      const u = seg.usuarioDaRequisicao(req);
      if (!u) throw new HttpError(401, 'Sessão expirada. Entre novamente.');
      enviar(res, 200, { usuario: publico(u) });
    }
  }
];