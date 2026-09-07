const db = require("../config/database");


/*
 * =====================================
 * DEPARTMENT MODEL
 * =====================================
 */


/*
 * =====================================
 * GET ALL
 * =====================================
 */

function getAll() {

    return db.prepare(`
        SELECT
            id,
            kode,
            nama,
            aktif,
            created_at,
            updated_at
        FROM departments

        ORDER BY
            nama ASC,
            id ASC
    `).all();

}


/*
 * =====================================
 * GET ACTIVE
 * =====================================
 */

function getActive() {

    return db.prepare(`
        SELECT
            id,
            kode,
            nama,
            aktif
        FROM departments

        WHERE aktif = 1

        ORDER BY
            nama ASC,
            id ASC
    `).all();

}


/*
 * =====================================
 * GET BY ID
 * =====================================
 */

function getById(id) {

    return db.prepare(`
        SELECT
            id,
            kode,
            nama,
            aktif,
            created_at,
            updated_at
        FROM departments

        WHERE id = ?
    `).get(id);

}


/*
 * =====================================
 * CREATE
 * =====================================
 */

function create({
    kode,
    nama
}) {

    const cleanKode =
        String(kode || "")
            .trim()
            .toUpperCase();

    const cleanNama =
        String(nama || "")
            .trim();

    if (!cleanKode || !cleanNama) {
        return null;
    }

    const result =
        db.prepare(`
            INSERT INTO departments (
                kode,
                nama,
                aktif
            )

            VALUES (
                ?,
                ?,
                1
            )
        `).run(
            cleanKode,
            cleanNama
        );

    return getById(
        result.lastInsertRowid
    );

}


/*
 * =====================================
 * UPDATE
 * =====================================
 */

function update(
    id,
    {
        kode,
        nama
    }
) {

    const cleanKode =
        String(kode || "")
            .trim()
            .toUpperCase();

    const cleanNama =
        String(nama || "")
            .trim();

    if (!cleanKode || !cleanNama) {
        return null;
    }

    db.prepare(`
        UPDATE departments

        SET
            kode = ?,
            nama = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        cleanKode,
        cleanNama,
        id
    );

    return getById(id);

}


/*
 * =====================================
 * SET STATUS
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
        UPDATE departments

        SET
            aktif = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        aktif ? 1 : 0,
        id
    );

    return getById(id);

}


module.exports = {

    getAll,
    getActive,
    getById,
    create,
    update,
    setStatus

};