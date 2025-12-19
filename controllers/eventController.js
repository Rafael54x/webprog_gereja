// File: controllers/eventController.js

const db = require('../config/database'); 
const fs = require('fs').promises; // Import fs dengan Promise untuk hapus file
const path = require('path');     // Import path

// 1. FUNGSI: Tambah Event (Dipanggil dari router.post("/tambah"))
exports.tambahEvent = async (req, res) => {
    // Debugging untuk memastikan Multer mengirim data dengan benar ke Controller
    console.log("------------------ UPLOAD EVENT CONTROLLER DEBUG ------------------");
    // ... (Logika debug, body, dan file) ...
    console.log("---------------------------------------------------------------------");

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Gagal mengunggah poster (file tidak terdeteksi)." });
    }
    
    const { nama_event, link_gform } = req.body;
    const poster = req.file.filename;

    if (!nama_event || !poster) {
        return res.status(400).json({ success: false, message: "Nama event dan poster wajib diisi." });
    }

    const sql = "INSERT INTO events (nama_event, poster, link_gform) VALUES (?, ?, ?)";
    
    try {
        const [result] = await db.query(sql, [nama_event, poster, link_gform]);
        
        console.log(`✅ Event BERHASIL INSERT di Controller! ID: ${result.insertId}`);
        return res.status(201).json({ 
            success: true, 
            message: "Event berhasil disimpan!",
        });

    } catch (err) {
        console.error("❌ Gagal simpan event ke DB dari Controller:", err.message);
        let userMessage = "Gagal menyimpan event ke database.";
        return res.status(500).json({ success: false, message: userMessage });
    }
};

// 2. FUNGSI: Ambil Daftar Event (Dipanggil dari router.get("/daftar"))
exports.getDaftar = async (req, res) => {
    // ... (Logika SELECT dari events) ...
    const searchQuery = req.query.q; 
    
    let sql = "SELECT * FROM events";
    let params = []; 

    if (searchQuery) {
        sql += " WHERE nama_event LIKE ?"; 
        params.push(`%${searchQuery}%`); 
    }
    
    sql += " ORDER BY id_event ASC"; 

    try {
        const [results] = await db.query(sql, params); 
        
        return res.json({
            success: true,
            data: results
        });
        
    } catch (err) {
        console.error("❌ Gagal ambil data event dari Controller:", err);
        return res.status(500).json({
            success: false,
            message: "Gagal memuat daftar event dari database."
        });
    }
};

// 3. FUNGSI: Hapus Event (Dipanggil dari router.delete("/:id"))
exports.deleteEvent = async (req, res) => {
    const eventId = req.params.id; 
    
    // 1. Ambil nama file poster dari DB sebelum dihapus
    const sqlSelect = "SELECT poster FROM events WHERE id_event = ?";
    let posterFilename;
    
    try {
        const [rows] = await db.query(sqlSelect, [eventId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Event tidak ditemukan." });
        }
        
        posterFilename = rows[0].poster;
        
        // 2. Hapus data event dari database
        const sqlDelete = "DELETE FROM events WHERE id_event = ?";
        const [result] = await db.query(sqlDelete, [eventId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Gagal menghapus event dari database (ID tidak valid)." });
        }

        // 3. Hapus file poster dari server
        if (posterFilename) {
            const filePath = path.join(__dirname, '..', 'public', 'eventPosters', posterFilename);
            
            // Menggunakan fs.promises.unlink untuk menghapus file secara async
            await fs.unlink(filePath);
            console.log(`✅ File poster ${posterFilename} berhasil dihapus.`);
        }

        console.log(`✅ Event ID ${eventId} berhasil dihapus dari DB dan disk.`);
        return res.json({ success: true, message: "Event berhasil dihapus." });

    } catch (error) {
        if (error.code === 'ENOENT') {
             console.log(`⚠️ Data DB terhapus, tetapi File ${posterFilename} tidak ditemukan di disk.`);
             return res.json({ success: true, message: "Event berhasil dihapus, meskipun file poster sudah hilang." });
        }
        
        console.error("❌ Gagal menghapus event:", error);
        return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat penghapusan." });
    }
};