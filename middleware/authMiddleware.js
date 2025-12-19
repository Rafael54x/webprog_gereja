const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login.' });
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ success: false, message: 'Akses ditolak. Fitur ini hanya untuk admin.' });
};

module.exports = { isLoggedIn, isAdmin };
