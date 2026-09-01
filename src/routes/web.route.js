const express = require("express");

const router = express.Router();

console.log("🔥 WEB.ROUTE.JS TERLOAD");

// =====================================================
// CONTROLLERS
// =====================================================

const homeController =
    require("../controllers/home.controller");

const dashboardController =
    require("../controllers/dashboard.controller");

const workorderController =
    require("../controllers/workorder.controller");

const adminController =
    require("../controllers/admin.controller");

const categoryController =
    require("../controllers/admin.category.controller");

const userModel =
    require("../models/user.model");

const profileController =
    require("../controllers/profile.controller");

const settingsController =
    require("../controllers/settings.controller");

const adminMasterDataController =
    require("../controllers/admin.master-data.controller");

const priorityController =
    require("../controllers/admin.priority.controller");

const businessCalendarController =
    require("../controllers/business-calendar.controller");


// =====================================================
// MIDDLEWARE
// =====================================================

const {
    requireRole
} = require("../middleware/role.middleware");

const {
    requireLogin
} = require("../middleware/auth.middleware");

const {
    uploadBranding,
    uploadCompletion
} = require("../middleware/upload.middleware");


// =====================================================
// DASHBOARD
// =====================================================

router.get(
    "/dashboard",
    requireLogin,
    dashboardController.index
);


// =====================================================
// PROFILE
// =====================================================

router.get(
    "/profile",
    requireLogin,
    profileController.index
);


router.get(
    "/profile/edit",
    requireLogin,
    profileController.edit
);


router.post(
    "/profile/edit",
    requireLogin,
    profileController.update
);


// =====================================================
// WORK ORDER
// =====================================================

// Form Create WO

router.get(
    "/workorder/create",
    requireLogin,
    requireRole(
        "pelapor",
        "teknisi",
        "admin"
    ),
    workorderController.create
);


// Simpan WO

router.post(
    "/workorder",
    requireLogin,
    requireRole(
        "pelapor",
        "teknisi",
        "admin"
    ),
    workorderController.store
);


// Daftar WO

router.get(
    "/workorder",
    requireLogin,
    workorderController.index
);


// History WO

router.get(
    "/workorder/history",
    requireLogin,
    workorderController.history
);


// Detail WO

router.get(
    "/workorder/:id",
    requireLogin,
    workorderController.detail
);


// =====================================================
// HOME
// =====================================================

router.get(
    "/",
    homeController.index
);


// =====================================================
// LOGIN
// =====================================================

router.get(
    "/login",
    (req, res) => {

        // User sudah login
        // tidak perlu melihat halaman login lagi

        if (req.user) {

            return res.redirect(
                "/dashboard"
            );

        }


        const returnTo =
            typeof req.query.returnTo === "string"
                ? req.query.returnTo
                : "/dashboard";


        res.render(
            "login/index",
            {
                layout: false,
                returnTo
            }
        );

    }
);


// =====================================================
// LOGIN PROCESS
// =====================================================

router.post(
    "/login",
    (req, res) => {

        const {
            username,
            password,
            returnTo
        } = req.body;


        // =================================================
        // VALIDASI INPUT
        // =================================================

        if (
            !username ||
            !password
        ) {

            return res.render(
                "login/index",
                {
                    layout: false,
                    error:
                        "Username dan password wajib diisi."
                }
            );

        }


        try {

            const user =
                userModel.findByUsername(
                    username.trim()
                );


            // =================================================
            // USER TIDAK DITEMUKAN
            // =================================================

            if (!user) {

                return res.render(
                    "login/index",
                    {
                        layout: false,
                        error:
                            "Username atau password salah."
                    }
                );

            }


            // =================================================
            // VERIFIKASI PASSWORD
            // =================================================

            const valid =
                userModel.verifyPassword(
                    password,
                    user.password_hash
                );


            if (!valid) {

                return res.render(
                    "login/index",
                    {
                        layout: false,
                        error:
                            "Username atau password salah."
                    }
                );

            }


            // =================================================
            // LOGIN BERHASIL
            // =================================================
            //
            // Regenerate session untuk mencegah
            // session fixation.
            //
            // =================================================

            req.session.regenerate(
                function (error) {

                    if (error) {

                        console.error(
                            "LOGIN SESSION:",
                            error
                        );

                        return res
                            .status(500)
                            .send(
                                "Gagal membuat session login."
                            );

                    }


                    // Jangan simpan password_hash
                    // ke dalam session.

                    req.session.user = {

                        id:
                            user.id,

                        nama:
                            user.nama,

                        username:
                            user.username,

                        role:
                            user.role,

                        seksi:
                            user.seksi,

                        bagian:
                            user.bagian

                    };


                    // =================================================
                    // RETURN TO
                    // =================================================
                    //
                    // Hanya izinkan URL internal OpenWO.
                    //
                    // =================================================

                    const destination =
                        typeof returnTo === "string" &&
                        returnTo.startsWith("/") &&
                        !returnTo.startsWith("//")
                            ? returnTo
                            : "/dashboard";


                    res.redirect(
                        destination
                    );

                }
            );

        } catch (error) {

            console.error(
                "LOGIN:",
                error
            );

            return res
                .status(500)
                .send(
                    "Terjadi kesalahan saat proses login."
                );

        }

    }
);


