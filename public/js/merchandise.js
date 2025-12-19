// public/js/merchandise.js

document.addEventListener('DOMContentLoaded', () => {
    loadMerchandise();
    setupCheckoutListeners(); 
});

let availableProducts = []; 

async function loadMerchandise() {
    const listContainer = document.getElementById('merchandiseList');
    listContainer.innerHTML = '<p class="text-center w-100">Memuat daftar produk...</p>';
    
    const apiUrl = '/api/merch/products'; 

    try {
        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Gagal mengambil data merchandise dari server.');
        }

        availableProducts = result.data; 
        listContainer.innerHTML = ''; 

        if (availableProducts.length === 0) {
            listContainer.innerHTML = '<p class="text-center w-100">Belum ada *merchandise* yang tersedia saat ini.</p>';
            return;
        }

        availableProducts.forEach(item => {
            const price = parseFloat(item.price).toLocaleString('id-ID');
            const merchImagePath = item.imageUrl 
                ? `/images/merch/${item.imageUrl}` 
                : '/images/default_merch.jpg'; 
            
            // GANTI BAGIAN ITEM HTML INI:
            const itemHtml = `
                <div class="col">
                    <div class="merch-card"> <div class="merch-img-wrapper"> <img src="${merchImagePath}" alt="${item.name}">
                            <span class="badge-stok">Ready Stock</span>
                        </div>
                        
                        <div class="merch-body">
                            <h5 class="merch-title" title="${item.name}">${item.name}</h5>
                            <p class="merch-desc">
                                ${item.description ? item.description.substring(0, 80) : 'Tidak ada deskripsi'}...
                            </p>
                            
                            <div class="mt-auto"> <span class="merch-price">Rp ${price}</span>
                                <button class="btn-beli buy-btn" 
                                        data-id="${item.id}" 
                                        data-name="${item.name}" 
                                        data-price="${item.price}">
                                    <i class="fa-solid fa-cart-shopping me-2"></i> Beli Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHtml);
        });

    } catch (error) {
        console.error("Error loading merchandise:", error);
        listContainer.innerHTML = `<p class="text-center w-100 text-danger">Gagal memuat produk. Error: ${error.message}</p>`;
    }
}

// =========================================================
// FITUR CHECKOUT & PERHITUNGAN
// =========================================================

function setupCheckoutListeners() {
    const checkoutModalElement = document.getElementById('checkoutModal');
    const checkoutQuantityInput = document.getElementById('checkoutQuantity');
    const shippingModeSelect = document.getElementById('shippingMode');
    const checkoutForm = document.getElementById('checkoutForm');
    const listContainer = document.getElementById('merchandiseList');

    // 1. LISTENER KLIK TOMBOL 'BELI SEKARANG'
    listContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('buy-btn')) {
            const btn = e.target;
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);

            // Isi data awal modal
            document.getElementById('checkoutProductName').textContent = name;
            document.getElementById('checkoutProductId').value = id;
            document.getElementById('checkoutPriceAtSale').value = price;
            document.getElementById('checkoutQuantity').value = 1;
            
            // Set default shipping mode
            if(shippingModeSelect) shippingModeSelect.value = 'pribadi';

            updateCheckoutCalculations(); // Hitung total awal

            const myModal = new bootstrap.Modal(checkoutModalElement);
            myModal.show();
        }
    });

    // 2. LISTENER PERUBAHAN INPUT (QUANTITY & SHIPPING)
    if (checkoutQuantityInput) {
        checkoutQuantityInput.addEventListener('input', updateCheckoutCalculations);
    }
    if (shippingModeSelect) {
        shippingModeSelect.addEventListener('change', updateCheckoutCalculations);
    }

    // 3. LISTENER SUBMIT FORM CHECKOUT
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const quantity = parseInt(document.getElementById('checkoutQuantity').value);
        const productId = document.getElementById('checkoutProductId').value;
        const priceAtSale = parseFloat(document.getElementById('checkoutPriceAtSale').value);
        
        // Ambil Ongkir dari teks (hapus karakter non-angka)
        const shippingCostText = document.getElementById('displayShipping').innerText;
        const shippingCost = parseFloat(shippingCostText.replace(/[^0-9]/g, ''));

        // Data Transaksi Lengkap untuk Sinkronisasi ke Master Tujuan Admin
        const transactionData = {
            items: [{
                product_id: productId,
                quantity: quantity,
                price_at_sale: priceAtSale
            }],
            customer_name: document.getElementById('customerName').value,
            customer_address: document.getElementById('customerAddress').value,
            customer_phone: document.getElementById('customerPhone').value,
            shipping_mode: document.getElementById('shippingMode').value,
            shipping_cost: shippingCost
        };

        try {
            const response = await fetch('/api/merch/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });
            
            const result = await response.json();

            if (response.ok) {
                bootstrap.Modal.getInstance(checkoutModalElement).hide();
                alert(`✅ Checkout Berhasil!\nTotal Akhir: Rp ${result.total_paid ? result.total_paid.toLocaleString('id-ID') : 'Sukses'}`);
                loadMerchandise(); 
                checkoutForm.reset();
            } else if (response.status === 401) {
                alert("❌ Pembelian gagal: Anda harus login terlebih dahulu.");
            } else {
                alert(`❌ Pembelian gagal: ${result.message}`);
            }

        } catch (error) {
            console.error("Error during checkout:", error);
            alert('Error jaringan atau server saat memproses checkout.');
        }
    });
}

// Fungsi bantu untuk update subtotal, ongkir, dan total
function updateCheckoutCalculations() {
    const qtyInput = document.getElementById('checkoutQuantity');
    const priceInput = document.getElementById('checkoutPriceAtSale');
    const modeSelect = document.getElementById('shippingMode');
    
    if (!qtyInput || !priceInput || !modeSelect) return;

    const qty = parseInt(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const mode = modeSelect.value;
    
    // Logika biaya ongkir
    const shippingCost = (mode === 'hadiah') ? 20000 : 10000;
    const subtotal = qty * price;
    const total = subtotal + shippingCost;

    // Update tampilan di Modal
    const subtotalEl = document.getElementById('displaySubtotal');
    const shippingEl = document.getElementById('displayShipping');
    const totalEl = document.getElementById('displayTotal');

    if(subtotalEl) subtotalEl.innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    if(shippingEl) shippingEl.innerText = `Rp ${shippingCost.toLocaleString('id-ID')}`;
    if(totalEl) totalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
}