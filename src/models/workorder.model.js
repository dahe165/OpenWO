const db = require("../config/database");

const { canTransition } =
    require("../config/workorder.workflow");


/*
 * =====================================
 * Helper: Ubah row SQLite menjadi
 * object Work Order yang dipakai UI
 * =====================================
 */

function mapWorkorder(row) {

    if (!row) {
        return null;
    }

    const timeline = db.prepare(`
        SELECT
            wt.status,
            wt.created_at AS tanggal,
            wt.reason,
            u.nama AS user,
            CASE
                WHEN u.role = 'pelapor'
                    THEN 'Pelapor'
                WHEN u.role = 'teknisi'
                    THEN 'Teknisi'
                WHEN u.role = 'asman'
                    THEN 'Asman'
                WHEN u.role = 'manager'
                    THEN 'Manager'
                ELSE u.role
            END AS role

        FROM work_order_timeline wt

        LEFT JOIN users u
            ON u.id = wt.user_id

        WHERE wt.work_order_id = ?

        ORDER BY wt.id ASC
    `).all(row.id);


    return {

        id: row.id,

        nomor: row.nomor,

        judul: row.judul,

        deskripsi: row.deskripsi,

        kategori: row.kategori,

        subkategori: row.subkategori,

        status: row.status,

        resolutionDescription:
            row.resolution_description,

        completionPhoto:
            row.completion_photo,

        pelapor:
            row.pelapor_nama,

        pelaporId:
            row.pelapor_id,

        teknisiId:
            row.teknisi_id,

        teknisi:
            row.teknisi_nama,

        eskalasi:
            Boolean(row.eskalasi),

        eskalasiLevel:
            row.eskalasi_level,

        createdAt:
            row.created_at,

        updatedAt:
            row.updated_at,

        /*
         * Dipakai UI.
         */
        expanded: false,

        timeline

    };
}


/*
 * =====================================
 * Query dasar Work Order
 * =====================================
 */

const baseQuery = `
    SELECT
        wo.id,
        wo.nomor,
        wo.judul,
        wo.deskripsi,
        wo.kategori,
        wo.subkategori,
        wo.status,
        wo.resolution_description,
        wo.completion_photo,
        wo.pelapor_id,
        pelapor.nama AS pelapor_nama,

        wo.teknisi_id,
        teknisi.nama AS teknisi_nama,

        wo.eskalasi,
        wo.eskalasi_level,

        wo.created_at,
        wo.updated_at

    FROM work_orders wo

    LEFT JOIN users pelapor
        ON pelapor.id = wo.pelapor_id

    LEFT JOIN users teknisi
        ON teknisi.id = wo.teknisi_id
`;


/*
 * =====================================
 * GET ALL
 * =====================================
 */

function getAll() {

    const rows = db.prepare(`
        ${baseQuery}
        ORDER BY wo.id ASC
    `).all();

    return rows.map(mapWorkorder);
}

function getHistory() {

    const rows = db.prepare(`
        ${baseQuery}

        WHERE wo.status = 'Ditutup'

        ORDER BY wo.updated_at DESC
    `).all();

    return rows.map(mapWorkorder);
}

/*
 * =====================================
 * GET BY TECHNICIAN
 * =====================================
 */

function getByTechnicianId(technicianId) {

    const rows = db.prepare(`
        ${baseQuery}

        WHERE wo.teknisi_id = ?

        ORDER BY wo.created_at DESC
    `).all(technicianId);

    return rows.map(mapWorkorder);
}


/*
 * =====================================
 * GET FOR MANAGER
 * =====================================
 */

function getForManager() {

    const rows = db.prepare(`
        ${baseQuery}

        WHERE wo.status =
            'Menunggu Verifikasi Manager'

        ORDER BY wo.created_at DESC
    `).all();

    return rows.map(mapWorkorder);
}

/*
 * =====================================
 * ACCEPT WORK ORDER BY ASMAN
 * =====================================
 */

