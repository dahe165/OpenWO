const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

const webRoute = require("./routes/web.route");

const session = require("express-session");

const {loadUser} = require("./middleware/user.middleware");

const settingsModel = require("./models/settings.model");

const expressApp = express();

expressApp.use(express.urlencoded({ extended: true }));

// Static File
expressApp.use(express.static(path.join(__dirname, "public")));

// Layout Middleware
expressApp.use(expressLayouts);

// View Engine
expressApp.set("view engine", "ejs");
expressApp.set("views", path.join(__dirname, "views"));
expressApp.set("layout", "layouts/public");

expressApp.use(
    session({
        secret: "openwo-development-secret",
        resave: false,
        saveUninitialized: false
    })
);

expressApp.use(loadUser);

/*
 * =====================================
 * USER GLOBAL UNTUK SEMUA VIEW EJS
 * =====================================
 */

expressApp.use((req, res, next) => {

    res.locals.user =
        req.user || null;

    next();

});

/*
 * =====================================
 * SYSTEM SETTINGS GLOBAL
 * =====================================
 */

expressApp.use((req, res, next) => {

    res.locals.appName =
        settingsModel.get("app_name")
        || "OpenWO";

    res.locals.appDescription =
        settingsModel.get("app_description")
        || "Work Order System";

    res.locals.appLogo =
        settingsModel.get("app_logo")
        || "";

    next();

});

// Routes
expressApp.use("/", webRoute);

module.exports = expressApp;