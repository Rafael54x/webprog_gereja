// routes/admin.js
const express = require('express');
const router = express.Router();
const merchController = require('../controllers/merchController');

// Route untuk menampilkan halaman (Render HTML)
router.get('/laporan', (req, res) => {
    res.render('admin/laporan_stok'); // Ini akan memanggil file .ejs tadi
});

// Route API untuk ambil datanya (Data JSON dari database)
router.get('/api/report-data', merchController.getStockMovementReport);