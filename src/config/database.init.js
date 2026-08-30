const db =
    require("./database");


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