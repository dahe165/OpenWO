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

            return res
                .status(403)
                .render(
                    "errors/403",
                    {
                        layout: false
                    }
                );

        }

        next();

    };

}

module.exports = {
    requireRole
};