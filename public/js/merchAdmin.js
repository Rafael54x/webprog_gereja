// public/js/merchAdmin.js

document.addEventListener('DOMContentLoaded', () => {
    // Panggil loadAdminMerchandise untuk memuat data awal dan setupEventListeners
    loadAdminMerchandise(true); 
});

// Fungsi untuk membersihkan backdrop/overlay modal secara agresif
const cleanUpModal = () => {
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow'); 
    document.body.style.removeProperty('padding-right'); 
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
};

async function loadAdminMerchandise(initialLoad = false) {
    cleanUpModal(); 
    
    const tableBody = document.getElementById('adminMerchTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Memuat produk...</td></tr>';
    
    const apiUrl = '/api/merch/products'; 

    try {
        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Gagal mengambil data admin merchandise.');
        }

        const items = result.data;
        tableBody.innerHTML = '';

        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada produk untuk dikelola.</td></tr>';
        } else {
            items.forEach(item => {
                const price = parseFloat(item.price).toLocaleString('id-ID');
                const imagePath = item.imageUrl 
                    ? `/images/merch/${item.imageUrl}` 
                    : '/images/default_merch.jpg'; 
                
                // UPDATE: Menggunakan class CSS baru (btn-edit-yellow, btn-delete-lilac)
                // align-middle biar teks rapi di tengah vertikal
                const row = `
                    <tr>
                        <td class="align-middle text-center">${item.id}</td>
                        <td class="align-middle text-center">
                            <img src="${imagePath}" class="shadow-sm rounded" style="width: 60px; height: 60px; object-fit: cover;">
                        </td>
                        <td class="align-middle fw-bold">${item.name}</td>
                        <td class="align-middle">Rp ${price}</td>
                        <td class="align-middle text-center">${item.stock}</td>
                        <td class="align-middle text-center">
                            <button class="btn btn-sm btn-warning edit-btn me-1" data-id="${item.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Hapus</button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        }
        
        if (initialLoad) {
            setupEventListeners(); 
        }

    } catch (error) {
        console.error("Error loading admin merchandise:", error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function setupEventListeners() {
    const tableBody = document.getElementById('adminMerchTableBody');
    
    // Helper untuk auto-reload saat modal tutup
    const setupModalReload = (modalElement) => {
        modalElement.removeEventListener('hidden.bs.modal', modalReloadHandler); 
        modalElement.addEventListener('hidden.bs.modal', modalReloadHandler);
    };

    const modalReloadHandler = function () {
        cleanUpModal(); 
        loadAdminMerchandise(); 
    };

    // 1. LISTENER UNTUK TOMBOL EDIT/HAPUS (Delegation)
    tableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('btn-danger')) {
            if (confirm(`Yakin ingin menghapus produk ID ${id}?`)) {
                await deleteProduct(id);
            }
        } else if (e.target.classList.contains('btn-warning')) {
            await openEditModal(id); 
        }
    });

    // 2. LISTENER UNTUK TOMBOL TAMBAH PRODUK BARU
    // Menggunakan querySelector untuk tombol dengan href specific
    const addBtn = document.querySelector('a[href="#addProductModal"]'); 
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            document.getElementById('addProductForm').reset();
        });
    }

    // 3. LISTENER SUBMIT FORM TAMBAH
    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target); 

        try {
            const response = await fetch('/api/merch/product', {
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();
            
            if (response.ok) {
                alert(`✅ Sukses: ${result.message}`);
                const modalElement = document.getElementById('addProductModal');
                setupModalReload(modalElement); 
                bootstrap.Modal.getInstance(modalElement).hide();
            } else {
                alert(`❌ Gagal menambahkan produk: ${result.message}`);
            }
        } catch (error) {
            console.error("Error submit form:", error);
            alert('Terjadi error saat terhubung ke server.');
        }
    });
    
    // 4. LISTENER SUBMIT FORM EDIT
    document.getElementById('editProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const productId = form.querySelector('#editProductId').value;
        const formData = new FormData(form); 
        
        try {
            const response = await fetch(`/api/merch/product/${productId}`, {
                method: 'PUT',
                body: formData,
            });

            const result = await response.json();
            
            if (response.ok) {
                alert(`✅ Sukses: ${result.message}`);
                const modalElement = document.getElementById('editProductModal');
                setupModalReload(modalElement); 
                bootstrap.Modal.getInstance(modalElement).hide();
            } else {
                alert(`❌ Gagal mengupdate produk: ${result.message}`);
            }
        } catch (error) {
            console.error("Error submit form edit:", error);
            alert('Terjadi error saat terhubung ke server.');
        }
    });
}

// FUNGSI: Mengambil data dan menampilkan modal edit
async function openEditModal(id) {
    try {
        const response = await fetch(`/api/merch/products/${id}`); 
        const result = await response.json();

        if (!response.ok || !result.success) {
            alert('Gagal memuat data produk untuk diedit.');
            return;
        }

        const data = result.data;
        
        document.getElementById('editProductId').value = data.id;
        document.getElementById('editProductName').value = data.name;
        document.getElementById('editProductDescription').value = data.description;
        document.getElementById('editProductPrice').value = data.price;
        document.getElementById('editProductStock').value = data.stock;
        document.getElementById('editExistingImageUrl').value = data.imageUrl; 
        document.getElementById('editProductImageFile').value = '';

        const modalElement = document.getElementById('editProductModal');
        new bootstrap.Modal(modalElement).show();

    } catch (error) {
        console.error("Error loading edit modal:", error);
        alert('Gagal mengambil data produk dari server.');
    }
}

// Fungsi Delete
async function deleteProduct(id) {
    try {
        const response = await fetch(`/api/merch/product/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (response.ok) {
            alert(`✅ ${result.message}`);
            loadAdminMerchandise(); 
        } else {
            alert(`❌ Gagal: ${result.message}`);
        }
    } catch (error) {
        alert('Error jaringan saat menghapus produk.');
    }
}