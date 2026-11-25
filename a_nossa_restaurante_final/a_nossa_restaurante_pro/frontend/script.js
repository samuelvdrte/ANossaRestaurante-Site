'use strict';
/* ================= INICIALIZAÇÃO ================= */
document.addEventListener('DOMContentLoaded', async () => {
  aplicarTemas();
  $('#form-login').addEventListener('submit', (e) => enviarAuth(e, 'login'));
  $('#form-registrar').addEventListener('submit', (e) => enviarAuth(e, 'registrar'));
  $('#checkout-form').addEventListener('submit', finalizarPedido);
  ['custom-proteina', 'custom-guarnicao', 'custom-extra'].forEach((id) => $('#' + id).addEventListener('change', atualizarPersonalizado));

  // Tenta validar token existente
  if (estado.token) {
    try {
      const r = await api('/auth/eu', { semSessao: true });
      return await entrarNoApp(r.usuario);
    } catch (e) {
      estado.token = '';
      localStorage.removeItem('anossa_token');
    }
  }

  // LOGIN AUTOMÁTICO DIRETO COMO ADMIN (Entra sem precisar fazer nada)
  try {
    const r = await api('/auth/login', {
      metodo: 'POST',
      corpo: { usuario: 'admin', senha: '12345' },
      semSessao: true
    });
    estado.token = r.token;
    localStorage.setItem('anossa_token', r.token);
    await entrarNoApp(r.usuario);
  } catch (e) {
    mostrarAuth(e.message);
  }
});
// Força o login automático com o perfil admin para entrar sem fazer nada
document.addEventListener('DOMContentLoaded', () => {
    // Cria o objeto do usuário admin mestre
    const usuarioAdmin = {
        nome: "Administrador",
        usuario: "admin",
        admin: true
    };

    // Salva no localStorage do navegador para simular que já está logado
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAdmin));

    // Opcional: Se a sua aplicação usa alguma função específica para carregar a tela principal 
    // após o login (ex: carregarCardapio() ou mostrarPainel()), chame-a aqui diretamente:
    if (typeof carregarPainel === 'function') {
        carregarPainel();
    } else if (typeof mostrarTelaPrincipal === 'function') {
        mostrarTelaPrincipal();
    } else {
        // Se a tela de login estiver visível, esconde ela e mostra o sistema
        const telaLogin = document.getElementById('tela-login'); // Ajuste o ID conforme o seu HTML se necessário
        const telaApp = document.getElementById('app');         // Ajuste o ID conforme o seu HTML se necessário
        
        if (telaLogin) telaLogin.style.display = 'none';
        if (telaApp) telaApp.style.display = 'block';
    }
});

