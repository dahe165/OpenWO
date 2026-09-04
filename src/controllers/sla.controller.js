const slaDashboardService =
    require("../services/sla-dashboard.service");


function index(req, res) {

    const slaHealth =
        slaDashboardService.getSlaHealth();

    const slaOverview =
        slaDashboardService.getSlaOverview();

    const technicianPerformance =
        slaDashboardService.getTechnicianPerformance();

    const slaTrend =
        slaDashboardService.getSlaTrend();


    res.render(
        "sla/index",
        {
            title: "SLA Monitoring",
            layout: "layouts/app",
            slaHealth,
            slaOverview,
            slaTrend,
            technicianPerformance
        }
    );

}


module.exports = {
    index
};