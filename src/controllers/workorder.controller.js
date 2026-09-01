const { getIO } = require("../socket");

const workorderModel = require("../models/workorder.model");

const categoryModel = require("../models/category.model");

const priorityModel = require("../models/priority.model");

const userModel = require("../models/user.model");

const { formatRelativeTime } = require("../utils/time.util");

function create(req, res) {

    const role =
        req.user?.role;


    /*
     * =====================================
     * CEK SIAPA YANG BOLEH MEMILIH PELAPOR
     * =====================================
     */

    const canCreateForOther =
        role === "teknisi" ||
        role === "admin";

    const categories =
    categoryModel.getActiveCategories()
        .map(category => {

            return {
                ...category,

                subcategories:
                    categoryModel
                        .getActiveSubcategories(
                            category.id
                        )
            };

        });

    const priorities =
    priorityModel.getActivePriorities();

    /*
     * =====================================
     * DAFTAR CALON PELAPOR
     * =====================================
     *
     * Hanya ambil jika memang diperlukan.
     *
     */

    let users = [];

    if (canCreateForOther) {

        users =
            userModel.getAll()
                .filter(
                    user =>
                        user.role === "pelapor"
                );

    }


    /*
     * =====================================
     * RENDER
     * =====================================
     */

    res.render(
        "workorder/create",
        {

            title:
                "Buat Work Order",

            layout:
                "layouts/app",

            users,

            canCreateForOther,

            categories,

            priorities

        }
    );

}

function store(req, res) {

    /*
     * =====================================
     * DATA FORM
     * =====================================
     */

    const {
        title,
        description,
        kategori,
        subkategori,
        prioritas,
        pelaporId: submittedPelaporId
    } = req.body;


    /*
     * =====================================
     * USER YANG LOGIN
     * =====================================
     */

    const currentUser =
        req.user;


    if (!currentUser?.id) {

        return res.status(401).send(
            "User belum login."
        );

    }


    const currentUserId =
        Number(currentUser.id);


    const currentRole =
        currentUser.role;


    /*
     * =====================================
     * TENTUKAN PELAPOR
     * =====================================
     *
     * PELAPOR:
     *   Pelapor otomatis dirinya sendiri.
     *
     * TEKNISI / ADMIN:
     *   Boleh memilih Pelapor.
     *
     */

    let pelaporId;


    if (currentRole === "pelapor") {

        pelaporId =
            currentUserId;

    }

    else if (
        currentRole === "teknisi" ||
        currentRole === "admin"
    ) {

        pelaporId =
            Number(submittedPelaporId);


        if (!pelaporId) {

            return res.status(400).send(
                "Pelapor Work Order wajib dipilih."
            );

        }

    }

    else {

        return res.status(403).send(
            "Role Anda tidak diperbolehkan membuat Work Order."
        );

    }


    /*
     * =====================================
     * VALIDASI PELAPOR
     * =====================================
     */

    const users =
        userModel.getAll();


    const pelapor =
        users.find(
            user =>
                Number(user.id) ===
                pelaporId
        );


    if (!pelapor) {

        return res.status(400).send(
            "Pelapor tidak ditemukan."
        );

    }


    /*
     * =====================================
     * PASTIKAN YANG DIPILIH
     * ADALAH PELAPOR
     * =====================================
     */

    if (
        currentRole !== "pelapor" &&
        pelapor.role !== "pelapor"
    ) {

        return res.status(400).send(
            "User yang dipilih bukan Pelapor."
        );

    }


    /*
     * =====================================
     * PEMBUAT WORK ORDER
     * =====================================
     *
     * SELALU user yang sedang login.
     *
     * Tidak mengambil dari req.body.
     *
     */

    const createdBy =
        currentUserId;


    /*
     * =====================================
     * CREATE WORK ORDER
     * =====================================
     */

    const workorder =
        workorderModel.create({

            judul:
                title,

            deskripsi:
                description,

            kategori,

            subkategori,

            prioritas,

            pelaporId,

            createdBy

        });


    /*
     * =====================================
     * SUCCESS
     * =====================================
     */

    res.render(
        "workorder/success",
        {

            title:
                "Work Order Berhasil",

            layout:
                "layouts/app",

            workorder

        }
    );

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

    const completeMode =
        req.query.complete === "1";

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
            workorderModel
                .getAll()
                .find(
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

            completeMode,

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

function startWaiting(req, res) {

    const id =
        Number(req.params.id);

    const technicianId =
        req.user?.id;

    const reason =
        (req.body?.reason || "")
            .trim();

    console.log(
        "=== START WAITING ==="
    );

    console.log(
        "WO ID:",
        id
    );

    console.log(
        "TECHNICIAN ID:",
        technicianId
    );

    console.log(
        "REASON:",
        reason
    );


    if (!reason) {

        return res.status(400).json({

            success: false,

            message:
                "Alasan menunggu wajib diisi."

        });

    }


    const workorder =
        workorderModel.startWaiting(

            id,

            technicianId,

            reason

        );


    if (!workorder) {

        return res.status(404).json({

            success: false,

            message:
                "Work Order tidak ditemukan, bukan tanggung jawab Anda, atau belum dalam status Diproses."

        });

    }


    return res.json({

        success: true,

        workorder

    });

}

function resumeWaiting(req, res) {

    const id =
        Number(req.params.id);

    const technicianId =
        req.user?.id;

    console.log(
        "=== RESUME WAITING ==="
    );

    console.log(
        "WO ID:",
        id
    );

    console.log(
        "TECHNICIAN ID:",
        technicianId
    );


    const workorder =
        workorderModel.resumeWaiting(
            id,
            technicianId
        );


    if (!workorder) {

        return res.status(404).json({

            success: false,

            message:
                "Work Order tidak ditemukan, bukan tanggung jawab Anda, atau tidak sedang Waiting."

        });

    }


    return res.json({

        success: true,

        workorder

    });

}

function complete(req, res) {

    const id =
        Number(req.params.id);

    const technicianId =
        req.user?.id;

    const technicianName =
        req.user?.nama;


    /*
     * =====================================
     * DATA PENYELESAIAN
     * =====================================
     */

    const resolutionDescription =
        (req.body?.resolutionDescription || "")
            .trim();


    /*
     * DESKRIPSI WAJIB
     */

    if (!resolutionDescription) {

        return res.status(400).json({

            success: false,

            message:
                "Deskripsi penyelesaian wajib diisi."

        });

    }


    /*
     * =====================================
     * FOTO PENYELESAIAN
     * =====================================
     */

    let completionPhoto =
        null;


    if (req.file) {

        completionPhoto =
            `/images/completions/${req.file.filename}`;

    }


    console.log(
        "=== COMPLETE WORK ORDER ==="
    );

    console.log(
        "WO ID:",
        id
    );

    console.log(
        "TECHNICIAN:",
        technicianId
    );

    console.log(
        "RESOLUTION:",
        resolutionDescription
    );

    console.log(
        "FILE:",
        req.file
    );


    /*
     * =====================================
     * SIMPAN KE MODEL
     * =====================================
     */

    const workorder =
        workorderModel.completeWork(

            id,

            technicianId,

            technicianName,

            resolutionDescription,

            completionPhoto

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
    startWaiting,
    resumeWaiting,
    complete,
    verify,
    assign,
    escalate,
    verifyManager,
    history

};