function acceptByAsman(
    id,
    asmanId,
    asmanName
) {

    const workorder =
        db.prepare(`
            ${baseQuery}

            WHERE wo.id = ?
        `).get(id);


    if (!workorder) {

        return null;

    }


    /*
     * WO harus boleh berpindah
     * dari Menunggu → Diterima
     */

    if (
        !canTransition(
            workorder.status,
            "Diterima"
        )
    ) {

        return null;

    }


    const now =
        new Date().toISOString();


    const update =
        db.prepare(`
            UPDATE work_orders

            SET
                status = ?,
                updated_at = ?

            WHERE id = ?
        `);


    const insertTimeline =
        db.prepare(`
            INSERT INTO work_order_timeline (

                work_order_id,
                status,
                user_id,
                created_at

            )

            VALUES (?, ?, ?, ?)
        `);


    const transaction =
        db.transaction(() => {

            /*
             * Update status WO
             */

            update.run(
                "Diterima",
                now,
                id
            );


            /*
             * Catat penerimaan
             * oleh Asman
             */

            insertTimeline.run(
                id,
                "Diterima",
                asmanId,
                now
            );

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "ACCEPT WORK ORDER ERROR:",
            error
        );

        return null;

    }


    return getById(id);

}

/*
 * =====================================
 * ASSIGN WORK ORDER BY ASMAN
 * =====================================
 */

function assignByAsman(
    id,
    technicianId,
    asmanId
) {

    const workorder =
        getById(id);


    if (!workorder) {

        return null;

    }


    /*
     * Hanya WO Diterima
     * yang boleh ditugaskan.
     */

    if (
        !canTransition(
            workorder.status,
            "Ditugaskan"
        )
    ) {

        return null;

    }


    /*
     * Pastikan user yang dipilih
     * memang seorang teknisi.
     */

    const technician =
        db.prepare(`
            SELECT
                id,
                nama,
                role
            FROM users
            WHERE id = ?
              AND role = 'teknisi'
        `).get(technicianId);


    if (!technician) {

        return null;

    }


    const now =
        new Date().toISOString();


    const transaction =
        db.transaction(() => {

            /*
             * Simpan teknisi
             * dan ubah status WO.
             */

            db.prepare(`
                UPDATE work_orders

                SET
                    status = ?,
                    teknisi_id = ?,
                    updated_at = ?

                WHERE id = ?
            `).run(
                "Ditugaskan",
                technicianId,
                now,
                id
            );


            /*
             * Catat penugasan
             * oleh Asman.
             */

            db.prepare(`
                INSERT INTO work_order_timeline (
                    work_order_id,
                    status,
                    user_id,
                    created_at
                )

                VALUES (?, ?, ?, ?)
            `).run(
                id,
                "Ditugaskan",
                asmanId,
                now
            );

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "ASSIGN WORK ORDER ERROR:",
            error
        );

        return null;

    }


    return getById(id);

}

/*
 * =====================================
 * START WORK
 * =====================================
 */

function startWork(
    id,
    technicianId,
    technicianName
) {

    const workorder = db.prepare(`
        ${baseQuery}

        WHERE wo.id = ?
        AND wo.teknisi_id = ?
    `).get(
        id,
        technicianId
    );


    if (!workorder) {
        return null;
    }


    if (
        workorder.status !==
        "Ditugaskan"
    ) {

        return null;

    }


    if (
        !canTransition(
            workorder.status,
            "Diproses"
        )
    ) {

        return null;

    }


    const now =
        new Date().toISOString();


    const update =
        db.prepare(`
            UPDATE work_orders

            SET
                status = ?,
                updated_at = ?

            WHERE id = ?
        `);


    const insertTimeline =
        db.prepare(`
            INSERT INTO work_order_timeline (

                work_order_id,
                status,
                user_id,
                created_at

            )

            VALUES (?, ?, ?, ?)
        `);


    const transaction =
        db.transaction(() => {

            update.run(
                "Diproses",
                now,
                id
            );


            insertTimeline.run(
                id,
                "Dikerjakan",
                technicianId,
                now
            );

        });


    transaction();


    return getById(id);
}


