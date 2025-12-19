const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const eventController = require("../controllers/eventController");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'eventPosters'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.post("/tambah",
    upload.single("poster"),
    eventController.tambahEvent
);

router.get("/daftar", eventController.getDaftar);

// 🛑 BARIS BARU: Endpoint untuk Menghapus Event berdasarkan ID
router.delete("/:id", eventController.deleteEvent);

module.exports = router;