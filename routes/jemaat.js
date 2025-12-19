const express = require('express');
const router = express.Router();
const jemaatController = require('../controllers/jemaatController');
const { isAdmin, isLoggedIn } = require('../middleware/authMiddleware'); 

// ==========================================================
// RUTE JEMAAT PROFILE (DAPAT DIAKSES OLEH JEMAAT BIASA)
// ==========================================================
// Sekarang isLoggedIn sudah didefinisikan!
router.get('/me', isLoggedIn, jemaatController.getJemaatProfile); 
router.put('/me', isLoggedIn, jemaatController.updateJemaatProfile); 
// ==========================================================


router.use(isAdmin); // Hanya Admin yang bisa mengakses modul di bawah ini

// Rute CRUD Admin
router.get('/', jemaatController.getAllJemaat);
router.post('/', jemaatController.createJemaat);
router.put('/:id', jemaatController.updateJemaat);
router.delete('/:id', jemaatController.deleteJemaat);


module.exports = router;