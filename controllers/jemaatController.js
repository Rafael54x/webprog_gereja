const db = require('../config/database');

// ==========================================================
// FUNGSI UNTUK ADMIN (CRUD dan FILTER/SORT)
// ==========================================================

exports.getAllJemaat = async (req, res) => {
    try {
        const { search, sort_by, sort_order } = req.query;
        const sortByField = ['id', 'nama_lengkap', 'tanggal_lahir'].includes(sort_by) ? sort_by : 'nama_lengkap';
        const sortOrderDirection = sort_order === 'DESC' ? 'DESC' : 'ASC';

        let query = 'SELECT * FROM master_jemaat';
        const queryParams = [];

        if (search) {
            query += ' WHERE nama_lengkap LIKE ? OR email LIKE ?';
            queryParams.push(`%${search}%`);
            queryParams.push(`%${search}%`);
        }

        query += ` ORDER BY ${sortByField} ${sortOrderDirection}`;

        const [jemaat] = await db.query(query, queryParams);
        res.json(jemaat);
    } catch (error) { 
        console.error('Error fetching jemaat data:', error);
        res.status(500).json({ message: 'Server Error saat memuat data jemaat.' }); 
    }
};

exports.createJemaat = async (req, res) => {
    const { nama_lengkap, alamat, nomor_telepon, tanggal_lahir, jenis_kelamin } = req.body;
    if (!nama_lengkap) { return res.status(400).json({ message: 'Nama lengkap wajib diisi' }); }
    try {
        const query = 'INSERT INTO master_jemaat (nama_lengkap, alamat, nomor_telepon, tanggal_lahir, jenis_kelamin) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [nama_lengkap, alamat, nomor_telepon, tanggal_lahir, jenis_kelamin]);
        res.status(201).json({ message: 'Data jemaat berhasil ditambahkan' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.updateJemaat = async (req, res) => {
    const { id } = req.params;
    const { nama_lengkap, alamat, nomor_telepon, tanggal_lahir, jenis_kelamin } = req.body;
    if (!nama_lengkap) { return res.status(400).json({ message: 'Nama lengkap wajib diisi' }); }
    try {
        const query = 'UPDATE master_jemaat SET nama_lengkap = ?, alamat = ?, nomor_telepon = ?, tanggal_lahir = ?, jenis_kelamin = ? WHERE id = ?';
        await db.query(query, [nama_lengkap, alamat, nomor_telepon, tanggal_lahir, jenis_kelamin, id]);
        res.json({ message: 'Data jemaat berhasil diperbarui' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

exports.deleteJemaat = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM master_jemaat WHERE id = ?', [id]);
        res.json({ message: 'Data jemaat berhasil dihapus' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// ==========================================================
// FUNGSI PROFIL JEMAAT (Modul 'Profil Saya' - Read & Update)
// ==========================================================

exports.getJemaatProfile = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const [jemaat] = await db.query('SELECT * FROM master_jemaat WHERE user_id = ?', [userId]);
        if (jemaat.length === 0) {
            return res.status(404).json({ message: 'Data profil tidak ditemukan.' });
        }
        res.json(jemaat[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error saat memuat profil.' });
    }
};

exports.updateJemaatProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        if (!userId) {
            return res.status(401).json({ message: 'Sesi tidak valid. Silakan login kembali.' });
        }

        const {
            nama_lengkap,
            email,
            nomor_telepon,
            alamat,
            tempat_lahir,
            tanggal_lahir,
            jenis_kelamin,
            foto_profile_url
        } = req.body;
            
        if (!nama_lengkap || !email) {
            return res.status(400).json({ message: 'Nama lengkap dan email wajib diisi.' });
        }

        const userQuery = 'UPDATE users SET nama_lengkap = ? WHERE id = ?';
        await db.query(userQuery, [nama_lengkap, userId]);

        const jemaatQuery = `
            UPDATE master_jemaat 
            SET nomor_telepon = ?, alamat = ?, tempat_lahir = ?, 
                tanggal_lahir = ?, jenis_kelamin = ?, email = ?, foto_profile_url = ?
            WHERE user_id = ?
        `;
        const jemaatValues = [
            nomor_telepon,
            alamat,
            tempat_lahir,
            tanggal_lahir,
            jenis_kelamin,
            email,
            foto_profile_url,
            userId
        ];
        await db.query(jemaatQuery, jemaatValues);

        if (req.session.user) {
            req.session.user.nama_lengkap = nama_lengkap;
        }

        res.status(200).json({ message: 'Profil berhasil diperbarui.' });

    } catch (error) {
        console.error('SERVER ERROR SAAT UPDATE PROFIL:', error);
        res.status(500).json({ message: 'Terjadi kesalahan di server. Periksa kembali nama kolom database.' });
    }
};