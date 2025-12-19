document.addEventListener('DOMContentLoaded', () => {
    const sliderContent = document.getElementById('sliderContent');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.getElementById('searchForm');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    let eventsData = [];
    let currentIndex = 0;

    async function loadEventList(searchQuery = '') {
        // Loading State
        sliderContent.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center py-5">
                <div class="spinner-border text-secondary" role="status"></div>
                <p class="mt-3 text-muted">Memuat event...</p>
            </div>`;

        let url = `/api/event/daftar${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`;

        try {
            const response = await fetch(url);
            const result = await response.json();

            if (!result.success || result.data.length === 0) {
                sliderContent.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">Tidak ada event ditemukan.</h4>
                    </div>`;
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
                return;
            }

            eventsData = result.data;
            currentIndex = 0;
            
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';

            renderSlider();

        } catch (e) {
            console.error("Fetch error:", e);
            sliderContent.innerHTML = '<p class="text-danger text-center py-5">Gagal terhubung ke server.</p>';
        }
    }

    function renderSlider() {
        sliderContent.innerHTML = ''; 

        eventsData.forEach((event, index) => {
            const posterPath = `/eventPosters/${event.poster}`;
            const isActive = index === 0 ? 'active' : '';

            const buttonHtml = event.link_gform 
                ? `<a href="${event.link_gform}" target="_blank" class="btn-action">Daftar Sekarang</a>`
                : `<span class="badge rounded-pill bg-secondary px-4 py-2 fs-6">Pendaftaran Ditutup</span>`;

            const slideHtml = `
                <div class="event-slide ${isActive}" data-index="${index}">
                    <img src="${posterPath}" alt="${event.nama_event}" class="poster-large">
                    
                    <div class="text-center mt-2">
                        <h2 class="event-title-large">${event.nama_event}</h2>
                        <div class="mt-3">
                            ${buttonHtml}
                        </div>
                    </div>
                </div>
            `;
            sliderContent.insertAdjacentHTML('beforeend', slideHtml);
        });
    }

    function showSlide(index) {
        const slides = document.querySelectorAll('.event-slide');
        if (slides.length === 0) return;

        if (index >= slides.length) currentIndex = 0;
        else if (index < 0) currentIndex = slides.length - 1;
        else currentIndex = index;

        slides.forEach(slide => slide.classList.remove('active'));
        slides[currentIndex].classList.add('active');
    }

    // Event Listeners
    nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
    prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
        if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
    });

    window.searchEvents = () => loadEventList(searchInput.value.trim());

    if (searchInput) {
        searchInput.addEventListener('input', () => { 
            if(searchInput.value.trim() === '') loadEventList(''); 
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.searchEvents();
        });
    }

    loadEventList();
});