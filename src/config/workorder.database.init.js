console.log("=== WORKORDER DATABASE INIT TERPANGGIL ===");

const db = require("./database");

console.log(
    "=== DATABASE FILE ==="
);

console.log(
    db.name
);


/*
 * =====================================
 * Aktifkan Foreign Key
 * =====================================
 */

db.pragma("foreign_keys = ON");


/*
 * =====================================
 * Tabel Work Orders
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS work_orders (

        id INTEGER PRIMARY KEY,

        nomor TEXT NOT NULL UNIQUE,

        judul TEXT NOT NULL,

        deskripsi TEXT,

        kategori TEXT NOT NULL,

        subkategori TEXT NOT NULL,

        status TEXT NOT NULL,

        pelapor_id INTEGER NOT NULL,

        teknisi_id INTEGER,

        eskalasi INTEGER NOT NULL DEFAULT 0,

        eskalasi_level TEXT,

        created_at TEXT NOT NULL,

        updated_at TEXT,

        FOREIGN KEY (pelapor_id)
            REFERENCES users(id),

        FOREIGN KEY (teknisi_id)
            REFERENCES users(id)

    );
`);

/*
 * =====================================
 * MIGRASI — DESKRIPSI PENYELESAIAN
 * =====================================
 */

const workOrderColumns =
    db.prepare(`
        PRAGMA table_info(work_orders)
    `).all();


const hasResolutionDescription =
    workOrderColumns.some(
        column =>
            column.name ===
            "resolution_description"
    );


if (!hasResolutionDescription) {

    db.exec(`
        ALTER TABLE work_orders
        ADD COLUMN resolution_description TEXT;
    `);

    console.log(
        "DATABASE MIGRATION: kolom resolution_description berhasil ditambahkan."
    );

}

/*
 * =====================================
 * MIGRASI — FOTO PENYELESAIAN
 * =====================================
 */

const hasCompletionPhoto =
    workOrderColumns.some(
        column =>
            column.name ===
            "completion_photo"
    );


if (!hasCompletionPhoto) {

    db.exec(`
        ALTER TABLE work_orders
        ADD COLUMN completion_photo TEXT;
    `);

    console.log(
        "DATABASE MIGRATION: kolom completion_photo berhasil ditambahkan."
    );

}

/*
 * =====================================
 * MIGRASI — DIBUAT OLEH
 * =====================================
 */

const hasCreatedBy =
    workOrderColumns.some(
        column =>
            column.name ===
            "created_by"
    );


if (!hasCreatedBy) {

    db.exec(`
        ALTER TABLE work_orders
        ADD COLUMN created_by INTEGER;
    `);

    console.log(
        "DATABASE MIGRATION: kolom created_by berhasil ditambahkan."
    );

}

/*
 * =====================================
 * MIGRASI — PRIORITAS
 * =====================================
 */

const hasPriority =
    workOrderColumns.some(
        column =>
            column.name ===
            "prioritas"
    );


if (!hasPriority) {

    db.exec(`
        ALTER TABLE work_orders
        ADD COLUMN prioritas TEXT;
    `);

    console.log(
        "DATABASE MIGRATION: kolom prioritas berhasil ditambahkan."
    );

}

/*
 * =====================================
 * Tabel Timeline
 * =====================================
 */

