// File: routes/kritik.js

const express = require('express');
const router = express.Router();
const kritikController = require('../controllers/kritikController');

// Panggil middleware dengan cara destrukturisasi (ambil "alat" dari "kotak perkakas")
const { isLoggedIn, isAdmin } = require('../middleware/authMiddleware');

// Rute untuk Jemaat (cukup login)
router.post('/', isLoggedIn, kritikController.createKritik);

// Rute untuk Admin (harus login DAN admin)
router.get('/', isLoggedIn, isAdmin, kritikController.getAllKritik);

module.exports = router; 