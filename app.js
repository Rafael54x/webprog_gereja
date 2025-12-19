const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ----------------------------------------------------------------
// 💡 VIEW ENGINE CONFIGURATION (TAMBAHAN BARU)
// ----------------------------------------------------------------
app.set('view engine', 'ejs'); // Mengatur EJS sebagai engine template
app.set('views', path.join(__dirname, 'views')); // Folder untuk file .ejs

// 🛑 DEBUGGING KRITIS (Hapus setelah masalah teratasi)
console.log('----------------------------------------------------');
console.log('LOKASI SERVER (__dirname):', __dirname);
console.log('LOKASI FOLDER EVENT: ' + path.resolve(__dirname, 'public', 'eventPosters'));
console.log('----------------------------------------------------');

// ----------------------------------------------------------------
// 💡 STATIC FILE SERVING 
// ----------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use('/galleryMedia', express.static(path.join(__dirname, 'public', 'galleryMedia')));
app.use('/eventPosters', express.static(path.resolve(__dirname, 'public', 'eventPosters')));

// ----------------------------------------------------------------
// Middleware dasar
// ----------------------------------------------------------------
app.use(cors({ 
    origin: 'null', 
    credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key_anda',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Aplikasi backend berjalan dengan baik.',
        timestamp: new Date().toISOString()
    });
});

// Koneksi Database
const db = require('./config/db'); 

// ----------------------------------------------------------------
// Import Routes
// ----------------------------------------------------------------
const authRoutes = require('./routes/auth');
const jemaatRoutes = require('./routes/jemaat');
const galleryRoutes = require('./routes/gallery');
const kritikRoutes = require('./routes/kritik');
const eventRoutes = require('./routes/event');
const transactionRoutes = require('./routes/transaction'); 
const merchRoutes = require('./routes/merch');

// ----------------------------------------------------------------
// 💡 ADMIN / FRONTEND ROUTES (TAMBAHAN UNTUK DISPLAY HALAMAN)
// ----------------------------------------------------------------
// Route untuk menampilkan halaman laporan stok secara langsung
app.get('/admin/laporan-stok', (req, res) => {
    res.render('admin/laporan_stok'); // Ini memanggil file views/admin/laporan_stok.ejs
});

// ----------------------------------------------------------------
// Gunakan Routes API
// ----------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/jemaat', jemaatRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/kritik', kritikRoutes);
app.use('/api/event', eventRoutes); 
app.use('/api/transaction', transactionRoutes); 
app.use('/api/merch', merchRoutes);

const PORT = process.env.PORT || 30297;
app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));