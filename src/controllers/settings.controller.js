const settingsModel =
    require("../models/settings.model");

const { getWorkflowSettings } =
    require("../config/workorder.workflow");
const {
    normalizeMode,
    getTimelineProgressColors,
    setTimelineProgressColor
} = require("../config/timeline.config");


function index(req, res) {

    const workflow = getWorkflowSettings();

    res.render(
        "settings/index",
        {
            title: "Pengaturan Work Order",
            layout: "layouts/app",
            workflow,
            timelineDisplayMode: normalizeMode(settingsModel.get("timeline_display_mode")),
            timelineProgressColors: getTimelineProgressColors(),
            saved: req.query.saved === "1"
        }
    );

}


function system(req, res) {

    const appName =
        settingsModel.get("app_name");

    const appDescription =
        settingsModel.get("app_description");

    const appLogo =
        settingsModel.get("app_logo");


    res.render(
        "settings/system",
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

function workorder(req, res) {

    const workflow = getWorkflowSettings();

    res.render(
        "settings/index",
        {
            title: "Pengaturan Work Order",
            layout: "layouts/app",
            workflow,
            timelineDisplayMode: normalizeMode(settingsModel.get("timeline_display_mode")),
            timelineProgressColors: getTimelineProgressColors(),
            saved: req.query.saved === "1"
        }
    );

}

function updateWorkorder(req, res) {

    const closing = req.body?.workflowClosing === "on";
    let verification = req.body?.workflowVerification === "on";
    let escalation = req.body?.workflowEscalation === "on";

    // Dependency: jika Penutupan OFF, workflow berhenti di Selesai.
    if (!closing) {
        verification = false;
        escalation = false;
    }

    // Dependency: Eskalasi tidak dapat aktif tanpa Verifikasi Asman.
    if (!verification) {
        escalation = false;
    }

    settingsModel.set("workflow_closing", closing ? "on" : "off");
    settingsModel.set("workflow_verification", verification ? "on" : "off");
    settingsModel.set("workflow_escalation", escalation ? "on" : "off");

    const timelineDisplayMode =
        normalizeMode(req.body?.timelineDisplayMode);

    settingsModel.set(
        "timeline_display_mode",
        timelineDisplayMode
    );

    const timelineStages = [
        "Dibuat",
        "Diterima",
        "Ditugaskan",
        "Dikerjakan",
        "Selesai"
    ];

    timelineStages.forEach(stage => {
        setTimelineProgressColor(
            stage,
            req.body?.[`timelineColor${stage.replace(/\s+/g, "")}`]
        );
    });

    res.redirect("/setting?section=workorder&saved=1");
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

    workorder,

    system,

    updateWorkorder,

    update

};