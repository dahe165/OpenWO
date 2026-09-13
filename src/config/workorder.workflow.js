const settingsModel = require("../models/settings.model");

/*
 * Workflow Work Order bersifat dinamis.
 * Pengaturan dibaca dari system_settings setiap kali
 * workflow diperiksa sehingga perubahan Admin langsung
 * menjadi sumber kebenaran untuk backend.
 */

const DEFAULTS = {
    closing: true,
    verification: true,
    escalation: true
};

function isOn(value, fallback) {
    if (value === null || value === undefined) return fallback;
    return String(value).toLowerCase() === "on" || String(value) === "1" || String(value).toLowerCase() === "true";
}

function getWorkflowSettings() {
    return {
        closing: isOn(settingsModel.get("workflow_closing"), DEFAULTS.closing),
        verification: isOn(settingsModel.get("workflow_verification"), DEFAULTS.verification),
        escalation: isOn(settingsModel.get("workflow_escalation"), DEFAULTS.escalation)
    };
}

function getWorkflow() {
    const settings = getWorkflowSettings();

    const workflow = {
        Menunggu: ["Diterima"],
        Diterima: ["Ditugaskan"],
        Ditugaskan: ["Diproses"],
        Diproses: ["Waiting", "Selesai"],
        Waiting: ["Diproses"],
        Selesai: [],
        "Verifikasi Asman": [],
        "Menunggu Verifikasi Manager": [],
        "Verifikasi Manager": [],
        Ditutup: []
    };

    // Penutupan OFF = workflow berhenti di Selesai.
    if (!settings.closing) {
        return workflow;
    }

    // Penutupan ON + Verifikasi OFF = langsung Ditutup setelah Selesai.
    if (!settings.verification) {
        workflow.Selesai = ["Ditutup"];
        // Tahap lama yang sudah terlanjur berjalan tetap dapat diselesaikan.
        workflow["Verifikasi Asman"] = ["Ditutup", "Menunggu Verifikasi Manager"];
        workflow["Menunggu Verifikasi Manager"] = ["Verifikasi Manager"];
        workflow["Verifikasi Manager"] = ["Ditutup"];
        return workflow;
    }

    // Verifikasi ON = Selesai masuk ke Verifikasi Asman.
    workflow.Selesai = ["Verifikasi Asman"];
    workflow["Verifikasi Asman"] = ["Ditutup"];

    // Eskalasi hanya tersedia jika Verifikasi Asman aktif.
    if (settings.escalation) {
        workflow["Verifikasi Asman"].push("Menunggu Verifikasi Manager");
    }

    // WO yang sudah berada pada jalur Manager harus tetap dapat selesai
    // walaupun Admin kemudian mengubah konfigurasi workflow.
    workflow["Menunggu Verifikasi Manager"] = ["Verifikasi Manager"];
    workflow["Verifikasi Manager"] = ["Ditutup"];

    return workflow;
}

// Kompatibilitas untuk kode lama yang masih membaca WORKFLOW.
const WORKFLOW = new Proxy({}, {
    get(target, property) {
        return getWorkflow()[property];
    }
});

function canTransition(currentStatus, nextStatus) {
    const allowed = getWorkflow()[currentStatus] || [];
    return allowed.includes(nextStatus);
}

module.exports = {
    WORKFLOW,
    canTransition,
    getWorkflow,
    getWorkflowSettings
};
