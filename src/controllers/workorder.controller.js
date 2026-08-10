const workorderModel = require("../models/workorder.model");

const { formatRelativeTime } = require("../utils/time.util");

function create(req, res) {

    res.render("workorder/create", {
        title: "Buat Work Order",
        layout: "layouts/app"
    });

}

function store(req, res) {

    const { title, description } = req.body;

    const workorder = workorderModel.create({

        judul: title,

        deskripsi: description

    });

    res.render("workorder/success", {

        title: "Work Order Berhasil",

        layout: "layouts/app",

        workorder

    });

}

function index(req, res) {

    const workorders = workorderModel.getAll().map(wo => ({
    ...wo,
    update: formatRelativeTime(wo.createdAt)
    }));

    const activeId = Number(req.query.id) || 1;

    const activeIndex = workorders.findIndex(
        wo => wo.id === activeId
    );

    if (activeIndex > 0) {

        const activeWorkorder = workorders.splice(activeIndex, 1)[0];

        workorders.unshift(activeWorkorder);

    }

    res.render("workorder/index", {
        title: "Work Order Saya",
        layout: "layouts/app",
        workorders,
        activeId
    });

}

function start(req, res) {

    const id = Number(req.params.id);

    const technicianId = req.user?.id;

    console.log("=== START WORK ===");
    console.log("WO ID:", id);
    console.log("USER:", req.user);
    console.log("TECHNICIAN ID:", technicianId);

    const workorder =
        workorderModel.startWork(
            id,
            technicianId
        );

    if (!workorder) {

        return res.status(404).json({
            success: false,
            message:
                "Work Order tidak ditemukan atau bukan tanggung jawab Anda."
        });

    }

    return res.json({
        success: true,
        workorder
    });
}

function complete(req, res) {

    const id = Number(req.params.id);

    const technicianId = req.user?.id;

    const workorder =
        workorderModel.completeWork(
            id,
            technicianId
        );

    if (!workorder) {

        return res.status(404).json({
            success: false,
            message:
                "Work Order tidak ditemukan, bukan tanggung jawab Anda, atau belum diproses."
        });

    }

    return res.json({
        success: true,
        workorder
    });
}

module.exports = {

    create,
    store,
    index,
    start,
    complete

};