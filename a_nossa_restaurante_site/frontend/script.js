const API_URL = 'http://localhost:3000/api';

const defaultProducts = [
    {
        id: 1,
        name: "Prato Executivo Frango Grelhado",
        description: "Suculento filé de frango grelhado acompanhado de arroz branco, feijão carioca, batata frita crocante e salada fresca.",
        allergenInfo: "Contém carne branca • Sem glúten",
        tagDestaque: "Mais vendido",
        price: 30.00,
        category: "Promoção do dia",
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80",
        available: true
    },
    {
        id: 2,
        name: "Marmita G - Carne Assada",
        description: "Generosa porção de carne assada ao molho ferrugem com mandioca cozida, arroz e feijão.",
        allergenInfo: "Contém carne bovina",
        tagDestaque: "Promoção",
        price: 32.00,
        category: "Cardápio normal",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        available: true
    },
    {
        id: 3,
        name: "Executivo Omelete Especial",
        description: "Omelete recheada com queijo, tomate e ervas finas, servida com arroz integral, feijão e legumes no vapor.",
        allergenInfo: "Opção Vegetariana • Contém ovos e derivados de leite",
        tagDestaque: "Vegetariano",
        price: 22.90,
        category: "Cardápio normal",
        image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
        available: true
    },
    {
        id: 4,
        name: "Strogonoff de Cogumelos",
        description: "Combinação cremosa de shimeji e paris com molho artesanal, acompanha arroz soltinho e batata palha.",
        allergenInfo: "Opção Vegetariana • Contém laticínios",
        tagDestaque: "Vegetariano / Especial",
        price: 28.50,
        category: "Cardápio normal",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        available: true
    },
    {
        id: 5,
        name: "Suco Natural de Laranja 500ml",
        description: "Suco de laranja 100% natural, espremido na hora sem adição de água ou açúcar.",
        allergenInfo: "Sem glúten • 100% Natural",
        tagDestaque: "Especial",
        price: 9.00,
        category: "Bebidas",
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
        available: true
    },
    {
        id: 6,
        name: "Pudim de Leite Condensado",
        description: "Fatia generosa de pudim tradicional super cremoso com calda de caramelo caseira.",
        allergenInfo: "Contém laticínios e ovos",
        tagDestaque: "Mais vendido",
        price: 10.00,
        category: "Sobremesas",
        image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&w=600&q=80",
        available: true
    }
];

let products = defaultProducts;
let cart = JSON.parse(localStorage.getItem('anossa_cart')) || [];
let currentCategory = 'Promoção do dia';
let currentUploadedImageBase64 = '';

const productsContainer = document.getElementById('products-container');
const tabButtons = document.querySelectorAll('.tab-btn');
const customMealSection = document.getElementById('custom-meal-section');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalValue = document.getElementById('cart-total-value');
const toastNotification = document.getElementById('toast-notification');

const quantityModal = document.getElementById('quantity-modal');
const checkoutModal = document.getElementById('checkout-modal');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminPanel = document.getElementById('admin-panel');
const mainContent = document.getElementById('main-content');

let selectedProductForModal = null;
let currentModalQty = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
    renderOrderHistory();
    setupEventListeners();
    checkSavedThemes();
});

