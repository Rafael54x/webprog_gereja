// routes/transaction.js

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { isLoggedIn } = require('../middleware/authMiddleware'); 

// Route Simpan Transaksi Multi-Row
router.post('/save', isLoggedIn, transactionController.saveTransaction);

// Route Laporan Transaksi (Bisa diakses tanpa auth atau dengan auth, tergantung kebijakan)
router.get('/report', transactionController.getReport);

// Route BARU untuk Detail Transaksi berdasarkan ID
router.get('/detail/:id', transactionController.getTransactionDetail);

module.exports = router;