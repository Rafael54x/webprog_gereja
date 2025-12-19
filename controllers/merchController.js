const db = require('../config/database'); 
const path = require('path'); 

// ==========================================
// 1. PRODUK (JEMAAT & ADMIN)
// ==========================================

exports.getProducts = async (req, res) => {
    try {
        const [products] = await db.query('SELECT id, name, description, price, stock, image_url AS imageUrl FROM merchandise_products ORDER BY name');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat produk.' });
    }
};

exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const [product] = await db.query('SELECT * FROM merchandise_products WHERE id = ?', [id]);
        if (product.length === 0) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
        res.json({ success: true, data: product[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error server.' });
    }
};

// ==========================================
// 2. TRANSAKSI JEMAAT (CHECKOUT)
// ==========================================

exports.checkout = async (req, res) => {
    const { items, customer_name, customer_address, customer_phone, shipping_mode, shipping_cost } = req.body; 
    const userId = req.session.user ? req.session.user.id : null;
    
    if (!userId) return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
    if (!customer_name) return res.status(400).json({ success: false, message: 'Nama penerima wajib diisi!' });

    try {
        await db.query('START TRANSACTION');

        // Sinkronisasi data ke Master Tujuan
        const syncCustomerQuery = `
    INSERT INTO merchandise_customers (user_id, name, address, phone)
    VALUES (?, ?, ?, ?)
`;
        await db.query(syncCustomerQuery, [userId, customer_name, customer_address, customer_phone]);
        
        let subtotal = 0;
        for (const item of items) {
            const [prod] = await db.query('SELECT stock, price, name FROM merchandise_products WHERE id = ?', [item.product_id]);
            if (prod.length === 0) throw new Error(`Produk tidak ditemukan.`);
            if (prod[0].stock < item.quantity) throw new Error(`Stok "${prod[0].name}" tidak mencukupi.`);
            subtotal += prod[0].price * item.quantity;
        }

        const finalTotal = subtotal + parseFloat(shipping_cost || 0);

        // Header Transaksi
        const [header] = await db.query(`
            INSERT INTO sales_transactions 
            (user_id, total_paid, transaction_date, status, customer_name, customer_address, shipping_cost, shipping_mode) 
            VALUES (?, ?, NOW(), 'PAID', ?, ?, ?, ?)
        `, [userId, finalTotal, customer_name, customer_address, shipping_cost, shipping_mode]);

        // Detail Transaksi, Update Stok, dan Catat Log Keluar (OUT)
        for (const item of items) {
            await db.query('INSERT INTO sales_items (sales_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)', 
                [header.insertId, item.product_id, item.quantity, item.price_at_sale]);
            
            await db.query('UPDATE merchandise_products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
            
            await db.query('INSERT INTO inventory_logs (product_id, type, quantity, transaction_date) VALUES (?, "OUT", ?, NOW())', 
                [item.product_id, item.quantity]);
        }
        
        await db.query('COMMIT'); 
        res.status(201).json({ success: true, message: 'Pembelian Berhasil!', total_paid: finalTotal });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. MANAJEMEN INVENTARIS (ADMIN)
// ==========================================

exports.inventoryIn = async (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Daftar barang kosong.' });

    try {
        await db.query('START TRANSACTION');
        for (const item of items) {
            await db.query('UPDATE merchandise_products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
            await db.query('INSERT INTO inventory_logs (product_id, type, quantity, transaction_date) VALUES (?, "IN", ?, NOW())', 
                [item.product_id, item.quantity]);
        }
        await db.query('COMMIT');
        res.json({ success: true, message: 'Stok berhasil ditambahkan!' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Gagal memproses barang masuk.' });
    }
};

exports.inventoryOut = async (req, res) => {
    const { product_id, quantity } = req.body;
    try {
        const [prod] = await db.query('SELECT stock FROM merchandise_products WHERE id = ?', [product_id]);
        if (prod[0].stock < quantity) return res.status(400).json({ success: false, message: 'Stok kurang.' });

        await db.query('START TRANSACTION');
        await db.query('UPDATE merchandise_products SET stock = stock - ? WHERE id = ?', [quantity, product_id]);
        await db.query('INSERT INTO inventory_logs (product_id, type, quantity, transaction_date) VALUES (?, "OUT", ?, NOW())', 
            [product_id, quantity]);
        await db.query('COMMIT');
        res.json({ success: true, message: 'Stok berhasil dikurangi.' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Gagal mengurangi stok.' });
    }
};

exports.getStockMovementReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Tanggal harus diisi.' });

    try {
        const sql = `
            SELECT 
                mp.id AS product_id,
                mp.name AS product_name,
                COALESCE((SELECT SUM(quantity) FROM inventory_logs WHERE product_id = mp.id AND type = 'IN' AND transaction_date BETWEEN ? AND ?), 0) AS masuk,
                COALESCE((SELECT SUM(quantity) FROM inventory_logs WHERE product_id = mp.id AND type = 'OUT' AND transaction_date BETWEEN ? AND ?), 0) AS keluar,
                mp.stock AS stok_akhir
            FROM merchandise_products mp
            ORDER BY mp.id ASC
        `;
        const start = startDate + ' 00:00:00';
        const end = endDate + ' 23:59:59';
        const [report] = await db.query(sql, [start, end, start, end]);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat laporan.' });
    }
};

// ==========================================
// 4. MASTER DATA & CRUD (ADMIN)
// ==========================================

exports.getCustomers = async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM merchandise_customers ORDER BY created_at DESC');
        res.json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat data pelanggan.' });
    }
};

exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { name, address, phone } = req.body;
    try {
        await db.query('UPDATE merchandise_customers SET name = ?, address = ?, phone = ? WHERE id = ?', [name, address, phone, id]);
        res.json({ success: true, message: 'Data pelanggan diperbarui.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui data.' });
    }
};

exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM merchandise_customers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Data pelanggan dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const [report] = await db.query(`
            SELECT st.id AS sales_id, st.transaction_date, st.customer_name, st.customer_address, 
                   st.shipping_mode, st.shipping_cost, st.total_paid, u.username, 
                   GROUP_CONCAT(CONCAT(si.quantity, 'x ', mp.name) SEPARATOR '; ') AS items_sold
            FROM sales_transactions st
            JOIN users u ON st.user_id = u.id
            JOIN sales_items si ON st.id = si.sales_id
            JOIN merchandise_products mp ON si.product_id = mp.id
            GROUP BY st.id ORDER BY st.transaction_date DESC
        `);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat laporan.' });
    }
};

exports.createProduct = async (req, res) => {
    const { name, description, price, stock } = req.body;
    const imageUrl = req.file ? req.file.filename : null;
    try {
        await db.query('INSERT INTO merchandise_products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)', [name, description, price, stock, imageUrl]);
        res.status(201).json({ success: true, message: 'Produk ditambahkan.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menambah produk.' });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, existingImageUrl } = req.body;
    const newImageUrl = req.file ? req.file.filename : existingImageUrl;
    try {
        await db.query('UPDATE merchandise_products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?', [name, description, price, stock, newImageUrl, id]);
        res.json({ success: true, message: 'Produk diperbarui.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui produk.' });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM merchandise_products WHERE id = ?', [id]);
        res.json({ success: true, message: 'Produk dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
    }
};
