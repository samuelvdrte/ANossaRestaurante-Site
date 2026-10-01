// DADOS INICIAIS DO CARDÁPIO
const defaultProducts = [
    {
        id: 1,
        name: "Prato Executivo Frango",
        description: "Arroz, feijao, fritas e salada.",
        price: 30.00,
        category: "Promocao do dia",
        image: "https://i.imgur.com/8Q0N6c9.png",
        available: true
    },
    {
        id: 2,
        name: "Marmita G - Carne Assada",
        description: "Acompanha guarnicao do dia.",
        price: 32.00,
        category: "Cardapio normal",
        image: "https://i.imgur.com/8Q0N6c9.png",
        available: true
    },
    {
        id: 3,
        name: "Prato Executivo Omelete",
        description: "Arroz, feijao, legumes e salada.",
        price: 22.90,
        category: "Cardapio normal",
        image: "https://i.imgur.com/8Q0N6c9.png",
        available: true
    },
    {
        id: 4,
        name: "Suco Natural Laranja",
        description: "500ml espremido na hora.",
        price: 9.00,
        category: "Bebidas",
        image: "https://i.imgur.com/8Q0N6c9.png",
        available: false
    },
    {
        id: 5,
        name: "Refrigerante Lata",
        description: "350ml gelado.",
        price: 6.50,
        category: "Bebidas",
        image: "https://i.imgur.com/8Q0N6c9.png",
        available: true
    },
    {
        id: 6,
        name: "Pudim de Leite",
        description: "Fatia generosa com calda de caramelo.",
        price: 10.00,
        category: "Sobremesas",
        image: "https://i.imgur.com/8Q0N6c9.png",
        available: true
    }
];

// ESTADO DA APLICAÇÃO
let products = JSON.parse(localStorage.getItem('anossa_products')) || defaultProducts;
let cart = JSON.parse(localStorage.getItem('anossa_cart')) || [];
let currentCategory = 'Promocao do dia';

// Seletores DOM
const productsContainer = document.getElementById('products-container');
const tabButtons = document.querySelectorAll('.tab-btn');
const customMealSection = document.getElementById('custom-meal-section');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalValue = document.getElementById('cart-total-value');

// Modais
const quantityModal = document.getElementById('quantity-modal');
const checkoutModal = document.getElementById('checkout-modal');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminPanel = document.getElementById('admin-panel');
const mainContent = document.getElementById('main-content');

let selectedProductForModal = null;
let currentModalQty = 1;

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartCount();
    renderOrderHistory();
    setupEventListeners();
    checkSavedThemes();
});

