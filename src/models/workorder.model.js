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
        update: "10 menit lalu",
        createdAt: "2026-08-07T09:30:00",
        expanded: true
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
        update: "30 menit lalu",
        createdAt: "2026-08-07T09:00:00",
        expanded: false
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
        update: "1 jam lalu",
        createdAt: "2026-08-07T08:30:00",
        expanded: false
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

        expanded: false

    };

    workorders.push(workorder);

    return workorder;

}

module.exports = {
    getAll,
    getByTechnicianId,
    create
};