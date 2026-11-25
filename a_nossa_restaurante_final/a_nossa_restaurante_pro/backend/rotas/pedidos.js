const { HttpError, ler, gravar, enviar, lerCorpo } = require('../lib/util');
const { usuarioDaRequisicao } = require('../lib/seguranca');

// Combinações possíveis do "Monte o seu prato" (base 27,90 + proteína + extra)
const PRECOS_PERSONALIZADO = new Set(
  [0, 6].flatMap((p) => [0, 8, 3].map((e) => Math.round((27.9 + p + e) * 100)))
);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = [
  {
    metodo: 'GET', caminho: '/api/pedidos',
    async tratar(req, res) {
      const u = usuarioDaRequisicao(req);
      if (!u) throw new HttpError(401, 'Faça login para continuar.');
      const todos = ler('pedidos.json', []);
      const lista = u.papel === 'admin' ? todos : todos.filter((p) => p.usuario === u.usuario);
      enviar(res, 200, lista.slice(0, 50));
    }
  },
  {
    metodo: 'POST', caminho: '/api/pedidos',
    async tratar(req, res) {
      const u = usuarioDaRequisicao(req);
      if (!u) throw new HttpError(401, 'Faça login para continuar.');
      const c = await lerCorpo(req, 200 * 1024);
      if (!Array.isArray(c.items) || c.items.length < 1 || c.items.length > 50) throw new HttpError(400, 'Pedido sem itens.');
      const name = str(c.name, 80), address = str(c.address, 200), payment = str(c.payment, 80);
      if (!name || !address || !payment) throw new HttpError(400, 'Preencha nome, endereço e forma de pagamento.');

      const produtos = ler('produtos.json', []);
      let total = 0;
      const items = c.items.map((it) => {
        const quantity = Number(it.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new HttpError(400, 'Quantidade inválida.');
        if (it.isCustom) {
          const price = Math.round(Number(it.price) * 100);
          if (!PRECOS_PERSONALIZADO.has(price)) throw new HttpError(400, 'Preço do prato personalizado inválido.');
          total += (price / 100) * quantity;
          return { id: str(it.id, 40), name: 'Marmita Personalizada', details: str(it.details, 500), price: price / 100, quantity, isCustom: true };
        }
        const p = produtos.find((x) => x.id === Number(it.id));
        if (!p || !p.available) throw new HttpError(400, `Item indisponível: ${str(it.name, 60) || it.id}`);
        total += p.price * quantity;
        return { id: p.id, name: p.name, details: p.description, price: p.price, quantity, isCustom: false };
      });

      // Soma as vendas (alimenta o selo "Mais vendido")
      items.filter((i) => !i.isCustom).forEach((i) => {
        const p = produtos.find((x) => x.id === i.id);
        p.vendas = (p.vendas || 0) + i.quantity;
      });
      gravar('produtos.json', produtos);

      const pedidos = ler('pedidos.json', []);
      const pedido = {
        id: Date.now(), date: new Date().toLocaleString('pt-BR'), usuario: u.usuario,
        name, address, payment, obs: str(c.obs, 300), total: Math.round(total * 100) / 100, items
      };
      pedidos.unshift(pedido);
      gravar('pedidos.json', pedidos);
      enviar(res, 201, pedido);
    }
  }
];
