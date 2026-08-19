const express = require("express");

const router = express.Router();

const homeController = require("../controllers/home.controller");

const dashboardController = require("../controllers/dashboard.controller");

const workorderController = require("../controllers/workorder.controller");

const adminController = require("../controllers/admin.controller");

const userModel = require("../models/user.model");

const profileController = require("../controllers/profile.controller");

const {requireRole} = require("../middleware/role.middleware");

router.get("/dashboard", dashboardController.index);

router.get("/profile", profileController.index);

router.get(
    "/profile/edit",
    profileController.edit
);


router.post(
    "/profile/edit",
    profileController.update
);

router.get(
    "/workorder/create",
    requireRole("pelapor"),
    workorderController.create
);

router.post(
    "/workorder",
    requireRole("pelapor"),
    workorderController.store
);

router.get("/workorder", workorderController.index);

router.get("/", homeController.index);

router.get("/login", (req, res) => {

    res.render("login/index");

});

router.get("/report", (req, res) => {

    res.send("Halaman Laporan");

});

router.get("/setting", (req, res) => {

    res.send("Halaman Pengaturan");

});

router.get("/login/:username", (req, res) => {

    const user =
        userModel.findByUsername(
            req.params.username
        );

    if (!user) {

        return res.status(404).send(
            "User tidak ditemukan."
        );

    }

    req.session.user = user;

    res.redirect("/dashboard");

});

router.post(
    "/workorder/:id/accept",
    requireRole("asman"),
    workorderController.accept
);

router.post(
    "/workorder/:id/assign",
    requireRole("asman"),
    workorderController.assign
);

router.post(
    "/workorder/:id/start",
    requireRole("teknisi"),
    workorderController.start
);

router.post(
    "/workorder/:id/complete",
    requireRole("teknisi"),
    workorderController.complete
);

router.post(
    "/workorder/:id/verify",
    requireRole("asman"),
    workorderController.verify
);

router.post(
    "/workorder/:id/escalate",
    requireRole("asman"),
    workorderController.escalate
);

router.post(
    "/workorder/:id/verify-manager",
    requireRole("manager"),
    workorderController.verifyManager
);

router.get(
    "/admin/users",
    requireRole("admin", "superuser"),
    adminController.index
);

router.get(
    "/admin/users/create",
    requireRole("admin", "superuser"),
    adminController.create
);

router.post(
    "/admin/users",
    requireRole("admin", "superuser"),
    adminController.store
);

router.get(
    "/admin/users/:id/edit",
    requireRole("admin", "superuser"),
    adminController.edit
);

router.post(
    "/admin/users/:id",
    requireRole("admin", "superuser"),
    adminController.update
);

router.post(
    "/admin/users/:id/delete",
    requireRole("admin", "superuser"),
    adminController.remove
);

router.get(
    "/workorder/history",
    workorderController.history
);

router.get(
    "/workorder/:id",
    workorderController.detail
);

module.exports = router;