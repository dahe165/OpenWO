const db =
    require("./database");


/*
 * =====================================
 * Tabel Departments / Bagian
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS departments (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        kode TEXT NOT NULL UNIQUE,

        nama TEXT NOT NULL UNIQUE,

        aktif INTEGER NOT NULL DEFAULT 1,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

    );
`);

console.log(
    "✅ Tabel departments / Bagian siap."
);

/*
 * =====================================
 * MASTER SEKSI
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        department_id INTEGER NOT NULL,

        kode TEXT NOT NULL,
        nama TEXT NOT NULL,

        aktif INTEGER NOT NULL DEFAULT 1,

        urutan INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (department_id)
            REFERENCES departments(id)
            ON DELETE RESTRICT,

        UNIQUE (
            department_id,
            kode
        ),

        UNIQUE (
            department_id,
            nama
        )
    );
`);

console.log(
    "✅ Tabel sections siap."
);

/*
 * =====================================
 * RELASI SEKSI ↔ KATEGORI
 * =====================================
 *
 * Master Kategori tetap berdiri sendiri.
 * Relasi Seksi → Kategori disimpan di tabel
 * section_categories.
 *
 * Satu kategori dapat digunakan oleh
 * beberapa Seksi.
 *
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS section_categories (
        section_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,

        created_at TEXT NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (
            section_id,
            category_id
        ),

        FOREIGN KEY (section_id)
            REFERENCES sections(id)
            ON DELETE RESTRICT,

        FOREIGN KEY (category_id)
            REFERENCES categories(id)
            ON DELETE RESTRICT
    );
`);

console.log(
    "✅ Tabel section_categories siap."
);

/*
 * -------------------------------------
 * Index Relasi Kategori
 * -------------------------------------
 */

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_section_categories_category_id
    ON section_categories(category_id);
`);

/*
 * =====================================
 * Tabel Users
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS users (

        id INTEGER PRIMARY KEY,

        nama TEXT NOT NULL,

        username TEXT NOT NULL UNIQUE,

        role TEXT NOT NULL,

        seksi TEXT,

        bagian TEXT

    );
`);

/*
 * =====================================
 * MIGRASI USERS
 * Rename:
 *
 * divisi      → seksi
 * organisasi  → bagian
 * =====================================
 */

const userColumns =
    db.prepare(`
        PRAGMA table_info(users)
    `).all();


const hasDivisi =
    userColumns.some(
        column =>
            column.name === "divisi"
    );


const hasOrganisasi =
    userColumns.some(
        column =>
            column.name === "organisasi"
    );


const hasSeksi =
    userColumns.some(
        column =>
            column.name === "seksi"
    );


const hasBagian =
    userColumns.some(
        column =>
            column.name === "bagian"
    );


/*
 * -------------------------------------
 * divisi → seksi
 * -------------------------------------
 */

if (
    hasDivisi &&
    !hasSeksi
) {

    db.exec(`
        ALTER TABLE users
        RENAME COLUMN divisi TO seksi;
    `);

    console.log(
        "DATABASE MIGRATION: divisi → seksi berhasil."
    );

}


/*
 * -------------------------------------
 * organisasi → bagian
 * -------------------------------------
 */

if (
    hasOrganisasi &&
    !hasBagian
) {

    db.exec(`
        ALTER TABLE users
        RENAME COLUMN organisasi TO bagian;
    `);

    console.log(
        "DATABASE MIGRATION: organisasi → bagian berhasil."
    );

}

/*
 * -------------------------------------
 * password_hash
 * -------------------------------------
 */

const hasPasswordHash =
    userColumns.some(
        column =>
            column.name === "password_hash"
    );

if (!hasPasswordHash) {

    db.exec(`
        ALTER TABLE users
        ADD COLUMN password_hash TEXT;
    `);

    console.log(
        "DATABASE MIGRATION: kolom password_hash berhasil ditambahkan."
    );

}

/*
 * -------------------------------------
 * department_id
 * -------------------------------------
 *
 * Relasi User → Bagian
 *
 * Nullable untuk menjaga kompatibilitas
 * dengan data user lama.
 *
 * Tidak menghapus:
 * - users.bagian
 * - users.seksi
 *
 */

const hasDepartmentId =
    userColumns.some(
        column =>
            column.name === "department_id"
    );


if (!hasDepartmentId) {

    db.exec(`
        ALTER TABLE users
        ADD COLUMN department_id INTEGER
        REFERENCES departments(id);
    `);

    console.log(
        "DATABASE MIGRATION: kolom department_id berhasil ditambahkan."
    );

}

/*
 * -------------------------------------
 * section_id
 * -------------------------------------
 *
 * Relasi User → Seksi
 *
 * Nullable untuk menjaga kompatibilitas
 * dengan data user lama.
 *
 * Tidak menghapus:
 * - users.seksi
 * - users.bagian
 *
 */

const hasSectionId =
    userColumns.some(
        column =>
            column.name === "section_id"
    );


if (!hasSectionId) {

    db.exec(`
        ALTER TABLE users
        ADD COLUMN section_id INTEGER
        REFERENCES sections(id);
    `);

    console.log(
        "DATABASE MIGRATION: kolom section_id berhasil ditambahkan."
    );

}