db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_timeline (

        id INTEGER PRIMARY KEY,

        work_order_id INTEGER NOT NULL,

        status TEXT NOT NULL,

        user_id INTEGER NOT NULL,

        created_at TEXT NOT NULL,

        FOREIGN KEY (work_order_id)
            REFERENCES work_orders(id)
            ON DELETE CASCADE,

        FOREIGN KEY (user_id)
            REFERENCES users(id)

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
 * Migrasi Timeline — Alasan Eskalasi
 * =====================================
 */

const timelineColumns =
    db.prepare(`
        PRAGMA table_info(work_order_timeline)
    `).all();


console.log(
    "TIMELINE COLUMNS:",
    timelineColumns.map(column => column.name)
);


const hasReasonColumn =
    timelineColumns.some(
        column => column.name === "reason"
    );


if (!hasReasonColumn) {

    db.exec(`
        ALTER TABLE work_order_timeline
        ADD COLUMN reason TEXT;
    `);

    console.log(
        "DATABASE MIGRATION: kolom reason berhasil ditambahkan."
    );

}

/*
 * =====================================
 * Data Work Order Awal
 * =====================================
 */

const workorders = [

    {
        id: 1,
        nomor: "WO-2026-00001",
        judul: "Internet Kantor Mati",
        deskripsi: null,
        kategori: "Incident",
        subkategori: "Network",
        status: "Ditugaskan",
        pelaporId: 2,
        teknisiId: 3,
        eskalasi: false,
        eskalasiLevel: null,
        createdAt: "2026-08-07T09:30:00",
        updatedAt: null
    },

    {
        id: 2,
        nomor: "WO-2026-00002",
        judul: "Printer Tidak Bisa Print",
        deskripsi: null,
        kategori: "Incident",
        subkategori: "Hardware",
        status: "Menunggu",
        pelaporId: 2,
        teknisiId: null,
        eskalasi: false,
        eskalasiLevel: null,
        createdAt: "2026-08-07T09:00:00",
        updatedAt: null
    },

    {
        id: 3,
        nomor: "WO-2026-00003",
        judul: "WiFi Lantai 2 Lambat",
        deskripsi: null,
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelaporId: 2,
        teknisiId: 3,
        eskalasi: false,
        eskalasiLevel: null,
        createdAt: "2026-08-07T08:30:00",
        updatedAt: null
    },

    {
        id: 4,
        nomor: "WO-2026-00004",
        judul: "WiFi Lantai 10 Lag",
        deskripsi: null,
        kategori: "Incident",
        subkategori: "Hardware",
        status: "Diproses",
        pelaporId: 2,
        teknisiId: 3,
        eskalasi: false,
        eskalasiLevel: null,
        createdAt: "2026-08-07T08:30:00",
        updatedAt: null
    },

    {
        id: 5,
        nomor: "WO-2026-00005",
        judul: "WiFi Lantai 2 Lambat",
        deskripsi: null,
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelaporId: 2,
        teknisiId: 3,
        eskalasi: false,
        eskalasiLevel: null,
        createdAt: "2026-08-07T08:30:00",
        updatedAt: null
    },

    {
        id: 6,
        nomor: "WO-2026-00006",
        judul: "WiFi Lantai 2 Lambat",
        deskripsi: null,
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelaporId: 2,
        teknisiId: 3,
        eskalasi: false,
        eskalasiLevel: null,
        createdAt: "2026-08-07T08:30:00",
        updatedAt: null
    },

    {
        id: 7,
        nomor: "WO-2026-00007",
        judul: "Router Tidak ada sinyal",
        deskripsi: null,
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelaporId: 2,
        teknisiId: 3,
        eskalasi: true,
        eskalasiLevel: "Manager",
        createdAt: "2026-08-07T08:30:00",
        updatedAt: null
    }

];


/*
 * =====================================
 * Insert Work Orders
 * =====================================
 */

const insertWorkorder = db.prepare(`
    INSERT OR IGNORE INTO work_orders (

        id,
        nomor,
        judul,
        deskripsi,
        kategori,
        subkategori,
        status,
        pelapor_id,
        teknisi_id,
        eskalasi,
        eskalasi_level,
        created_at,
        updated_at

    )

    VALUES (

        @id,
        @nomor,
        @judul,
        @deskripsi,
        @kategori,
        @subkategori,
        @status,
        @pelaporId,
        @teknisiId,
        @eskalasi,
        @eskalasiLevel,
        @createdAt,
        @updatedAt

    )
`);


const insertWorkorders = db.transaction(() => {

    for (const workorder of workorders) {

        insertWorkorder.run({

            ...workorder,

            eskalasi:
                workorder.eskalasi ? 1 : 0

        });

    }

});


insertWorkorders();


/*
 * =====================================
 * Data Timeline
 * =====================================
 */

const timeline = [

    // WO 1

    {
        id: 1,
        workOrderId: 1,
        status: "Dibuat",
        userId: 2,
        createdAt: "2026-08-07T09:30:00"
    },

    {
        id: 2,
        workOrderId: 1,
        status: "Diterima",
        userId: 1,
        createdAt: "2026-08-07T09:35:00"
    },

    {
        id: 3,
        workOrderId: 1,
        status: "Ditugaskan",
        userId: 1,
        createdAt: "2026-08-07T09:40:00"
    },


    // WO 2

    {
        id: 4,
        workOrderId: 2,
        status: "Dibuat",
        userId: 2,
        createdAt: "2026-08-07T09:00:00"
    },


    // WO 3

    {
        id: 5,
        workOrderId: 3,
        status: "Dibuat",
        userId: 2,
        createdAt: "2026-08-07T08:30:00"
    },

    {
        id: 6,
        workOrderId: 3,
        status: "Diterima",
        userId: 1,
        createdAt: "2026-08-07T08:35:00"
    },

    {
        id: 7,
        workOrderId: 3,
        status: "Ditugaskan",
        userId: 1,
        createdAt: "2026-08-07T08:40:00"
    },

    {
        id: 8,
        workOrderId: 3,
        status: "Dikerjakan",
        userId: 3,
        createdAt: "2026-08-07T08:45:00"
    },


    // WO 4

    {
        id: 9,
        workOrderId: 4,
        status: "Dibuat",
        userId: 2,
        createdAt: "2026-08-07T08:30:00"
    },

    {
        id: 10,
        workOrderId: 4,
        status: "Diterima",
        userId: 1,
        createdAt: "2026-08-07T08:35:00"
    },

    {
        id: 11,
        workOrderId: 4,
        status: "Ditugaskan",
        userId: 1,
        createdAt: "2026-08-07T08:40:00"
    },

    {
        id: 12,
        workOrderId: 4,
        status: "Dikerjakan",
        userId: 3,
        createdAt: "2026-08-07T08:45:00"
    },


    // WO 5

    {
        id: 13,
        workOrderId: 5,
        status: "Dibuat",
        userId: 2,
        createdAt: "2026-08-07T08:30:00"
    },

    {
        id: 14,
        workOrderId: 5,
        status: "Diterima",
        userId: 1,
        createdAt: "2026-08-07T08:35:00"
    },

    {
        id: 15,
        workOrderId: 5,
        status: "Ditugaskan",
        userId: 1,
        createdAt: "2026-08-07T08:40:00"
    },

    {
        id: 16,
        workOrderId: 5,
        status: "Dikerjakan",
        userId: 3,
        createdAt: "2026-08-07T08:45:00"
    },


    // WO 6

    {
        id: 17,
        workOrderId: 6,
        status: "Dibuat",
        userId: 2,
        createdAt: "2026-08-07T08:30:00"
    },

    {
        id: 18,
        workOrderId: 6,
        status: "Diterima",
        userId: 1,
        createdAt: "2026-08-07T08:35:00"
    },

    {
        id: 19,
        workOrderId: 6,
        status: "Ditugaskan",
        userId: 1,
        createdAt: "2026-08-07T08:40:00"
    },

    {
        id: 20,
        workOrderId: 6,
        status: "Dikerjakan",
        userId: 3,
        createdAt: "2026-08-07T08:45:00"
    },


    // WO 7

    {
        id: 21,
        workOrderId: 7,
        status: "Dibuat",
        userId: 2,
        createdAt: "2026-08-07T08:30:00"
    },

    {
        id: 22,
        workOrderId: 7,
        status: "Diterima",
        userId: 1,
        createdAt: "2026-08-07T08:35:00"
    },

    {
        id: 23,
        workOrderId: 7,
        status: "Ditugaskan",
        userId: 1,
        createdAt: "2026-08-07T08:40:00"
    },

    {
        id: 24,
        workOrderId: 7,
        status: "Dikerjakan",
        userId: 3,
        createdAt: "2026-08-07T08:45:00"
    }

];


const insertTimeline = db.prepare(`
    INSERT OR IGNORE INTO work_order_timeline (

        id,
        work_order_id,
        status,
        user_id,
        created_at

    )

    VALUES (

        @id,
        @workOrderId,
        @status,
        @userId,
        @createdAt

    )
`);


const insertTimelines = db.transaction(() => {

    for (const event of timeline) {

        insertTimeline.run(event);

    }

});


insertTimelines();


console.log(
    "✅ Tabel work_orders siap."
);

console.log(
    "✅ Tabel work_order_timeline siap."
);

console.log(
    "✅ WO #1 - #7 berhasil dimigrasikan."
);