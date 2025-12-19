// public/js/main.js

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. VARIABEL UI ---
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const jemaatOnlyElements = document.querySelectorAll('.jemaat-only');
    const authElements = document.querySelectorAll('.auth-only');

    // Sembunyikan menu role-specific di awal
    function hideAllRoleMenus() {
        if(adminOnlyElements) adminOnlyElements.forEach(el => el.style.display = 'none');
        if(jemaatOnlyElements) jemaatOnlyElements.forEach(el => el.style.display = 'none');
        if(authElements) authElements.forEach(el => el.style.display = 'none');
    }

    // --- 2. FUNGSI LOAD HEADER (NAVBAR) ---
    async function loadHeader() {
        const currentHeader = document.querySelector('header');
        
        // Cek apakah header ada tapi kosong (belum ada <nav>)
        if (currentHeader && !currentHeader.querySelector('nav')) { 
            try {
                // Ambil dari index.html
                const response = await fetch('/index.html'); 
                const htmlString = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, 'text/html');
                const nav = doc.querySelector('nav');
                
                if (nav) {
                    currentHeader.innerHTML = ''; 
                    currentHeader.appendChild(nav);
                    
                    // Re-inisialisasi status login setelah navbar muncul
                    setTimeout(() => checkAuthStatus(), 100); 
                }
            } catch (error) {
                console.error('Gagal memuat navigasi:', error);
            }
        }
    }

    // --- 3. FUNGSI LOAD FOOTER (BARU ✨) ---
    async function loadFooter() {
        const currentFooter = document.querySelector('footer');

        // Cek jika ada tag footer tapi isinya kosong (belum ada div container)
        if (currentFooter && !currentFooter.querySelector('.container-fluid')) {
            try {
                // Ambil dari index.html (karena footer sumber ada di sana)
                const response = await fetch('/index.html');
                const htmlString = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, 'text/html');
                const sourceFooter = doc.querySelector('footer');

                if (sourceFooter) {
                    // 1. Copy isi HTML (Teks, Link, Sosmed)
                    currentFooter.innerHTML = sourceFooter.innerHTML;

                    // 2. Copy Style & Class (Warna ungu, padding, dll)
                    // Ini PENTING karena di index.html style ada di tag <footer>-nya
                    currentFooter.className = sourceFooter.className;
                    currentFooter.setAttribute('style', sourceFooter.getAttribute('style'));
                }
            } catch (error) {
                console.error('Gagal memuat footer:', error);
            }
        }
    }

    // --- 4. FUNGSI UPDATE TAMPILAN (LOGIN/LOGOUT) ---
    function updateUIVisibility(user) {
        const body = document.body;
        
        // Ambil elemen ulang karena baru saja di-load dari loadHeader()
        const loginLink = document.getElementById('login-link');
        const registerLink = document.getElementById('register-link');
        const userInfo = document.getElementById('user-info');
        const welcomeUserName = document.getElementById('welcome-user-name');
        
        const adminEls = document.querySelectorAll('.admin-only');
        const jemaatEls = document.querySelectorAll('.jemaat-only');
        const authEls = document.querySelectorAll('.auth-only');

        // Reset
        body.classList.remove('logged-in', 'role-admin', 'role-jemaat');
        if(adminEls) adminEls.forEach(el => el.style.display = 'none');
        if(jemaatEls) jemaatEls.forEach(el => el.style.display = 'none');
        if(authEls) authEls.forEach(el => el.style.display = 'none');

        if (user) { 
            // === USER LOGIN ===
            body.classList.add('logged-in');
            
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex'; 
            
            if (welcomeUserName) welcomeUserName.textContent = user.nama_lengkap;

            if(authEls) authEls.forEach(el => el.style.display = 'inline-block');

            if (user.role === 'admin') {
                body.classList.add('role-admin');
                if(adminEls) adminEls.forEach(el => el.style.display = 'inline-block'); 
            } else if (user.role === 'jemaat') {
                body.classList.add('role-jemaat');
                if(jemaatEls) jemaatEls.forEach(el => el.style.display = 'inline-block');
            }

        } else { 
            // === TIDAK LOGIN ===
            if (loginLink) loginLink.style.display = 'inline-block';
            if (registerLink) registerLink.style.display = 'inline-block';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    // --- 5. CEK STATUS KE SERVER ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status', { credentials: 'include' });
            const data = await response.json();
            
            if (data.success) {
                updateUIVisibility(data.user);
            } else {
                updateUIVisibility(null);
            }
        } catch (error) {
            console.error("Gagal cek auth:", error);
            updateUIVisibility(null);
        }
    }

    // --- EKSEKUSI UTAMA ---
    await loadHeader(); // 1. Muat Header
    await loadFooter(); // 2. Muat Footer (BARU)
    await checkAuthStatus(); // 3. Cek Login

    // --- EVENT LISTENER LOGOUT ---
    document.addEventListener('click', async (event) => {
        const logoutBtn = event.target.closest('#logout-btn');
        if (logoutBtn) {
            event.preventDefault();
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                sessionStorage.removeItem('introShown'); 
                window.location.href = '/index.html';
            } catch (error) {
                console.error("Logout error:", error);
            }
        }
    });

    document.body.classList.add('ready');
});