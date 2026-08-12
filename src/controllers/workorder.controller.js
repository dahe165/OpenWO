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

    let workorders;

    const activeId =
        Number(req.query.id) || 1;

    if (req.user?.role === "manager") {

        workorders =
            workorderModel.getForManager();

        /*
        * Jika Manager sedang membuka WO tertentu
        * setelah melakukan aksi, tetap tampilkan WO tersebut.
        */
        if (req.query.id) {

            const allWorkorders =
                workorderModel.getAll();

            const activeWorkorder =
                allWorkorders.find(
                    wo => wo.id === activeId
                );

            if (
                activeWorkorder &&
                !workorders.some(
                    wo => wo.id === activeId
                )
            ) {

                workorders.push(
                    activeWorkorder
                );

            }

        }

    } else {

        workorders =
            workorderModel.getAll();

    }

    workorders = workorders.map(wo => ({
        ...wo,
        update: formatRelativeTime(wo.createdAt)
    }));

    // const activeId = Number(req.query.id) || 1;

    const activeIndex = workorders.findIndex(
        wo => wo.id === activeId
    );

    if (activeIndex > 0) {

        const activeWorkorder = workorders.splice(activeIndex, 1)[0];

        workorders.unshift(activeWorkorder);

    }    

    console.log("=== WORKORDER INDEX ===");
    console.log("USER:", req.user);
    console.log("ROLE:", req.user?.role);

    res.render("workorder/index", {
        title: "Work Order Saya",
        layout: "layouts/app",
        workorders,
        activeId,
        role: req.user?.role
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

    const technicianName = req.user?.nama;

    const workorder =
        workorderModel.completeWork(
            id,
            technicianId,
            technicianName
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

function verify(req, res) {

    const id = Number(req.params.id);

    const asmanId = req.user?.id;
    const asmanName = req.user?.nama;

    console.log("=== VERIFY WORK ORDER ===");
    console.log("WO ID:", id);
    console.log("ASMAN:", req.user);

    const workorder =
        workorderModel.verifyByAsman(
            id,
            asmanId,
            asmanName
        );

    if (!workorder) {

        return res.status(404).json({
            success: false,
            message:
                "Work Order tidak ditemukan atau belum siap diverifikasi."
        });

    }

    return res.json({
        success: true,
        workorder
    });
}

function verifyManager(req, res) {

    const id = Number(req.params.id);

    const managerId = req.user?.id;
    const managerName = req.user?.nama;

    console.log("=== VERIFY MANAGER ===");
    console.log("WO ID:", id);
    console.log("MANAGER:", req.user);

    const workorder =
        workorderModel.verifyByManager(
            id,
            managerId,
            managerName
        );

    if (!workorder) {

        return res.status(404).json({
            success: false,
            message:
                "Work Order tidak ditemukan, bukan WO eskalasi Manager, atau belum siap diverifikasi."
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
    complete,
    verify,
    verifyManager

};