async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/produtos`);
        if (res.ok) {
            products = await res.json();
        }
    } catch (e) {
        products = JSON.parse(localStorage.getItem('anossa_products')) || defaultProducts;
    }
    renderProducts();
}

function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
        toastNotification.classList.add('hidden');
    }, 3000);
}

function setupEventListeners() {
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

    document.getElementById('btn-cart-toggle').addEventListener('click', () => {
        renderCartItems();
        cartModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-cart').addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    document.getElementById('btn-checkout-step').addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('Seu carrinho está vazio!');
            return;
        }
        cartModal.classList.add('hidden');
        checkoutModal.classList.remove('hidden');
    });
    document.getElementById('btn-back-cart').addEventListener('click', () => {
        checkoutModal.classList.add('hidden');
        cartModal.classList.remove('hidden');
    });

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
            name: 'Marmita Personalizada',
            details: `${arroz} | ${feijao} | ${proteina} | ${guarnicao} | ${salada} | Extra: ${extra}${obs ? ' | Obs: ' + obs : ''}`,
            price: price,
            quantity: 1,
            isCustom: true
        };

        cart.push(customItem);
        saveCart();
        updateCartCount();
        showToast('Prato personalizado adicionado ao carrinho!');
    });

    document.getElementById('qty-plus').addEventListener('click', () => { currentModalQty++; document.getElementById('qty-value').textContent = currentModalQty; });
    document.getElementById('qty-minus').addEventListener('click', () => { if (currentModalQty > 1) currentModalQty--; document.getElementById('qty-value').textContent = currentModalQty; });
    document.getElementById('btn-cancel-qty').addEventListener('click', () => quantityModal.classList.add('hidden'));
    document.getElementById('btn-confirm-add').addEventListener('click', () => {
        if (selectedProductForModal) {
            addItemToCart(selectedProductForModal, currentModalQty);
            quantityModal.classList.add('hidden');
        }
    });

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        finalizeOrderWhatsApp();
    });

    document.getElementById('btn-darkmode').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('anossa_dark', document.body.classList.contains('dark-mode'));
    });
    document.getElementById('btn-contrast').addEventListener('click', () => {
        document.body.classList.toggle('contrast-mode');
        localStorage.setItem('anossa_contrast', document.body.classList.contains('contrast-mode'));
    });

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
            showToast('Credenciais inválidas! Use admin / admin123');
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

    const fileInput = document.getElementById('p-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const imgPreviewContainer = document.getElementById('img-preview-container');
    const imgPreview = document.getElementById('img-preview');
    const urlInput = document.getElementById('p-img-url');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(event) {
                currentUploadedImageBase64 = event.target.result;
                imgPreview.src = currentUploadedImageBase64;
                imgPreviewContainer.classList.remove('hidden');
                urlInput.value = ''; 
            };
            reader.readAsDataURL(file);
        }
    });

    urlInput.addEventListener('input', (e) => {
        if (e.target.value) {
            currentUploadedImageBase64 = '';
            fileInput.value = '';
            fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
            imgPreview.src = e.target.value;
            imgPreviewContainer.classList.remove('hidden');
        }
    });

    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveAdminProduct();
    });
    document.getElementById('btn-clear-product').addEventListener('click', clearAdminForm);
}

function renderProducts() {
    productsContainer.innerHTML = '';
    const filtered = products.filter(p => p.category === currentCategory && p.available);

    if (filtered.length === 0) {
        productsContainer.innerHTML = `<p class="empty-history">Nenhum produto disponível nesta categoria no momento.</p>`;
        return;
    }

    filtered.forEach(p => {
        const tagDestaqueHTML = p.tagDestaque ? `<span class="product-tag ${p.tagDestaque.includes('Vegetariano') ? 'product-tag-highlight' : ''}">${p.tagDestaque}</span>` : '';
        const allergenHTML = p.allergenInfo ? `<div class="product-allergen">${p.allergenInfo}</div>` : '';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-info">
                <div class="product-tags-wrapper">
                    <span class="product-tag">${p.category}</span>
                    ${tagDestaqueHTML}
                </div>
                <h3 class="product-title">${p.name}</h3>
                <p class="product-desc">${p.description}</p>
                ${allergenHTML}
                <div class="product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
            </div>
            <img src="${p.image}" class="product-img" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'">
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
    showToast(`${qty}x ${product.name} adicionado(s) ao carrinho!`);
}

function updateCartCount() {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQty;
}

function saveCart() {
    localStorage.setItem('anossa_cart', JSON.stringify(cart));
}

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

async function finalizeOrderWhatsApp() {
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

    const message = `*NOVO PEDIDO - A NOSSA RESTAURANTE*\n\n` +
                    `👤 *Cliente:* ${name}\n` +
                    `📍 *Endereço:* ${address}\n` +
                    `💳 *Pagamento:* ${payment}\n` +
                    `📝 *Obs:* ${obs || 'Nenhuma'}\n\n` +
                    `🛒 *Itens do Pedido:*\n${itemsText}\n\n` +
                    `💰 *Total:* R$ ${total.toFixed(2)}`;

    const orderData = {
        id: Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        name,
        address,
        payment,
        total: total.toFixed(2),
        items: [...cart]
    };

    saveOrderHistory(orderData);

    try {
        await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
    } catch (e) {
        console.error("Erro ao sincronizar com o backend", e);
    }

    cart = [];
    saveCart();
    updateCartCount();
    checkoutModal.classList.add('hidden');

    const phone = "5511999999999";
    const encodedURL = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(encodedURL, '_blank');

    renderOrderHistory();
    showToast('Pedido direcionado para o WhatsApp com sucesso!');
}

function saveOrderHistory(order) {
    let history = JSON.parse(localStorage.getItem('anossa_order_history')) || [];
    history.unshift(order);
    if (history.length > 5) history.pop(); 
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
        const itemsSummary = ord.items ? ord.items.map(i => `<li>${i.quantity}x ${i.name}</li>`).join('') : '';

        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div>
                <h4>Pedido #${ord.id.toString().slice(-4)} - ${ord.date}</h4>
                <p><strong>Cliente:</strong> ${ord.name}</p>
                <p><strong>Endereço:</strong> ${ord.address}</p>
                <p><strong>Pagamento:</strong> ${ord.payment}</p>
                <ul class="history-items-list">${itemsSummary}</ul>
                <p><strong>Total:</strong> R$ ${ord.total.replace('.', ',')}</p>
            </div>
            <button class="btn-reorder" onclick="reorderPastOrder(${ord.id})">🔁 Pedir Novamente</button>
        `;
        container.appendChild(card);
    });
}

