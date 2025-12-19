document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profile-form');
    const loadingMessage = document.getElementById('loading-profile');

    async function muatProfile() {
        try {
            // 1. Mengambil data profil dari server
            const response = await fetch('/api/jemaat/me');
            
            // Redirect ke login jika sesi berakhir (401/403)
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error('Gagal memuat data profil dari server.');
            }
            
            const data = await response.json();
            
            // 2. Mengisi form dengan data dari database
            if (form.nama_lengkap) form.nama_lengkap.value = data.nama_lengkap || '';
            if (form.email) form.email.value = data.email || '';
            if (form.nomor_telepon) form.nomor_telepon.value = data.nomor_telepon || '';
            if (form.alamat) form.alamat.value = data.alamat || '';
            if (form.tempat_lahir) form.tempat_lahir.value = data.tempat_lahir || '';
            if (form.jenis_kelamin) form.jenis_kelamin.value = data.jenis_kelamin || 'Laki-laki'; 
            
            // Penanganan Tanggal Lahir (format YYYY-MM-DD)
            if (form.tanggal_lahir) {
                if (data.tanggal_lahir) {
                    form.tanggal_lahir.value = data.tanggal_lahir.split('T')[0];
                } else {
                    form.tanggal_lahir.value = '';
                }
            }
            
            // 3. Tampilkan form dan sembunyikan pesan loading
            if (loadingMessage) loadingMessage.style.display = 'none';
            form.style.display = 'block'; // Menggunakan block karena layout tanpa foto
            
        } catch (error) {
            if (loadingMessage) {
                loadingMessage.innerHTML = `<span style="color: #dc3545;">Gagal memuat profil. Pastikan data 'user_id' di database master_jemaat sudah benar.</span>`;
            }
            console.error('Error memuat profil:', error);
        }
    }

    // Listener untuk Simpan Perubahan (UPDATE)
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/jemaat/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('Profil berhasil diperbarui!');
                    muatProfile(); // Muat ulang data untuk verifikasi
                    
                    // Muat ulang status navbar (jika ada fungsi global untuk update nama user)
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI(); 
                    } else {
                        fetch('/api/auth/status'); 
                    }
                    
                } else {
                    alert('Gagal memperbarui: ' + (result.message || 'Terjadi kesalahan'));
                }
                
            } catch (error) {
                console.error(error);
                alert('Tidak dapat terhubung ke server untuk menyimpan data.');
            }
        });
    }

    muatProfile();
});