// CONFIGURAÇÃO DE EVENTOS
function setupEventListeners() {
    // Abas do cardápio
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-category');

            if (currentCategory === 'Monte o seu prato') {
                productsContainer.classList.add('hidden');
                customMealSection.classList.remove('hidden');
            } else {
                customMealSection.classList.add('hidden');
                productsContainer.classList.remove('hidden');
                renderProducts();
            }
        });
    });

    // Carrinho Toggle
    document.getElementById('btn-cart-toggle').addEventListener('click', () => {
        renderCartItems();
        cartModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-cart').addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    // Avançar para entrega
    document.getElementById('btn-checkout-step').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        cartModal.classList.add('hidden');
        checkoutModal.classList.remove('hidden');
    });
    document.getElementById('btn-back-cart').addEventListener('click', () => {
        checkoutModal.classList.add('hidden');
        cartModal.classList.remove('hidden');
    });

    // Cálculo dinâmico prato personalizado
    const customProteina = document.getElementById('custom-proteina');
    const customExtra = document.getElementById('custom-extra');
    const customPriceDisplay = document.getElementById('custom-price-display');

    function updateCustomPrice() {
        let base = 27.90;
        const pOpt = customProteina.options[customProteina.selectedIndex];
        if (pOpt.dataset.extra) base += parseFloat(pOpt.dataset.extra);
        const eOpt = customExtra.options[customExtra.selectedIndex];
        if (eOpt.dataset.extra) base += parseFloat(eOpt.dataset.extra);
        customPriceDisplay.textContent = `R$ ${base.toFixed(2).replace('.', ',')}`;
    }
    customProteina.addEventListener('change', updateCustomPrice);
    customExtra.addEventListener('change', updateCustomPrice);

    // Adicionar Prato Personalizado
    document.getElementById('btn-add-custom').addEventListener('click', () => {
        const arroz = document.getElementById('custom-arroz').value;
        const feijao = document.getElementById('custom-feijao').value;
        const proteina = customProteina.value;
        const guarnicao = document.getElementById('custom-guarnicao').value;
        const salada = document.getElementById('custom-salada').value;
        const extra = customExtra.value;
        const obs = document.getElementById('custom-obs').value;

        let price = 27.90;
        const pOpt = customProteina.options[customProteina.selectedIndex];
        if (pOpt.dataset.extra) price += parseFloat(pOpt.dataset.extra);
        const eOpt = customExtra.options[customExtra.selectedIndex];
        if (eOpt.dataset.extra) price += parseFloat(eOpt.dataset.extra);

        const customItem = {
            id: 'custom_' + Date.now(),
            name: 'Monte o seu prato',
            details: `Arroz: ${arroz} | Feijao: ${feijao} | Proteina: ${proteina} | Guarnicao: ${guarnicao} | Salada: ${salada} | Extra: ${extra} | Obs: ${obs || 'Nenhuma'}`,
            price: price,
            quantity: 1,
            isCustom: true
        };

        cart.push(customItem);
        saveCart();
        updateCartCount();
        alert('Prato personalizado adicionado ao carrinho!');
    });

    // Modal Quantidade
    document.getElementById('qty-plus').addEventListener('click', () => { currentModalQty++; document.getElementById('qty-value').textContent = currentModalQty; });
    document.getElementById('qty-minus').addEventListener('click', () => { if (currentModalQty > 1) currentModalQty--; document.getElementById('qty-value').textContent = currentModalQty; });
    document.getElementById('btn-cancel-qty').addEventListener('click', () => quantityModal.classList.add('hidden'));
    document.getElementById('btn-confirm-add').addEventListener('click', () => {
        if (selectedProductForModal) {
            addItemToCart(selectedProductForModal, currentModalQty);
            quantityModal.classList.add('hidden');
        }
    });

    // Finalizar no WhatsApp
    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        finalizeOrderWhatsApp();
    });

    // Temas (Noturno e Contraste)
    document.getElementById('btn-darkmode').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('anossa_dark', document.body.classList.contains('dark-mode'));
    });
    document.getElementById('btn-contrast').addEventListener('click', () => {
        document.body.classList.toggle('contrast-mode');
        localStorage.setItem('anossa_contrast', document.body.classList.contains('contrast-mode'));
    });

    // Admin Navigation
    document.getElementById('btn-admin').addEventListener('click', () => {
        adminLoginModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-admin-login').addEventListener('click', () => {
        adminLoginModal.classList.add('hidden');
    });
    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;
        if (user === 'admin' && pass === 'admin123') {
            adminLoginModal.classList.add('hidden');
            mainContent.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            renderAdminProducts();
        } else {
            alert('Credenciais inválidas! Use admin / admin123');
        }
    });
    document.getElementById('btn-admin-back').addEventListener('click', () => {
        adminPanel.classList.add('hidden');
        mainContent.classList.remove('hidden');
        renderProducts();
    });
    document.getElementById('btn-admin-logout').addEventListener('click', () => {
        adminPanel.classList.add('hidden');
        mainContent.classList.remove('hidden');
        renderProducts();
    });

    // Salvar Produto no Admin
    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveAdminProduct();
    });
    document.getElementById('btn-clear-product').addEventListener('click', clearAdminForm);
}

