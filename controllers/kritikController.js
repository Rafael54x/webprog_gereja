// File: controllers/kritikController.js
const db = require('../config/db');

/**
 * Menyimpan kritik dan saran (ANONIM) ke database.
 */
exports.createKritik = async (req, res) => {
    const { isi_saran } = req.body;

    if (!isi_saran) {
        return res.status(400).json({ message: 'Kritik dan saran tidak boleh kosong.' });
    }

    // Query INSERT disederhanakan, hanya menyimpan isi_saran
    const query = 'INSERT INTO kritik_saran (isi_saran) VALUES (?)';
    
    try {
        // Hanya kirim isi_saran, tidak perlu jemaat_id
        await db.query(query, [isi_saran]);
        res.status(201).json({ message: 'Terima kasih, masukan Anda telah kami terima.' });
    } catch (err) {
        // Jika terjadi error, catat di konsol server dan kirim pesan ke pengguna
        console.error("Database Error:", err);
        res.status(500).json({ message: 'Server Error saat menyimpan masukan.' });
    }
};

/**
 * Admin: Mengambil semua data kritik dan saran.
 */
exports.getAllKritik = async (req, res) => {
    // Query SELECT disederhanakan, tidak perlu JOIN
    const query = 'SELECT id_saran, isi_saran, tanggal_kirim FROM kritik_saran ORDER BY tanggal_kirim DESC';
    
    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ message: 'Server Error saat mengambil data.' });
    }
};