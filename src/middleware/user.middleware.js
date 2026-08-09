function loadUser(req, res, next) {

    req.user = req.session.user || null;

    next();

}

module.exports = {
    loadUser
};