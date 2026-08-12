function requireRole(...allowedRoles) {

    return function (req, res, next) {

        const user = req.user;

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Anda belum login."
            });

        }

        if (!allowedRoles.includes(user.role)) {

            return res.status(403).json({
                success: false,
                message: "Anda tidak memiliki akses untuk tindakan ini."
            });

        }

        next();

    };

}

module.exports = {
    requireRole
};