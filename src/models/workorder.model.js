const {canTransition} = require("../config/workorder.workflow");

const workorders = [

    {
        id: 1,
        nomor: "WO-2026-00001",
        judul: "Internet Kantor Mati",
        kategori: "Incident",
        subkategori: "Network",
        status: "Ditugaskan",
        pelapor: "Budi",
        teknisiId: 3,
        eskalasi: false,
        update: "10 menit lalu",
        createdAt: "2026-08-07T09:30:00",
        expanded: true,
                timeline: [
                {
                    status: "Dibuat",
                    tanggal: "2026-08-07T09:30:00",
                    user: "Budi",
                    role: "Pelapor"
                },
                {
                    status: "Diterima",
                    tanggal: "2026-08-07T09:35:00",
                    user: "Dahe Ugi",
                    role: "Asman"
                },
                {
                    status: "Ditugaskan",
                    tanggal: "2026-08-07T09:40:00",
                    user: "Dahe Ugi",
                    role: "Asman"
                }
            ]
    },

    {
        id: 2,
        nomor: "WO-2026-00002",
        judul: "Printer Tidak Bisa Print",
        kategori: "Incident",
        subkategori: "Hardware",
        status: "Menunggu",
        pelapor: "Budi",
        teknisiId: null,
        eskalasi: false,
        update: "30 menit lalu",
        createdAt: "2026-08-07T09:00:00",
        expanded: false,
        timeline: [
            {
                status: "Dibuat",
                tanggal: "2026-08-07T09:00:00",
                user: "Budi",
                role: "Pelapor"
            }
        ],
    },

    {
        id: 3,
        nomor: "WO-2026-00003",
        judul: "WiFi Lantai 2 Lambat",
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelapor: "Budi",
        teknisiId: 3,
        eskalasi: false,
        update: "1 jam lalu",
        createdAt: "2026-08-07T08:30:00",
        expanded: false,
        timeline: [
            {
                status: "Dibuat",
                tanggal: "2026-08-07T08:30:00",
                user: "Budi",
                role: "Pelapor"
            },
            {
                status: "Diterima",
                tanggal: "2026-08-07T08:35:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Ditugaskan",
                tanggal: "2026-08-07T08:40:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Dikerjakan",
                tanggal: "2026-08-07T08:45:00",
                user: "Andi",
                role: "Teknisi"
            }
        ],
    },

    {
        id: 4,
        nomor: "WO-2026-00004",
        judul: "WiFi Lantai 10 Lag",
        kategori: "Incident",
        subkategori: "Hardware",
        status: "Diproses",
        pelapor: "Budi",
        teknisiId: 3,
        eskalasi: false,
        update: "5 jam lalu",
        createdAt: "2026-08-07T08:30:00",
        expanded: false,
        timeline: [
            {
                status: "Dibuat",
                tanggal: "2026-08-07T08:30:00",
                user: "Budi",
                role: "Pelapor"
            },
            {
                status: "Diterima",
                tanggal: "2026-08-07T08:35:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Ditugaskan",
                tanggal: "2026-08-07T08:40:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Dikerjakan",
                tanggal: "2026-08-07T08:45:00",
                user: "Andi",
                role: "Teknisi"
            }
        ],
    },

    {
        id: 5,
        nomor: "WO-2026-00005",
        judul: "WiFi Lantai 2 Lambat",
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelapor: "Budi",
        teknisiId: 3,
        eskalasi: false,
        update: "4 jam lalu",
        createdAt: "2026-08-07T08:30:00",
        expanded: false,
        timeline: [
            {
                status: "Dibuat",
                tanggal: "2026-08-07T08:30:00",
                user: "Budi",
                role: "Pelapor"
            },
            {
                status: "Diterima",
                tanggal: "2026-08-07T08:35:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Ditugaskan",
                tanggal: "2026-08-07T08:40:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Dikerjakan",
                tanggal: "2026-08-07T08:45:00",
                user: "Andi",
                role: "Teknisi"
            }
        ],
    },

    {
        id: 6,
        nomor: "WO-2026-00006",
        judul: "WiFi Lantai 2 Lambat",
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelapor: "Budi",
        teknisiId: 3,
        eskalasi: false,
        update: "3 jam lalu",
        createdAt: "2026-08-07T08:30:00",
        expanded: false,
        timeline: [
            {
                status: "Dibuat",
                tanggal: "2026-08-07T08:30:00",
                user: "Budi",
                role: "Pelapor"
            },
            {
                status: "Diterima",
                tanggal: "2026-08-07T08:35:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Ditugaskan",
                tanggal: "2026-08-07T08:40:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Dikerjakan",
                tanggal: "2026-08-07T08:45:00",
                user: "Andi",
                role: "Teknisi"
            }
        ],
    },

    {
        id: 7,
        nomor: "WO-2026-00007",
        judul: "Router Tidak ada sinyal",
        kategori: "Incident",
        subkategori: "Network",
        status: "Diproses",
        pelapor: "Budi",
        teknisiId: 3,
        eskalasi: true,
        eskalasiLevel: "Manager",
        update: "3 jam lalu",
        createdAt: "2026-08-07T08:30:00",
        expanded: false,
        timeline: [
            {
                status: "Dibuat",
                tanggal: "2026-08-07T08:30:00",
                user: "Budi",
                role: "Pelapor"
            },
            {
                status: "Diterima",
                tanggal: "2026-08-07T08:35:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Ditugaskan",
                tanggal: "2026-08-07T08:40:00",
                user: "Dahe Ugi",
                role: "Asman"
            },
            {
                status: "Dikerjakan",
                tanggal: "2026-08-07T08:45:00",
                user: "Andi",
                role: "Teknisi"
            }
        ],
    }

];

