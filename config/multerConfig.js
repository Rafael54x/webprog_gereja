// config/multerConfig.js

const multer = require('multer');
const path = require('path');

// Tentukan lokasi dan nama file penyimpanan
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Pastikan folder ini ada: public/images/merch/
        cb(null, 'public/images/merch/'); 
    },
    filename: (req, file, cb) => {
        // Nama file unik (timestamp-fieldname.ext)
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + file.fieldname + ext); 
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Batas ukuran file 5MB
});

module.exports = upload;