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

module.exports = {

    create,
    store,
    index

};