/*
 * =====================================
 * COMPLETE WORK
 * =====================================
 */

function completeWork(
    id,
    technicianId,
    technicianName,
    resolutionDescription,
    completionPhoto
) {

    const workorder = db.prepare(`
        ${baseQuery}

        WHERE wo.id = ?
        AND wo.teknisi_id = ?
    `).get(
        id,
        technicianId
    );


    if (!workorder) {

        return null;

    }


    /*
     * =====================================
     * VALIDASI WORKFLOW
     * =====================================
     */

    if (
        !canTransition(
            workorder.status,
            "Selesai"
        )
    ) {

        return null;

    }


    /*
     * =====================================
     * DESKRIPSI PENYELESAIAN WAJIB
     * =====================================
     */

    if (
        !resolutionDescription ||
        !resolutionDescription.trim()
    ) {

        return null;

    }


    const now =
        new Date().toISOString();


    /*
     * =====================================
     * UPDATE WORK ORDER
     * =====================================
     */

    const update =
        db.prepare(`
            UPDATE work_orders

            SET
                status = ?,
                resolution_description = ?,
                completion_photo = ?,
                updated_at = ?

            WHERE id = ?
        `);


    /*
     * =====================================
     * TIMELINE
     * =====================================
     */

    const insertTimeline =
        db.prepare(`
            INSERT INTO work_order_timeline (
                work_order_id,
                status,
                user_id,
                created_at
            )

            VALUES (?, ?, ?, ?)
        `);


    /*
     * =====================================
     * TRANSACTION
     * =====================================
     */

    const transaction =
        db.transaction(() => {

            update.run(
                "Selesai",
                resolutionDescription.trim(),
                completionPhoto || null,
                now,
                id
            );


            insertTimeline.run(
                id,
                "Selesai",
                technicianId,
                now
            );

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "COMPLETE WORK ERROR:",
            error
        );

        return null;

    }


    return getById(id);

}


/*
 * =====================================
 * VERIFY ASMAN
 * =====================================
 */

function verifyByAsman(
    id,
    asmanId,
    asmanName
) {

    const workorder =
        getById(id);


    if (!workorder) {
        return null;
    }


    /*
     * Harus Selesai
     */
    if (
        !canTransition(
            workorder.status,
            "Verifikasi Asman"
        )
    ) {

        return null;

    }


    const now =
        new Date().toISOString();


    const transaction =
        db.transaction(() => {

            /*
             * Catat Verifikasi Asman
             */
            db.prepare(`
                INSERT INTO work_order_timeline (

                    work_order_id,
                    status,
                    user_id,
                    created_at

                )

                VALUES (?, ?, ?, ?)
            `).run(
                id,
                "Verifikasi Asman",
                asmanId,
                now
            );


            /*
             * Jika perlu Manager
             */
            if (
                workorder.eskalasi === true &&
                workorder.eskalasiLevel ===
                    "Manager"
            ) {

                if (
                    !canTransition(
                        "Verifikasi Asman",
                        "Menunggu Verifikasi Manager"
                    )
                ) {

                    throw new Error(
                        "Workflow Manager tidak valid."
                    );

                }


                db.prepare(`
                    UPDATE work_orders

                    SET
                        status = ?,
                        updated_at = ?

                    WHERE id = ?
                `).run(
                    "Menunggu Verifikasi Manager",
                    now,
                    id
                );


                db.prepare(`
                    INSERT INTO work_order_timeline (

                        work_order_id,
                        status,
                        user_id,
                        created_at

                    )

                    VALUES (?, ?, ?, ?)
                `).run(
                    id,
                    "Menunggu Verifikasi Manager",
                    asmanId,
                    now
                );

            } else {

                /*
                 * WO normal langsung ditutup
                 */
                if (
                    !canTransition(
                        "Verifikasi Asman",
                        "Ditutup"
                    )
                ) {

                    throw new Error(
                        "Workflow penutupan tidak valid."
                    );

                }


                db.prepare(`
                    UPDATE work_orders

                    SET
                        status = ?,
                        updated_at = ?

                    WHERE id = ?
                `).run(
                    "Ditutup",
                    now,
                    id
                );


                db.prepare(`
                    INSERT INTO work_order_timeline (

                        work_order_id,
                        status,
                        user_id,
                        created_at

                    )

                    VALUES (?, ?, ?, ?)
                `).run(
                    id,
                    "Ditutup",
                    asmanId,
                    now
                );

            }

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "VERIFY ASMAN ERROR:",
            error
        );

        return null;

    }


    return getById(id);
}

