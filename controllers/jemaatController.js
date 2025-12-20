const db = require('../config/db');

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

// Test endpoint to debug session
exports.testSession = async (req, res) => {
    console.log('=== SESSION TEST ===');
    console.log('Session:', req.session);
    console.log('Session user:', req.session.user);
    res.json({ 
        hasSession: !!req.session,
        hasUser: !!req.session.user,
        user: req.session.user 
    });
};

exports.getJemaatProfile = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const [jemaat] = await db.query('SELECT * FROM master_jemaat WHERE user_id = ?', [userId]);
        
        if (jemaat.length === 0) {
            // Create empty profile if not exists
            const emptyProfile = {
                id: null,
                nama_lengkap: req.session.user.nama_lengkap || '',
                email: '',
                nomor_telepon: '',
                alamat: '',
                tempat_lahir: '',
                tanggal_lahir: null,
                jenis_kelamin: 'Laki-laki', // Default frontend format
                foto_profile_url: '',
                user_id: userId
            };
            return res.json(emptyProfile);
        }
        
        // Convert database format to frontend format
        const profile = jemaat[0];
        if (profile.jenis_kelamin) {
            profile.jenis_kelamin = profile.jenis_kelamin === 'L' ? 'Laki-laki' : 
                                   profile.jenis_kelamin === 'P' ? 'Perempuan' : 
                                   profile.jenis_kelamin;
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Error loading profile:', error);
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
            
        if (!nama_lengkap) {
            return res.status(400).json({ message: 'Nama lengkap wajib diisi.' });
        }

        // Convert empty strings to null and handle jenis_kelamin conversion
        const cleanData = {
            nama_lengkap: nama_lengkap || null,
            email: email || null,
            nomor_telepon: nomor_telepon || null,
            alamat: alamat || null,
            tempat_lahir: tempat_lahir || null,
            tanggal_lahir: tanggal_lahir || null,
            jenis_kelamin: jenis_kelamin === 'Laki-laki' ? 'L' : 
                          jenis_kelamin === 'Perempuan' ? 'P' : null,
            foto_profile_url: foto_profile_url || null
        };

        // Update users table
        await db.query('UPDATE users SET nama_lengkap = ? WHERE id = ?', [cleanData.nama_lengkap, userId]);

        // Check if jemaat record exists
        const [existing] = await db.query('SELECT id FROM master_jemaat WHERE user_id = ?', [userId]);
        
        if (existing.length === 0) {
            // Insert new record
            const insertQuery = `
                INSERT INTO master_jemaat 
                (nama_lengkap, email, nomor_telepon, alamat, tempat_lahir, tanggal_lahir, jenis_kelamin, foto_profile_url, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(insertQuery, [cleanData.nama_lengkap, cleanData.email, cleanData.nomor_telepon, cleanData.alamat, cleanData.tempat_lahir, cleanData.tanggal_lahir, cleanData.jenis_kelamin, cleanData.foto_profile_url, userId]);
        } else {
            // Update existing record
            const updateQuery = `
                UPDATE master_jemaat 
                SET nama_lengkap = ?, email = ?, nomor_telepon = ?, alamat = ?, tempat_lahir = ?, 
                    tanggal_lahir = ?, jenis_kelamin = ?, foto_profile_url = ?
                WHERE user_id = ?
            `;
            await db.query(updateQuery, [cleanData.nama_lengkap, cleanData.email, cleanData.nomor_telepon, cleanData.alamat, cleanData.tempat_lahir, cleanData.tanggal_lahir, cleanData.jenis_kelamin, cleanData.foto_profile_url, userId]);
        }

        if (req.session.user) {
            req.session.user.nama_lengkap = cleanData.nama_lengkap;
        }

        res.status(200).json({ message: 'Profil berhasil diperbarui.' });

    } catch (error) {
        console.error('SERVER ERROR SAAT UPDATE PROFIL:', error);
        res.status(500).json({ message: 'Terjadi kesalahan di server.' });
    }
};