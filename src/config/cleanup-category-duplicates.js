const db = require("./database");


/*
 * =====================================
 * BERSIHKAN DUPLIKAT SUBKATEGORI
 * =====================================
 *
 * Untuk setiap:
 *
 * category_id + nama
 *
 * kita pertahankan ID paling kecil.
 *
 * Data duplikat lainnya dihapus.
 *
 */

db.exec(`
    DELETE FROM subcategories
    WHERE id NOT IN (
        SELECT MIN(id)
        FROM subcategories
        GROUP BY
            category_id,
            LOWER(nama)
    );
`);


console.log(
    "🧹 Duplikat subkategori berhasil dibersihkan."
);