function getAll() {

    return workorders.map(wo => ({ ...wo }));

}

function getByTechnicianId(technicianId) {

    return workorders
        .filter(wo => wo.teknisiId === technicianId)
        .map(wo => ({ ...wo }));

}

function getForManager() {

    return workorders
        .filter(
            wo =>
                wo.status === "Menunggu Verifikasi Manager"
        )
        .map(wo => ({ ...wo }));

}

function startWork(
    id,
    technicianId,
    technicianName
) {

    const workorder = workorders.find(
        wo =>
            wo.id === id &&
            wo.teknisiId === technicianId
    );

    if (!workorder) {
        return null;
    }

    if (workorder.status !== "Ditugaskan") {
        return null;
    }

    workorder.status = "Diproses";

    workorder.update = "Baru saja";

    addTimeline(
        workorder,
        "Dikerjakan",
        technicianName,
        "Teknisi"
    );

    return { ...workorder };
}

function completeWork(
    id,
    technicianId,
    technicianName
) {

    const workorder = workorders.find(
        wo =>
            wo.id === id &&
            wo.teknisiId === technicianId
    );

    if (!workorder) {
        return null;
    }

    /*
     * Pastikan perpindahan status
     * memang diperbolehkan workflow.
     */
    if (
        !canTransition(
            workorder.status,
            "Selesai"
        )
    ) {
        return null;
    }

    workorder.status = "Selesai";

    workorder.update = "Baru saja";

    addTimeline(
        workorder,
        "Selesai",
        technicianName,
        "Teknisi"
    );

    return {
        ...workorder
    };
}

