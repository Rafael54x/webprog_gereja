document.addEventListener('DOMContentLoaded', () => {
    // --- 1. AMBIL SEMUA ELEMEN YANG DIBUTUHKAN DI AWAL ---
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const adminGalleryContainer = document.getElementById('admin-gallery-container');

    // Elemen-elemen untuk fungsionalitas pop-up (modal)
    const modal = document.getElementById('gallery-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('modal-close-btn');

    if (!adminGalleryContainer || !uploadForm) return;

    // --- 2. FUNGSI UTAMA UNTUK MEMUAT GALERI ---
    async function loadAdminGallery() {
        try {
            const response = await fetch('/api/gallery', { credentials: 'include' });
            const items = await response.json();
            adminGalleryContainer.innerHTML = '';

            if (items.length === 0) {
                 adminGalleryContainer.innerHTML = '<p class="text-center">Tidak ada media galeri saat ini.</p>';
                 return;
            }

            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'col-sm-6 col-md-4 col-lg-3'; 
                
                let mediaElementThumbnail = '';
                let mediaElementForModal = '';

                // item.file_path = "/galleryMedia/namafile.ext" (Path dari DB)
                const filePath = item.file_path; 

                // Lakukan validasi minimal
                if (!filePath) return; 

                if (item.file_type === 'image') {
                    mediaElementThumbnail = `<img src="${filePath}" alt="${item.caption}" class="img-fluid rounded">`;
                    mediaElementForModal = mediaElementThumbnail;
                } else {
                    mediaElementThumbnail = `<video src="${filePath}" class="img-fluid rounded"></video>`;
                    mediaElementForModal = `<video controls src="${filePath}" class="w-100"></video>`;
                }

                itemDiv.innerHTML = `
                    <div class="card h-100 shadow-sm">
                        <div class="media-wrapper card-img-top p-2">
                            ${mediaElementThumbnail}
                        </div>
                        <div class="caption-wrapper card-body">
                            <h6 class="card-title">${item.event_name || 'Tanpa Nama Acara'}</h6>
                            <p class="card-text text-muted small">${item.caption || 'Tidak ada keterangan'}</p>
                            <button class="btn btn-sm btn-danger deleteGalleryBtn" data-id="${item.id}">Hapus</button>
                        </div>
                    </div>
                `;

                // --- LOGIKA POP-UP ---
                const mediaWrapper = itemDiv.querySelector('.media-wrapper');
                if (mediaWrapper) {
                    mediaWrapper.addEventListener('click', () => {
                        if (modal && modalContent) {
                            modalContent.innerHTML = mediaElementForModal; 
                            modal.classList.add('visible');
                        }
                    });
                }
                
                adminGalleryContainer.appendChild(itemDiv);
            });
        } catch (error) {
            adminGalleryContainer.innerHTML = '<p class="text-danger">Gagal memuat galeri. Pastikan Anda sudah login.</p>';
        }
    }

    // --- 3. EVENT LISTENERS (Logika CRUD Tetap) ---

    // Event listener untuk tombol Hapus (ditambah Konfirmasi)
    adminGalleryContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('deleteGalleryBtn')) {
            const id = event.target.dataset.id;
            
            // KONFIRMASI (KRITERIA UAS)
            if (confirm('Apakah Anda yakin ingin menghapus media ini? Aksi ini tidak dapat dibatalkan.')) {
                try {
                    const response = await fetch(`/api/gallery/${id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        alert('✅ Media berhasil dihapus!');
                        loadAdminGallery();
                    } else {
                        const err = await response.json();
                        alert(`❌ Gagal menghapus media: ${err.message}`);
                    }
                } catch (error) {
                    alert('❌ Error koneksi saat mencoba menghapus.');
                }
            }
        }
    });

    // Event listener untuk form Unggah (ditambah Konfirmasi)
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // KONFIRMASI (KRITERIA UAS)
        if (!confirm('Yakin ingin mengunggah media ini ke galeri?')) {
            uploadStatus.textContent = 'Unggahan dibatalkan.';
            return;
        }

        const formData = new FormData(uploadForm);
        uploadStatus.textContent = 'Mengunggah... Tunggu sebentar.';
        
        try {
            const response = await fetch('/api/gallery/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            const result = await response.json();
            
            if (response.ok) {
                uploadStatus.textContent = `✅ Berhasil: ${result.message}`;
                uploadForm.reset();
                loadAdminGallery();
            } else {
                uploadStatus.textContent = `❌ Gagal: ${result.message}`;
            }
        } catch (error) {
            uploadStatus.textContent = '❌ Error koneksi ke server.';
        }
    });
    
    // --- LOGIKA POP-UP: Penutupan Modal ---
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('visible');
            modalContent.innerHTML = ''; 
        });
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('visible');
                modalContent.innerHTML = ''; 
            }
        });
    }

    loadAdminGallery();
});