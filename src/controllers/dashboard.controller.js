const workorderModel = require("../models/workorder.model");

const dashboardService = require("../services/dashboard.service");

function index(req, res) {

    const summary = dashboardService.getSummary();

    const trend = dashboardService.getWorkOrderTrend();

    const categoryTrend = dashboardService.getCategoryTrend();

    const role = req.user?.role;

    const technicianId = req.user?.id;

    const technicianWorkorders = workorderModel.getByTechnicianId(technicianId);

    const technicianSummary = {

    ditugaskan: technicianWorkorders.filter(
        wo => wo.status === "Ditugaskan"
    ).length,

    diproses: technicianWorkorders.filter(
        wo => wo.status === "Diproses"
    ).length,

    selesai: technicianWorkorders.filter(
        wo => wo.status === "Selesai"
    ).length

    };

    res.render("dashboard/index", {

        title: "Dashboard",

        layout: "layouts/app",

        summary,

        trend,

        categoryTrend,

        role,

        technicianWorkorders,

        technicianSummary

    });

}

module.exports = {
    index
};