// RENDERIZAR PRODUTOS NO CARDÁPIO
function renderProducts() {
    productsContainer.innerHTML = '';
    const filtered = products.filter(p => p.category === currentCategory && p.available);

    if (filtered.length === 0) {
        productsContainer.innerHTML = `<p class="empty-history">Nenhum produto disponível nesta categoria no momento.</p>`;
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-info">
                <span class="product-tag">${p.category}</span>
                <h3 class="product-title">${p.name}</h3>
                <p class="product-desc">${p.description}</p>
                <div class="product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
            </div>
            <img src="${p.image}" class="product-img" alt="${p.name}" onerror="this.src='https://i.imgur.com/8Q0N6c9.png'">
        `;
        card.addEventListener('click', () => {
            selectedProductForModal = p;
            currentModalQty = 1;
            document.getElementById('qty-product-name').textContent = p.name;
            document.getElementById('qty-value').textContent = 1;
            quantityModal.classList.remove('hidden');
        });
        productsContainer.appendChild(card);
    });
}

// ADICIONAR AO CARRINHO
function addItemToCart(product, qty) {
    const existing = cart.find(item => item.id === product.id && !item.isCustom);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            details: product.description,
            price: product.price,
            quantity: qty,
            isCustom: false
        });
    }
    saveCart();
    updateCartCount();
    alert(`${qty}x ${product.name} adicionado(s) ao pedido!`);
}

function updateCartCount() {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQty;
}

function saveCart() {
    localStorage.setItem('anossa_cart', JSON.stringify(cart));
}

// RENDERIZAR ITENS NO CARRINHO LATERAL
function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-history">Seu carrinho está vazio.</p>`;
        cartTotalValue.textContent = 'R$ 0,00';
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        const div = document.createElement('div');
        div.className = 'cart-item-card';
        div.innerHTML = `
            <div class="cart-item-info">
                <span>${item.name}</span>
                <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="cart-item-details">${item.details || ''}</div>
            <div class="cart-item-controls">
                <div class="qty-control-box">
                    <button onclick="changeCartQty(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeCartQty(${index}, 1)">+</button>
                </div>
                <button class="btn-remove-item" onclick="removeCartItem(${index})">Remover</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });
    cartTotalValue.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

window.changeCartQty = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    updateCartCount();
    renderCartItems();
};

window.removeCartItem = function(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCartItems();
};

// FINALIZAR PEDIDO NO WHATSAPP
function finalizeOrderWhatsApp() {
    const name = document.getElementById('client-name').value;
    const address = document.getElementById('client-address').value;
    const payment = document.getElementById('client-payment').value;
    const obs = document.getElementById('client-obs').value;

    let total = 0;
    let itemsText = cart.map(i => {
        const sub = i.price * i.quantity;
        total += sub;
        return `- ${i.quantity}x ${i.name} (${i.details || ''}) - R$ ${sub.toFixed(2)}`;
    }).join('\n');

    const message = `*NOVO PEDIDO - A NOSSA RESTAURANTE* 🍽️\n\n` +
                    `*Cliente:* ${name}\n` +
                    `*Endereço:* ${address}\n` +
                    `*Pagamento:* ${payment}\n` +
                    `*Obs:* ${obs || 'Nenhuma'}\n\n` +
                    `*Itens do Pedido:*\n${itemsText}\n\n` +
                    `*Total:* R$ ${total.toFixed(2)}`;

    // Salvar no histórico do LocalStorage
    saveOrderHistory({
        id: Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        name,
        address,
        payment,
        total: total.toFixed(2),
        items: [...cart]
    });

    // Limpar carrinho
    cart = [];
    saveCart();
    updateCartCount();
    checkoutModal.classList.add('hidden');

    // Redirecionar para API do WhatsApp (Número exemplo: 5511999999999)
    const phone = "5511999999999";
    const encodedURL = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(encodedURL, '_blank');

    renderOrderHistory();
    alert('Pedido direcionado para o WhatsApp com sucesso!');
}

// HISTÓRICO DE PEDIDOS (LOCALSTORAGE)
function saveOrderHistory(order) {
    let history = JSON.parse(localStorage.getItem('anossa_order_history')) || [];
    history.unshift(order);
    if (history.length > 5) history.pop(); // Mantém os últimos 5
    localStorage.setItem('anossa_order_history', JSON.stringify(history));
}

function renderOrderHistory() {
    const container = document.getElementById('orders-history-container');
    let history = JSON.parse(localStorage.getItem('anossa_order_history')) || [];

    if (history.length === 0) {
        container.innerHTML = `<p class="empty-history">Nenhum pedido recente registrado neste navegador.</p>`;
        return;
    }

    container.innerHTML = '';
    history.forEach(ord => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <h4>Pedido #${ord.id.toString().slice(-4)} - ${ord.date}</h4>
            <p><strong>Recebe:</strong> ${ord.name}</p>
            <p><strong>Endereço:</strong> ${ord.address}</p>
            <p><strong>Pagamento:</strong> ${ord.payment} | <strong>Total:</strong> R$ ${ord.total.replace('.', ',')}</p>
        `;
        container.appendChild(card);
    });
}

