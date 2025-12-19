// controllers/transactionController.js

const db = require('../config/db'); // Sesuaikan jika Anda menggunakan '../config/db'
const { isLoggedIn } = require('../middleware/authMiddleware'); // Pastikan path benar

// =========================================================
// Logika Transaksi: Simpan Multi-Row (Kriteria 5a)
// =========================================================
exports.saveTransaction = async (req, res) => {
    // ... (Fungsi saveTransaction tetap sama) ...
    const { items } = req.body; 
    const userId = req.session.user ? req.session.user.id : null; 
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Anda harus login untuk mencatat transaksi.' });
    }
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Minimal harus ada satu item transaksi.' });
    }

    try {
        await db.query('START TRANSACTION'); 

        // 1. Hitung Total dan Insert Header Transaksi
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const headerQuery = 'INSERT INTO transactions (user_id, total_amount, transaction_date) VALUES (?, ?, NOW())';
        const [headerResult] = await db.query(headerQuery, [userId, totalAmount]);
        const transactionId = headerResult.insertId;

        // 2. Insert Multiple Rows (Detail Items) - Kriteria 5a
        const itemQuery = 'INSERT INTO transaction_items (transaction_id, item_description, amount) VALUES (?, ?, ?)';
        
        for (const item of items) {
            await db.query(itemQuery, [transactionId, item.description, item.amount]);
        }
        
        await db.query('COMMIT'); 

        return res.status(201).json({ 
            success: true, 
            message: `Transaksi berhasil disimpan. Total: Rp${totalAmount.toLocaleString('id-ID')}.`,
            id: transactionId
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error saat menyimpan transaksi multi-row:", error);
        return res.status(500).json({ success: false, message: 'Gagal menyimpan transaksi.' });
    }
};

// =========================================================
// Logika Laporan: Report & Search/Filter (Kriteria 5b, 5c)
// =========================================================
exports.getReport = async (req, res) => {
    // ... (Fungsi getReport tetap sama) ...
    const searchQuery = req.query.q || '';

    let sql = `
        SELECT t.id, t.transaction_date, t.total_amount, u.username
        FROM transactions t
        JOIN users u ON t.user_id = u.id
    `;
    const params = [];

    if (searchQuery) {
        // Mencari berdasarkan total amount atau username
        sql += ` WHERE t.total_amount LIKE ? OR u.username LIKE ?`; 
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    sql += ` ORDER BY t.transaction_date DESC`;

    try {
        const [transactions] = await db.query(sql, params);
        
        // Kriteria 5b: Menampilkan Laporan
        return res.json({ success: true, transactions: transactions });

    } catch (error) {
        console.error("Error fetching transaction report:", error);
        return res.status(500).json({ success: false, message: 'Gagal memuat laporan transaksi.' });
    }
};

// =========================================================
// Logika Detail Transaksi (Fungsi Baru)
// =========================================================
exports.getTransactionDetail = async (req, res) => {
    const { id } = req.params;

    // Query untuk mengambil data header transaksi dan semua item terkait
    const detailQuery = `
        SELECT 
            t.id, 
            t.transaction_date, 
            t.total_amount, 
            u.username as user_pencatat,
            ti.item_description,
            ti.amount as item_amount
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
        WHERE t.id = ?
        ORDER BY ti.id ASC
    `;

    try {
        const [rows] = await db.query(detailQuery, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }

        // Memproses hasil query menjadi satu objek detail (Header + Array Items)
        const header = {
            id: rows[0].id,
            transaction_date: rows[0].transaction_date,
            total_amount: rows[0].total_amount,
            user_pencatat: rows[0].user_pencatat,
            items: []
        };

        rows.forEach(row => {
            // Hanya tambahkan item jika memang ada (untuk kasus transaksi tanpa item)
            if (row.item_description) {
                header.items.push({
                    description: row.item_description,
                    amount: row.item_amount
                });
            }
        });

        return res.json({ success: true, transaction: header });

    } catch (error) {
        console.error("Error fetching transaction detail:", error);
        return res.status(500).json({ success: false, message: 'Gagal memuat detail transaksi.' });
    }
};