// /js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const statusMessage = document.getElementById('status-message');

    // Fungsi untuk menampilkan status pesan (menggunakan class Bootstrap)
    const showStatus = (message, isSuccess = false) => {
        statusMessage.textContent = message;
        statusMessage.classList.remove('d-none', 'alert-success', 'alert-danger');
        statusMessage.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
        if (isSuccess) {
            // Jika berhasil, sembunyikan pesan setelah 5 detik
            setTimeout(() => {
                 statusMessage.classList.add('d-none');
            }, 5000);
        }
    };

    // Fungsi validasi password Client-Side sesuai kriteria (Min. 8, Huruf Besar, Angka, Underscore)
    const validateClientPassword = (password, retype) => {
        const minLength = 8;
        
        // 1. Cek kecocokan
        if (password !== retype) {
            return "Password dan Ulangi Password tidak cocok.";
        }

        // 2. Cek minimal 8 karakter (termasuk dari kriteria sebelumnya)
        if (password.length < minLength) {
            return `Password harus minimal ${minLength} karakter.`;
        }

        // 3. Regex untuk kriteria kompleks: 
        // a. (?=.*[A-Z]): Minimal 1 huruf besar
        // b. (?=.*[a-z]): Minimal 1 huruf kecil
        // c. (?=.*[0-9]): Minimal 1 angka
        // d. (?=.*_): Minimal 1 simbol underscore (_)
        const passwordRegex = new RegExp(`^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*_).{${minLength},}$`);

        if (!passwordRegex.test(password)) {
            return "Password harus mengandung minimal 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol underscore (_).";
        }

        return null; // Validasi berhasil
    };


    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const password = document.getElementById('password').value;
            const retype = document.getElementById('retype_password').value;
            
            // (e) Validasi Client-Side (Sebelum fetch)
            const validationError = validateClientPassword(password, retype);
            if (validationError) {
                showStatus(validationError, false);
                return;
            }

            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());
            
            // Reset pesan status sebelum fetch
            statusMessage.classList.add('d-none'); 

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();

                if (response.ok) {
                    // (f) Informasi berhasil & Redirect ke login
                    showStatus(`✅ ${result.message}`, true);
                    
                    // Redirect ke login.html setelah 2 detik
                    setTimeout(() => {
                        window.location.href = '/login.html'; 
                    }, 2000); 

                } else {
                    // (f) Informasi gagal (Error dari Server)
                    showStatus(`❌ ${result.message}`, false);
                }
            } catch (error) { 
                showStatus('Gagal mendaftar. Tidak dapat terhubung ke server.', false); 
            }
        });
    }
});