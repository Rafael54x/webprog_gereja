document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('jemaat-table-body');
    const formContainer = document.getElementById('form-jemaat-container');
    const form = document.getElementById('jemaat-form');
    const formTitle = document.getElementById('form-title');
    const jemaatIdInput = document.getElementById('jemaat-id');
    const showAddFormBtn = document.getElementById('show-add-form-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const searchSortForm = document.getElementById('search-sort-form');
    
    // Elemen Notifikasi dari jemaat.html
    const statusMessage = document.getElementById('jemaatStatusMessage'); 

    // ===============================================
    // FUNGSI UTILITY: NOTIFIKASI (KRITERIA b)
    // ===============================================
    const showJemaatStatus = (message, isSuccess = false) => {
        statusMessage.textContent = message;
        statusMessage.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
        statusMessage.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
        statusMessage.classList.remove('d-none');
        
        // Sembunyikan setelah 5 detik
        setTimeout(() => {
            statusMessage.classList.add('d-none');
        }, 5000);
    };

    // ===============================================
    // FUNGSI LOAD DATA (CRUD-READ & KRITERIA d)
    // ===============================================
    async function muatDataJemaat(params = {}) { 
        let url = '/api/jemaat';
        const queryString = new URLSearchParams(params).toString();
        if (queryString) { url += '?' + queryString; }

        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Memuat data...</td></tr>';
        
        try {
            const response = await fetch(url, { credentials: 'include' });
            
            if (response.status === 403) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Akses Ditolak. Halaman ini hanya untuk Admin.</td></tr>';
                return;
            }
            if (!response.ok) { throw new Error('Gagal memuat data'); }
            
            const data = await response.json();
            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada data jemaat yang ditemukan.</td></tr>';
                return;
            }
            
            data.forEach(jemaat => {
                const tr = document.createElement('tr');
                // Format tanggal_lahir jika ada
                const tglLahir = jemaat.tanggal_lahir ? new Date(jemaat.tanggal_lahir).toLocaleDateString('id-ID') : '-';
                
                tr.innerHTML = `
                    <td>${jemaat.nama_lengkap}</td>
                    <td>${jemaat.alamat || '-'}</td>
                    <td>${jemaat.nomor_telepon || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-jemaat='${JSON.stringify(jemaat)}'>Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${jemaat.id}" data-nama="${jemaat.nama_lengkap}">Hapus</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
        }
    }

    const triggerLoad = (event) => {
        if (event) event.preventDefault(); 
        const params = {
            search: document.getElementById('search-input').value,
            sort_by: document.getElementById('sort-by').value,
            sort_order: document.getElementById('sort-order').value
        };
        for (const key in params) {
             if (!params[key]) { delete params[key]; }
        }
        muatDataJemaat(params);
    };

    // Fungsi Form Management
    function showForm(jemaat = null) {
        form.reset();
        if (jemaat) {
            formTitle.textContent = 'Edit Data Jemaat';
            jemaatIdInput.value = jemaat.id;
            form.nama_lengkap.value = jemaat.nama_lengkap || '';
            form.alamat.value = jemaat.alamat || '';
            form.nomor_telepon.value = jemaat.nomor_telepon || '';
            if (jemaat.tanggal_lahir) {
                // Mengambil bagian tanggal saja (YYYY-MM-DD)
                form.tanggal_lahir.value = jemaat.tanggal_lahir.split('T')[0];
            } else {
                form.tanggal_lahir.value = '';
            }
            form.jenis_kelamin.value = jemaat.jenis_kelamin || '';
        } else {
            formTitle.textContent = 'Tambah Jemaat Baru';
            jemaatIdInput.value = '';
        }
        formContainer.style.display = 'block';
    }

    function hideForm() {
        formContainer.style.display = 'none';
        form.reset();
        jemaatIdInput.value = '';
    }

    showAddFormBtn.addEventListener('click', () => showForm());
    cancelEditBtn.addEventListener('click', hideForm);

    // ===============================================
    // LOGIKA SAVE/UPDATE (KRITERIA a, b, c)
    // ===============================================
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = jemaatIdInput.value;
        const data = Object.fromEntries(new FormData(form).entries());
        if (!id) { delete data.id; }
        
        const url = id ? `/api/jemaat/${id}` : '/api/jemaat';
        const method = id ? 'PUT' : 'POST';
        const actionText = id ? 'diperbarui' : 'disimpan';

        // (a) Konfirmasi sebelum Save/Update
        if (!confirm(`Yakin ingin ${actionText} data Jemaat ${data.nama_lengkap}?`)) {
            showJemaatStatus('Proses dibatalkan.', false);
            return;
        }
        
        try {
            // (c) Melakukan CRUD (POST/PUT)
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            
            const responseData = await response.json();
            
            if (response.ok) {
                // (b) Notifikasi berhasil
                showJemaatStatus(`✅ Data Jemaat ${data.nama_lengkap} berhasil ${actionText}!`, true);
                hideForm();
                triggerLoad();
            } else {
                // (b) Notifikasi gagal
                throw new Error(responseData.message || `Gagal ${actionText}. Status: ${response.status}`);
            }
        } catch (error) {
            showJemaatStatus(`❌ Gagal ${actionText}: ${error.message}`, false);
        }
    });

    // ===============================================
    // LOGIKA DELETE & EDIT (KRITERIA a, b, c)
    // ===============================================
    tbody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const id = event.target.dataset.id;
            const nama = event.target.dataset.nama;
            
            // (a) Konfirmasi sebelum Delete
            if (confirm(`Yakin ingin menghapus data Jemaat ${nama}? Aksi ini tidak dapat dibatalkan.`)) {
                try {
                    // (c) Melakukan CRUD (DELETE)
                    const response = await fetch(`/api/jemaat/${id}`, { method: 'DELETE', credentials: 'include' });
                    const result = await response.json();
                    
                    if (response.ok) {
                        // (b) Notifikasi berhasil
                        showJemaatStatus(`🗑️ Data Jemaat ${nama} berhasil dihapus.`, true);
                        triggerLoad();
                    } else {
                         // (b) Notifikasi gagal
                        throw new Error(result.message || 'Gagal menghapus data.');
                    }
                } catch (error) {
                    showJemaatStatus(`❌ Gagal menghapus: ${error.message}`, false);
                }
            }
        }
        if (event.target.classList.contains('edit-btn')) {
            const jemaatData = JSON.parse(event.target.dataset.jemaat);
            showForm(jemaatData);
        }
    });
    
    // ===============================================
    // EVENT LISTENER SEARCH/SORT (KRITERIA d)
    // ===============================================
    if (searchSortForm) {
        searchSortForm.addEventListener('submit', triggerLoad); 
    }
    
    // Initial Load
    triggerLoad();
});