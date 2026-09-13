const db = require("../config/database");

const slaEventService =
    require("../services/sla-event.service");

const { canTransition, getWorkflowSettings } =
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
            u.department_id AS department_id,
            u.section_id AS section_id,
            departments.nama AS department_nama,
            sections.nama AS section_nama,

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

        LEFT JOIN departments
            ON departments.id = u.department_id

        LEFT JOIN sections
            ON sections.id = u.section_id

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

        prioritas: row.prioritas,

        targetDepartmentId: row.target_department_id,
        targetSectionId: row.target_section_id,
        targetDepartment: row.target_department,
        targetSection: row.target_section,

        status: row.status,

        resolutionDescription:
            row.resolution_description,

        completionPhoto:
            row.completion_photo,

        pelapor:
            row.pelapor_nama,

        pelaporDepartmentId:
            row.pelapor_department_id,

        pelaporSectionId:
            row.pelapor_section_id,

        pelaporDepartment:
            row.pelapor_department,

        pelaporSection:
            row.pelapor_section,

        pelaporId:
            row.pelapor_id,

        createdBy:
            row.created_by,

        teknisiId:
            row.teknisi_id,

        teknisi:
            row.teknisi_nama,

        teknisiDepartmentId:
            row.teknisi_department_id,

        teknisiSectionId:
            row.teknisi_section_id,

        teknisiDepartment:
            row.teknisi_department,

        teknisiSection:
            row.teknisi_section,

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
        wo.prioritas,
        wo.target_department_id,
        wo.target_section_id,
        target_department.nama AS target_department,
        target_section.nama AS target_section,
        wo.status,
        wo.resolution_description,
        wo.completion_photo,
        wo.pelapor_id,
        wo.created_by,
        pelapor.nama AS pelapor_nama,
        pelapor.department_id AS pelapor_department_id,
        pelapor.section_id AS pelapor_section_id,
        pelapor_department.nama AS pelapor_department,
        pelapor_section.nama AS pelapor_section,

        wo.teknisi_id,
        teknisi.nama AS teknisi_nama,
        teknisi.department_id AS teknisi_department_id,
        teknisi.section_id AS teknisi_section_id,
        teknisi_department.nama AS teknisi_department,
        teknisi_section.nama AS teknisi_section,

        wo.eskalasi,
        wo.eskalasi_level,

        wo.created_at,
        wo.updated_at

    FROM work_orders wo

    LEFT JOIN departments target_department
        ON target_department.id = wo.target_department_id

    LEFT JOIN sections target_section
        ON target_section.id = wo.target_section_id

    LEFT JOIN users pelapor
        ON pelapor.id = wo.pelapor_id

    LEFT JOIN departments pelapor_department
        ON pelapor_department.id = pelapor.department_id

    LEFT JOIN sections pelapor_section
        ON pelapor_section.id = pelapor.section_id

    LEFT JOIN users teknisi
        ON teknisi.id = wo.teknisi_id

    LEFT JOIN departments teknisi_department
        ON teknisi_department.id = teknisi.department_id

    LEFT JOIN sections teknisi_section
        ON teknisi_section.id = teknisi.section_id
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

function getForAsmanSection(sectionId) {

    const rows = db.prepare(`
        ${baseQuery}

        WHERE wo.target_section_id = ?
          AND EXISTS (
              SELECT 1
              FROM section_categories sc
              INNER JOIN categories c
                  ON c.id = sc.category_id
              WHERE sc.section_id = wo.target_section_id
                AND c.nama = wo.kategori
          )
        ORDER BY wo.created_at DESC
    `).all(Number(sectionId));

    return rows.map(mapWorkorder);
}

