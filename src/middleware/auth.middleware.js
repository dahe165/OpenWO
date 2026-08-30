function requireLogin(req, res, next) {

    if (!req.user) {

        const returnTo =
            req.originalUrl || "/dashboard";


        return res.redirect(
            "/login?returnTo=" +
            encodeURIComponent(
                returnTo
            )
        );

    }

    next();

}


module.exports = {
    requireLogin
};