// PAINEL ADMINISTRATIVO
function renderAdminProducts() {
    const listContainer = document.getElementById('admin-products-list');
    listContainer.innerHTML = '';

    products.forEach(p => {
        const row = document.createElement('div');
        row.className = 'admin-product-row';
        row.innerHTML = `
            <div>
                <span class="product-tag">${p.category}</span>
                <strong>${p.name}</strong> - R$ ${p.price.toFixed(2).replace('.', ',')}
                <br><small style="color:var(--text-muted)">${p.available ? 'Disponível' : 'Indisponível'}</small>
            </div>
            <div class="admin-actions-group">
                <button class="nav-btn" onclick="editProduct(${p.id})">Editar</button>
                <button class="btn-danger-outline" onclick="deleteProduct(${p.id})">Excluir</button>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

function saveAdminProduct() {
    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('p-name').value;
    const desc = document.getElementById('p-desc').value;
    const price = parseFloat(document.getElementById('p-price').value);
    const category = document.getElementById('p-category').value;
    const image = document.getElementById('p-img').value || 'https://i.imgur.com/8Q0N6c9.png';
    const available = document.getElementById('p-available').checked;

    if (id) {
        // Editar
        products = products.map(p => p.id == id ? { ...p, name, description: desc, price, category, image, available } : p);
    } else {
        // Criar novo
        const newP = {
            id: Date.now(),
            name,
            description: desc,
            price,
            category,
            image,
            available
        };
        products.push(newP);
    }

    localStorage.setItem('anossa_products', JSON.stringify(products));
    clearAdminForm();
    renderAdminProducts();
    alert('Produto salvo com sucesso!');
}

window.editProduct = function(id) {
    const p = products.find(item => item.id == id);
    if (!p) return;
    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-desc').value = p.description;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-img').value = p.image;
    document.getElementById('p-available').checked = p.available;
    document.getElementById('admin-form-title').textContent = 'Editar Produto';
};

window.deleteProduct = function(id) {
    if (confirm('Deseja realmente excluir este produto?')) {
        products = products.filter(item => item.id != id);
        localStorage.setItem('anossa_products', JSON.stringify(products));
        renderAdminProducts();
    }
};

function clearAdminForm() {
    document.getElementById('edit-product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('admin-form-title').textContent = 'Cadastrar Novo Produto';
}

function checkSavedThemes() {
    if (localStorage.getItem('anossa_dark') === 'true') {
        document.body.classList.add('dark-mode');
    }
    if (localStorage.getItem('anossa_contrast') === 'true') {
        document.body.classList.add('contrast-mode');
    }
}