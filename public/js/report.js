// public/js/report.js

// Inisialisasi variabel untuk Modal Bootstrap
let detailModal;

document.addEventListener('DOMContentLoaded', () => {
    const reportTableBody = document.getElementById('reportTableBody');
    const searchInput = document.getElementById('searchInput');

    // Inisialisasi Modal Bootstrap setelah DOM Content Loaded
    // Pastikan Anda menambahkan markup modal ke transaction_report.html
    const modalElement = document.getElementById('transactionDetailModal');
    if (modalElement) {
        detailModal = new bootstrap.Modal(modalElement);
    }
    
    // [b] & [c] Fungsi untuk memuat dan menampilkan laporan (termasuk search)
    window.loadReport = async (event) => {
        if (event) event.preventDefault();
        
        const searchQuery = searchInput.value.trim();
        let url = '/api/transaction/report';
        
        // Menambahkan query parameter untuk Search/Filter
        if (searchQuery) {
            url += `?q=${encodeURIComponent(searchQuery)}`;
        }
        
        reportTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat data laporan...</td></tr>';

        try {
            const response = await fetch(url, { credentials: 'include' });
            
            if (!response.ok) {
                // Mencoba membaca pesan error dari body jika ada
                const errorResult = await response.json().catch(() => ({ message: `Status: ${response.status}` }));
                throw new Error(`Gagal memuat data. ${errorResult.message || 'Error server.'}`);
            }

            const result = await response.json();
            const transactions = result.transactions;
            reportTableBody.innerHTML = '';

            if (transactions.length === 0) {
                reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center">Tidak ada transaksi ditemukan ${searchQuery ? 'untuk kriteria ini.' : 'saat ini.'}</td></tr>`;
                return;
            }

            transactions.forEach(t => {
                const date = new Date(t.transaction_date).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${t.id}</td>
                    <td>${date}</td>
                    <td>${t.username}</td>
                    <td>Rp ${parseFloat(t.total_amount).toLocaleString('id-ID')}</td>
                    <td><button class="btn btn-sm btn-danger detail-btn" data-id="${t.id}">Lihat Detail</button></td>
                `; // Ganti btn-info menjadi btn-danger agar sesuai screenshot
                reportTableBody.appendChild(tr);
            });

        } catch (error) {
            console.error("Error fetching report:", error);
            reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">❌ Gagal memuat data: ${error.message}</td></tr>`;
        }
    };
    
    // Fungsi BARU untuk mengambil dan menampilkan detail transaksi
    window.fetchTransactionDetail = async (id) => {
        // Tampilkan loading di modal header
        document.getElementById('detailModalTitle').textContent = `Detail Transaksi ID ${id}`;
        document.getElementById('detailModalBody').innerHTML = '<p class="text-center">Memuat detail...</p>';
        if (detailModal) detailModal.show();
        
        try {
            const response = await fetch(`/api/transaction/detail/${id}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                document.getElementById('detailModalBody').innerHTML = `<p class="text-danger">Gagal memuat detail: ${result.message || 'Error server.'}</p>`;
                return;
            }

            const detail = result.transaction;
            
            // Format tanggal
            const formattedDate = new Date(detail.transaction_date).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Bangun tampilan detail item
            let itemsHtml = '';
            if (detail.items && detail.items.length > 0) {
                detail.items.forEach(item => {
                    const amount = parseFloat(item.amount).toLocaleString('id-ID');
                    itemsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${item.description}
                            <span class="badge bg-primary rounded-pill">Rp ${amount}</span>
                        </li>
                    `;
                });
            } else {
                itemsHtml = `<li class="list-group-item text-muted">Tidak ada item detail yang tercatat.</li>`;
            }

            // Tampilkan konten modal
            document.getElementById('detailModalBody').innerHTML = `
                <p><strong>Tanggal Transaksi:</strong> ${formattedDate}</p>
                <p><strong>User Pencatat:</strong> ${detail.user_pencatat}</p>
                <p><strong>Total Transaksi:</strong> <span class="badge bg-success fs-5">Rp ${parseFloat(detail.total_amount).toLocaleString('id-ID')}</span></p>
                
                <h6 class="mt-4">Item Transaksi:</h6>
                <ul class="list-group">
                    ${itemsHtml}
                </ul>
            `;

        } catch (error) {
            console.error('Error fetching detail:', error);
            document.getElementById('detailModalBody').innerHTML = `<p class="text-danger">Error jaringan: Gagal terhubung ke server.</p>`;
        }
    }
    
    // Initial Load
    loadReport();
    
    // Event listener untuk tombol Detail (panggil fungsi fetchTransactionDetail)
    reportTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('detail-btn')) {
            const transactionId = e.target.dataset.id;
            fetchTransactionDetail(transactionId);
        }
    });
});