/*
 * -------------------------------------
 * Index section_id
 * -------------------------------------
 */

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_users_section_id
    ON users(section_id);
`);

/*
 * -------------------------------------
 * Index department_id
 * -------------------------------------
 */

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_users_department_id
    ON users(department_id);
`);

/*
 * -------------------------------------
 * Verifikasi akhir
 * -------------------------------------
 */

const finalUserColumns =
    db.prepare(`
        PRAGMA table_info(users)
    `).all();


console.log(
    "USERS COLUMNS:",
    finalUserColumns.map(
        column => column.name
    )
);

/*
 * =====================================
 * Data User Awal
 * =====================================
 */

const users = [

    {
        id: 1,
        nama: "Dahe Ugi",
        username: "dahe",
        role: "asman",
        divisi: null,
        organisasi: null
    },

    {
        id: 2,
        nama: "Budi",
        username: "budi",
        role: "pelapor",
        divisi: null,
        organisasi: null
    },

    {
        id: 3,
        nama: "Andi",
        username: "andi",
        role: "teknisi",
        divisi: null,
        organisasi: null
    },

    {
        id: 4,
        nama: "Manager",
        username: "manager",
        role: "manager",
        divisi: null,
        organisasi: null
    }

];


/*
 * =====================================
 * Insert User
 * =====================================
 */

const insertUser =
    db.prepare(`
        INSERT OR IGNORE INTO users (
            id,
            nama,
            username,
            role,
            seksi,
            bagian
        )
        VALUES (
            @id,
            @nama,
            @username,
            @role,
            @divisi,
            @organisasi
        )
    `);


const insertUsers =
    db.transaction(() => {

        for (const user of users) {

            insertUser.run(user);

        }

    });


insertUsers();


/*
 * =====================================
 * Tabel System Settings
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        key TEXT NOT NULL UNIQUE,

        value TEXT,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP

    );
`);

/*
 * =====================================
 * MASTER ASSET
 * =====================================
 *
 * Asset Management v0.0
 *
 * Asset berdiri sendiri terlebih dahulu.
 * Relasi ke Work Order belum dibuat.
 *
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS assets (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        kode TEXT NOT NULL UNIQUE,

        nama TEXT NOT NULL,

        jenis TEXT,

        merk TEXT,

        model TEXT,

        serial_number TEXT,

        lokasi TEXT,

        department_id INTEGER NOT NULL,

        section_id INTEGER NOT NULL,

        status TEXT NOT NULL DEFAULT 'Aktif',

        keterangan TEXT,

        created_at TEXT NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (department_id)
            REFERENCES departments(id)
            ON DELETE RESTRICT,

        FOREIGN KEY (section_id)
            REFERENCES sections(id)
            ON DELETE RESTRICT

    );
`);


db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_assets_department_id
    ON assets(department_id);
`);


db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_assets_section_id
    ON assets(section_id);
`);


db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_assets_status
    ON assets(status);
`);

console.log(
    "✅ Tabel assets / Master Asset siap."
);


/*
 * =====================================
 * Tabel SLA Event
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_sla_events (

        id INTEGER PRIMARY KEY,

        work_order_id INTEGER NOT NULL,

        event TEXT NOT NULL,

        user_id INTEGER,

        reason TEXT,

        metadata TEXT,

        occurred_at TEXT NOT NULL,

        created_at TEXT NOT NULL,

        FOREIGN KEY (work_order_id)
            REFERENCES work_orders(id)
            ON DELETE CASCADE,

        FOREIGN KEY (user_id)
            REFERENCES users(id)

    );
`);

console.log(
    "✅ Tabel work_order_sla_events siap."
);

/*
 * =====================================
 * Pengaturan Sistem Awal
 * =====================================
 */

const insertSetting =
    db.prepare(`
        INSERT OR IGNORE INTO system_settings (
            key,
            value
        )
        VALUES (?, ?)
    `);


insertSetting.run(
    "app_name",
    "OpenWO"
);


insertSetting.run(
    "app_description",
    "Smart Work Order Management"
);


insertSetting.run(
    "app_logo",
    ""
);

insertSetting.run(
    "workflow_closing",
    "on"
);

insertSetting.run(
    "workflow_verification",
    "on"
);

insertSetting.run(
    "workflow_escalation",
    "on"
);

insertSetting.run(
    "timeline_display_mode",
    "detail"
);

insertSetting.run("timeline_color_dibuat", "#0ea5e9");
insertSetting.run("timeline_color_diterima", "#8b5cf6");
insertSetting.run("timeline_color_ditugaskan", "#f59e0b");
insertSetting.run("timeline_color_dikerjakan", "#2563eb");
insertSetting.run("timeline_color_selesai", "#16a34a");


console.log(
    "✅ Tabel system_settings siap."
);


console.log(
    "✅ SQLite database siap."
);


console.log(
    "✅ Tabel users siap dengan Divisi & Organisasi."
);


console.log(
    "✅ Data user berhasil disiapkan."
);