// =====================================================
// REPORT
// =====================================================

router.get(
    "/report",
    requireLogin,
    (req, res) => {

        res.send(
            "Halaman Laporan"
        );

    }
);


// =====================================================
// WORK ORDER ACTIONS
// =====================================================

// Accept

router.post(
    "/workorder/:id/accept",
    requireLogin,
    requireRole("asman"),
    workorderController.accept
);


// Assign

router.post(
    "/workorder/:id/assign",
    requireLogin,
    requireRole("asman"),
    workorderController.assign
);


// Start

router.post(
    "/workorder/:id/start",
    requireLogin,
    requireRole("teknisi"),
    workorderController.start
);

// waiting
router.post(
    "/workorder/:id/waiting",
    requireRole("teknisi"),
    workorderController.startWaiting
);

// resumeWaiting
router.post(
    "/workorder/:id/resume-waiting",
    requireRole("teknisi"),
    workorderController.resumeWaiting
);

// Complete
router.post(
    "/workorder/:id/complete",
    requireLogin,
    requireRole("teknisi"),
    uploadCompletion.single(
        "completionPhoto"
    ),
    workorderController.complete
);


// Verify

router.post(
    "/workorder/:id/verify",
    requireLogin,
    requireRole("asman"),
    workorderController.verify
);


// Escalate

router.post(
    "/workorder/:id/escalate",
    requireLogin,
    requireRole("asman"),
    workorderController.escalate
);


// Manager Verify

router.post(
    "/workorder/:id/verify-manager",
    requireLogin,
    requireRole("manager"),
    workorderController.verifyManager
);


// =====================================================
// ADMIN - USER MANAGEMENT
// =====================================================

// List Users

router.get(
    "/admin/users",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminController.index
);


// Search Users

router.get(
    "/admin/users/search",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminController.search
);


// Create User

router.get(
    "/admin/users/create",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminController.create
);


// Store User

router.post(
    "/admin/users",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminController.store
);


// Edit User

router.get(
    "/admin/users/:id/edit",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminController.edit
);


// Update User

router.post(
    "/admin/users/:id",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminController.update
);


// Delete User

router.post(
    "/admin/users/:id/delete",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminController.remove
);

// =====================================================
// ADMIN - MASTER KATEGORI
// =====================================================

router.get(
    "/admin/categories",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.index
);


router.get(
    "/admin/categories/create",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.createCategory
);


router.post(
    "/admin/categories",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.storeCategory
);


router.get(
    "/admin/categories/:id/edit",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.editCategory
);


router.post(
    "/admin/categories/:id",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.updateCategory
);


router.post(
    "/admin/categories/:id/toggle",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.toggleCategory
);


// =====================================================
// ADMIN - MASTER SUBKATEGORI
// =====================================================

router.post(
    "/admin/categories/:categoryId/subcategories",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.storeSubcategory
);


router.get(
    "/admin/subcategories/:id/edit",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.editSubcategory
);


router.post(
    "/admin/subcategories/:id",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.updateSubcategory
);


router.post(
    "/admin/subcategories/:id/toggle",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    categoryController.toggleSubcategory
);

// =====================================================
// ADMIN - MASTER PRIORITAS
// =====================================================
console.log("🔥 ROUTE PRIORITY TERDAFTAR");
// List Prioritas

router.get(
    "/admin/priorities",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    priorityController.index
);


// Form Create Prioritas

router.get(
    "/admin/priorities/create",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    priorityController.create
);


// Store Prioritas

router.post(
    "/admin/priorities",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    priorityController.store
);


// Form Edit Prioritas

router.get(
    "/admin/priorities/:id/edit",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    priorityController.edit
);


// Update Prioritas

router.post(
    "/admin/priorities/:id",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    priorityController.update
);


// Toggle Status Prioritas

router.post(
    "/admin/priorities/:id/toggle",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    priorityController.toggle
);

// =====================================================
// ADMIN - KALENDER LAYANAN
// =====================================================

router.get(
    "/admin/business-calendar",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    businessCalendarController.index
);


router.get(
    "/admin/business-calendar/exception/create",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    businessCalendarController.createExceptionForm
);


router.post(
    "/admin/business-calendar/exception",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    businessCalendarController.createException
);


// =====================================================
// SETTINGS
// =====================================================

router.get(
    "/setting",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    settingsController.index
);


router.post(
    "/setting",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    uploadBranding.single(
        "appLogo"
    ),
    settingsController.update
);


// =====================================================
// LOGOUT
// =====================================================

router.get(
    "/logout",
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        "LOGOUT SESSION:",
                        error
                    );

                    return res
                        .status(500)
                        .send(
                            "Gagal keluar dari OpenWO."
                        );

                }


                res.clearCookie(
                    "connect.sid"
                );


                res.redirect(
                    "/"
                );

            }
        );

    }
);

// =====================================================
// ADMIN - MASTER DATA
// =====================================================

router.get(
    "/admin/master-data",
    requireLogin,
    requireRole(
        "admin",
        "superuser"
    ),
    adminMasterDataController.index
);

// =====================================================
// 404 - ROUTE TIDAK DITEMUKAN
// =====================================================

router.use(
    (req, res) => {

        res.status(404).render(
            "errors/404",
            {
                title: "Halaman Tidak Ditemukan"
            }
        );

    }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;