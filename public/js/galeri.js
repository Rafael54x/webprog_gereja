document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('gallery-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    let allGalleryItems = []; // Menyimpan SEMUA data dari database
    const itemsPerPage = 6;   // Batas 6 foto per halaman
    let currentPage = 1;      // Halaman aktif saat ini

    // --- 1. Inisialisasi Modal ---
    function initModal() {
        const modal = document.getElementById('gallery-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        const modalContent = document.getElementById('modal-content');
        
        if (!modal) return;
        
        closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('visible');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                modal.classList.remove('visible');
            }
        });
        
        window.openModal = (globalIndex) => {
            if (!allGalleryItems[globalIndex]) return;
            
            const item = allGalleryItems[globalIndex];
            const isImage = item.file_type === 'image';
            
            modalContent.innerHTML = isImage
                ? `<img src="${item.file_path}" alt="${item.caption || 'Galeri'}">`
                : `<video controls autoplay src="${item.file_path}"></video>`;
            
            modal.classList.add('visible');
        };
    }

    // --- 2. Fungsi Render Galeri ---
    function renderGalleryPage(page) {
        galleryContainer.innerHTML = ''; 

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToDisplay = allGalleryItems.slice(startIndex, endIndex);

        if (itemsToDisplay.length === 0) {
            galleryContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted text-white">Tidak ada foto di halaman ini.</p></div>';
            return;
        }

        itemsToDisplay.forEach((item, loopIndex) => {
            const globalIndex = startIndex + loopIndex;
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item'; 
            
            const filePath = item.file_path; 
            let mediaElement = '';

            if (item.file_type === 'image') {
                mediaElement = `<img src="${filePath}" alt="${item.caption || 'Galeri'}" loading="lazy">`;
            } else if (item.file_type === 'video') {
                mediaElement = `<video src="${filePath}" preload="metadata"></video>`;
            }

            // === ⬇️ PERBAIKAN: DEFINISI VARIABEL TEKS DISINI ⬇️ ===
            const titleText = item.event_name || 'Dokumentasi';
            const captionText = item.caption || '';
            // =======================================================

            galleryItem.innerHTML = `
                <div class="card h-100 shadow-sm border-0 overflow-hidden" style="cursor: pointer;">
                    <div class="gallery-img-wrapper">
                        ${mediaElement}
                        <div class="gallery-overlay">
                            <h5 class="overlay-text">${titleText}</h5>
                            ${captionText ? `<p class="overlay-caption">${captionText}</p>` : ''}
                            <i class="fa-solid fa-up-right-from-square text-white mt-2"></i>
                        </div>
                    </div>
                </div>
            `;
            
            galleryItem.addEventListener('click', () => {
                window.openModal(globalIndex);
            });
            
            galleryContainer.appendChild(galleryItem);
        });

        renderPaginationControls();
    }

    // --- 3. Fungsi Render Tombol Pagination ---
    function renderPaginationControls() {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(allGalleryItems.length / itemsPerPage);

        if (totalPages <= 1) return;

        // Tombol PREVIOUS
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>'; // Pakai Icon biar cantik
        prevBtn.className = 'btn btn-pagination';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderGalleryPage(currentPage);
            }
        });
        paginationContainer.appendChild(prevBtn);

        // Tombol Angka (Opsional: Supaya user tahu di halaman berapa)
        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'mx-3 text-white fw-bold align-self-center';
        pageIndicator.innerText = `${currentPage} / ${totalPages}`;
        // Jika di halaman index (background putih), text harus hitam
        if(!document.body.classList.contains('galeri-dark')) {
            pageIndicator.classList.remove('text-white');
            pageIndicator.classList.add('text-dark');
        }
        paginationContainer.appendChild(pageIndicator);

        // Tombol NEXT
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>'; // Pakai Icon biar cantik
        nextBtn.className = 'btn btn-pagination';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderGalleryPage(currentPage);
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // --- 4. Fungsi Utama Fetch Data ---
    async function loadPublicGallery() {
        galleryContainer.innerHTML = '<p class="loading-text text-white text-center">Memuat galeri...</p>';

        try {
            const response = await fetch('/api/gallery'); 
            if (!response.ok) throw new Error(`Status: ${response.status}`);

            const items = await response.json(); 
            allGalleryItems = items; 

            if (allGalleryItems.length === 0) {
                 galleryContainer.innerHTML = '<div class="col-12 text-center text-white"><p>Belum ada media di galeri saat ini.</p></div>';
                 return;
            }

            currentPage = 1;
            renderGalleryPage(1);

        } catch (error) {
            console.error("Error:", error);
            galleryContainer.innerHTML = '<p class="text-danger loading-text text-center">Gagal memuat galeri.</p>';
        }
    }

    initModal();
    loadPublicGallery();
});