const db = require("../config/database");


/*
 * =====================================
 * CATEGORY MODEL
 * =====================================
 *
 * Semua akses database untuk:
 *
 * - Categories
 * - Subcategories
 *
 * berada di file ini.
 *
 */


/*
 * =====================================
 * GET ALL CATEGORIES
 * =====================================
 *
 * Mengambil semua kategori.
 *
 * Urutan:
 * 1. urutan
 * 2. id
 *
 */

function getAllCategories() {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM categories
        ORDER BY
            urutan ASC,
            id ASC
    `).all();

}


/*
 * =====================================
 * GET ACTIVE CATEGORIES
 * =====================================
 *
 * Dipakai oleh Form Work Order.
 *
 * Hanya kategori aktif yang ditampilkan.
 *
 */

function getActiveCategories() {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan
        FROM categories
        WHERE aktif = 1
        ORDER BY
            urutan ASC,
            id ASC
    `).all();

}


/*
 * =====================================
 * GET CATEGORY BY ID
 * =====================================
 */

function getCategoryById(id) {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM categories
        WHERE id = ?
    `).get(id);

}


/*
 * =====================================
 * GET CATEGORY BY NAME
 * =====================================
 */

function getCategoryByName(nama) {

    return db.prepare(`
        SELECT
            id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM categories
        WHERE nama = ?
    `).get(nama);

}


/*
 * =====================================
 * CREATE CATEGORY
 * =====================================
 */

function createCategory(
    nama,
    urutan = 0
) {

    const result =
        db.prepare(`
            INSERT INTO categories (
                nama,
                aktif,
                urutan
            )
            VALUES (?, 1, ?)
        `).run(
            nama.trim(),
            Number(urutan) || 0
        );


    return getCategoryById(
        result.lastInsertRowid
    );

}


/*
 * =====================================
 * UPDATE CATEGORY
 * =====================================
 */

function updateCategory(
    id,
    nama,
    urutan
) {

    db.prepare(`
        UPDATE categories

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


    return getCategoryById(id);

}


/*
 * =====================================
 * SET CATEGORY STATUS
 * =====================================
 *
 * Tidak menghapus data.
 *
 * aktif:
 * 1 = Aktif
 * 0 = Tidak Aktif
 *
 */

function setCategoryStatus(
    id,
    aktif
) {

    db.prepare(`
        UPDATE categories

        SET
            aktif = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        aktif ? 1 : 0,
        id
    );


    return getCategoryById(id);

}


/*
 * =====================================
 * GET SUBCATEGORIES
 * =====================================
 *
 * Mengambil semua subkategori
 * berdasarkan category_id.
 *
 */

function getSubcategories(
    categoryId
) {

    return db.prepare(`
        SELECT
            id,
            category_id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM subcategories
        WHERE category_id = ?
        ORDER BY
            urutan ASC,
            id ASC
    `).all(categoryId);

}


/*
 * =====================================
 * GET ACTIVE SUBCATEGORIES
 * =====================================
 *
 * Dipakai oleh Form Work Order.
 *
 */

function getActiveSubcategories(
    categoryId
) {

    return db.prepare(`
        SELECT
            id,
            category_id,
            nama,
            aktif,
            urutan
        FROM subcategories
        WHERE category_id = ?
          AND aktif = 1
        ORDER BY
            urutan ASC,
            id ASC
    `).all(categoryId);

}


/*
 * =====================================
 * GET SUBCATEGORY BY ID
 * =====================================
 */

function getSubcategoryById(id) {

    return db.prepare(`
        SELECT
            id,
            category_id,
            nama,
            aktif,
            urutan,
            created_at,
            updated_at
        FROM subcategories
        WHERE id = ?
    `).get(id);

}


/*
 * =====================================
 * CREATE SUBCATEGORY
 * =====================================
 */

function createSubcategory(
    categoryId,
    nama,
    urutan = 0
) {

    const result =
        db.prepare(`
            INSERT INTO subcategories (
                category_id,
                nama,
                aktif,
                urutan
            )
            VALUES (?, ?, 1, ?)
        `).run(
            categoryId,
            nama.trim(),
            Number(urutan) || 0
        );


    return getSubcategoryById(
        result.lastInsertRowid
    );

}


/*
 * =====================================
 * UPDATE SUBCATEGORY
 * =====================================
 */

function updateSubcategory(
    id,
    nama,
    urutan
) {

    db.prepare(`
        UPDATE subcategories

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


    return getSubcategoryById(id);

}


/*
 * =====================================
 * SET SUBCATEGORY STATUS
 * =====================================
 *
 * Tidak menghapus data.
 *
 */

function setSubcategoryStatus(
    id,
    aktif
) {

    db.prepare(`
        UPDATE subcategories

        SET
            aktif = ?,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = ?
    `).run(
        aktif ? 1 : 0,
        id
    );


    return getSubcategoryById(id);

}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {

    getAllCategories,

    getActiveCategories,

    getCategoryById,

    getCategoryByName,

    createCategory,

    updateCategory,

    setCategoryStatus,

    getSubcategories,

    getActiveSubcategories,

    getSubcategoryById,

    createSubcategory,

    updateSubcategory,

    setSubcategoryStatus

};