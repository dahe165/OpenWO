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

        role TEXT NOT NULL

    );
`);


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
        role: "asman"
    },

    {
        id: 2,
        nama: "Budi",
        username: "budi",
        role: "pelapor"
    },

    {
        id: 3,
        nama: "Andi",
        username: "andi",
        role: "teknisi"
    },

    {
        id: 4,
        nama: "Manager",
        username: "manager",
        role: "manager"
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
            role
        )
        VALUES (
            @id,
            @nama,
            @username,
            @role
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
    "✅ Database SQLite siap."
);

console.log(
    "✅ Data user berhasil disiapkan."
);