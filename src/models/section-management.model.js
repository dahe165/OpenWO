const db = require("../config/database");

function getSectionById(sectionId) {
    return db.prepare(`
        SELECT
            sections.id,
            sections.department_id,
            sections.kode,
            sections.nama,
            sections.aktif,
            departments.kode AS department_kode,
            departments.nama AS department_nama
        FROM sections
        LEFT JOIN departments
            ON departments.id = sections.department_id
        WHERE sections.id = ?
    `).get(Number(sectionId));
}


// =====================================================
// ASMAN
// =====================================================

function getAsmansBySection(sectionId) {
    return db.prepare(`
        SELECT
            id,
            nama,
            username,
            role,
            department_id,
            section_id
        FROM users
        WHERE role = 'asman'
          AND section_id = ?
        ORDER BY nama ASC, id ASC
    `).all(Number(sectionId));
}


// =====================================================
// TEKNISI
// =====================================================

function getTechniciansBySection(sectionId) {
    return db.prepare(`
        SELECT
            id,
            nama,
            username,
            role,
            department_id,
            section_id
        FROM users
        WHERE role = 'teknisi'
          AND section_id = ?
        ORDER BY nama ASC, id ASC
    `).all(Number(sectionId));
}


// =====================================================
// ASMAN YANG BISA DIPILIH
// Hanya:
// - Asman yang sudah berada di Seksi ini
// - Asman yang belum memiliki Seksi
// - Dari Bagian yang sama
// =====================================================

function getAvailableAsmans(departmentId, sectionId) {
    return db.prepare(`
        SELECT
            id,
            nama,
            username,
            role,
            department_id,
            section_id
        FROM users
        WHERE role = 'asman'
          AND (
                department_id = ?
                OR department_id IS NULL
              )
          AND (
                section_id = ?
                OR section_id IS NULL
              )
        ORDER BY nama ASC, id ASC
    `).all(
        Number(departmentId),
        Number(sectionId)
    );
}


// =====================================================
// TEKNISI YANG BISA DIPILIH
// Hanya:
// - Teknisi yang sudah berada di Seksi ini
// - Teknisi yang belum memiliki Seksi
// - Dari Bagian yang sama
//
// Teknisi yang sudah berada di Seksi lain
// TIDAK muncul di sini.
// =====================================================

function getAvailableTechnicians(departmentId, sectionId) {
    return db.prepare(`
        SELECT
            id,
            nama,
            username,
            role,
            department_id,
            section_id
        FROM users
        WHERE role = 'teknisi'
          AND (
                department_id = ?
                OR department_id IS NULL
              )
          AND (
                section_id = ?
                OR section_id IS NULL
              )
        ORDER BY nama ASC, id ASC
    `).all(
        Number(departmentId),
        Number(sectionId)
    );
}


// =====================================================
// KATEGORI
// =====================================================