/* ================= CONFIGURAÇÃO ================= */
const WHATSAPP = '5511930559316'; // troque pelo número do restaurante (DDI+DDD+número)
// Servido pelo backend => mesma origem. Abrindo o index.html direto do disco => usa localhost:3000
const API = window.ANOSSA_API || (location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api');

/* Widgets de identificação dos pratos */
const SELOS = {
  'carne-bovina': { emoji: '🥩', texto: 'Carne bovina', tom: 'carne' },
  'carne-frango': { emoji: '🍗', texto: 'Frango', tom: 'carne' },
  'carne-suina':  { emoji: '🥓', texto: 'Carne suína', tom: 'carne' },
  'peixe':        { emoji: '🐟', texto: 'Peixe', tom: 'peixe' },
  'vegetariano':  { emoji: '🥗', texto: 'Vegetariano', tom: 'verde' },
  'vegano':       { emoji: '🌱', texto: 'Vegano', tom: 'verde' },
  'sem-gluten':   { emoji: '✅', texto: 'Sem glúten', tom: 'verde' },
  'gluten':       { emoji: '🌾', texto: 'Contém glúten', tom: 'gluten' },
  'lactose':      { emoji: '🥛', texto: 'Contém lactose', tom: 'lactose' },
  'ovo':          { emoji: '🥚', texto: 'Contém ovo', tom: 'ovo' },
  'picante':      { emoji: '🌶️', texto: 'Picante', tom: 'picante' }
};
const ORDEM_SELOS = Object.keys(SELOS);
const CARNES = ['carne-bovina', 'carne-frango', 'carne-suina', 'peixe'];

/* ================= ESTADO ================= */
const estado = {
  token: localStorage.getItem('anossa_token') || '',
  usuario: null,
  produtos: [],
  carrinho: [],
  pedidos: [],
  categoria: 'Promoção do dia',
  filtros: new Set(),
  produtoQtd: null,
  qtd: 1,
  emAdmin: false,
  imagemUpload: ''
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const chaveCarrinho = () => `anossa_carrinho_${estado.usuario ? estado.usuario.usuario : 'anon'}`;

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
}

/* ================= API ================= */
async function api(caminho, { metodo = 'GET', corpo, semSessao } = {}) {
  let resp;
  try {
    resp = await fetch(API + caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(estado.token ? { Authorization: 'Bearer ' + estado.token } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
  } catch (e) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando (npm start).');
  }
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    if (resp.status === 401 && !semSessao) { encerrarSessao(); throw new Error('Sua sessão expirou. Entre novamente.'); }
    throw new Error(dados.error || 'Erro inesperado.');
  }
  return dados;
}

/* ================= TEMAS ================= */
function aplicarTemas() {
  document.body.classList.toggle('dark', localStorage.getItem('anossa_tema') === 'escuro');
  document.body.classList.toggle('contraste', localStorage.getItem('anossa_contraste') === '1');
  const escuro = document.body.classList.contains('dark');
  $$('.tema-lbl').forEach((e) => (e.textContent = escuro ? 'Claro' : 'Escuro'));
  $$('[data-acao="tema"] use').forEach((u) => u.setAttribute('href', escuro ? '#i-sun' : '#i-moon'));
}

/* ================= MODAIS ================= */
function abrir(el) { el.classList.remove('hidden'); document.body.classList.add('sem-rolagem'); const f = $('input,select,textarea,button:not(.close-btn)', el); if (f && el.id !== 'cart-modal') setTimeout(() => f.focus({ preventScroll: true }), 30); }
function fechar(el) { el.classList.add('hidden'); if (!$$('.modal-overlay:not(.hidden)').length) document.body.classList.remove('sem-rolagem'); }
function fecharTodos() { $$('.modal-overlay').forEach((m) => m.classList.add('hidden')); document.body.classList.remove('sem-rolagem'); }

/* ================= LOGIN / CADASTRO ================= */
function mostrarAuth(msg) {
  $('#app').classList.add('hidden');
  $('#fab-cart').classList.remove('tem-itens');
  $('#tela-auth').classList.remove('hidden');
  trocarAba('login');
  if (msg) erroAuth('#form-login', msg);
}

function trocarAba(aba) {
  $$('.auth-tab').forEach((b) => { const a = b.dataset.auth === aba; b.classList.toggle('active', a); b.setAttribute('aria-selected', a); });
  $('#form-login').classList.toggle('hidden', aba !== 'login');
  $('#form-registrar').classList.toggle('hidden', aba !== 'registrar');
  $$('.auth-erro').forEach((e) => e.classList.add('hidden'));
}

function erroAuth(form, msg) { const e = $('.auth-erro', $(form)); e.textContent = msg; e.classList.remove('hidden'); }

async function enviarAuth(ev, tipo) {
  ev.preventDefault();
  const form = ev.currentTarget, id = '#' + form.id, btn = $('button[type=submit]', form);
  $('.auth-erro', form).classList.add('hidden');
  let corpo;
  if (tipo === 'login') {
    corpo = { usuario: $('#login-usuario').value, senha: $('#login-senha').value };
    if (!corpo.usuario.trim() || !corpo.senha) return erroAuth(id, 'Preencha usuário e senha.');
  } else {
    corpo = { nome: $('#reg-nome').value, usuario: $('#reg-usuario').value, senha: $('#reg-senha').value };
    if ($('#reg-senha2').value !== corpo.senha) return erroAuth(id, 'As senhas não conferem.');
  }
  btn.disabled = true;
  try {
    const r = await api(tipo === 'login' ? '/auth/login' : '/auth/registrar', { metodo: 'POST', corpo, semSessao: true });
    estado.token = r.token;
    localStorage.setItem('anossa_token', r.token);
    form.reset();
    await entrarNoApp(r.usuario);
  } catch (e) { erroAuth(id, e.message); }
  btn.disabled = false;
}

function encerrarSessao() {
  estado.token = ''; estado.usuario = null; estado.emAdmin = false;
  localStorage.removeItem('anossa_token');
  fecharTodos();
  $('#admin-root').innerHTML = '';
  const b = $('#btn-admin'); if (b) b.remove();
  mostrarAuth();
}

function sair() { encerrarSessao(); toast('Você saiu da conta.'); }

async function entrarNoApp(usuario) {
  estado.usuario = usuario;
  estado.carrinho = JSON.parse(localStorage.getItem(chaveCarrinho()) || '[]');
  $('#tela-auth').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#nome-usuario').textContent = usuario.nome.split(' ')[0];
  $('#btn-usuario').classList.add('nome-visivel');
  $('#main-content').classList.remove('hidden');
  $('#admin-root').innerHTML = '';
  estado.emAdmin = false;

  // O botão (e o painel) de admin só existem para quem o servidor identificou como administrador
  const antigo = $('#btn-admin'); if (antigo) antigo.remove();
  if (usuario.papel === 'admin') {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'btn-admin'; b.className = 'nav-btn solid'; b.dataset.acao = 'admin-abrir';
    b.innerHTML = '<svg class="ico"><use href="#i-shield"/></svg><span class="lbl">Admin</span>';
    $('#btn-usuario').before(b);
  }
  atualizarCarrinho();
  try {
    await Promise.all([carregarProdutos(), carregarPedidos()]);
  } catch (e) { toast(e.message); }
  window.scrollTo(0, 0);
  toast(`Olá, ${usuario.nome.split(' ')[0]}! ${usuario.papel === 'admin' ? 'Você entrou como administrador.' : 'Bom apetite!'}`);
}

/* ================= CARDÁPIO ================= */
async function carregarProdutos() {
  estado.produtos = await api('/produtos');
  renderProdutos();
}

function chipSelo(k) {
  const s = SELOS[k]; if (!s) return '';
  return `<span class="selo selo-${s.tom}" title="${esc(s.texto)}"><span aria-hidden="true">${s.emoji}</span>${esc(s.texto)}</span>`;
}
const chips = (lista) => ORDEM_SELOS.filter((k) => (lista || []).includes(k)).map(chipSelo).join('');

function emojiDoProduto(p) {
  if (p.category === 'Bebidas') return '🥤';
  if (p.category === 'Sobremesas') return '🍮';
  const s = p.selos || [];
  if (s.includes('peixe')) return '🐟';
  if (s.includes('carne-frango')) return '🍗';
  if (s.includes('carne-bovina') || s.includes('carne-suina')) return '🥩';
  if (s.includes('vegetariano')) return '🥗';
  return '🍽️';
}

function passaFiltros(p) {
  const f = estado.filtros, s = p.selos || [];
  if (f.has('mais-vendido') && !p.maisVendido) return false;
  if (f.has('vegetariano') && !s.includes('vegetariano')) return false;
  if (f.has('vegano') && !s.includes('vegano')) return false;
  if (f.has('sem-gluten') && !s.includes('sem-gluten')) return false;
  return true;
}

function htmlImagem(p) {
  const alt = esc(p.name);
  return p.image
    ? `<img src="${esc(p.image)}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer">`
    : `<div class="img-fallback" role="img" aria-label="${alt}">${emojiDoProduto(p)}</div>`;
}

function renderProdutos() {
  const box = $('#products-container');
  const lista = estado.produtos.filter((p) => p.category === estado.categoria && p.available && passaFiltros(p));
  if (!lista.length) {
    box.innerHTML = `<p class="vazio">${estado.filtros.size ? 'Nenhum prato desta categoria combina com os filtros escolhidos.' : 'Nenhum produto disponível nesta categoria no momento.'}</p>`;
    return;
  }
  box.innerHTML = lista.map((p) => `
    <article class="card-produto" data-id="${p.id}">
      <div class="card-img">
        ${htmlImagem(p)}
        <span class="etiqueta">${esc(p.category)}</span>
        ${p.maisVendido ? '<span class="mais-vendido">🔥 Mais vendido</span>' : ''}
      </div>
      <div class="card-corpo">
        <h4>${esc(p.name)}</h4>
        <p class="desc">${esc(p.description)}</p>
        <div class="selos">${chips(p.selos)}</div>
        <div class="card-rodape">
          <strong class="preco">${brl(p.price)}</strong>
          <button type="button" class="btn-add" data-acao="pedir" aria-label="Adicionar ${esc(p.name)}"><svg class="ico"><use href="#i-plus"/></svg>Adicionar</button>
        </div>
      </div>
    </article>`).join('');
}

function trocarCategoria(cat) {
  estado.categoria = cat;
  $$('.tab-btn').forEach((b) => { const a = b.dataset.categoria === cat; b.classList.toggle('active', a); b.setAttribute('aria-selected', a); });
  const custom = cat === 'Monte o seu prato';
  $('#custom-meal-section').classList.toggle('hidden', !custom);
  $('#products-container').classList.toggle('hidden', custom);
  $('#filtros').classList.toggle('hidden', custom);
  if (custom) atualizarPersonalizado(); else renderProdutos();
}

/* ================= MONTE O SEU PRATO ================= */
function calcPersonalizado() {
  let preco = 27.9; const selos = new Set();
  ['custom-proteina', 'custom-guarnicao', 'custom-extra'].forEach((id) => {
    const o = $('#' + id).selectedOptions[0];
    if (o.dataset.extra) preco += parseFloat(o.dataset.extra);
    (o.dataset.selos || '').split(',').filter(Boolean).forEach((s) => selos.add(s));
  });
  if (CARNES.some((c) => selos.has(c))) selos.delete('vegetariano');
  return { preco, selos: [...selos] };
}
function atualizarPersonalizado() {
  const { preco, selos } = calcPersonalizado();
  $('#custom-price-display').textContent = brl(preco);
  $('#custom-selos').innerHTML = chips(selos);
}
function adicionarPersonalizado() {
  const v = (id) => $('#' + id).value;
  const { preco } = calcPersonalizado();
  const obs = v('custom-obs').trim();
  estado.carrinho.push({
    id: 'custom_' + Date.now(), name: 'Marmita Personalizada', isCustom: true, quantity: 1, price: preco,
    details: `${v('custom-arroz')} | ${v('custom-feijao')} | ${v('custom-proteina')} | ${v('custom-guarnicao')} | ${v('custom-salada')} | Extra: ${v('custom-extra')}${obs ? ' | Obs: ' + obs : ''}`
  });
  salvarCarrinho();
  toast('Prato personalizado adicionado ao carrinho!');
}

/* ================= CARRINHO ================= */
function salvarCarrinho() {
  localStorage.setItem(chaveCarrinho(), JSON.stringify(estado.carrinho));
  atualizarCarrinho();
}
const totalCarrinho = () => estado.carrinho.reduce((s, i) => s + i.price * i.quantity, 0);

function atualizarCarrinho() {
  const qtd = estado.carrinho.reduce((s, i) => s + i.quantity, 0);
  $('#cart-count').textContent = qtd;
  $('#fab-qtd').textContent = qtd;
  $('#fab-total').textContent = brl(totalCarrinho());
  $('#fab-cart').classList.toggle('tem-itens', qtd > 0 && !estado.emAdmin);
  if (!$('#cart-modal').classList.contains('hidden')) renderCarrinho();
}

function renderCarrinho() {
  const box = $('#cart-items-container');
  if (!estado.carrinho.length) {
    box.innerHTML = '<p class="vazio">Seu carrinho está vazio.</p>';
  } else {
    box.innerHTML = estado.carrinho.map((it, i) => `
      <div class="cart-item-card">
        <div class="cart-item-info"><span>${esc(it.name)}</span><span>${brl(it.price * it.quantity)}</span></div>
        <div class="cart-item-details">${esc(it.details || '')}</div>
        <div class="cart-item-controls">
          <div class="qty-control-box">
            <button type="button" data-acao="cart-menos" data-i="${i}" aria-label="Diminuir">−</button>
            <span>${it.quantity}</span>
            <button type="button" data-acao="cart-mais" data-i="${i}" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="btn-remove-item" data-acao="cart-remover" data-i="${i}">Remover</button>
        </div>
      </div>`).join('');
  }
  $('#cart-total-value').textContent = brl(totalCarrinho());
}

function adicionarAoCarrinho(p, qtd) {
  const ex = estado.carrinho.find((i) => i.id === p.id && !i.isCustom);
  if (ex) ex.quantity = Math.min(99, ex.quantity + qtd);
  else estado.carrinho.push({ id: p.id, name: p.name, details: p.description, price: p.price, quantity: qtd, isCustom: false });
  salvarCarrinho();
  toast(`${qtd}x ${p.name} adicionado(s) ao carrinho!`);
}

/* ================= PEDIDOS ================= */
async function carregarPedidos() {
  try { estado.pedidos = await api('/pedidos'); } catch (e) { estado.pedidos = []; }
  renderPedidos();
}

function renderPedidos() {
  const box = $('#orders-history-container');
  const meus = estado.pedidos.filter((p) => p.usuario === estado.usuario.usuario).slice(0, 5);
  if (!meus.length) { box.innerHTML = '<p class="vazio">Nenhum pedido recente registrado.</p>'; return; }
  box.innerHTML = meus.map((o) => `
    <div class="history-card">
      <div>
        <h4>Pedido #${String(o.id).slice(-4)}</h4>
        <div class="meta">${esc(o.date)} • ${esc(o.payment)}</div>
      </div>
      <ul class="history-items-list">${o.items.map((i) => `<li>${i.quantity}x ${esc(i.name)}</li>`).join('')}</ul>
      <div class="history-total">${brl(o.total)}</div>
      <button type="button" class="btn-reorder" data-acao="repetir" data-id="${o.id}">Pedir novamente</button>
    </div>`).join('');
}

function repetirPedido(id) {
  const o = estado.pedidos.find((p) => String(p.id) === String(id));
  if (!o) return toast('Não foi possível carregar o pedido anterior.');
  o.items.forEach((i) => {
    if (i.isCustom) { estado.carrinho.push({ ...i, id: 'custom_' + Date.now() + Math.random().toString(36).slice(2, 5) }); return; }
    const atual = estado.produtos.find((p) => p.id === i.id && p.available);
    if (!atual) return toast(`"${i.name}" não está mais disponível.`);
    const ex = estado.carrinho.find((c) => c.id === atual.id && !c.isCustom);
    if (ex) ex.quantity += i.quantity;
    else estado.carrinho.push({ id: atual.id, name: atual.name, details: atual.description, price: atual.price, quantity: i.quantity, isCustom: false });
  });
  salvarCarrinho(); renderCarrinho(); abrir($('#cart-modal'));
  toast('Itens do pedido anterior adicionados ao carrinho!');
}

async function finalizarPedido(ev) {
  ev.preventDefault();
  const dado = { name: $('#client-name').value.trim(), address: $('#client-address').value.trim(), payment: $('#client-payment').value, obs: $('#client-obs').value.trim() };
  if (!dado.name || !dado.address || !dado.payment) return toast('Preencha nome, endereço e pagamento.');
  const btn = $('button[type=submit]', ev.currentTarget); btn.disabled = true;
  // abre a janela já (clique do usuário) para evitar bloqueio de pop-up
  const janela = window.open('', '_blank');
  try {
    const pedido = await api('/pedidos', { metodo: 'POST', corpo: { ...dado, items: estado.carrinho } });
    const itens = pedido.items.map((i) => `- ${i.quantity}x ${i.name} (${i.details || ''}) - ${brl(i.price * i.quantity)}`).join('\n');
    const msg = `*NOVO PEDIDO - A NOSSA RESTAURANTE*\n\n👤 *Cliente:* ${dado.name}\n📍 *Endereço:* ${dado.address}\n💳 *Pagamento:* ${dado.payment}\n📝 *Obs:* ${dado.obs || 'Nenhuma'}\n\n🛒 *Itens do Pedido:*\n${itens}\n\n💰 *Total:* ${brl(pedido.total)}`;
    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent(msg)}`;
    if (janela) { janela.opener = null; janela.location.href = url; } else location.href = url;
    estado.carrinho = []; salvarCarrinho();
    fecharTodos(); ev.target.reset();
    await Promise.all([carregarPedidos(), carregarProdutos().catch(() => {})]);
    toast('Pedido registrado e enviado para o WhatsApp!');
  } catch (e) {
    if (janela) janela.close();
    toast(e.message);
  }
  btn.disabled = false;
}

/* ================= ADMIN (só existe para administradores) ================= */
function abrirAdmin() {
  if (!estado.usuario || estado.usuario.papel !== 'admin') return; // barreira extra no cliente (a real é no servidor)
  estado.emAdmin = true;
  $('#main-content').classList.add('hidden');
  const root = $('#admin-root');
  root.innerHTML = '';
  root.appendChild($('#tpl-admin').content.cloneNode(true));
  $('#p-selos').innerHTML = ORDEM_SELOS.map((k) => `<label><input type="checkbox" value="${k}"> ${SELOS[k].emoji} ${esc(SELOS[k].texto)}</label>`).join('');
  $('#product-form').addEventListener('submit', salvarProduto);
  $('#p-file-input').addEventListener('change', escolherArquivo);
  $('#p-img-url').addEventListener('input', (e) => mostrarPreview(e.target.value.trim(), true));
  carregarProdutos().then(renderAdmin).catch((e) => toast(e.message));
  atualizarCarrinho();
  window.scrollTo(0, 0);
}
function voltarCardapio() {
  estado.emAdmin = false;
  $('#admin-root').innerHTML = '';
  $('#main-content').classList.remove('hidden');
  renderProdutos(); atualizarCarrinho();
}

function renderAdmin() {
  if (!$('#admin-products-list')) return;
  $('#admin-count').textContent = `${estado.produtos.length} itens`;
  $('#admin-products-list').innerHTML = estado.produtos.map((p) => `
    <div class="admin-product-row">
      <div class="admin-thumb">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : emojiDoProduto(p)}</div>
      <div class="admin-row-info">
        <strong>${esc(p.name)} <span class="badge-status ${p.available ? '' : 'off'}">${p.available ? 'Ativo' : 'Inativo'}</span></strong>
        <small>${esc(p.category)} • ${brl(p.price)}${p.vendas ? ` • ${p.vendas} vendidos` : ''}</small>
      </div>
      <div class="admin-actions-group">
        <button type="button" data-acao="admin-editar" data-id="${p.id}">Editar</button>
        <button type="button" class="excluir" data-acao="admin-excluir" data-id="${p.id}">Excluir</button>
      </div>
    </div>`).join('');
}

function mostrarPreview(src, ehUrl) {
  const c = $('#img-preview-container');
  if (!src) return c.classList.add('hidden');
  if (ehUrl) { estado.imagemUpload = ''; $('#p-file-input').value = ''; $('#file-name-display').textContent = 'Nenhum arquivo selecionado'; }
  $('#img-preview').src = src; c.classList.remove('hidden');
}

// Reduz a imagem enviada (máx. 900px) para não pesar na API
function escolherArquivo(e) {
  const arq = e.target.files[0]; if (!arq) return;
  $('#file-name-display').textContent = arq.name;
  const leitor = new FileReader();
  leitor.onload = () => {
    const img = new Image();
    img.onload = () => {
      const esc_ = Math.min(1, 900 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * esc_); cv.height = Math.round(img.height * esc_);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      estado.imagemUpload = cv.toDataURL('image/jpeg', 0.82);
      $('#p-img-url').value = '';
      mostrarPreview(estado.imagemUpload, false);
    };
    img.onerror = () => toast('Arquivo de imagem inválido.');
    img.src = leitor.result;
  };
  leitor.readAsDataURL(arq);
}

function limparFormAdmin() {
  $('#product-form').reset();
  $('#edit-product-id').value = '';
  $('#admin-form-title').textContent = 'Cadastrar Novo Produto';
  $('#btn-save-product').textContent = 'Salvar Produto';
  $('#file-name-display').textContent = 'Nenhum arquivo selecionado';
  $('#img-preview-container').classList.add('hidden');
  estado.imagemUpload = '';
}

function editarProduto(id) {
  const p = estado.produtos.find((x) => x.id === Number(id)); if (!p) return;
  $('#edit-product-id').value = p.id;
  $('#p-name').value = p.name; $('#p-desc').value = p.description; $('#p-price').value = p.price;
  $('#p-category').value = p.category; $('#p-available').checked = p.available;
  $('#p-img-url').value = p.image && !p.image.startsWith('data:') ? p.image : '';
  estado.imagemUpload = p.image && p.image.startsWith('data:') ? p.image : '';
  $$('#p-selos input').forEach((c) => (c.checked = (p.selos || []).includes(c.value)));
  mostrarPreview(p.image, false);
  $('#admin-form-title').textContent = 'Editar Produto';
  $('#btn-save-product').textContent = 'Atualizar Produto';
  $('.admin-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function salvarProduto(ev) {
  ev.preventDefault();
  const id = $('#edit-product-id').value;
  const corpo = {
    name: $('#p-name').value, description: $('#p-desc').value, price: parseFloat($('#p-price').value),
    category: $('#p-category').value, available: $('#p-available').checked,
    image: estado.imagemUpload || $('#p-img-url').value.trim(),
    selos: $$('#p-selos input:checked').map((c) => c.value)
  };
  if (!corpo.name.trim() || !corpo.description.trim() || !(corpo.price > 0)) return toast('Preencha nome, descrição e preço.');
  try {
    await api(id ? `/produtos/${id}` : '/produtos', { metodo: id ? 'PUT' : 'POST', corpo });
    toast(id ? 'Produto atualizado!' : 'Produto cadastrado!');
    limparFormAdmin();
    await carregarProdutos(); renderAdmin();
  } catch (e) { toast(e.message); }
}

async function excluirProduto(id) {
  const p = estado.produtos.find((x) => x.id === Number(id)); if (!p) return;
  if (!confirm(`Excluir "${p.name}" do cardápio?`)) return;
  try { await api(`/produtos/${id}`, { metodo: 'DELETE' }); toast('Produto removido.'); await carregarProdutos(); renderAdmin(); }
  catch (e) { toast(e.message); }
}

/* ================= EVENTOS (delegação) ================= */
const acoes = {
  contraste() { localStorage.setItem('anossa_contraste', document.body.classList.contains('contraste') ? '0' : '1'); aplicarTemas(); },
  tema() { localStorage.setItem('anossa_tema', document.body.classList.contains('dark') ? 'claro' : 'escuro'); aplicarTemas(); },
  sair,
  'abrir-carrinho'() { renderCarrinho(); abrir($('#cart-modal')); },
  'ir-checkout'() {
    if (!estado.carrinho.length) return toast('Seu carrinho está vazio!');
    fechar($('#cart-modal')); $('#client-name').value = $('#client-name').value || estado.usuario.nome; abrir($('#checkout-modal'));
  },
  'voltar-carrinho'() { fechar($('#checkout-modal')); renderCarrinho(); abrir($('#cart-modal')); },
  'add-custom': adicionarPersonalizado,
  'qty-mais'() { estado.qtd = Math.min(99, estado.qtd + 1); $('#qty-value').textContent = estado.qtd; },
  'qty-menos'() { estado.qtd = Math.max(1, estado.qtd - 1); $('#qty-value').textContent = estado.qtd; },
  'confirmar-add'() { if (estado.produtoQtd) adicionarAoCarrinho(estado.produtoQtd, estado.qtd); fechar($('#quantity-modal')); },
  'cart-mais'(el) { const i = estado.carrinho[el.dataset.i]; i.quantity = Math.min(99, i.quantity + 1); salvarCarrinho(); renderCarrinho(); },
  'cart-menos'(el) { const i = estado.carrinho[el.dataset.i]; if (--i.quantity <= 0) estado.carrinho.splice(el.dataset.i, 1); salvarCarrinho(); renderCarrinho(); },
  'cart-remover'(el) { estado.carrinho.splice(el.dataset.i, 1); salvarCarrinho(); renderCarrinho(); },
  repetir(el) { repetirPedido(el.dataset.id); },
  'admin-abrir': abrirAdmin,
  'admin-voltar': voltarCardapio,
  'admin-limpar': limparFormAdmin,
  'admin-editar'(el) { editarProduto(el.dataset.id); },
  'admin-excluir'(el) { excluirProduto(el.dataset.id); },
  pedir(el) { abrirQuantidade(Number(el.closest('.card-produto').dataset.id)); }
};

function abrirQuantidade(id) {
  const p = estado.produtos.find((x) => x.id === id); if (!p) return;
  estado.produtoQtd = p; estado.qtd = 1;
  $('#qty-nome').textContent = p.name; $('#qty-value').textContent = 1;
  $('#qty-selos').innerHTML = chips(p.selos);
  abrir($('#quantity-modal'));
}

document.addEventListener('click', (e) => {
  const alvo = e.target;
  const el = alvo.closest('[data-acao]');
  if (el && acoes[el.dataset.acao]) return acoes[el.dataset.acao](el);
  const auth = alvo.closest('[data-auth]'); if (auth) return trocarAba(auth.dataset.auth);
  const aba = alvo.closest('.tab-btn'); if (aba) return trocarCategoria(aba.dataset.categoria);
  const filtro = alvo.closest('.filtro');
  if (filtro) {
    const k = filtro.dataset.filtro;
    estado.filtros.has(k) ? estado.filtros.delete(k) : estado.filtros.add(k);
    filtro.setAttribute('aria-pressed', estado.filtros.has(k)); return renderProdutos();
  }
  const card = alvo.closest('.card-produto'); if (card) return abrirQuantidade(Number(card.dataset.id));
  if (alvo.closest('[data-fechar]')) return fecharTodos();
  if (alvo.classList.contains('modal-overlay')) return fechar(alvo);
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharTodos(); });

// Imagem quebrada => mostra um bloco com emoji em vez de um ícone feio
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG' || img.id === 'img-preview') return;
  const card = img.closest('.card-produto'), id = card && Number(card.dataset.id);
  const p = estado.produtos.find((x) => x.id === id);
  const div = document.createElement('div');
  div.className = img.closest('.admin-thumb') ? '' : 'img-fallback';
  div.textContent = p ? emojiDoProduto(p) : '🍽️';
  img.replaceWith(div);
}, true);

/* ================= INICIALIZAÇÃO ================= */
document.addEventListener('DOMContentLoaded', async () => {
  aplicarTemas();
  $('#form-login').addEventListener('submit', (e) => enviarAuth(e, 'login'));
  $('#form-registrar').addEventListener('submit', (e) => enviarAuth(e, 'registrar'));
  $('#checkout-form').addEventListener('submit', finalizarPedido);
  ['custom-proteina', 'custom-guarnicao', 'custom-extra'].forEach((id) => $('#' + id).addEventListener('change', atualizarPersonalizado));

  if (!estado.token) return mostrarAuth();
  try {
    const r = await api('/auth/eu', { semSessao: true });
    await entrarNoApp(r.usuario);
  } catch (e) {
    estado.token = ''; localStorage.removeItem('anossa_token');
    mostrarAuth(e.message.startsWith('Não foi possível') ? e.message : '');
  }
});
