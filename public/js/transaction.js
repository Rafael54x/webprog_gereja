// public/js/transaction.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transactionForm');
    const itemTableBody = document.getElementById('itemTableBody');
    const addRowBtn = document.getElementById('addRowBtn');
    const statusMessage = document.getElementById('statusMessage');

    // Utility untuk Notifikasi (Sama seperti di modul lain)
    const showStatus = (message, isSuccess) => {
        statusMessage.textContent = message;
        statusMessage.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
        statusMessage.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
        statusMessage.classList.remove('d-none');
        setTimeout(() => statusMessage.classList.add('d-none'), 5000);
    };

    // Fungsi menambah baris input dinamis
    const addRow = (description = '', amount = '') => {
        const row = itemTableBody.insertRow();
        row.innerHTML = `
            <td>
                <input type="text" name="item_description[]" class="form-control" placeholder="Contoh: Persembahan Syukur" value="${description}" required>
            </td>
            <td>
                <input type="number" name="item_amount[]" class="form-control" placeholder="Jumlah (misal: 50000)" value="${amount}" min="1" required>
            </td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-row-btn" onclick="this.closest('tr').remove()">Hapus</button>
            </td>
        `;
    };
    
    // Tambahkan baris awal
    addRow();

    addRowBtn.addEventListener('click', addRow);

    // [a] Event Submit untuk Menyimpan Multi-Rows
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Kumpulkan data dari semua baris input
        const descriptions = Array.from(document.querySelectorAll('input[name="item_description[]"]')).map(el => el.value);
        const amounts = Array.from(document.querySelectorAll('input[name="item_amount[]"]')).map(el => el.value);

        if (descriptions.length === 0) {
            return showStatus('Gagal: Tambahkan minimal satu item transaksi.', false);
        }

        const items = descriptions.map((desc, index) => ({
            description: desc,
            amount: amounts[index]
        }));
        
        // [a] Konfirmasi sebelum Save (Kriteria UAS Master Module)
        if (!confirm('Apakah Anda yakin ingin menyimpan transaksi ini?')) {
            return;
        }

        showStatus('⏳ Sedang menyimpan transaksi...', false);

        try {
            // Panggil API Backend (Kriteria 5a)
            const response = await fetch('/api/transaction/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
                credentials: 'include'
            });

            const result = await response.json();
            
            if (response.ok) {
                showStatus(`✅ ${result.message}`, true);
                // Reset form dan load baris input baru
                itemTableBody.innerHTML = '';
                addRow(); 
            } else {
                showStatus(`❌ Gagal: ${result.message}`, false);
            }
        } catch (error) {
            showStatus('❌ Error jaringan: Gagal terhubung ke server.', false);
        }
    });
});