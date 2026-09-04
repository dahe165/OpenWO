const reportService =
    require("../services/report.service");


function index(req, res) {

    const now = new Date();

    const month =
        Number(req.query.month) ||
        (now.getMonth() + 1);

    const year =
        Number(req.query.year) ||
        now.getFullYear();


    const report =
        reportService.getMonthlyReport(
            year,
            month
        );

    console.log("=================================");
    console.log("REPORT DEBUG");
    console.log("Periode :", month, year);
    console.log("Summary :", report.summary);
    console.log("Subkategori :", report.subkategori);
    console.log("Jumlah Data :", report.data.length);
    console.log("=================================");


    res.render(
        "report/index",
        {
            title: "Rekap Bulanan Work Order",
            layout: "layouts/app",
            report
        }
    );
}

function workorders(req, res) {

    const now =
        new Date();

    const month =
        Number(req.query.month) ||
        (now.getMonth() + 1);

    const year =
        Number(req.query.year) ||
        now.getFullYear();


    const report =
        reportService.getMonthlyReport(
            year,
            month
        );


    res.render(
        "report/workorders",
        {
            title:
                "Rekap Work Order",

            layout:
                "layouts/app",

            report
        }
    );

}

module.exports = {
    index,
    workorders
};