function escalateByAsman(
    id,
    asmanId,
    asmanName,
    reason
) {

    const workorder =
        getById(id);


    if (!workorder) {

        return null;

    }


    /*
     * Hanya WO Selesai
     * yang boleh dieskalasi.
     */

    if (
        workorder.status !== "Selesai"
    ) {

        return null;

    }


    /*
     * Alasan eskalasi wajib.
     */

    if (
        !reason ||
        !reason.trim()
    ) {

        return null;

    }


    const now =
        new Date().toISOString();


    const transaction =
        db.transaction(() => {

            /*
             * Ubah status WO.
             */

            db.prepare(`
                UPDATE work_orders

                SET
                    status = ?,
                    eskalasi = ?,
                    eskalasi_level = ?,
                    updated_at = ?

                WHERE id = ?
            `).run(
                "Menunggu Verifikasi Manager",
                1,
                "Manager",
                now,
                id
            );

            /*
            * =====================================
            * CATAT VERIFIKASI ASMAN
            * =====================================
            */

            db.prepare(`
                INSERT INTO work_order_timeline (
                    work_order_id,
                    status,
                    user_id,
                    created_at
                )

                VALUES (?, ?, ?, ?)
            `).run(
                id,
                "Verifikasi Asman",
                asmanId,
                now
            );


            /*
            * =====================================
            * CATAT MENUNGGU VERIFIKASI MANAGER
            * =====================================
            */

            db.prepare(`
                INSERT INTO work_order_timeline (
                    work_order_id,
                    status,
                    user_id,
                    reason,
                    created_at
                )

                VALUES (?, ?, ?, ?, ?)
            `).run(
                id,
                "Menunggu Verifikasi Manager",
                asmanId,
                reason.trim(),
                now
            );

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "ESCALATE WORK ORDER ERROR:",
            error
        );

        return null;

    }


    const checkTimeline =
    db.prepare(`
        SELECT
            id,
            work_order_id,
            status,
            user_id,
            reason,
            created_at
        FROM work_order_timeline
        WHERE work_order_id = ?
        ORDER BY id DESC
        LIMIT 1
    `).get(id);

    return getById(id);

}

/*
 * =====================================
 * VERIFY MANAGER
 * =====================================
 */

function verifyByManager(
    id,
    managerId,
    managerName
) {

    const workorder =
        getById(id);


    if (!workorder) {
        return null;
    }


    /*
     * Harus memang WO Manager
     */
    if (
        workorder.eskalasi !== true ||
        workorder.eskalasiLevel !==
            "Manager"
    ) {

        return null;

    }


    /*
     * Harus menunggu Manager
     */
    if (
        !canTransition(
            workorder.status,
            "Verifikasi Manager"
        )
    ) {

        return null;

    }


    const now =
        new Date().toISOString();


    const transaction =
        db.transaction(() => {

            /*
             * Catat Verifikasi Manager
             */
            db.prepare(`
                INSERT INTO work_order_timeline (

                    work_order_id,
                    status,
                    user_id,
                    created_at

                )

                VALUES (?, ?, ?, ?)
            `).run(
                id,
                "Verifikasi Manager",
                managerId,
                now
            );


            /*
             * Setelah verifikasi,
             * tutup WO.
             */
            if (
                !canTransition(
                    "Verifikasi Manager",
                    "Ditutup"
                )
            ) {

                throw new Error(
                    "Workflow penutupan Manager tidak valid."
                );

            }


            db.prepare(`
                UPDATE work_orders

                SET
                    status = ?,
                    updated_at = ?

                WHERE id = ?
            `).run(
                "Ditutup",
                now,
                id
            );


            db.prepare(`
                INSERT INTO work_order_timeline (

                    work_order_id,
                    status,
                    user_id,
                    created_at

                )

                VALUES (?, ?, ?, ?)
            `).run(
                id,
                "Ditutup",
                managerId,
                now
            );

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "VERIFY MANAGER ERROR:",
            error
        );

        return null;

    }


    return getById(id);
}