function getHistoryForAsmanSection(sectionId) {

    const rows = db.prepare(`
        ${baseQuery}

        WHERE wo.status = 'Ditutup'
          AND wo.target_section_id = ?

        ORDER BY wo.updated_at DESC
    `).all(Number(sectionId));

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
          AND wo.target_section_id = (
              SELECT u.section_id
              FROM users u
              WHERE u.id = ?
                AND u.role = 'teknisi'
          )

        ORDER BY wo.created_at DESC
    `).all(technicianId, technicianId);

    return rows.map(mapWorkorder);
}


/*
 * =====================================
 * GET FOR PELAPOR
 * =====================================
 */

function getForPelapor(userId) {

    const rows = db.prepare(`
        ${baseQuery}

        WHERE wo.pelapor_id = ?
           OR wo.created_by = ?

        ORDER BY wo.created_at DESC
    `).all(Number(userId), Number(userId));

    return rows.map(mapWorkorder);
}


/*
 * =====================================
 * GET FOR MANAGER
 * Semua WO yang ditujukan ke Bagian Manager.
 * Status tidak dibatasi agar Manager dapat
 * melihat seluruh lifecycle WO di Bagiannya.
 * =====================================
 */

function getForManagerDepartment(departmentId) {

    if (!departmentId) {
        return [];
    }

    const rows = db.prepare(`
        ${baseQuery}

        WHERE wo.target_department_id = ?

        ORDER BY wo.created_at DESC
    `).all(Number(departmentId));

    return rows.map(mapWorkorder);
}


/*
 * Legacy/flow-specific Manager query.
 * Dipertahankan untuk kebutuhan workflow verifikasi Manager.
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

function isAsmanAuthorizedForWorkorder(workorderId, asmanId) {
    return Boolean(db.prepare(`
        SELECT 1
        FROM work_orders wo
        INNER JOIN users asman
            ON asman.id = ?
           AND asman.role = 'asman'
        INNER JOIN section_categories sc
            ON sc.section_id = wo.target_section_id
        INNER JOIN categories c
            ON c.id = sc.category_id
           AND c.nama = wo.kategori
        WHERE wo.id = ?
          AND asman.section_id IS NOT NULL
          AND wo.target_section_id = asman.section_id
        LIMIT 1
    `).get(Number(asmanId), Number(workorderId)));
}

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


    if (!isAsmanAuthorizedForWorkorder(id, asmanId)) {

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

            /*
            * Catat SLA Event
            */

            slaEventService.recordEvent({

                workOrderId:
                    id,

                event:
                    slaEventService
                        .SLA_EVENTS
                        .ACCEPTED,

                userId:
                    asmanId,

                occurredAt:
                    now

            });

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


    if (!isAsmanAuthorizedForWorkorder(id, asmanId)) {

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
                role,
                department_id,
                section_id
            FROM users
            WHERE id = ?
              AND role = 'teknisi'
        `).get(technicianId);


    if (!technician) {

        return null;

    }

    if (
        Number(technician.section_id) !==
        Number(workorder.targetSectionId)
    ) {

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

            /*
            * Catat SLA Event
            */

            slaEventService.recordEvent({

                workOrderId:
                    id,

                event:
                    slaEventService
                        .SLA_EVENTS
                        .ASSIGNED,

                userId:
                    asmanId,

                occurredAt:
                    now

            });

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

            /*
            * Catat SLA Event
            */

            slaEventService.recordEvent({

                workOrderId:
                    id,

                event:
                    slaEventService
                        .SLA_EVENTS
                        .STARTED,

                userId:
                    technicianId,

                occurredAt:
                    now

            });

        });


    transaction();


    return getById(id);
}

/*
 * =====================================
 * START WAITING
 * =====================================
 */

