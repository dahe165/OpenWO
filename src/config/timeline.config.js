const settingsModel = require("../models/settings.model");

const DEFAULT_MODE = "detail";

const TIMELINE_MODES = {
    DETAIL: "detail",
    COMPACT: "compact"
};

// Warna progres Timeline utama.
// Nilai disimpan di system_settings agar Admin dapat mengubahnya secara global.
const TIMELINE_STAGE_DEFAULTS = {
    "Dibuat": "#0ea5e9",
    "Diterima": "#8b5cf6",
    "Ditugaskan": "#f59e0b",
    "Dikerjakan": "#2563eb",
    "Selesai": "#16a34a"
};

const TIMELINE_STAGE_KEYS = {
    "Dibuat": "timeline_color_dibuat",
    "Diterima": "timeline_color_diterima",
    "Ditugaskan": "timeline_color_ditugaskan",
    "Dikerjakan": "timeline_color_dikerjakan",
    "Selesai": "timeline_color_selesai"
};

function normalizeHexColor(value, fallback) {
    const clean = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(clean)
        ? clean.toLowerCase()
        : fallback;
}

function getTimelineProgressColors() {
    return Object.fromEntries(
        Object.entries(TIMELINE_STAGE_DEFAULTS).map(([stage, fallback]) => [
            stage,
            normalizeHexColor(
                settingsModel.get(TIMELINE_STAGE_KEYS[stage]),
                fallback
            )
        ])
    );
}

function setTimelineProgressColor(stage, value) {
    const key = TIMELINE_STAGE_KEYS[stage];
    if (!key) return null;

    const fallback = TIMELINE_STAGE_DEFAULTS[stage];
    const clean = normalizeHexColor(value, fallback);

    settingsModel.set(key, clean);
    return clean;
}

function normalizeMode(value) {
    return value === TIMELINE_MODES.COMPACT
        ? TIMELINE_MODES.COMPACT
        : TIMELINE_MODES.DETAIL;
}

function getTimelineDisplayMode() {
    return normalizeMode(
        settingsModel.get("timeline_display_mode")
            || DEFAULT_MODE
    );
}

function getTimelineDisplaySettings() {
    const mode = getTimelineDisplayMode();

    return {
        mode,
        isDetail: mode === TIMELINE_MODES.DETAIL,
        isCompact: mode === TIMELINE_MODES.COMPACT
    };
}

module.exports = {
    DEFAULT_MODE,
    TIMELINE_MODES,
    normalizeMode,
    getTimelineDisplayMode,
    getTimelineDisplaySettings,
    TIMELINE_STAGE_DEFAULTS,
    TIMELINE_STAGE_KEYS,
    normalizeHexColor,
    getTimelineProgressColors,
    setTimelineProgressColor
};