window.reorderPastOrder = function(orderId) {
    let history = JSON.parse(localStorage.getItem('anossa_order_history')) || [];
    const pastOrder = history.find(o => o.id === orderId);

    if (pastOrder && pastOrder.items && pastOrder.items.length > 0) {
        cart = [...pastOrder.items];
        saveCart();
        updateCartCount();
        renderCartItems();
        cartModal.classList.remove('hidden');
        showToast('Itens do pedido anterior adicionados ao carrinho!');
    } else {
        showToast('Não foi possível carregar o pedido anterior.');
    }
};

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
                <br><small style="color:var(--text-muted)">${p.available ? '🟢 Disponível' : '🔴 Indisponível'}</small>
            </div>
            <div class="admin-actions-group">
                <button class="nav-btn" onclick="editProduct(${p.id})">Editar</button>
                <button class="btn-danger-outline" onclick="deleteProduct(${p.id})">Excluir</button>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

async function saveAdminProduct() {
    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('p-name').value;
    const desc = document.getElementById('p-desc').value;
    const price = parseFloat(document.getElementById('p-price').value);
    const category = document.getElementById('p-category').value;
    const tagDestaque = document.getElementById('p-tag-destaque').value;
    const allergenInfo = document.getElementById('p-restricoes').value;
    const urlImage = document.getElementById('p-img-url').value;
    const available = document.getElementById('p-available').checked;

    const finalImage = currentUploadedImageBase64 || urlImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

    const payload = { name, description: desc, price, category, tagDestaque, allergenInfo, image: finalImage, available };

    try {
        if (id) {
            await fetch(`${API_URL}/produtos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
    } catch (e) {
        console.error("Modo offline / erro na API:", e);
    }

    await loadProducts();
    clearAdminForm();
    renderAdminProducts();
    showToast('Produto salvo com sucesso!');
}

window.editProduct = function(id) {
    const p = products.find(item => item.id == id);
    if (!p) return;
    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-desc').value = p.description;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-tag-destaque').value = p.tagDestaque || '';
    document.getElementById('p-restricoes').value = p.allergenInfo || '';
    document.getElementById('p-available').checked = p.available;

    if (p.image && p.image.startsWith('data:image')) {
        currentUploadedImageBase64 = p.image;
        document.getElementById('p-img-url').value = '';
        document.getElementById('file-name-display').textContent = 'Imagem Base64 carregada';
    } else {
        currentUploadedImageBase64 = '';
        document.getElementById('p-img-url').value = p.image;
        document.getElementById('file-name-display').textContent = 'Nenhum arquivo selecionado';
    }

    document.getElementById('img-preview').src = p.image;
    document.getElementById('img-preview-container').classList.remove('hidden');
    document.getElementById('admin-form-title').textContent = 'Editar Produto';
};

window.deleteProduct = async function(id) {
    try {
        await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
    } catch (e) {
        console.error("Erro na API ao excluir:", e);
    }
    await loadProducts();
    renderAdminProducts();
    showToast('Produto removido com sucesso!');
};

function clearAdminForm() {
    document.getElementById('edit-product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('file-name-display').textContent = 'Nenhum arquivo selecionado';
    document.getElementById('img-preview-container').classList.add('hidden');
    document.getElementById('img-preview').src = '';
    currentUploadedImageBase64 = '';
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
