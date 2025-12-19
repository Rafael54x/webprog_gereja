const db = require('../config/database');
const bcrypt = require('bcryptjs');

// =========================================================
// FUNGSI VALIDASI PASSWORD KOMPLEKS (UNTUK KRITERIA UAS)
// =========================================================
function validatePassword(password) {
    const minLength = 8;
    // Regex: Minimal 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol underscore (_)
    const regex = new RegExp(
        `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*_).{${minLength},}$`
    );
    return regex.test(password);
}
// =========================================================


exports.register = async (req, res) => {
    // Tambahkan retype_password dari body request
    const { nama_lengkap, username, password, retype_password, role = 'jemaat' } = req.body; 
    
    if (!nama_lengkap || !username || !password || !retype_password) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi, termasuk Ulangi Password.' });
    }

    // 1. Validasi Retype Password
    if (password !== retype_password) {
        return res.status(400).json({ success: false, message: 'Password dan Ulangi Password tidak cocok.' });
    }

    // 2. Validasi Kompleksitas Password (KRITERIA UAS)
    if (!validatePassword(password)) {
        return res.status(400).json({ 
            success: false, 
            message: `Password harus minimal 8 karakter, mengandung setidaknya 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol underscore (_).` 
        });
    }

    try {
        // Cek duplikasi username (tetap dipertahankan)
        const [existing] = await db.query('SELECT username FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Username sudah digunakan.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (nama_lengkap, username, password, role) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [nama_lengkap, username, hashedPassword, role]);
        const newUserId = result.insertId;

        // Integrasi dengan master_jemaat (sesuai logika asli Anda)
        await db.query('INSERT INTO master_jemaat (nama_lengkap, user_id) VALUES (?, ?)', [nama_lengkap, newUserId]);

        // Informasi berhasil (KRITERIA UAS: Signup berhasil)
        res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
        
    } catch (error) {
        // Tangani ER_DUP_ENTRY secara spesifik jika terjadi di luar pengecekan awal
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username sudah digunakan.' });
        }
        console.error("Server error saat registrasi:", error);
        res.status(500).json({ success: false, message: 'Server error saat registrasi.' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }
        req.session.user = { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error : ' + error.message });
    }
};

exports.status = (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Anda berhasil logout' });
    });
};