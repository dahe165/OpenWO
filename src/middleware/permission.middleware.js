const permissionService =
    require("../services/permission.service");


function requirePermission(permission) {

    return function (req, res, next) {

        const userRole =
            req.user?.role;

        if (!userRole) {

            return res.status(401).send(
                "User belum login."
            );

        }

        const allowed =
            permissionService.hasPermission(
                userRole,
                permission
            );

        if (!allowed) {

            return res.status(403).send(
                "Anda tidak memiliki izin untuk mengakses halaman ini."
            );

        }

        next();

    };

}


module.exports = {
    requirePermission
};