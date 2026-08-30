/*
 * =====================================
 * ADMIN MASTER DATA CONTROLLER
 * =====================================
 */

function index(req, res) {

    res.render(
        "admin/master-data/index",
        {
            title: "Master Data",
            layout: "layouts/app"
        }
    );

}


module.exports = {
    index
};