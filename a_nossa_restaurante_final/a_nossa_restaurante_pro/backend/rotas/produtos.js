const { HttpError, ler, gravar, enviar, lerCorpo } = require('../lib/util');
const { usuarioDaRequisicao } = require('../lib/seguranca');
const { CATEGORIAS, normalizarSelos, imagemValida } = require('../lib/catalogo');

const lerProdutos = () => ler('produtos.json', []);
const gravarProdutos = (p) => gravar('produtos.json', p);

function exigirLogin(req) {
  const u = usuarioDaRequisicao(req);
  if (!u) throw new HttpError(401, 'Faça login para continuar.');
  return u;
}
function exigirAdmin(req) {
  const u = exigirLogin(req);
  if (u.papel !== 'admin') throw new HttpError(403, 'Acesso restrito a administradores.');
  return u;
}

// O "mais vendido" é calculado pelas vendas reais: o campeão de cada categoria
function marcarMaisVendidos(lista) {
  const topo = {};
  lista.forEach((p) => {
    if ((p.vendas || 0) > 0 && (!topo[p.category] || p.vendas > topo[p.category].vendas)) topo[p.category] = p;
  });
  return lista.map((p) => ({ ...p, maisVendido: topo[p.category] === p }));
}

function validar(c, parcial) {
  const o = {};
  const tem = (k) => c[k] !== undefined;
  if (!parcial || tem('name')) {
    const v = typeof c.name === 'string' ? c.name.trim() : '';
    if (v.length < 2 || v.length > 80) throw new HttpError(400, 'Nome do produto: 2 a 80 caracteres.');
    o.name = v;
  }
  if (!parcial || tem('description')) {
    const v = typeof c.description === 'string' ? c.description.trim() : '';
    if (v.length < 3 || v.length > 400) throw new HttpError(400, 'Descrição: 3 a 400 caracteres.');
    o.description = v;
  }
  if (!parcial || tem('price')) {
    const v = Number(c.price);
    if (!Number.isFinite(v) || v <= 0 || v > 999.99) throw new HttpError(400, 'Preço inválido.');
    o.price = Math.round(v * 100) / 100;
  }
  if (!parcial || tem('category')) {
    if (!CATEGORIAS.includes(c.category)) throw new HttpError(400, 'Categoria inválida.');
    o.category = c.category;
  }
  if (!parcial || tem('image')) {
    if (!imagemValida(c.image)) throw new HttpError(400, 'Imagem inválida (use URL http(s) ou envie um arquivo de imagem).');
    o.image = c.image || '';
  }
  if (!parcial || tem('available')) o.available = c.available !== false;
  if (!parcial || tem('selos')) o.selos = normalizarSelos(c.selos);
  return o;
}

module.exports = [
  {
    metodo: 'GET', caminho: '/api/produtos',
    async tratar(req, res) {
      const u = exigirLogin(req);
      let lista = marcarMaisVendidos(lerProdutos());
      if (u.papel !== 'admin') lista = lista.filter((p) => p.available).map(({ vendas, ...resto }) => resto);
      enviar(res, 200, lista);
    }
  },
  {
    metodo: 'POST', caminho: '/api/produtos',
    async tratar(req, res) {
      exigirAdmin(req);
      const dados = validar(await lerCorpo(req), false);
      const produtos = lerProdutos();
      const novo = { id: Math.max(0, ...produtos.map((p) => p.id)) + 1, ...dados, vendas: 0 };
      produtos.push(novo);
      gravarProdutos(produtos);
      enviar(res, 201, novo);
    }
  },
  {
    metodo: 'PUT', caminho: /^\/api\/produtos\/(\d+)$/,
    async tratar(req, res, [id]) {
      exigirAdmin(req);
      const dados = validar(await lerCorpo(req), true);
      const produtos = lerProdutos();
      const i = produtos.findIndex((p) => p.id === Number(id));
      if (i < 0) throw new HttpError(404, 'Produto não encontrado.');
      produtos[i] = { ...produtos[i], ...dados, id: produtos[i].id };
      gravarProdutos(produtos);
      enviar(res, 200, produtos[i]);
    }
  },
  {
    metodo: 'DELETE', caminho: /^\/api\/produtos\/(\d+)$/,
    async tratar(req, res, [id]) {
      exigirAdmin(req);
      const produtos = lerProdutos();
      if (!produtos.some((p) => p.id === Number(id))) throw new HttpError(404, 'Produto não encontrado.');
      gravarProdutos(produtos.filter((p) => p.id !== Number(id)));
      enviar(res, 200, { success: true, message: 'Produto removido com sucesso.' });
    }
  }
];
