const { getIO } = require("../socket");

const workorderModel = require("../models/workorder.model");

const { getWorkflowSettings } =
    require("../config/workorder.workflow");

const { getTimelineProgressColors } =
    require("../config/timeline.config");

const categoryModel = require("../models/category.model");

const priorityModel = require("../models/priority.model");

const userModel = require("../models/user.model");

const sectionManagementModel =
    require("../models/section-management.model");

const departmentModel =
    require("../models/department.model");

const sectionModel =
    require("../models/section.model");

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
        role === "admin" ||
        role === "asman" ||
        role === "manager";

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

    const departments =
        departmentModel.getActive();

    const sections =
        sectionModel.getActive();

    /*
     * Routing map: Seksi tujuan -> kategori
     * yang memang menjadi scope Seksi tersebut.
     */
    const targetSections =
        sections.map(section => ({
            ...section,
            categoryIds:
                sectionManagementModel
                    .getCategoryIdsBySection(
                        section.id
                    )
        }));

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
            userModel.getAll();

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

            currentUserId: req.user?.id,

            currentUserName: req.user?.nama,

            categories,

            departments,

            targetSections,

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
        targetDepartmentId: submittedTargetDepartmentId,
        targetSectionId: submittedTargetSectionId,
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
        currentRole === "admin" ||
        currentRole === "asman" ||
        currentRole === "manager"
    ) {

        // Default: user yang sedang login melapor untuk dirinya sendiri.
        // Jika memilih pengguna lain di form, gunakan pengguna tersebut
        // sebagai pelapor.
        pelaporId =
            Number(submittedPelaporId) ||
            currentUserId;

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
     * ORGANISASI PELAPOR
     * =====================================
     *
     * Sumber organisasi Work Order adalah:
     * users.department_id + users.section_id.
     * Field legacy users.seksi / users.bagian
     * tidak digunakan untuk menentukan organisasi.
     *
     */

    if (
        pelapor.department_id === null ||
        pelapor.section_id === null
    ) {

        return res.status(400).send(
            "Pelapor belum memiliki Bagian dan Seksi pada Master Organisasi."
        );

    }


    /*
     * =====================================
     * PASTIKAN YANG DIPILIH
     * ADALAH PELAPOR
     * =====================================
     */

    // Pelapor bukan role khusus. Semua user yang valid dapat menjadi
    // pelapor; role hanya menentukan hak/kemampuan di dalam OpenWO.
    // Dengan demikian Manager/Asman/Teknisi/Admin juga dapat melapor
    // untuk dirinya sendiri maupun membuatkan WO untuk user lain.


    /*
     * =====================================
     * TUJUAN WORK ORDER
     * =====================================
     *
     * Target ditentukan oleh Seksi tujuan,
     * bukan oleh organisasi Pelapor.
     * Bagian tujuan diturunkan dari Seksi
     * dan hanya dipakai sebagai tampilan/form.
     *
     */

    const targetSectionId =
        Number(submittedTargetSectionId);

    if (!targetSectionId) {

        return res.status(400).send(
            "Seksi tujuan Work Order wajib dipilih."
        );

    }

    const targetSection =
        sectionModel.getById(
            targetSectionId
        );

    if (!targetSection || !targetSection.aktif) {

        return res.status(400).send(
            "Seksi tujuan tidak valid atau tidak aktif."
        );

    }

    const targetDepartmentId =
        Number(targetSection.department_id);

    if (!targetDepartmentId) {

        return res.status(400).send(
            "Seksi tujuan belum memiliki Bagian."
        );

    }

    if (
        submittedTargetDepartmentId &&
        Number(submittedTargetDepartmentId) !==
            targetDepartmentId
    ) {

        return res.status(400).send(
            "Bagian dan Seksi tujuan tidak sesuai."
        );

    }

    const targetCategoryIds =
        sectionManagementModel
            .getCategoryIdsBySection(
                targetSectionId
            );

    const category =
        categoryModel.getCategoryByName(
            kategori
        );

    if (!category || !category.aktif) {

        return res.status(400).send(
            "Kategori Work Order tidak valid atau tidak aktif."
        );

    }

    if (
        !targetCategoryIds.includes(
            Number(category.id)
        )
    ) {

        return res.status(400).send(
            "Kategori tersebut tidak tersedia pada Seksi tujuan."
        );

    }

    const validSubcategories =
        categoryModel.getActiveSubcategories(
            category.id
        );

    if (
        !validSubcategories.some(
            item => item.nama === subkategori
        )
    ) {

        return res.status(400).send(
            "Sub Kategori tidak sesuai dengan Kategori yang dipilih."
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

            targetDepartmentId,

            targetSectionId,

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

    const currentUser =
        userModel.findById(
            Number(req.user?.id)
        );

    if (req.user?.role === "manager") {

        workorders =
            currentUser?.department_id
                ? workorderModel.getForManagerDepartment(
                    currentUser.department_id
                )
                : [];

    } else if (req.user?.role === "asman") {

        workorders =
            currentUser?.section_id
                ? workorderModel.getForAsmanSection(
                    currentUser.section_id
                )
                : [];

    } else if (req.user?.role === "teknisi") {

        workorders =
            workorderModel.getByTechnicianId(
                Number(req.user.id)
            );

    } else if (req.user?.role === "pelapor") {

        workorders =
            workorderModel.getForPelapor(
                Number(req.user.id)
            );

    } else {

        // Admin tetap memiliki visibilitas penuh.
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

        let activeSource = [];

        if (req.user?.role === "manager") {

            activeSource =
                currentUser?.department_id
                    ? workorderModel.getForManagerDepartment(
                        currentUser.department_id
                    )
                    : [];

        } else if (req.user?.role === "asman") {

            activeSource =
                currentUser?.section_id
                    ? workorderModel.getForAsmanSection(
                        currentUser.section_id
                    )
                    : [];

        } else if (req.user?.role === "teknisi") {

            activeSource =
                workorderModel.getByTechnicianId(
                    Number(req.user.id)
                );

        } else if (req.user?.role === "pelapor") {

            activeSource =
                workorderModel.getForPelapor(
                    Number(req.user.id)
                );

        } else {

            activeSource =
                workorderModel.getAll();

        }

        activeWO =
            activeSource.find(
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

    let technicians;

    if (req.user?.role === "asman") {

        // Ambil Seksi Asman langsung dari database.
        // Jangan bergantung pada data Seksi di session.
        const asman =
            userModel.findById(
                Number(req.user.id)
            );

        technicians =
            asman?.section_id
                ? sectionManagementModel.getTechniciansBySection(
                    asman.section_id
                )
                : [];

    } else {

        technicians =
            userModel.getTechnicians();

    }


    // ==========================================
    // PRIORITY COLORS
    // ==========================================

    const priorityColors =
        Object.fromEntries(
            priorityModel
                .getAllPriorities()
                .map(priority => [
                    priority.nama,
                    priority.warna || "#64748b"
                ])
        );

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

            currentUserId:
                Number(req.user?.id),

            technicians,

            priorityColors,

            workflow: getWorkflowSettings(),

            timelineProgressColors: getTimelineProgressColors(),

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

    let workorders;

    if (req.user?.role === "asman") {

        const asman =
            userModel.findById(
                Number(req.user.id)
            );

        workorders =
            asman?.section_id
                ? workorderModel.getHistoryForAsmanSection(
                    asman.section_id
                )
                : [];

    } else {

        workorders =
            workorderModel.getHistory();

    }

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

    const detailUser =
        userModel.findById(
            Number(req.user?.id)
        );

    if (req.user?.role === "asman" &&
        !workorderModel.isAsmanAuthorizedForWorkorder(id, req.user.id)) {

        return res.status(403).send(
            "Work Order bukan bagian dari Seksi Anda."
        );
    }

    if (req.user?.role === "teknisi" &&
        (Number(workorder.teknisiId) !== Number(req.user.id) ||
         Number(workorder.targetSectionId) !== Number(detailUser?.section_id))) {

        return res.status(403).send(
            "Work Order bukan tugas Teknisi Anda."
        );
    }

    if (req.user?.role === "manager" &&
        Number(workorder.targetDepartmentId) !== Number(detailUser?.department_id)) {

        return res.status(403).send(
            "Work Order bukan bagian dari Bagian Anda."
        );
    }

    if (req.user?.role === "pelapor" &&
        Number(workorder.pelaporId) !== Number(req.user.id) &&
        Number(workorder.createdBy) !== Number(req.user.id)) {

        return res.status(403).send(
            "Work Order bukan milik Anda."
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