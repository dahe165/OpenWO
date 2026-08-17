const { getIO } = require("../socket");

const workorderModel = require("../models/workorder.model");

const userModel = require("../models/user.model");

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

        deskripsi: description,

        pelaporId: req.user?.id

    });

    res.render("workorder/success", {

        title: "Work Order Berhasil",

        layout: "layouts/app",

        workorder

    });

}

function accept(req, res) {

    const id =
        Number(req.params.id);

    const asmanId =
        req.user?.id;

    const asmanName =
        req.user?.nama;

    console.log("=== ACCEPT WORK ORDER ===");
    console.log("WO ID:", id);
    console.log("ASMAN:", req.user);

    const workorder =
        workorderModel.acceptByAsman(
            id,
            asmanId,
            asmanName
        );

    if (!workorder) {

        return res.status(404).json({
            success: false,
            message:
                "Work Order tidak ditemukan atau belum dapat diterima."
        });

    }

    // ==========================================
    // REAL-TIME EVENT
    // ==========================================
    
    getIO().emit(
        "workorder:updated",
        {
            id,
            action: "accept",
            workorder
        }
    );

    return res.json({
        success: true,
        workorder
    });

}

function index(req, res) {

    console.log(
        "📥 WORKORDER QUERY:",
        req.query
    );

    let workorders;

    const activeId =
        Number(req.query.id) || null;

    const search =
        (req.query.search || "").trim().toLowerCase();

    const status =
        (req.query.status || "Semua").trim();    

    // ==========================================
    // PAGINATION
    // ==========================================

    const page =
        Math.max(
            Number(req.query.page) || 1,
            1
        );

    const limit = 5;


    // ==========================================
    // AMBIL DATA SESUAI ROLE
    // ==========================================

    if (req.user?.role === "manager") {

        workorders =
            workorderModel.getForManager();

    } else {

        workorders =
            workorderModel.getAll();

    }


    // ==========================================
    // FORMAT DATA
    // ==========================================

    workorders =
        workorders.map(wo => ({
            ...wo,
            update: formatRelativeTime(
                wo.createdAt
            )
        }));

    // ==========================================
    // SIMPAN WO AKTIF SEBELUM SEARCH & FILTER
    // ==========================================

    let activeWO = null;

    if (activeId) {

        activeWO =
            workorders.find(
                wo => wo.id === activeId
            ) || null;

    }

    // ==========================================
    // SEARCH & FILTER
    // ==========================================

    if (search) {

        workorders =
            workorders.filter(wo => {

                const text =
                    (
                        (wo.nomor || "") +
                        " " +
                        (wo.judul || "")
                    ).toLowerCase();

                return text.includes(search);

            });

    }


    if (
        status &&
        status !== "Semua"
    ) {

        workorders =
            workorders.filter(
                wo => wo.status === status
            );

    }

    // ==========================================
    // TOTAL DATA
    // ==========================================

    const totalItems =
        workorders.length;

    const totalPages =
        Math.max(
            Math.ceil(
                totalItems / limit
            ),
            1
        );


    // ==========================================
    // PASTIKAN PAGE VALID
    // ==========================================

    const currentPage =
        Math.min(
            page,
            totalPages
        );


    // ==========================================
    // POSISI DATA
    // ==========================================

    const offset =
        (currentPage - 1) * limit;


    // ==========================================
    // AMBIL 5 WO UNTUK HALAMAN INI
    // ==========================================

    workorders =
        workorders.slice(
            offset,
            offset + limit
        );


    // ==========================================
    // ACTIVE WO
    // ==========================================

    if (activeId) {

        const activeIndex =
            workorders.findIndex(
                wo => wo.id === activeId
            );


        // ======================================
        // WO AKTIF MASIH ADA DI HALAMAN INI
        // ======================================

        if (activeIndex > 0) {

            const currentActiveWO =
                workorders.splice(
                    activeIndex,
                    1
                )[0];

            workorders.unshift(
                currentActiveWO
            );

        }


        // ======================================
        // WO AKTIF HILANG DARI FILTER
        // ======================================
        //
        // Contoh:
        //
        // /workorder?status=Menunggu&page=15
        //
        // WO 70 = Menunggu
        //
        // Klik "Terima WO"
        //
        // WO 70 berubah menjadi Diterima.
        //
        // Filter Menunggu kemudian membuang
        // WO 70 dari daftar.
        //
        // Tetapi WO 70 harus tetap ditampilkan
        // sebagai Timeline aktif.
        // ======================================

        else if (
            activeIndex === -1 &&
            activeWO
        ) {

            workorders.unshift(
                activeWO
            );

        }

    }

    // ==========================================
    // TEKNISI
    // ==========================================

    const technicians =
        userModel.getTechnicians();


    // ==========================================
    // RENDER
    // ==========================================

    res.render(
        "workorder/index",
        {
            title: "Work Order Saya",
            layout: "layouts/app",

            workorders,

            activeId,

            role:
                req.user?.role,

            technicians,

            search,
            status,

            pagination: {
                page: currentPage,
                totalPages,
                totalItems,
                limit,

                from:
                    totalItems === 0
                        ? 0
                        : offset + 1,

                to:
                    Math.min(
                        offset + limit,
                        totalItems
                    )
            }
        }
    );

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

function assign(req, res) {

    const id =
        Number(req.params.id);

    const technicianId =
        Number(req.body?.technicianId);

    const asmanId =
        req.user?.id;

    console.log("=== ASSIGN WORK ORDER ===");
    console.log("WO ID:", id);
    console.log("ASMAN:", req.user);
    console.log("TECHNICIAN ID:", technicianId);


    if (!technicianId) {

        return res.status(400).json({
            success: false,
            message:
                "Teknisi belum dipilih."
        });

    }


    const workorder =
        workorderModel.assignByAsman(
            id,
            technicianId,
            asmanId
        );


    if (!workorder) {

        return res.status(404).json({
            success: false,
            message:
                "Work Order tidak ditemukan, belum berstatus Diterima, atau teknisi tidak valid."
        });

    }


    return res.json({
        success: true,
        workorder
    });

}

function escalate(req, res) {

    const id =
        Number(req.params.id);

    const asmanId =
        req.user?.id;

    const asmanName =
        req.user?.nama;

    const reason =
        req.body?.reason;

    if (
        !reason ||
        !reason.trim()
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Alasan eskalasi wajib diisi."
        });

    }


    const workorder =
        workorderModel.escalateByAsman(
            id,
            asmanId,
            asmanName,
            reason
        );


    if (!workorder) {

        return res.status(404).json({
            success: false,
            message:
                "Work Order tidak ditemukan atau belum siap dieskalasi."
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

function history(req, res) {

    const workorders =
        workorderModel.getHistory();

    res.render(
        "workorder/history",
        {
            workorders,
            user: req.user,
            title: "Riwayat Work Order"
        }
    );

}

function detail(req, res) {

    const id =
        Number(req.params.id);

    if (!id) {

        return res.status(400).send(
            "ID Work Order tidak valid."
        );

    }

    const workorder =
        workorderModel.getById(id);

    if (!workorder) {

        return res.status(404).send(
            "Work Order tidak ditemukan."
        );

    }

    res.render(
        "workorder/detail",
        {
            workorder,
            user: req.user,
            role: req.user?.role,
            title: `Detail ${workorder.nomor}`
        }
    );

}

module.exports = {

    create,
    store,
    index,
    detail,
    accept,
    start,
    complete,
    verify,
    assign,
    escalate,
    verifyManager,
    history

};