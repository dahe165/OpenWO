const sectionManagementModel =
    require("../models/section-management.model");


// =====================================================
// HALAMAN KELOLA SEKSI
// =====================================================

function manage(req, res) {
    try {
        const sectionId = Number(req.params.id);

        if (!Number.isInteger(sectionId) || sectionId <= 0) {
            return res.status(400).send("ID Seksi tidak valid.");
        }

        const section =
            sectionManagementModel.getSectionById(sectionId);

        if (!section) {
            return res.status(404).send("Seksi tidak ditemukan.");
        }

        const asmans =
            sectionManagementModel.getAvailableAsmans(
                section.department_id,
                sectionId
            );

        const technicians =
            sectionManagementModel.getAvailableTechnicians(
                section.department_id,
                sectionId
            );

        const categories =
            sectionManagementModel.getCategoriesByDepartment(
                section.department_id
            );

        const selectedAsmans =
            sectionManagementModel.getAsmansBySection(
                section.id
            );

        const selectedTechnicians =
            sectionManagementModel.getTechniciansBySection(
                section.id
            );

        const selectedCategoryIds =
            sectionManagementModel.getCategoryIdsBySection(
                section.id
            );

        res.render(
            "admin/sections/manage",
            {
                title: `Kelola Seksi - ${section.nama}`,

                layout: "layouts/app",

                section,

                asmans,

                technicians,

                categories,

                selectedAsmanId:
                    selectedAsmans.length
                        ? Number(selectedAsmans[0].id)
                        : null,

                selectedTechnicianIds:
                    selectedTechnicians.map(
                        technician => Number(technician.id)
                    ),

                selectedCategoryIds
            }
        );

    } catch (error) {
        console.error(
            "Gagal membuka Kelola Seksi:",
            error
        );

        res.status(500).send(
            "Terjadi kesalahan saat membuka Kelola Seksi."
        );
    }
}


// =====================================================
// SIMPAN KELOLA SEKSI
// =====================================================

function update(req, res) {
    try {
        const sectionId = Number(req.params.id);

        if (!Number.isInteger(sectionId) || sectionId <= 0) {
            return res.status(400).send("ID Seksi tidak valid.");
        }

        const asmanId =
            normalizeSingleId(req.body.asman_id);

        const technicianIds =
            normalizeIds(req.body.teknisi_ids);

        const categoryIds =
            normalizeIds(req.body.category_ids);


        sectionManagementModel.saveManagement(
            sectionId,
            asmanId,
            technicianIds,
            categoryIds
        );

        return res.redirect(
            `/admin/sections/${sectionId}/manage`
        );

    } catch (error) {
        console.error(
            "Gagal menyimpan Kelola Seksi:",
            error
        );

        return res.status(400).send(
            error.message ||
            "Gagal menyimpan konfigurasi Seksi."
        );
    }
}


// =====================================================
// NORMALIZE SINGLE ID
// =====================================================

function normalizeSingleId(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID tidak valid.");
    }

    return id;
}


// =====================================================
// NORMALIZE MULTIPLE IDS
// =====================================================

function normalizeIds(value) {
    if (value === undefined || value === null) {
        return [];
    }

    const values = Array.isArray(value)
        ? value
        : [value];

    const ids = values.map(value => {
        const id = Number(value);

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("ID tidak valid.");
        }

        return id;
    });

    return [...new Set(ids)];
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    manage,
    update
};