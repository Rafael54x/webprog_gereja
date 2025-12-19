const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { isAdmin } = require('../middleware/authMiddleware');
const upload = require('../config/galleryMedia'); 

router.get('/', galleryController.getItems);
router.post('/upload', isAdmin, upload.single('mediaFile'), galleryController.uploadItem);
router.delete('/:id', isAdmin, galleryController.deleteItem);

module.exports = router;