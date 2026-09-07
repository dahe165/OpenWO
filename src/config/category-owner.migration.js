const db = require("./database");

/*
 * =====================================================
 * MIGRASI PEMILIK BAGIAN PADA MASTER KATEGORI
 * =====================================================
 * Non-destructive. Tidak menghapus data yang sudah ada.
 */

const columns = db.prepare(`PRAGMA table_info(categories)`).all();
const hasDepartmentId = columns.some(column => column.name === "department_id");

if (!hasDepartmentId) {
    db.exec(`ALTER TABLE categories ADD COLUMN department_id INTEGER;`);
    console.log("✅ categories.department_id berhasil ditambahkan.");
} else {
    console.log("ℹ️ categories.department_id sudah tersedia.");
}

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_categories_department_id
    ON categories(department_id);
`);

/*
 * Wariskan owner untuk kategori lama yang sudah digunakan
 * oleh Seksi dari tepat satu Bagian.
 */
const usages = db.prepare(`
    SELECT
        sc.category_id,
        s.department_id
    FROM section_categories sc
    INNER JOIN sections s
        ON s.id = sc.section_id
    GROUP BY sc.category_id, s.department_id
    ORDER BY sc.category_id ASC, s.department_id ASC
`).all();

const byCategory = new Map();

for (const row of usages) {
    const categoryId = Number(row.category_id);
    const departmentId = Number(row.department_id);

    if (!byCategory.has(categoryId)) {
        byCategory.set(categoryId, new Set());
    }

    byCategory.get(categoryId).add(departmentId);
}

const assignOwner = db.prepare(`
    UPDATE categories
    SET department_id = ?
    WHERE id = ?
      AND department_id IS NULL
`);

for (const [categoryId, departmentIds] of byCategory.entries()) {
    if (departmentIds.size === 1) {
        assignOwner.run([...departmentIds][0], categoryId);
    }
}

console.log("✅ Migrasi Pemilik Bagian kategori selesai.");
