const express = require("express");

const router = express.Router();

const homeController = require("../controllers/home.controller");

const dashboardController = require("../controllers/dashboard.controller");

const workorderController = require("../controllers/workorder.controller");

const userModel = require("../models/user.model");

router.get("/dashboard", dashboardController.index);

router.get("/workorder/create", workorderController.create);

router.post("/workorder", workorderController.store);

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
    "/workorder/:id/start",
    workorderController.start
);

router.post(
    "/workorder/:id/complete",
    workorderController.complete
);

router.post(
    "/workorder/:id/verify",
    workorderController.verify
);

router.post(
    "/workorder/:id/verify-manager",
    workorderController.verifyManager
);

module.exports = router;