function verifyByAsman(
    id,
    asmanId,
    asmanName
) {

    const workorder =
        workorders.find(
            wo => wo.id === id
        );

    if (!workorder) {
        return null;
    }

    /*
     * WO harus berada pada status Selesai.
     */
    if (
        !canTransition(
            workorder.status,
            "Verifikasi Asman"
        )
    ) {
        return null;
    }

    /*
     * Catat verifikasi Asman.
     */
    addTimeline(
        workorder,
        "Verifikasi Asman",
        asmanName,
        "Asman"
    );

    /*
     * Jika WO membutuhkan Manager,
     * jangan langsung ditutup.
     */
    if (
        workorder.eskalasi === true &&
        workorder.eskalasiLevel === "Manager"
    ) {

        workorder.status =
            "Menunggu Verifikasi Manager";

        workorder.update =
            "Menunggu verifikasi Manager";

        addTimeline(
            workorder,
            "Menunggu Verifikasi Manager",
            asmanName,
            "Asman"
        );

    } else {

        /*
         * WO normal langsung ditutup.
         */
        if (
            !canTransition(
                "Verifikasi Asman",
                "Ditutup"
            )
        ) {
            return null;
        }

        workorder.status = "Ditutup";

        workorder.update = "Baru saja";

        addTimeline(
            workorder,
            "Ditutup",
            asmanName,
            "Asman"
        );
    }

    return {
        ...workorder
    };
}

function verifyByManager(
    id,
    managerId,
    managerName
) {

    const workorder =
        workorders.find(
            wo => wo.id === id
        );

    if (!workorder) {
        return null;
    }

    /*
     * Manager hanya boleh memverifikasi
     * WO yang memang membutuhkan Manager.
     */
    if (
        workorder.eskalasi !== true ||
        workorder.eskalasiLevel !== "Manager"
    ) {
        return null;
    }

    /*
     * Status harus:
     *
     * Menunggu Verifikasi Manager
     *
     * sebelum Manager melakukan verifikasi.
     */
    if (
        !canTransition(
            workorder.status,
            "Verifikasi Manager"
        )
    ) {
        return null;
    }

    /*
     * Catat verifikasi Manager.
     */
    addTimeline(
        workorder,
        "Verifikasi Manager",
        managerName,
        "Manager"
    );

    /*
     * Setelah Manager melakukan verifikasi,
     * WO boleh ditutup.
     */
    if (
        !canTransition(
            "Verifikasi Manager",
            "Ditutup"
        )
    ) {
        return null;
    }

    workorder.status = "Ditutup";

    workorder.update = "Baru saja";

    addTimeline(
        workorder,
        "Ditutup",
        managerName,
        "Manager"
    );

    return {
        ...workorder
    };
}

function create(data) {

    const nextId =
        workorders.length > 0
            ? Math.max(...workorders.map(wo => wo.id)) + 1
            : 1;

    const nomor = `WO-2026-${String(nextId).padStart(5, "0")}`;

    const workorder = {

        id: nextId,

        nomor,

        judul: data.judul,

        deskripsi: data.deskripsi,

        kategori: data.kategori,

        subkategori: data.subkategori,

        status: "Menunggu",

        pelapor: "Dahe Ugi",

        teknisiId: null,

        createdAt: new Date().toISOString(),

        expanded: false,

                timeline: [
                    {
                        status: "Dibuat",
                        tanggal: new Date().toISOString(),
                        user: "Dahe Ugi",
                        role: "Pelapor"
                    }
                ]

    };

    workorders.push(workorder);

    return workorder;

}

function addTimeline(
    workorder,
    status,
    user,
    role
) {

    if (!workorder.timeline) {
        workorder.timeline = [];
    }

    workorder.timeline.push({

        status,

        tanggal: new Date().toISOString(),

        user,

        role

    });
}

function getStatistics() {

    return {

        total:
            workorders.length,

        menunggu:
            workorders.filter(
                wo => wo.status === "Menunggu"
            ).length,

        ditugaskan:
            workorders.filter(
                wo => wo.status === "Ditugaskan"
            ).length,

        diproses:
            workorders.filter(
                wo => wo.status === "Diproses"
            ).length,

        selesai:
            workorders.filter(
                wo => wo.status === "Selesai"
            ).length,

        ditutup:
            workorders.filter(
                wo => wo.status === "Ditutup"
            ).length,

        eskalasi:
            workorders.filter(
                wo =>
                    wo.eskalasi === true
            ).length
    };

}

module.exports = {
    getAll,
    getByTechnicianId,
    getStatistics,
    getForManager,
    startWork,
    completeWork,
    verifyByAsman,
    verifyByManager,
    create
};