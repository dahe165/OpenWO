const assetModel =
    require("../models/asset.model");

const departmentModel =
    require("../models/department.model");

const sectionModel =
    require("../models/section.model");

const ASSET_STATUSES = [
    "Aktif",
    "Tidak Aktif",
    "Rusak",
    "Maintenance"
];

function clean(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function loadFormData() {
    return {
        departments: departmentModel.getActive(),
        sections: sectionModel.getActive()
    };
}

function validateAndBuild(req) {
    const kode = clean(req.body.kode);
    const nama = clean(req.body.nama);
    const jenis = clean(req.body.jenis);
    const merk = clean(req.body.merk);
    const model = clean(req.body.model);
    const serial_number = clean(req.body.serial_number);
    const lokasi = clean(req.body.lokasi);
    const department_id = Number(req.body.department_id);
    const section_id = Number(req.body.section_id);
    const status = clean(req.body.status);
    const keterangan = clean(req.body.keterangan);

    if (!kode || !nama) {
        return {
            error: "Kode Asset dan Nama Asset wajib diisi."
        };
    }

    if (!Number.isInteger(department_id) || department_id <= 0) {
        return {
            error: "Bagian wajib dipilih."
        };
    }

    if (!Number.isInteger(section_id) || section_id <= 0) {
        return {
            error: "Seksi wajib dipilih."
        };
    }

    if (!ASSET_STATUSES.includes(status)) {
        return {
            error: "Status Asset tidak valid."
        };
    }

    const department =
        departmentModel.getById(department_id);

    if (!department || department.aktif !== 1) {
        return {
            error: "Bagian tidak ditemukan atau tidak aktif."
        };
    }

    const section =
        sectionModel.getById(section_id);

    if (
        !section ||
        section.aktif !== 1 ||
        Number(section.department_id) !== department_id
    ) {
        return {
            error: "Seksi tidak sesuai dengan Bagian yang dipilih."
        };
    }

    return {
        data: {
            kode,
            nama,
            jenis,
            merk,
            model,
            serial_number,
            lokasi,
            department_id,
            section_id,
            status,
            keterangan
        }
    };
}

function index(req, res) {
    try {
        const assets = assetModel.getAll();

        res.render("admin/assets/index", {
            title: "Asset Management",
            layout: "layouts/app",
            assets,
            statuses: ASSET_STATUSES
        });
    } catch (error) {
        console.error("ADMIN ASSET INDEX ERROR:", error);
        res.status(500).send("Gagal memuat Asset Management.");
    }
}

function create(req, res) {
    res.render("admin/assets/create", {
        title: "Tambah Asset",
        layout: "layouts/app",
        ...loadFormData(),
        statuses: ASSET_STATUSES,
        form: {
            status: "Aktif"
        },
        error: null
    });
}

function store(req, res) {
    const result = validateAndBuild(req);

    if (result.error) {
        return res.status(400).render("admin/assets/create", {
            title: "Tambah Asset",
            layout: "layouts/app",
            ...loadFormData(),
            statuses: ASSET_STATUSES,
            form: req.body,
            error: result.error
        });
    }

    try {
        assetModel.create(result.data);
        return res.redirect("/admin/assets");
    } catch (error) {
        console.error("ADMIN ASSET STORE ERROR:", error);

        if (String(error.message).includes("UNIQUE")) {
            return res.status(400).render("admin/assets/create", {
                title: "Tambah Asset",
                layout: "layouts/app",
                ...loadFormData(),
                statuses: ASSET_STATUSES,
                form: req.body,
                error: "Kode Asset sudah digunakan."
            });
        }

        return res.status(500).send("Gagal menyimpan Asset.");
    }
}

function edit(req, res) {
    const id = Number(req.params.id);
    const asset = assetModel.getById(id);

    if (!asset) {
        return res.status(404).send("Asset tidak ditemukan.");
    }

    res.render("admin/assets/edit", {
        title: "Edit Asset",
        layout: "layouts/app",
        ...loadFormData(),
        statuses: ASSET_STATUSES,
        asset,
        form: asset,
        error: null
    });
}

function update(req, res) {
    const id = Number(req.params.id);
    const asset = assetModel.getById(id);

    if (!asset) {
        return res.status(404).send("Asset tidak ditemukan.");
    }

    const result = validateAndBuild(req);

    if (result.error) {
        return res.status(400).render("admin/assets/edit", {
            title: "Edit Asset",
            layout: "layouts/app",
            ...loadFormData(),
            statuses: ASSET_STATUSES,
            asset,
            form: req.body,
            error: result.error
        });
    }

    try {
        assetModel.update(id, result.data);
        return res.redirect(`/admin/assets/${id}`);
    } catch (error) {
        console.error("ADMIN ASSET UPDATE ERROR:", error);

        if (String(error.message).includes("UNIQUE")) {
            return res.status(400).render("admin/assets/edit", {
                title: "Edit Asset",
                layout: "layouts/app",
                ...loadFormData(),
                statuses: ASSET_STATUSES,
                asset,
                form: req.body,
                error: "Kode Asset sudah digunakan."
            });
        }

        return res.status(500).send("Gagal memperbarui Asset.");
    }
}

function detail(req, res) {
    const id = Number(req.params.id);
    const asset = assetModel.getById(id);

    if (!asset) {
        return res.status(404).send("Asset tidak ditemukan.");
    }

    res.render("admin/assets/detail", {
        title: "Detail Asset",
        layout: "layouts/app",
        asset
    });
}

module.exports = {
    index,
    create,
    store,
    edit,
    update,
    detail
};
