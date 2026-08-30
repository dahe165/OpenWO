function index(req, res) {

    res.render(
        "home/index",
        {
            layout: false,
            title: "Beranda"
        }
    );

}

module.exports = {
    index
};