/*
 * =====================================
 * CREATE
 * =====================================
 */

function create(data) {

    const pelaporId =
        Number(data.pelaporId);

    if (!pelaporId) {

        throw new Error(
            "Pelapor Work Order tidak valid."
        );

    }

    const nextIdRow =
        db.prepare(`
            SELECT
                COALESCE(
                    MAX(id),
                    0
                ) + 1 AS nextId

            FROM work_orders
        `).get();


    const nextId =
        nextIdRow.nextId;


    const nomor =
        `WO-2026-${String(nextId).padStart(5, "0")}`;


    const now =
        new Date().toISOString();


    const insertWorkorder =
        db.prepare(`
            INSERT INTO work_orders (

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

                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?

            )
        `);


    const insertTimeline =
        db.prepare(`
            INSERT INTO work_order_timeline (

                work_order_id,
                status,
                user_id,
                created_at

            )

            VALUES (?, ?, ?, ?)
        `);


    const transaction =
        db.transaction(() => {

            insertWorkorder.run(

                nextId,

                nomor,

                data.judul,

                data.deskripsi || null,

                data.kategori ||
                    "Incident",

                data.subkategori ||
                    "Network",

                "Menunggu",

                pelaporId,

                null,

                0,

                null,

                now,

                now

            );


            insertTimeline.run(

                nextId,

                "Dibuat",

                pelaporId,

                now

            );

        });


    transaction();

return getById(nextId);

}


/*
 * =====================================
 * GET BY ID
 * =====================================
 */

function getById(id) {

    const row = db.prepare(`
        ${baseQuery}

        WHERE wo.id = ?
    `).get(id);


    return mapWorkorder(row);
}


/*
 * =====================================
 * STATISTICS
 * =====================================
 */

function getStatistics() {

    const result =
        db.prepare(`
            SELECT

                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN status = 'Menunggu'
                        THEN 1
                        ELSE 0
                    END
                ) AS menunggu,

                SUM(
                    CASE
                        WHEN status = 'Ditugaskan'
                        THEN 1
                        ELSE 0
                    END
                ) AS ditugaskan,

                SUM(
                    CASE
                        WHEN status = 'Diproses'
                        THEN 1
                        ELSE 0
                    END
                ) AS diproses,

                SUM(
                    CASE
                        WHEN status = 'Selesai'
                        THEN 1
                        ELSE 0
                    END
                ) AS selesai,

                SUM(
                    CASE
                        WHEN status = 'Ditutup'
                        THEN 1
                        ELSE 0
                    END
                ) AS ditutup,

                SUM(
                    CASE
                        WHEN eskalasi = 1
                        THEN 1
                        ELSE 0
                    END
                ) AS eskalasi

            FROM work_orders
        `)
        .get();


    return {

        total:
            Number(result.total) || 0,

        menunggu:
            Number(result.menunggu) || 0,

        ditugaskan:
            Number(result.ditugaskan) || 0,

        diproses:
            Number(result.diproses) || 0,

        selesai:
            Number(result.selesai) || 0,

        ditutup:
            Number(result.ditutup) || 0,

        eskalasi:
            Number(result.eskalasi) || 0

    };
}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {

    getAll,

    getHistory,

    getByTechnicianId,

    getStatistics,

    getForManager,

    getById,

    acceptByAsman,

    assignByAsman,

    startWork,

    completeWork,

    verifyByAsman,

    escalateByAsman,

    verifyByManager,

    create

};