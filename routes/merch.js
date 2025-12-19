const express = require('express');
const router = express.Router();
const merchController = require('../controllers/merchController');
const { isLoggedIn, isAdmin } = require('../middleware/authMiddleware'); 
const upload = require('../config/multerMerchConfig');

// 1. GET /products: Daftar semua merchandise (Publik/Jemaat)
router.get('/products', merchController.getProducts);

// 2. GET /products/:id: Ambil data satu produk untuk Edit
router.get('/products/:id', merchController.getProductById); 

// 3. POST /checkout: Menyimpan transaksi penjualan (Jemaat)
router.post('/checkout', isLoggedIn, merchController.checkout);

// 4. GET /report: Laporan Penjualan (Admin Only)
router.get('/report', isAdmin, merchController.getSalesReport);

// ⭐ BARU: GET /customers: Mengambil data Master Tujuan (Admin Only)
router.get('/customers', isAdmin, merchController.getCustomers);

// 5. CRUD Produk (Admin Only)
router.post('/product', isAdmin, upload.single('imageFile'), merchController.createProduct);
router.put('/product/:id', isAdmin, upload.single('imageFile'), merchController.updateProduct);
router.delete('/product/:id', isAdmin, merchController.deleteProduct);

// 6. Inventaris (Masuk & Keluar)
router.post('/inventory-in', isAdmin, merchController.inventoryIn);

// routes/merch.js
// ... rute lainnya ...

router.put('/customer/:id', isAdmin, merchController.updateCustomer);
router.delete('/customer/:id', isAdmin, merchController.deleteCustomer);

router.get('/stock-report', isAdmin, merchController.getStockMovementReport);

// ...

module.exports = router;