const workorderModel = require("../models/workorder.model");

const dashboardService = require("../services/dashboard.service");

const userModel =  require("../models/user.model");

// controller lainnya...

function index(req, res) {

    const summary =
        dashboardService.getSummary();

    const trend =
        dashboardService.getWorkOrderTrend();

    const categoryTrend =
        dashboardService.getCategoryTrend();

    const stats =
        userModel.getUserStats();

    const role =
        req.user?.role;

    const pelaporId =
    req.user?.id;

    let pelaporDashboard =
        null;

    if (role === "pelapor") {

        pelaporDashboard =
            dashboardService
                .getPelaporDashboard(
                    pelaporId
                );

    }

    const technicianId =
        req.user?.id;


    const technicianWorkorders =
        workorderModel.getByTechnicianId(
            technicianId
        );


    /*
     * =====================================
     * Ringkasan Teknisi
     * =====================================
     */

    const technicianSummary = {

        ditugaskan:
            technicianWorkorders.filter(
                wo => wo.status === "Ditugaskan"
            ).length,

        diproses:
            technicianWorkorders.filter(
                wo => wo.status === "Diproses"
            ).length,

        selesai:
            technicianWorkorders.filter(
                wo => wo.status === "Selesai"
            ).length

    };


    /*
     * =====================================
     * Pagination Feed Teknisi
     * =====================================
     */

    technicianWorkorders.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    const limit = 5;


    const page = Math.max(
        Number(req.query.page) || 1,
        1
    );


    const totalItems =
        technicianWorkorders.length;


    const totalPages =
        Math.ceil(
            totalItems / limit
        );


    const offset =
        (page - 1) * limit;


    const technicianFeed =
        technicianWorkorders.slice(
            offset,
            offset + limit
        );


    /*
     * =====================================
     * Render Dashboard
     * =====================================
     */

    res.render("dashboard/index", {

        title: "Dashboard",

        layout: "layouts/app",

        summary,

        trend,

        categoryTrend,

        stats,

        role,

        pelaporDashboard,

        technicianWorkorders,

        technicianSummary,

        technicianFeed,

        pagination: {

            page,

            totalPages,

            totalItems,

            limit

        }

    });

}


module.exports = {
    index
};