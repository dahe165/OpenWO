function index(req, res) {

    res.render("home/index", {

        title: "Beranda"

    });

}

module.exports = {
    index
};