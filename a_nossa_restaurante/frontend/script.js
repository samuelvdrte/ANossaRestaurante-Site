const DEFAULT_PRODUCTS = [
            {
                id: 1,
                name: "Prato Executivo Frango Grelhado",
                description: "File de frango grelhado suculento, arroz branco soltinho, feijao carioca, batata frita e salada da casa.",
                price: 28.90,
                category: "Promocao do dia",
                image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80",
                available: true
            },
            {
                id: 2,
                name: "Marmita G - Bife Acebolado",
                description: "Bife de alcatra macio com cebolas douradas, arroz, feijao preto e farofa artesanal temperada.",
                price: 32.00,
                category: "Cardapio normal",
                image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
                available: true
            },
            {
                id: 3,
                name: "Strogonoff de Frango Especial",
                description: "Strogonoff cremoso com peito de frango em cubos, cogumelos, arroz e batata palha super crocante.",
                price: 29.90,
                category: "Promocao do dia",
                image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80",
                available: true
            },
            {
                id: 4,
                name: "Feijoada Completa Individual",
                description: "Feijoada tradicional rica em carnes nobres, acompanhada de couve refogada, farofa, arroz e laranja.",
                price: 38.50,
                category: "Cardapio normal",
                image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80",
                available: true
            },
            {
                id: 5,
                name: "Suco Natural Laranja 500ml",
                description: "Suco 100% natural espremido na hora, sem adicao de agua ou acucar.",
                price: 9.50,
                category: "Bebidas",
                image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80",
                available: true
            },
            {
                id: 6,
                name: "Refrigerante Lata 350ml",
                description: "Lata bem gelada. Opcoes: Coca-Cola, Guaraná Antarctica ou Fanta.",
                price: 6.50,
                category: "Bebidas",
                image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
                available: true
            },
            {
                id: 7,
                name: "Pudim de Leite Condensado",
                description: "Fatia generosa de pudim super cremoso com calda de caramelo caseira.",
                price: 11.00,
                category: "Sobremesas",
                image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&w=400&q=80",
                available: true
            },
            {
                id: 8,
                name: "Mousse de Maracuja Artesanal",
                description: "Mousse leve e aerado com calda natural de maracuja e sementes crocantes.",
                price: 10.00,
                category: "Sobremesas",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
                available: true
            }
        ];

        /* APPLICATION STATE */
        let products = JSON.parse(localStorage.getItem('anossa_products')) || DEFAULT_PRODUCTS;
        let cart = JSON.parse(localStorage.getItem('anossa_cart')) || [];
        let currentCategory = 'Promocao do dia';
        let activeProductForModal = null;
        let modalQty = 1;

        window.addEventListener('DOMContentLoaded', () => {
            initSavedPreferences();
            renderProducts();
            updateCartUI();
            renderOrderHistory();
            calculateCustomMealPrice();
        });

        /* TOAST NOTIFICATION SYSTEM */
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-brand-500';
            
            toast.className = `${bgColor} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center justify-between gap-3 pointer-events-auto animate-fade-in`;
            toast.innerHTML = `
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white font-extrabold">&times;</button>
            `;
            container.appendChild(toast);
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 3500);
        }

        /* CUSTOM CONFIRM DIALOG */
        function customConfirm(title, message, onConfirm) {
            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            
            const btnYes = document.getElementById('confirm-btn-yes');
            const btnNo = document.getElementById('confirm-btn-no');

            const close = () => modal.classList.add('hidden');

            btnYes.onclick = () => {
                close();
                onConfirm();
            };
            btnNo.onclick = close;

            modal.classList.remove('hidden');
        }

        /* THEME & ACCESSIBILITY HANDLERS */
        function initSavedPreferences() {
            if (localStorage.getItem('anossa_dark') === 'true') {
                document.documentElement.classList.add('dark');
            }
            if (localStorage.getItem('anossa_contrast') === 'true') {
                document.body.classList.add('high-contrast');
            }
        }

        function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('anossa_dark', isDark);
            showToast(isDark ? 'Modo Noturno ativado' : 'Modo Claro ativado', 'info');
        }

        function toggleHighContrast() {
            document.body.classList.toggle('high-contrast');
            const isContrast = document.body.classList.contains('high-contrast');
            localStorage.setItem('anossa_contrast', isContrast);
            showToast(isContrast ? 'Alto Contraste ativado' : 'Alto Contraste desativado', 'info');
        }

        /* CATEGORY SWITCHING */
        function switchCategory(category) {
            currentCategory = category;
            
            // Update active tab buttons styling
            document.querySelectorAll('.tab-btn').forEach(btn => {
                const cat = btn.getAttribute('data-cat');
                if (cat === category) {
                    btn.className = "tab-btn active px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 bg-brand-500 text-white shadow-md shadow-brand-500/20";
                } else {
                    btn.className = "tab-btn px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-brand-500";
                }
            });

            const grid = document.getElementById('products-grid');
            const customSection = document.getElementById('custom-meal-section');

            if (category === 'Monte o seu prato') {
                grid.classList.add('hidden');
                customSection.classList.remove('hidden');
            } else {
                customSection.classList.add('hidden');
                grid.classList.remove('hidden');
                renderProducts();
            }
        }

        function renderProducts() {
            const container = document.getElementById('products-grid');
            container.innerHTML = '';

            const filtered = products.filter(p => p.category === currentCategory && p.available);

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-2">
                        <p class="text-gray-500 dark:text-gray-400 font-bold text-sm">Nenhum item disponível nesta categoria no momento.</p>
                    </div>
                `;
                return;
            }

            filtered.forEach(product => {
                const card = document.createElement('div');
                card.className = "group bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm hover:shadow-xl flex flex-col justify-between cursor-pointer space-y-3";
                card.onclick = () => openQtyModal(product);

                card.innerHTML = `
                    <div class="space-y-3">
                        <div class="relative w-full h-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'">
                            <span class="badge-tag absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase text-brand-600 dark:text-brand-400">
                                ${product.category}
                            </span>
                        </div>
                        <div class="space-y-1">
                            <h4 class="font-extrabold text-base text-gray-900 dark:text-white leading-snug group-hover:text-brand-500 transition-colors">
                                ${product.name}
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                ${product.description}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span class="text-lg font-black text-brand-600 dark:text-brand-400">
                            R$ ${product.price.toFixed(2).replace('.', ',')}
                        </span>
                        <button class="p-2 rounded-xl bg-brand-50 dark:bg-gray-800 text-brand-600 dark:text-brand-400 font-bold text-xs group-hover:bg-brand-500 group-hover:text-white transition-all">
                            + Adicionar
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function calculateCustomMealPrice() {
            let total = 27.90; // Base price
            
            const proteinaSelect = document.getElementById('cm-proteina');
            const extraSelect = document.getElementById('cm-extra');

            const pPrice = parseFloat(proteinaSelect.options[proteinaSelect.selectedIndex]?.dataset.price || 0);
            const ePrice = parseFloat(extraSelect.options[extraSelect.selectedIndex]?.dataset.price || 0);

            total += pPrice + ePrice;

            document.getElementById('custom-meal-price').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            return total;
        }

        function addCustomMealToCart() {
            const arroz = document.getElementById('cm-arroz').value;
            const feijao = document.getElementById('cm-feijao').value;
            const proteina = document.getElementById('cm-proteina').value;
            const guarnicao = document.getElementById('cm-guarnicao').value;
            const salada = document.getElementById('cm-salada').value;
            const extra = document.getElementById('cm-extra').value;
            const obs = document.getElementById('cm-obs').value.trim();

            const price = calculateCustomMealPrice();

            const customItem = {
                id: 'custom_' + Date.now(),
                name: 'Prato Personalizado Montado',
                description: `${arroz}, ${feijao}, ${proteina}, ${guarnicao}, ${salada}, Extra: ${extra}` + (obs ? ` | Obs: ${obs}` : ''),
                price: price,
                quantity: 1,
                isCustom: true
            };

            cart.push(customItem);
            saveCart();
            updateCartUI();
            showToast('Prato personalizado adicionado ao carrinho!');
        }

        /* QUANTITY SELECTION MODAL LOGIC */
        function openQtyModal(product) {
            activeProductForModal = product;
            modalQty = 1;
            document.getElementById('qty-product-name').textContent = product.name;
            document.getElementById('qty-product-price').textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
            document.getElementById('qty-modal-value').textContent = modalQty;
            document.getElementById('qty-modal').classList.remove('hidden');
        }

        function closeQtyModal() {
            document.getElementById('qty-modal').classList.add('hidden');
            activeProductForModal = null;
        }

        function adjustQtyModal(delta) {
            if (modalQty + delta >= 1) {
                modalQty += delta;
                document.getElementById('qty-modal-value').textContent = modalQty;
            }
        }

        function confirmAddToCart() {
            if (!activeProductForModal) return;

            const existingIndex = cart.findIndex(item => item.id === activeProductForModal.id && !item.isCustom);
            
            if (existingIndex > -1) {
                cart[existingIndex].quantity += modalQty;
            } else {
                cart.push({
                    id: activeProductForModal.id,
                    name: activeProductForModal.name,
                    description: activeProductForModal.description,
                    price: activeProductForModal.price,
                    quantity: modalQty,
                    isCustom: false
                });
            }

            saveCart();
            updateCartUI();
            closeQtyModal();
            showToast(`${modalQty}x ${activeProductForModal.name} adicionado(s) ao pedido!`);
        }

        function saveCart() {
            localStorage.setItem('anossa_cart', JSON.stringify(cart));
        }

        function updateCartUI() {
            const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
            document.getElementById('cart-badge').textContent = totalItems;

            const container = document.getElementById('cart-items-container');
            container.innerHTML = '';

            if (cart.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-16 space-y-3">
                        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                            🛒
                        </div>
                        <p class="text-sm font-bold text-gray-500">Seu carrinho está vazio</p>
                    </div>
                `;
                document.getElementById('cart-total-price').textContent = 'R$ 0,00';
                return;
            }

            let grandTotal = 0;

            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                grandTotal += itemTotal;

                const itemCard = document.createElement('div');
                itemCard.className = "bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/60 space-y-2";
                itemCard.innerHTML = `
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <h5 class="font-extrabold text-sm text-gray-900 dark:text-white">${item.name}</h5>
                            <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2 mt-0.5">${item.description}</p>
                        </div>
                        <span class="font-black text-sm text-brand-600 dark:text-brand-400 whitespace-nowrap">
                            R$ ${itemTotal.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <div class="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1 bg-white dark:bg-gray-900">
                            <button onclick="updateCartItemQty(${index}, -1)" class="font-black text-xs text-gray-600 dark:text-gray-300 hover:text-brand-500 px-1.5">-</button>
                            <span class="text-xs font-bold w-4 text-center">${item.quantity}</span>
                            <button onclick="updateCartItemQty(${index}, 1)" class="font-black text-xs text-gray-600 dark:text-gray-300 hover:text-brand-500 px-1.5">+</button>
                        </div>
                        <button onclick="removeCartItem(${index})" class="text-xs font-bold text-red-500 hover:underline">
                            Remover
                        </button>
                    </div>
                `;
                container.appendChild(itemCard);
            });

            document.getElementById('cart-total-price').textContent = `R$ ${grandTotal.toFixed(2).replace('.', ',')}`;
        }

        function updateCartItemQty(index, delta) {
            if (cart[index].quantity + delta >= 1) {
                cart[index].quantity += delta;
            } else {
                cart.splice(index, 1);
            }
            saveCart();
            updateCartUI();
        }

        function removeCartItem(index) {
            cart.splice(index, 1);
            saveCart();
            updateCartUI();
            showToast('Item removido do carrinho', 'info');
        }

        function toggleCartModal(open) {
            const modal = document.getElementById('cart-modal');
            if (open) {
                updateCartUI();
                modal.classList.remove('hidden');
            } else {
                modal.classList.add('hidden');
            }
        }

        /* CHECKOUT & WHATSAPP INTEGRATION */
        function openCheckoutModal() {
            if (cart.length === 0) {
                showToast('Adicione pelo menos um item ao carrinho antes de continuar!', 'info');
                return;
            }
            
            const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            document.getElementById('chk-total-display').textContent = `R$ ${grandTotal.toFixed(2).replace('.', ',')}`;

            toggleCartModal(false);
            document.getElementById('checkout-modal').classList.remove('hidden');
        }

        function closeCheckoutModal() {
            document.getElementById('checkout-modal').classList.add('hidden');
        }

        function handleCheckoutSubmit(e) {
            e.preventDefault();

            const name = document.getElementById('chk-name').value.trim();
            const address = document.getElementById('chk-address').value.trim();
            const payment = document.getElementById('chk-payment').value;
            const obs = document.getElementById('chk-obs').value.trim();

            let grandTotal = 0;
            let itemsFormatted = cart.map(item => {
                const sub = item.price * item.quantity;
                grandTotal += sub;
                return `• *${item.quantity}x ${item.name}*\n  _${item.description}_\n  Subtotal: R$ ${sub.toFixed(2).replace('.', ',')}`;
            }).join('\n\n');

            const message = `*NOVO PEDIDO - A NOSSA RESTAURANTE* 🍽️\n` +
                            `----------------------------------\n` +
                            `*Cliente:* ${name}\n` +
                            `*Endereço:* ${address}\n` +
                            `*Pagamento:* ${payment}\n` +
                            (obs ? `*Observações:* ${obs}\n` : '') +
                            `----------------------------------\n` +
                            `*ITENS DO PEDIDO:*\n\n${itemsFormatted}\n\n` +
                            `----------------------------------\n` +
                            `*VALOR TOTAL:* R$ ${grandTotal.toFixed(2).replace('.', ',')}`;

            // Save order to history
            const orderRecord = {
                id: Date.now(),
                date: new Date().toLocaleString('pt-BR'),
                clientName: name,
                address: address,
                payment: payment,
                total: grandTotal.toFixed(2),
                itemsCount: cart.reduce((sum, item) => sum + item.quantity, 0)
            };

            saveOrderHistory(orderRecord);

            // Clear Cart
            cart = [];
            saveCart();
            updateCartUI();
            closeCheckoutModal();

            // Open WhatsApp API
            const phone = "5511999999999"; // Replace with store WhatsApp
            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');

            showToast('Pedido gerado! Conclua o envio no WhatsApp.');
            renderOrderHistory();
        }

        /* ORDER HISTORY LOGIC */
        function saveOrderHistory(order) {
            let history = JSON.parse(localStorage.getItem('anossa_order_history')) || [];
            history.unshift(order);
            if (history.length > 6) history.pop();
            localStorage.setItem('anossa_order_history', JSON.stringify(history));
        }

        function renderOrderHistory() {
            const container = document.getElementById('order-history-grid');
            let history = JSON.parse(localStorage.getItem('anossa_order_history')) || [];

            if (history.length === 0) {
                container.innerHTML = `
                    <p class="text-xs text-gray-400 italic col-span-full">Nenhum pedido recente registrado neste navegador.</p>
                `;
                return;
            }

            container.innerHTML = '';
            history.forEach(ord => {
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2 shadow-sm";
                card.innerHTML = `
                    <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                        <span class="text-xs font-black text-brand-600 dark:text-brand-400">#${ord.id.toString().slice(-4)}</span>
                        <span class="text-[10px] font-bold text-gray-400">${ord.date}</span>
                    </div>
                    <div class="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                        <p><strong>Cliente:</strong> ${ord.clientName}</p>
                        <p class="truncate"><strong>Endereço:</strong> ${ord.address}</p>
                        <p><strong>Pagamento:</strong> ${ord.payment}</p>
                    </div>
                    <div class="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 text-xs">
                        <span class="font-semibold text-gray-500">${ord.itemsCount} item(ns)</span>
                        <span class="font-extrabold text-emerald-600 dark:text-emerald-400">R$ ${parseFloat(ord.total).toFixed(2).replace('.', ',')}</span>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function clearOrderHistory() {
            customConfirm('Limpar Histórico', 'Deseja apagar o histórico de pedidos deste navegador?', () => {
                localStorage.removeItem('anossa_order_history');
                renderOrderHistory();
                showToast('Histórico apagado', 'info');
            });
        }

        function openAdminModal() {
            document.getElementById('admin-login-modal').classList.remove('hidden');
        }

        function closeAdminLoginModal() {
            document.getElementById('admin-login-modal').classList.add('hidden');
        }

        function handleAdminLogin(e) {
            e.preventDefault();
            const u = document.getElementById('admin-user-input').value.trim();
            const p = document.getElementById('admin-pass-input').value.trim();

            if (u === 'admin' && p === 'admin123') {
                closeAdminLoginModal();
                document.getElementById('app-main').classList.add('hidden');
                document.getElementById('app-admin').classList.remove('hidden');
                renderAdminProducts();
                showToast('Bem-vindo ao Painel Administrativo!');
            } else {
                showToast('Usuário ou senha inválidos!', 'error');
            }
        }

        function closeAdminPanel() {
            document.getElementById('app-admin').classList.add('hidden');
            document.getElementById('app-main').classList.remove('hidden');
            renderProducts();
        }

        function logoutAdmin() {
            closeAdminPanel();
            showToast('Sessão encerrada com sucesso', 'info');
        }

        function renderAdminProducts() {
            const container = document.getElementById('admin-products-container');
            document.getElementById('admin-count').textContent = `${products.length} itens`;
            container.innerHTML = '';

            products.forEach(p => {
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4 shadow-sm";
                card.innerHTML = `
                    <div class="flex items-center gap-3">
                        <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-800" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'">
                        <div>
                            <div class="flex items-center gap-2">
                                <h5 class="font-extrabold text-sm text-gray-900 dark:text-white">${p.name}</h5>
                                <span class="px-2 py-0.5 text-[10px] font-black rounded ${p.available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-600'}">
                                    ${p.available ? 'Ativo' : 'Indisponível'}
                                </span>
                            </div>
                            <p class="text-xs text-gray-500">${p.category} • R$ ${p.price.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="editAdminProduct(${p.id})" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
                            Editar
                        </button>
                        <button onclick="deleteAdminProduct(${p.id})" class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 text-xs font-bold hover:bg-red-100">
                            Excluir
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function handleProductSubmit(e) {
            e.preventDefault();

            const id = document.getElementById('admin-p-id').value;
            const name = document.getElementById('admin-p-name').value.trim();
            const desc = document.getElementById('admin-p-desc').value.trim();
            const price = parseFloat(document.getElementById('admin-p-price').value);
            const category = document.getElementById('admin-p-category').value;
            const image = document.getElementById('admin-p-image').value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
            const available = document.getElementById('admin-p-available').checked;

            if (id) {
                // Update
                products = products.map(p => p.id == id ? { ...p, name, description: desc, price, category, image, available } : p);
                showToast('Produto atualizado!');
            } else {
                // Create
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
                showToast('Novo produto cadastrado!');
            }

            localStorage.setItem('anossa_products', JSON.stringify(products));
            clearAdminForm();
            renderAdminProducts();
        }

        function editAdminProduct(id) {
            const p = products.find(item => item.id == id);
            if (!p) return;

            document.getElementById('admin-p-id').value = p.id;
            document.getElementById('admin-p-name').value = p.name;
            document.getElementById('admin-p-desc').value = p.description;
            document.getElementById('admin-p-price').value = p.price;
            document.getElementById('admin-p-category').value = p.category;
            document.getElementById('admin-p-image').value = p.image;
            document.getElementById('admin-p-available').checked = p.available;

            document.getElementById('admin-form-title').textContent = 'Editar Produto';
        }

        function deleteAdminProduct(id) {
            customConfirm('Excluir Produto', 'Deseja remover permanentemente este produto do cardápio?', () => {
                products = products.filter(p => p.id != id);
                localStorage.setItem('anossa_products', JSON.stringify(products));
                renderAdminProducts();
                showToast('Produto excluído com sucesso', 'info');
            });
        }

        function clearAdminForm() {
            document.getElementById('admin-p-id').value = '';
            document.getElementById('admin-product-form').reset();
            document.getElementById('admin-form-title').textContent = 'Cadastrar Novo Produto';
        }
