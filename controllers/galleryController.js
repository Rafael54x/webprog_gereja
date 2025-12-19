const db = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.uploadItem = async (req, res) => {
    const { caption, event_name } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'File tidak ditemukan.' });
    }
    const file_type = req.file.mimetype.startsWith('image') ? 'image' : 'video';
    const file_path = '/galleryMedia/' + req.file.filename;

    try {
        const query = 'INSERT INTO gallery_items (file_path, file_type, caption, event_name) VALUES (?, ?, ?, ?)';
        await db.query(query, [file_path, file_type, caption, event_name]);
        res.status(201).json({ message: 'Media berhasil diunggah!' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error saat menyimpan data media.' });
    }
};

exports.getItems = async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM gallery_items ORDER BY upload_date DESC');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error saat mengambil data galeri.' });
    }
};
exports.deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const [items] = await db.query('SELECT file_path FROM gallery_items WHERE id = ?', [id]);
        if (items.length === 0) {
            return res.status(404).json({ message: 'Item tidak ditemukan.' });
        }
        const filePath = items[0].file_path;
        await db.query('DELETE FROM gallery_items WHERE id = ?', [id]);
        const absolutePath = path.join(__dirname, '..', 'public', filePath);
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Gagal menghapus file fisik:", err);
        });
        res.json({ message: 'Media berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error saat menghapus media.' });
    }
};