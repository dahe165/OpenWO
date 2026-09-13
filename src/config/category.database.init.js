const db =
    require("./database");


/*
 * =====================================
 * Tabel Categories
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS categories (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        nama TEXT NOT NULL UNIQUE,

        aktif INTEGER NOT NULL DEFAULT 1,

        urutan INTEGER NOT NULL DEFAULT 0,


        created_at TEXT
            DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT
            DEFAULT CURRENT_TIMESTAMP

    );
`);


/*
 * =====================================
 * Tabel Subcategories
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS subcategories (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        category_id INTEGER NOT NULL,

        nama TEXT NOT NULL,

        aktif INTEGER NOT NULL DEFAULT 1,

        urutan INTEGER NOT NULL DEFAULT 0,

        created_at TEXT
            DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT
            DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            category_id
        )
        REFERENCES categories(id)

    );
`);


/*
 * =====================================
 * Index Subcategory
 * =====================================
 *
 * Mempercepat pencarian subkategori
 * berdasarkan kategori induknya.
 *
 */

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_subcategories_category_id

    ON subcategories(category_id);
`);

/*
 * =====================================
 * Tabel Section Categories
 * =====================================
 *
 * Relasi:
 *
 * Seksi ↔ Kategori
 *
 * Satu Seksi dapat memiliki banyak kategori.
 * Satu Kategori dapat digunakan oleh
 * beberapa Seksi.
 *
 * Master Kategori tetap berdiri sendiri.
 *
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS section_categories (

        section_id INTEGER NOT NULL,

        category_id INTEGER NOT NULL,

        created_at TEXT
            DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (
            section_id,
            category_id
        ),

        FOREIGN KEY (
            section_id
        )
        REFERENCES sections(id)
        ON DELETE RESTRICT,

        FOREIGN KEY (
            category_id
        )
        REFERENCES categories(id)
        ON DELETE RESTRICT

    );
`);


/*
 * =====================================
 * Index Section Categories
 * =====================================
 */

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_section_categories_category_id

    ON section_categories(category_id);
`);


console.log(
    "✅ Tabel section_categories siap."
);


/*
 * =====================================
 * Data Kategori Awal
 * =====================================
 */

const insertCategory =
    db.prepare(`
        INSERT OR IGNORE INTO categories (
            nama,
            aktif,
            urutan
        )
        VALUES (?, ?, ?)
    `);


insertCategory.run(
    "Incident",
    1,
    1
);


insertCategory.run(
    "Service Request",
    1,
    2
);


insertCategory.run(
    "Preventive Maintenance",
    1,
    3
);


/*
 * =====================================
 * Ambil ID Kategori
 * =====================================
 */

const getCategory =
    db.prepare(`
        SELECT
            id
        FROM categories
        WHERE nama = ?
    `);


/*
 * =====================================
 * Data Subkategori Awal
 * =====================================
 */

function insertSubcategory(
    categoryId,
    nama,
    aktif,
    urutan
) {

    db.prepare(`
        INSERT INTO subcategories (
            category_id,
            nama,
            aktif,
            urutan
        )
        SELECT ?, ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1
            FROM subcategories
            WHERE category_id = ?
              AND LOWER(nama) = LOWER(?)
        )
    `).run(
        categoryId,
        nama,
        aktif,
        urutan,
        categoryId,
        nama
    );

}


/*
 * -------------------------------------
 * Incident
 * -------------------------------------
 */

const incident =
    getCategory.get("Incident");


if (incident) {

    insertSubcategory(
        incident.id,
        "Network",
        1,
        1
    );

    insertSubcategory(
        incident.id,
        "Computer",
        1,
        2
    );

    insertSubcategory(
        incident.id,
        "Printer",
        1,
        3
    );

    insertSubcategory(
        incident.id,
        "Application",
        1,
        4
    );

}


/*
 * -------------------------------------
 * Service Request
 * -------------------------------------
 */

const serviceRequest =
    getCategory.get("Service Request");


if (serviceRequest) {

    insertSubcategory(
        serviceRequest.id,
        "Software",
        1,
        1
    );

    insertSubcategory(
        serviceRequest.id,
        "Account",
        1,
        2
    );

    insertSubcategory(
        serviceRequest.id,
        "Device",
        1,
        3
    );

}


/*
 * -------------------------------------
 * Preventive Maintenance
 * -------------------------------------
 */

const preventive =
    getCategory.get(
        "Preventive Maintenance"
    );


if (preventive) {

    insertSubcategory(
        preventive.id,
        "PC",
        1,
        1
    );

    insertSubcategory(
        preventive.id,
        "Server",
        1,
        2
    );

    insertSubcategory(
        preventive.id,
        "Network",
        1,
        3
    );

}

/*
 * =====================================
 * Tabel Priorities
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS priorities (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        nama TEXT NOT NULL UNIQUE,

        aktif INTEGER NOT NULL DEFAULT 1,

        urutan INTEGER NOT NULL DEFAULT 0,

        warna TEXT NOT NULL DEFAULT '#64748b',

        created_at TEXT
            DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT
            DEFAULT CURRENT_TIMESTAMP

    );
`);


/*
 * =====================================
 * Migrasi Warna Prioritas
 * =====================================
 *
 * Aman untuk database lama yang sudah memiliki
 * tabel priorities tanpa kolom warna.
 *
 */

const priorityColumns =
    db.prepare(`PRAGMA table_info(priorities)`).all();

if (!priorityColumns.some(column => column.name === "warna")) {

    db.exec(`
        ALTER TABLE priorities
        ADD COLUMN warna TEXT NOT NULL DEFAULT '#64748b'
    `);

    const setPriorityColor =
        db.prepare(`
            UPDATE priorities
            SET warna = ?
            WHERE LOWER(nama) = LOWER(?)
        `);

    [
        ["#dc2626", "Emergency"],
        ["#ea580c", "Critical"],
        ["#d97706", "Urgent"],
        ["#2563eb", "High"],
        ["#16a34a", "Normal"],
        ["#64748b", "Low"]
    ].forEach(([warna, nama]) =>
        setPriorityColor.run(warna, nama)
    );

}


/*
 * =====================================
 * Data Prioritas Awal
 * =====================================
 */

const insertPriority =
    db.prepare(`
        INSERT OR IGNORE INTO priorities (
            nama,
            aktif,
            urutan,
            warna
        )
        VALUES (?, ?, ?, ?)
    `);


insertPriority.run(
    "Critical",
    1,
    1,
    "#ea580c"
);


insertPriority.run(
    "High",
    1,
    2,
    "#2563eb"
);


insertPriority.run(
    "Normal",
    1,
    3,
    "#16a34a"
);


insertPriority.run(
    "Low",
    1,
    4,
    "#64748b"
);


/*
 * =====================================
 * Konfirmasi
 * =====================================
 */

console.log(
    "✅ Tabel priorities siap."
);

console.log(
    "✅ Data prioritas awal siap."
);

/*
 * =====================================
 * Selesai
 * =====================================
 */

console.log(
    "✅ Tabel categories siap."
);

console.log(
    "✅ Tabel subcategories siap."
);

console.log(
    "✅ Data kategori & subkategori awal siap."
);