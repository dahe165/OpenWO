const db = require("../config/database");

/*
 * =====================================
 * ASSET MODEL
 * =====================================
 *
 * Master Asset v0.0
 *
 * Asset berdiri sendiri terlebih dahulu.
 * Relasi ke Work Order belum dibuat pada tahap ini.
 *
 */

function getAll() {
    return db.prepare(`
        SELECT
            assets.id,
            assets.kode,
            assets.nama,
            assets.jenis,
            assets.merk,
            assets.model,
            assets.serial_number,
            assets.lokasi,
            assets.department_id,
            assets.section_id,
            assets.status,
            assets.keterangan,
            assets.created_at,
            assets.updated_at,

            departments.kode AS department_kode,
            departments.nama AS department_nama,

            sections.kode AS section_kode,
            sections.nama AS section_nama

        FROM assets

        LEFT JOIN departments
            ON departments.id = assets.department_id

        LEFT JOIN sections
            ON sections.id = assets.section_id

        ORDER BY
            assets.kode ASC,
            assets.id ASC
    `).all();
}

function getById(id) {
    return db.prepare(`
        SELECT
            assets.id,
            assets.kode,
            assets.nama,
            assets.jenis,
            assets.merk,
            assets.model,
            assets.serial_number,
            assets.lokasi,
            assets.department_id,
            assets.section_id,
            assets.status,
            assets.keterangan,
            assets.created_at,
            assets.updated_at,

            departments.kode AS department_kode,
            departments.nama AS department_nama,

            sections.kode AS section_kode,
            sections.nama AS section_nama

        FROM assets

        LEFT JOIN departments
            ON departments.id = assets.department_id

        LEFT JOIN sections
            ON sections.id = assets.section_id

        WHERE assets.id = ?
    `).get(id);
}

function create(data) {
    const result = db.prepare(`
        INSERT INTO assets (
            kode,
            nama,
            jenis,
            merk,
            model,
            serial_number,
            lokasi,
            department_id,
            section_id,
            status,
            keterangan
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        data.kode,
        data.nama,
        data.jenis || null,
        data.merk || null,
        data.model || null,
        data.serial_number || null,
        data.lokasi || null,
        data.department_id,
        data.section_id,
        data.status,
        data.keterangan || null
    );

    return getById(result.lastInsertRowid);
}

function update(id, data) {
    db.prepare(`
        UPDATE assets
        SET
            kode = ?,
            nama = ?,
            jenis = ?,
            merk = ?,
            model = ?,
            serial_number = ?,
            lokasi = ?,
            department_id = ?,
            section_id = ?,
            status = ?,
            keterangan = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        data.kode,
        data.nama,
        data.jenis || null,
        data.merk || null,
        data.model || null,
        data.serial_number || null,
        data.lokasi || null,
        data.department_id,
        data.section_id,
        data.status,
        data.keterangan || null,
        id
    );

    return getById(id);
}

module.exports = {
    getAll,
    getById,
    create,
    update
};
