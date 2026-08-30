const db =
    require("./database");


console.log(
    "=== BUSINESS CALENDAR DATABASE INIT TERPANGGIL ==="
);


/*
 * =====================================
 * Tabel Calendar Settings
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS business_calendar_settings (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        nama TEXT NOT NULL,

        timezone TEXT NOT NULL
            DEFAULT 'Asia/Jakarta',

        aktif INTEGER NOT NULL
            DEFAULT 1

    );
`);


/*
 * =====================================
 * Tabel Business Hours
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS business_hours (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        calendar_id INTEGER NOT NULL,

        hari INTEGER NOT NULL,

        jam_mulai TEXT NOT NULL,

        jam_selesai TEXT NOT NULL,

        aktif INTEGER NOT NULL
            DEFAULT 1,

        FOREIGN KEY (calendar_id)
            REFERENCES business_calendar_settings(id)
            ON DELETE CASCADE,

        UNIQUE (
            calendar_id,
            hari,
            jam_mulai,
            jam_selesai
        )

    );
`);


/*
 * =====================================
 * Tabel Calendar Exceptions
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_exceptions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        calendar_id INTEGER NOT NULL,

        tanggal TEXT NOT NULL,

        tipe TEXT NOT NULL,

        nama TEXT NOT NULL,

        jam_mulai TEXT,

        jam_selesai TEXT,

        keterangan TEXT,

        FOREIGN KEY (calendar_id)
            REFERENCES business_calendar_settings(id)
            ON DELETE CASCADE,

        UNIQUE (
            calendar_id,
            tanggal
        )

    );
`);


/*
 * =====================================
 * Kalender Default
 * =====================================
 */

const insertCalendar =
    db.prepare(`
        INSERT OR IGNORE INTO
        business_calendar_settings (

            id,
            nama,
            timezone,
            aktif

        )

        VALUES (

            1,
            'Default IT Service',
            'Asia/Jakarta',
            1

        )
    `);


insertCalendar.run();


/*
 * =====================================
 * Jam Kerja Default
 *
 * hari:
 * 1 = Senin
 * 2 = Selasa
 * 3 = Rabu
 * 4 = Kamis
 * 5 = Jumat
 * 6 = Sabtu
 * 7 = Minggu
 *
 * =====================================
 */

const insertBusinessHour =
    db.prepare(`
        INSERT OR IGNORE INTO
        business_hours (

            calendar_id,
            hari,
            jam_mulai,
            jam_selesai,
            aktif

        )

        VALUES (

            @calendarId,
            @hari,
            @jamMulai,
            @jamSelesai,
            1

        )
    `);


const businessHours = [

    // Senin
    {
        calendarId: 1,
        hari: 1,
        jamMulai: "08:00",
        jamSelesai: "12:00"
    },

    {
        calendarId: 1,
        hari: 1,
        jamMulai: "13:00",
        jamSelesai: "16:00"
    },


    // Selasa
    {
        calendarId: 1,
        hari: 2,
        jamMulai: "08:00",
        jamSelesai: "12:00"
    },

    {
        calendarId: 1,
        hari: 2,
        jamMulai: "13:00",
        jamSelesai: "16:00"
    },


    // Rabu
    {
        calendarId: 1,
        hari: 3,
        jamMulai: "08:00",
        jamSelesai: "12:00"
    },

    {
        calendarId: 1,
        hari: 3,
        jamMulai: "13:00",
        jamSelesai: "16:00"
    },


    // Kamis
    {
        calendarId: 1,
        hari: 4,
        jamMulai: "08:00",
        jamSelesai: "12:00"
    },

    {
        calendarId: 1,
        hari: 4,
        jamMulai: "13:00",
        jamSelesai: "16:00"
    },


    // Jumat
    {
        calendarId: 1,
        hari: 5,
        jamMulai: "08:00",
        jamSelesai: "12:00"
    },

    {
        calendarId: 1,
        hari: 5,
        jamMulai: "13:00",
        jamSelesai: "16:00"
    }

];


const insertBusinessHours =
    db.transaction(() => {

        for (
            const hour
            of businessHours
        ) {

            insertBusinessHour.run(
                hour
            );

        }

    });


insertBusinessHours();


/*
 * =====================================
 * Verifikasi
 * =====================================
 */

const calendar =
    db.prepare(`
        SELECT *
        FROM business_calendar_settings
        WHERE id = 1
    `).get();


const hours =
    db.prepare(`
        SELECT *
        FROM business_hours
        WHERE calendar_id = 1
        ORDER BY hari, jam_mulai
    `).all();


const exceptions =
    db.prepare(`
        SELECT *
        FROM calendar_exceptions
        WHERE calendar_id = 1
        ORDER BY tanggal
    `).all();


console.log(
    "CALENDAR:",
    calendar
);


console.log(
    "BUSINESS HOURS:",
    hours.length,
    "interval"
);


console.log(
    "CALENDAR EXCEPTIONS:",
    exceptions.length
);


console.log(
    "✅ Business Calendar database siap."
);