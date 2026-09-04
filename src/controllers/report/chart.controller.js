const reportService =
    require("../../services/report.service");


function index(req, res) {

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
        "report/chart",
        {
            title:
                "Diagram Work Order",

            layout:
                "layouts/app",

            report
        }
    );

}


module.exports = {
    index
};