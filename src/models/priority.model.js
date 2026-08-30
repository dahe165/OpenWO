const db =
    require("../config/database");


/*
 * =====================================
 * PRIORITY MODEL
 * =====================================
 *
 * Semua akses database untuk:
 *
 * - Priorities
 *
 * berada di file ini.
 *
 */


/*
 * =====================================
 * GET ALL PRIORITIES
 * =====================================
 *
 * Mengambil semua prioritas.
 *
 * Urutan:
 * 1. urutan
 * 2. id
 *
 */

function getAllPriorities() {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM priorities
        ORDER BY
            urutan ASC,
            id ASC
    `).all();

}


/*
 * =====================================
 * GET ACTIVE PRIORITIES
 * =====================================
 *
 * Dipakai oleh Form Work Order.
 *
 * Hanya prioritas aktif yang ditampilkan.
 *
 */

function getActivePriorities() {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan
        FROM priorities
        WHERE aktif = 1
        ORDER BY
            urutan ASC,
            id ASC
    `).all();

}


/*
 * =====================================
 * GET PRIORITY BY ID
 * =====================================
 */

function getPriorityById(id) {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM priorities
        WHERE id = ?
    `).get(id);

}


/*
 * =====================================
 * GET PRIORITY BY NAME
 * =====================================
 */

function getPriorityByName(nama) {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM priorities
        WHERE nama = ?
    `).get(nama);

}


/*
 * =====================================
 * CREATE PRIORITY
 * =====================================
 */

function createPriority(
    nama,
    urutan = 0
) {

    const result =
        db.prepare(`
            INSERT INTO priorities (
                nama,
                aktif,
                urutan
            )
            VALUES (?, 1, ?)
        `).run(
            nama.trim(),
            Number(urutan) || 0
        );


    return getPriorityById(
        result.lastInsertRowid
    );

}


/*
 * =====================================
 * UPDATE PRIORITY
 * =====================================
 */

function updatePriority(
    id,
    nama,
    urutan
) {

    db.prepare(`
        UPDATE priorities

        SET
            nama = ?,
            urutan = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        nama.trim(),
        Number(urutan) || 0,
        id
    );


    return getPriorityById(id);

}


/*
 * =====================================
 * SET PRIORITY STATUS
 * =====================================
 *
 * Tidak menghapus data.
 *
 * aktif:
 * 1 = Aktif
 * 0 = Tidak Aktif
 *
 */

function setPriorityStatus(
    id,
    aktif
) {

    db.prepare(`
        UPDATE priorities

        SET
            aktif = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        aktif ? 1 : 0,
        id
    );


    return getPriorityById(id);

}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {

    getAllPriorities,

    getActivePriorities,

    getPriorityById,

    getPriorityByName,

    createPriority,

    updatePriority,

    setPriorityStatus

};