function startWaiting(
    id,
    technicianId,
    reason
) {

    const workorder =
        db.prepare(`
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
     * Hanya WO Diproses
     * yang boleh masuk Waiting.
     */

    if (
        workorder.status !==
        "Diproses"
    ) {

        return null;

    }


    if (
        !canTransition(
            workorder.status,
            "Waiting"
        )
    ) {

        return null;

    }


    /*
     * Alasan Waiting wajib.
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
             * Ubah status WO
             */

            db.prepare(`
                UPDATE work_orders

                SET
                    status = ?,
                    updated_at = ?

                WHERE id = ?
            `).run(
                "Waiting",
                now,
                id
            );


            /*
             * Catat Timeline
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
                "Waiting",
                technicianId,
                reason.trim(),
                now
            );


            /*
             * Catat SLA Event
             */

            slaEventService.recordEvent({

                workOrderId:
                    id,

                event:
                    slaEventService
                        .SLA_EVENTS
                        .WAITING_STARTED,

                userId:
                    technicianId,

                occurredAt:
                    now

            });

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "START WAITING ERROR:",
            error
        );

        return null;

    }


    return getById(id);

}

/*
 * =====================================
 * RESUME WAITING
 * =====================================
 */

function resumeWaiting(
    id,
    technicianId
) {

    const workorder =
        db.prepare(`
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
     * Hanya WO Waiting
     * yang boleh dilanjutkan.
     */

    if (
        workorder.status !==
        "Waiting"
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

            /*
             * Kembali ke Diproses
             */

            update.run(
                "Diproses",
                now,
                id
            );


            /*
             * Catat pekerjaan dilanjutkan
             */

            insertTimeline.run(
                id,
                "Dikerjakan",
                technicianId,
                now
            );


            /*
             * Catat SLA Event
             */

            slaEventService.recordEvent({

                workOrderId:
                    id,

                event:
                    slaEventService
                        .SLA_EVENTS
                        .WAITING_ENDED,

                userId:
                    technicianId,

                occurredAt:
                    now

            });

        });


    try {

        transaction();

    } catch (error) {

        console.error(
            "RESUME WAITING ERROR:",
            error
        );

        return null;

    }


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

    const workflowSettings = getWorkflowSettings();

    const finalStatus =
        workflowSettings.closing && !workflowSettings.verification
            ? "Ditutup"
            : "Selesai";

    const transaction =
        db.transaction(() => {

            update.run(
                finalStatus,
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

            // Jika Penutupan ON tetapi Verifikasi OFF,
            // WO otomatis ditutup setelah teknisi selesai.
            if (finalStatus === "Ditutup") {

                insertTimeline.run(
                    id,
                    "Ditutup",
                    technicianId,
                    now
                );

            }

            /*
            * =====================================
            * CATAT SLA EVENT
            * =====================================
            */

            slaEventService.recordEvent({

                workOrderId:
                    id,

                event:
                    slaEventService
                        .SLA_EVENTS
                        .COMPLETED,

                userId:
                    technicianId,

                occurredAt:
                    now

            });

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

    if (!isAsmanAuthorizedForWorkorder(id, asmanId)) {
        return null;
    }


    /*
     * Verifikasi Asman harus aktif untuk WO yang
     * baru selesai. WO yang sudah masuk tahap
     * verifikasi tetap dapat diselesaikan agar
     * perubahan setting tidak menggantungkan WO lama.
     */
    const workflowSettings = getWorkflowSettings();

    if (
        workorder.status === "Selesai" &&
        (!workflowSettings.closing || !workflowSettings.verification)
    ) {
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

    if (!isAsmanAuthorizedForWorkorder(id, asmanId)) {
        return null;
    }


    /*
     * Eskalasi hanya tersedia jika Penutupan,
     * Verifikasi Asman, dan Eskalasi aktif.
     */
    const workflowSettings = getWorkflowSettings();

    if (
        !workflowSettings.closing ||
        !workflowSettings.verification ||
        !workflowSettings.escalation
    ) {
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

    /*
     * =====================================
     * PELAPOR
     * =====================================
     */

    const pelaporId =
        Number(data.pelaporId);

    if (!pelaporId) {

        throw new Error(
            "Pelapor Work Order tidak valid."
        );

    }


    /*
     * =====================================
     * PEMBUAT WO
     * =====================================
     */

    const createdBy =
        Number(data.createdBy);

    if (!createdBy) {

        throw new Error(
            "Pembuat Work Order tidak valid."
        );

    }


    /*
     * =====================================
     * VALIDASI PEMBUAT
     * =====================================
     *
     * User yang membuat WO harus benar-benar
     * ada di tabel users.
     *
     */

    const creator =
        db.prepare(`
            SELECT
                id,
                nama,
                role
            FROM users
            WHERE id = ?
        `).get(createdBy);


    if (!creator) {

        throw new Error(
            "Pembuat Work Order tidak ditemukan."
        );

    }


    /*
     * =====================================
     * VALIDASI TUJUAN & KATEGORI
     * =====================================
     */

    const targetSectionId = Number(data.targetSectionId);
    const targetDepartmentId = Number(data.targetDepartmentId);

    if (!targetSectionId || !targetDepartmentId) {
        throw new Error("Tujuan Work Order tidak valid.");
    }

    const targetSection = db.prepare(`
        SELECT id, department_id, aktif
        FROM sections
        WHERE id = ?
    `).get(targetSectionId);

    if (
        !targetSection ||
        !targetSection.aktif ||
        Number(targetSection.department_id) !== targetDepartmentId
    ) {
        throw new Error("Bagian dan Seksi tujuan tidak valid.");
    }

    const category = db.prepare(`
        SELECT id, nama, aktif
        FROM categories
        WHERE nama = ?
    `).get(data.kategori);

    if (!category || !category.aktif) {
        throw new Error("Kategori Work Order tidak valid.");
    }

    const categoryInSection = db.prepare(`
        SELECT 1
        FROM section_categories
        WHERE section_id = ?
          AND category_id = ?
        LIMIT 1
    `).get(targetSectionId, Number(category.id));

    if (!categoryInSection) {
        throw new Error("Kategori tersebut tidak tersedia pada Seksi tujuan.");
    }


    /*
     * =====================================
     * GENERATE ID
     * =====================================
     */

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


    /*
     * =====================================
     * GENERATE NOMOR WO
     * =====================================
     */

    const nomor =
        `WO-2026-${String(nextId).padStart(5, "0")}`;


    /*
     * =====================================
     * WAKTU
     * =====================================
     */

    const now =
        new Date().toISOString();


    /*
     * =====================================
     * INSERT WORK ORDER
     * =====================================
     */

    const insertWorkorder =
        db.prepare(`
            INSERT INTO work_orders (

                id,
                nomor,
                judul,
                deskripsi,
                kategori,
                subkategori,
                prioritas,
                target_department_id,
                target_section_id,
                status,
                pelapor_id,
                created_by,
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
                ?,
                ?,
                ?,
                ?,
                ?

            )
        `);


    /*
     * =====================================
     * INSERT TIMELINE
     * =====================================
     *
     * Timeline "Dibuat" sekarang mencatat
     * orang yang benar-benar membuat WO,
     * bukan otomatis pelapor.
     *
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

            /*
             * Simpan Work Order
             */

            insertWorkorder.run(

                nextId,

                nomor,

                data.judul,

                data.deskripsi || null,

                data.kategori ||
                    "Incident",

                data.subkategori ||
                    "Network",

                data.prioritas ||
                    null,

                Number(data.targetDepartmentId),

                Number(data.targetSectionId),

                "Menunggu",

                pelaporId,

                createdBy,

                null,

                0,

                null,

                now,

                now

            );


            /*
             * Catat Timeline "Dibuat"
             *
             * user_id = pembuat WO
             */

            insertTimeline.run(

                nextId,

                "Dibuat",

                createdBy,

                now

            );

            /*
            * =====================================
            * CATAT SLA EVENT CREATED
            * =====================================
            */

            slaEventService.recordEvent({

                workOrderId:
                    nextId,

                event:
                    slaEventService
                        .SLA_EVENTS
                        .CREATED,

                userId:
                    createdBy,

                occurredAt:
                    now

            });

        });


    /*
     * =====================================
     * JALANKAN TRANSACTION
     * =====================================
     */

    transaction();


    /*
     * =====================================
     * KEMBALIKAN WO
     * =====================================
     */

    return getById(
        nextId
    );

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

    getForAsmanSection,

    getHistoryForAsmanSection,

    getHistory,

    getByTechnicianId,

    getForPelapor,

    getStatistics,

    getForManagerDepartment,

    getForManager,

    getById,

    isAsmanAuthorizedForWorkorder,

    acceptByAsman,

    assignByAsman,

    startWork,

    startWaiting,

    resumeWaiting,

    completeWork,

    verifyByAsman,

    escalateByAsman,

    verifyByManager,

    create

};