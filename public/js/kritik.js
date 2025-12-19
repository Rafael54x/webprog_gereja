document.addEventListener('DOMContentLoaded', async () => {
    const jemaatView = document.getElementById('jemaat-view');
    const adminView = document.getElementById('admin-view');
    const formKritik = document.getElementById('form-kritik');
    const pesanSukses = document.getElementById('pesan-sukses');
    const listKritik = document.getElementById('list-kritik');

    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();

        if (!data.success) {
            window.location.href = '/login.html';
            return;
        }

        if (data.user.role === 'admin') {
            adminView.style.display = 'block';
            loadKritikSaran();
        } else {
            jemaatView.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal memverifikasi status login.');
    }

    async function loadKritikSaran() {
        try {
            const res = await fetch('/api/kritik', { credentials: 'include' });
            if (!res.ok) throw new Error('Gagal mengambil data masukan. Anda harus menjadi admin.');
            
            const daftarKritik = await res.json();

            if (daftarKritik.length === 0) {
                listKritik.innerHTML = '<p>Belum ada masukan yang diterima.</p>';
                return;
            }

            listKritik.innerHTML = '';
            daftarKritik.forEach(kritik => {
                const div = document.createElement('div');
                div.style.cssText = 'border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px;';
                
                // Tampilan diubah menjadi anonim (tanpa nama pengirim)
                div.innerHTML = `
                    <blockquote style="margin: 0 0 10px 0; padding-left: 15px; border-left: 3px solid #ccc; font-style: italic;">"${kritik.isi_saran}"</blockquote>
                    <small>Dikirim pada: ${new Date(kritik.tanggal_kirim).toLocaleString('id-ID')}</small>
                `;
                listKritik.appendChild(div);
            });
        } catch (error) {
            console.error(error);
            listKritik.innerHTML = `<p>${error.message}</p>`;
        }
    }

    formKritik.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isi_saran = e.target.isi_saran.value;
        pesanSukses.textContent = '';
        try {
            const res = await fetch('/api/kritik', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isi_saran }),
                credentials: 'include'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Gagal mengirim masukan.');
            pesanSukses.textContent = result.message;
            formKritik.reset();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });
});