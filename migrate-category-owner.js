const db = require("./src/config/database");

console.log("=== OPENWO CATEGORY OWNER MIGRATION ===");
console.log("DATABASE FILE:", db.name);

db.pragma("foreign_keys = ON");

const columns = db.prepare(`
    PRAGMA table_info(categories)
`).all();

const hasDepartmentId = columns.some(
    column => column.name === "department_id"
);

if (!hasDepartmentId) {
    db.exec(`
        ALTER TABLE categories
        ADD COLUMN department_id INTEGER
        REFERENCES departments(id);
    `);

    console.log(
        "DATABASE MIGRATION: categories.department_id berhasil ditambahkan."
    );
} else {
    console.log(
        "DATABASE MIGRATION: categories.department_id sudah ada."
    );
}

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_categories_department_id
    ON categories(department_id);
`);

console.log(
    "DATABASE MIGRATION: index categories.department_id siap."
);

/*
 * -------------------------------------------------
 * Backfill aman:
 *
 * Jika kategori yang sudah ada digunakan oleh Seksi
 * dan seluruh Seksi tersebut berada pada satu Bagian,
 * Bagian tersebut dijadikan Pemilik kategori.
 *
 * Jika belum bisa ditentukan secara tunggal,
 * department_id dibiarkan NULL agar dapat ditentukan
 * melalui Master Kategori.
 *
 * Tidak menghapus kategori maupun relasi yang ada.
 * -------------------------------------------------
 */

const categories = db.prepare(`
    SELECT id, nama, department_id
    FROM categories
`).all();

const getDepartments = db.prepare(`
    SELECT DISTINCT
        sections.department_id
    FROM section_categories
    INNER JOIN sections
        ON sections.id = section_categories.section_id
    WHERE section_categories.category_id = ?
      AND sections.department_id IS NOT NULL
`);

const setOwner = db.prepare(`
    UPDATE categories
    SET
        department_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
`);

let assigned = 0;
let ambiguous = 0;
let untouched = 0;

const migrate = db.transaction(() => {
    for (const category of categories) {

        if (category.department_id !== null) {
            untouched++;
            continue;
        }

        const departments = getDepartments
            .all(Number(category.id))
            .map(row => Number(row.department_id));

        const uniqueDepartments = [
            ...new Set(departments)
        ];

        if (uniqueDepartments.length === 1) {
            setOwner.run(
                uniqueDepartments[0],
                Number(category.id)
            );

            assigned++;
        } else if (uniqueDepartments.length > 1) {
            ambiguous++;
        } else {
            untouched++;
        }
    }
});

migrate();

const finalColumns = db.prepare(`
    PRAGMA table_info(categories)
`).all();

console.log(
    "CATEGORIES COLUMNS:",
    finalColumns.map(column => column.name)
);

console.log(
    "CATEGORY OWNER BACKFILL:",
    {
        assigned,
        ambiguous,
        untouched
    }
);

console.log("✅ Category Owner migration selesai.");
