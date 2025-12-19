document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('eventForm');
    const statusMessage = document.getElementById('statusMessage');
    const eventListContainer = document.getElementById('eventList'); // Wadah daftar event

    // --- UTILITY: Menampilkan Status Pesan ---
    const showStatus = (message, type) => {
        let className = '';
        if (type === 'success') {
            className = 'alert-success'; 
        } else if (type === 'error') {
            className = 'alert-danger';
        } else { // Loading/Info
            className = 'alert-warning';
        }
        
        statusMessage.className = `alert ${className}`;
        statusMessage.innerHTML = message;
        statusMessage.style.display = 'block';

        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    };

    // --- FUNGSI 1: Menangani Form Tambah Event ---
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const eventNameInput = document.getElementById('nama_event').value;
        if (!confirm(`Yakin ingin menambahkan event: "${eventNameInput}"?`)) {
            showStatus('Proses penambahan event dibatalkan.', 'alert-secondary');
            return; 
        }
        
        showStatus('⏳ Sedang memproses... Tunggu sebentar.', 'loading');

        const formData = new FormData(eventForm);

        try {
            const response = await fetch(eventForm.action, {
                method: 'POST',
                body: formData,
            });
            
            const contentType = response.headers.get("content-type");
            let result = {};
            
            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            }

            if (response.ok) {
                const eventName = eventNameInput || 'Event Baru';
                showStatus(`✅ Event **${eventName}** berhasil ditambahkan!`, 'success');
                eventForm.reset();
                
                // 🛑 KRITIS: Muat ulang daftar setelah sukses menambah
                loadEventList(); 

            } else {
                const errorMessage = result.message || `ERROR: Gagal menambahkan event. Status ${response.status}.`;
                showStatus(`❌ ${errorMessage}`, 'error');
            }

        } catch (error) {
            console.error('Error saat submit (Network/Parse):', error);
            showStatus('❌ ERROR JARINGAN: Gagal terhubung atau terjadi kesalahan pemrosesan.', 'error');
        }
    });

    // --- FUNGSI 2: Menangani Tombol Hapus Event ---
    const handleDelete = async (eventId, eventName) => {
        if (!confirm(`⚠️ Anda yakin ingin menghapus event **${eventName}** (ID: ${eventId})? Aksi ini tidak dapat dibatalkan.`)) {
            return;
        }

        showStatus(`⏳ Menghapus event ${eventName}...`, 'loading');
        
        try {
            const response = await fetch(`/api/event/${eventId}`, {
                method: 'DELETE', // Menggunakan HTTP DELETE
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showStatus(`✅ Event **${eventName}** berhasil dihapus.`, 'success');
                loadEventList(); // Muat ulang daftar untuk refresh tampilan
            } else {
                showStatus(`❌ Gagal menghapus event: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error saat menghapus event:', error);
            showStatus('❌ ERROR JARINGAN saat menghapus event.', 'error');
        }
    };

    // --- FUNGSI 3: Memuat dan Menampilkan Daftar Event ---
    const loadEventList = async () => {
        eventListContainer.innerHTML = '<p>Memuat daftar event...</p>';

        try {
            const response = await fetch('/api/event/daftar');
            const result = await response.json();

            if (response.ok && result.success && result.data.length > 0) {
                let html = `
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nama Event</th>
                                <th>Poster</th>
                                <th>Link GForm</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                result.data.forEach(event => {
                    const posterUrl = `/eventPosters/${event.poster}`; // Sesuaikan dengan path server Anda
                    html += `
                        <tr>
                            <td>${event.id_event}</td>
                            <td>${event.nama_event}</td>
                            <td><a href="${posterUrl}" target="_blank">Lihat Poster</a></td>
                            <td><a href="${event.link_gform}" target="_blank">Link</a></td>
                            <td>
                                <button type="button" 
                                        class="btn btn-danger btn-sm delete-btn" 
                                        data-id="${event.id_event}" 
                                        data-name="${event.nama_event}">
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    `;
                });

                html += `
                        </tbody>
                    </table>
                </div>
                `;
                eventListContainer.innerHTML = html;

                // 🛑 Attach listener ke semua tombol Hapus yang baru dibuat
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const id = button.getAttribute('data-id');
                        const name = button.getAttribute('data-name');
                        handleDelete(id, name);
                    });
                });

            } else if (result.data && result.data.length === 0) {
                 eventListContainer.innerHTML = '<div class="alert alert-info">Belum ada event yang diunggah.</div>';
            } else {
                eventListContainer.innerHTML = `<div class="alert alert-warning">Gagal memuat data event: ${result.message || 'Server Error'}</div>`;
            }
        } catch (error) {
            console.error('Error saat memuat daftar event:', error);
            eventListContainer.innerHTML = '<div class="alert alert-danger">Kesalahan jaringan atau server tidak merespons.</div>';
        }
    };

    // Panggil fungsi pemuatan daftar saat halaman pertama kali dimuat
    loadEventList();
});