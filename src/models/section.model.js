const db =
    require("../config/database");


/*
 * =====================================
 * SECTION MODEL
 * =====================================
 *
 * Semua akses database untuk:
 *
 * - Sections / Seksi
 *
 * berada di file ini.
 *
 */


/*
 * =====================================
 * GET ALL SECTIONS
 * =====================================
 *
 * Mengambil seluruh Seksi.
 *
 * Bagian ditampilkan melalui
 * relasi department_id.
 *
 * Urutan:
 * 1. Bagian
 * 2. urutan
 * 3. id
 *
 */

function getAll() {

    return db.prepare(`
        SELECT
            sections.id,
            sections.department_id,
            sections.kode,
            sections.nama,
            sections.aktif,
            sections.urutan,
            sections.created_at,
            sections.updated_at,

            departments.kode AS department_kode,
            departments.nama AS department_nama

        FROM sections

        LEFT JOIN departments
            ON departments.id =
               sections.department_id

        ORDER BY
            departments.nama ASC,
            sections.urutan ASC,
            sections.id ASC
    `).all();

}


/*
 * =====================================
 * GET ACTIVE SECTIONS
 * =====================================
 *
 * Hanya mengambil Seksi aktif.
 *
 * Dipakai nanti oleh:
 *
 * - Form User
 * - Form Asman
 * - Routing organisasi
 *
 */

function getActive() {

    return db.prepare(`
        SELECT
            sections.id,
            sections.department_id,
            sections.kode,
            sections.nama,
            sections.aktif,
            sections.urutan,

            departments.kode AS department_kode,
            departments.nama AS department_nama

        FROM sections

        LEFT JOIN departments
            ON departments.id =
               sections.department_id

        WHERE sections.aktif = 1

        ORDER BY
            departments.nama ASC,
            sections.urutan ASC,
            sections.id ASC
    `).all();

}


/*
 * =====================================
 * GET ACTIVE BY DEPARTMENT
 * =====================================
 *
 * Mengambil Seksi aktif berdasarkan
 * Bagian tertentu.
 *
 * Ini penting untuk struktur:
 *
 * Bagian
 *   └── Seksi
 *
 */

function getActiveByDepartmentId(
    departmentId
) {

    return db.prepare(`
        SELECT
            id,
            department_id,
            kode,
            nama,
            aktif,
            urutan

        FROM sections

        WHERE department_id = ?
          AND aktif = 1

        ORDER BY
            urutan ASC,
            id ASC
    `).all(
        departmentId
    );

}


/*
 * =====================================
 * GET SECTION BY ID
 * =====================================
 */

function getById(id) {

    return db.prepare(`
        SELECT
            sections.id,
            sections.department_id,
            sections.kode,
            sections.nama,
            sections.aktif,
            sections.urutan,
            sections.created_at,
            sections.updated_at,

            departments.kode AS department_kode,
            departments.nama AS department_nama

        FROM sections

        LEFT JOIN departments
            ON departments.id =
               sections.department_id

        WHERE sections.id = ?
    `).get(id);

}


/*
 * =====================================
 * CREATE SECTION
 * =====================================
 */

function create(data) {

    const result =
        db.prepare(`
            INSERT INTO sections (
                department_id,
                kode,
                nama,
                aktif,
                urutan
            )
            VALUES (?, ?, ?, 1, ?)
        `).run(
            Number(data.department_id),
            data.kode.trim(),
            data.nama.trim(),
            Number(data.urutan) || 0
        );


    return getById(
        result.lastInsertRowid
    );

}


/*
 * =====================================
 * UPDATE SECTION
 * =====================================
 */

function update(
    id,
    data
) {

    db.prepare(`
        UPDATE sections

        SET
            department_id = ?,
            kode = ?,
            nama = ?,
            urutan = ?,
            updated_at =
                CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        Number(data.department_id),
        data.kode.trim(),
        data.nama.trim(),
        Number(data.urutan) || 0,
        id
    );


    return getById(id);

}


/*
 * =====================================
 * SET SECTION STATUS
 * =====================================
 *
 * Tidak menghapus data.
 *
 * aktif:
 * 1 = Aktif
 * 0 = Tidak Aktif
 *
 */

function setStatus(
    id,
    aktif
) {

    db.prepare(`
        UPDATE sections

        SET
            aktif = ?,
            updated_at =
                CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        aktif ? 1 : 0,
        id
    );


    return getById(id);

}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {

    getAll,

    getActive,

    getActiveByDepartmentId,

    getById,

    create,

    update,

    setStatus

};