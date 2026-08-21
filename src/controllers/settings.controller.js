const settingsModel =
    require("../models/settings.model");


function index(req, res) {

    const appName =
        settingsModel.get("app_name");

    const appDescription =
        settingsModel.get("app_description");

    const appLogo =
    settingsModel.get("app_logo");


    res.render(
        "settings/index",
        {
            title: "Pengaturan Sistem",

            layout: "layouts/app",

            appName,

            appDescription,

            appLogo,

            saved:
                req.query.saved === "1"
        }
    );

}

function update(req, res) {

    console.log(
    "=== SETTINGS UPDATE ==="
);

console.log(
    "BODY:",
    req.body
);

console.log(
    "FILE:",
    req.file
);

    const appName =
        (req.body?.appName || "").trim();

    const appDescription =
        (req.body?.appDescription || "").trim();


    if (!appName) {

        return res.status(400).send(
            "Nama aplikasi wajib diisi."
        );

    }


    settingsModel.set(
        "app_name",
        appName
    );


    settingsModel.set(
        "app_description",
        appDescription
    );


    /*
     * =====================================
     * SIMPAN LOGO
     * =====================================
     */

    if (req.file) {

        const logoPath =
            `/images/branding/${req.file.filename}`;


        settingsModel.set(
            "app_logo",
            logoPath
        );

    }


    /*
     * =====================================
     * SELESAI
     * =====================================
     */

    res.redirect(
        "/setting?saved=1"
    );

}


module.exports = {

    index,

    update

};