function getCategoriesByDepartment(departmentId) {
    const categories = db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan,
            department_id
        FROM categories
        WHERE aktif = 1
          AND department_id = ?
        ORDER BY urutan ASC, id ASC
    `).all(Number(departmentId));

    if (categories.length === 0) {
        return [];
    }

    const subcategories = db.prepare(`
        SELECT
            id,
            category_id,
            nama,
            aktif,
            urutan
        FROM subcategories
        WHERE aktif = 1
          AND category_id IN (${categories.map(() => "?").join(",")})
        ORDER BY urutan ASC, id ASC
    `).all(...categories.map(category => Number(category.id)));

    const subcategoriesByCategory = new Map();

    for (const subcategory of subcategories) {
        const categoryId = Number(subcategory.category_id);

        if (!subcategoriesByCategory.has(categoryId)) {
            subcategoriesByCategory.set(categoryId, []);
        }

        subcategoriesByCategory.get(categoryId).push(subcategory);
    }

    return categories.map(category => ({
        ...category,
        subcategories:
            subcategoriesByCategory.get(Number(category.id)) || []
    }));
}


// =====================================================
// KATEGORI YANG SUDAH TERHUBUNG KE SEKSI
// =====================================================

function getCategoryIdsBySection(sectionId) {
    return db.prepare(`
        SELECT
            category_id
        FROM section_categories
        WHERE section_id = ?
        ORDER BY category_id ASC
    `)
    .all(Number(sectionId))
    .map(row => Number(row.category_id));
}


// =====================================================
// SIMPAN KELOLA SEKSI
// =====================================================

const saveManagement = db.transaction(
    (
        sectionId,
        asmanId,
        technicianIds,
        categoryIds
    ) => {

        const section = getSectionById(sectionId);

        if (!section) {
            throw new Error("Seksi tidak ditemukan.");
        }


        // =================================================
        // VALIDASI ASMAN
        // =================================================

        const asman = asmanId
            ? db.prepare(`
                SELECT
                    id,
                    role,
                    department_id,
                    section_id
                FROM users
                WHERE id = ?
                  AND role = 'asman'
            `).get(Number(asmanId))
            : null;

        if (asmanId && !asman) {
            throw new Error("Asman tidak valid.");
        }


        // =================================================
        // VALIDASI ASMAN TIDAK BOLEH DARI BAGIAN LAIN
        // =================================================

        if (
            asman &&
            asman.department_id !== null &&
            Number(asman.department_id) !==
                Number(section.department_id)
        ) {
            throw new Error(
                "Asman berasal dari Bagian yang berbeda."
            );
        }


        // =================================================
        // ASMAN TIDAK BOLEH SUDAH TERIKAT KE SEKSI LAIN
        // =================================================

        if (
            asman &&
            asman.section_id !== null &&
            Number(asman.section_id) !==
                Number(sectionId)
        ) {
            throw new Error(
                "Asman sudah terikat ke Seksi lain."
            );
        }


        // =================================================
        // VALIDASI TEKNISI
        // =================================================

        const technicians = technicianIds.length
            ? db.prepare(`
                SELECT
                    id,
                    role,
                    department_id,
                    section_id
                FROM users
                WHERE role = 'teknisi'
                  AND id IN (
                      ${technicianIds
                          .map(() => "?")
                          .join(",")}
                  )
            `).all(...technicianIds)
            : [];

        if (
            technicians.length !==
            technicianIds.length
        ) {
            throw new Error(
                "Data teknisi tidak valid."
            );
        }


        // =================================================
        // TEKNISI HARUS DARI BAGIAN YANG SAMA
        // =================================================

        for (const technician of technicians) {

            if (
                technician.department_id !== null &&
                Number(technician.department_id) !==
                    Number(section.department_id)
            ) {
                throw new Error(
                    "Ada teknisi yang berasal dari Bagian berbeda."
                );
            }


            // Teknisi yang sudah berada di Seksi lain
            // tidak boleh dipindahkan secara diam-diam.
            if (
                technician.section_id !== null &&
                Number(technician.section_id) !==
                    Number(sectionId)
            ) {
                throw new Error(
                    "Ada teknisi yang sudah terikat ke Seksi lain."
                );
            }
        }


        // =================================================
        // VALIDASI KATEGORI
        // =================================================

        const categories = categoryIds.length
            ? db.prepare(`
                SELECT
                    id
                FROM categories
                WHERE aktif = 1
                  AND id IN (
                      ${categoryIds
                          .map(() => "?")
                          .join(",")}
                  )
            `).all(...categoryIds)
            : [];

        if (
            categories.length !==
            categoryIds.length
        ) {
            throw new Error(
                "Data kategori tidak valid."
            );
        }


        // =================================================
        // RESET ASMAN DI SEKSI INI
        // =================================================

        db.prepare(`
            UPDATE users
            SET section_id = NULL
            WHERE role = 'asman'
              AND section_id = ?
        `).run(Number(sectionId));


        // =================================================
        // PASANG ASMAN
        // =================================================

        if (asman) {

            db.prepare(`
                UPDATE users
                SET
                    department_id = ?,
                    section_id = ?
                WHERE id = ?
                  AND role = 'asman'
            `).run(
                Number(section.department_id),
                Number(sectionId),
                Number(asman.id)
            );
        }


        // =================================================
        // RESET TEKNISI DI SEKSI INI
        // =================================================

        db.prepare(`
            UPDATE users
            SET section_id = NULL
            WHERE role = 'teknisi'
              AND section_id = ?
        `).run(Number(sectionId));


        // =================================================
        // PASANG TEKNISI
        // =================================================

        if (technicianIds.length) {

            const updateTechnician =
                db.prepare(`
                    UPDATE users
                    SET
                        department_id = ?,
                        section_id = ?
                    WHERE id = ?
                      AND role = 'teknisi'
                `);

            for (const technicianId of technicianIds) {

                updateTechnician.run(
                    Number(section.department_id),
                    Number(sectionId),
                    Number(technicianId)
                );
            }
        }


        // =================================================
        // RESET KATEGORI SEKSI
        // =================================================

        db.prepare(`
            DELETE FROM section_categories
            WHERE section_id = ?
        `).run(Number(sectionId));


        // =================================================
        // PASANG KATEGORI
        // =================================================

        const insertCategory = db.prepare(`
            INSERT INTO section_categories (
                section_id,
                category_id
            )
            VALUES (?, ?)
        `);

        for (const categoryId of categoryIds) {

            insertCategory.run(
                Number(sectionId),
                Number(categoryId)
            );
        }
    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getSectionById,
    getAsmansBySection,
    getTechniciansBySection,
    getAvailableAsmans,
    getAvailableTechnicians,
    getCategoriesByDepartment,
    getCategoryIdsBySection,
    saveManagement
};