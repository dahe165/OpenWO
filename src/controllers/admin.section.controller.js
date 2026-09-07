const sectionModel =
    require("../models/section.model");

const departmentModel =
    require("../models/department.model");


/*
 * =====================================
 * MASTER SEKSI CONTROLLER
 * =====================================
 */


/*
 * =====================================
 * INDEX
 * =====================================
 *
 * Menampilkan seluruh Seksi.
 *
 */

function index(req, res) {

    try {

        const sections =
            sectionModel.getAll();

        res.render(
            "admin/sections/index",
            {
                title: "Master Seksi",
                layout: "layouts/app",
                sections
            }
        );

    } catch (error) {

        console.error(
            "ADMIN SECTION INDEX ERROR:",
            error
        );

        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat mengambil data Seksi."
            );

    }

}


/*
 * =====================================
 * CREATE
 * =====================================
 */

function create(req, res) {

    try {

        const departments =
            departmentModel.getActive();

        res.render(
            "admin/sections/create",
            {
                title: "Tambah Seksi",
                layout: "layouts/app",
                departments
            }
        );

    } catch (error) {

        console.error(
            "ADMIN SECTION CREATE ERROR:",
            error
        );

        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat menyiapkan form Seksi."
            );

    }

}


/*
 * =====================================
 * STORE
 * =====================================
 */

function store(req, res) {

    try {

        const {
            department_id,
            kode,
            nama,
            urutan
        } = req.body;


        /*
         * Validasi dasar
         */

        if (
            !department_id ||
            !kode ||
            !nama
        ) {

            return res
                .status(400)
                .send(
                    "Bagian, kode, dan nama Seksi wajib diisi."
                );

        }


        /*
         * Pastikan Bagian memang ada
         * dan masih aktif.
         */

        const department =
            departmentModel
                .getById(
                    Number(department_id)
                );


        if (
            !department ||
            department.aktif !== 1
        ) {

            return res
                .status(400)
                .send(
                    "Bagian tidak ditemukan atau tidak aktif."
                );

        }


        sectionModel.create({

            department_id:
                Number(department_id),

            kode:
                kode.trim(),

            nama:
                nama.trim(),

            urutan:
                Number(urutan) || 0

        });


        return res.redirect(
            "/admin/sections"
        );

    } catch (error) {

        console.error(
            "ADMIN SECTION STORE ERROR:",
            error
        );


        /*
         * UNIQUE:
         * Bagian + kode
         * Bagian + nama
         */

        if (
            String(error.message)
                .includes("UNIQUE")
        ) {

            return res
                .status(400)
                .send(
                    "Kode atau nama Seksi sudah digunakan pada Bagian tersebut."
                );

        }


        return res
            .status(500)
            .send(
                "Gagal menyimpan Seksi."
            );

    }

}


/*
 * =====================================
 * EDIT
 * =====================================
 */

function edit(req, res) {

    try {

        const id =
            Number(req.params.id);


        const section =
            sectionModel.getById(id);


        if (!section) {

            return res
                .status(404)
                .send(
                    "Seksi tidak ditemukan."
                );

        }


        const departments =
            departmentModel.getActive();


        res.render(
            "admin/sections/edit",
            {
                title: "Edit Seksi",
                layout: "layouts/app",
                section,
                departments
            }
        );

    } catch (error) {

        console.error(
            "ADMIN SECTION EDIT ERROR:",
            error
        );

        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat mengambil data Seksi."
            );

    }

}


/*
 * =====================================
 * UPDATE
 * =====================================
 */

function update(req, res) {

    try {

        const id =
            Number(req.params.id);


        const {
            department_id,
            kode,
            nama,
            urutan
        } = req.body;


        if (
            !department_id ||
            !kode ||
            !nama
        ) {

            return res
                .status(400)
                .send(
                    "Bagian, kode, dan nama Seksi wajib diisi."
                );

        }


        const section =
            sectionModel.getById(id);


        if (!section) {

            return res
                .status(404)
                .send(
                    "Seksi tidak ditemukan."
                );

        }


        const department =
            departmentModel
                .getById(
                    Number(department_id)
                );


        if (
            !department ||
            department.aktif !== 1
        ) {

            return res
                .status(400)
                .send(
                    "Bagian tidak ditemukan atau tidak aktif."
                );

        }


        sectionModel.update(
            id,
            {
                department_id:
                    Number(department_id),

                kode:
                    kode.trim(),

                nama:
                    nama.trim(),

                urutan:
                    Number(urutan) || 0
            }
        );


        return res.redirect(
            "/admin/sections"
        );

    } catch (error) {

        console.error(
            "ADMIN SECTION UPDATE ERROR:",
            error
        );


        if (
            String(error.message)
                .includes("UNIQUE")
        ) {

            return res
                .status(400)
                .send(
                    "Kode atau nama Seksi sudah digunakan pada Bagian tersebut."
                );

        }


        return res
            .status(500)
            .send(
                "Gagal memperbarui Seksi."
            );

    }

}


/*
 * =====================================
 * TOGGLE
 * =====================================
 *
 * Tidak menghapus data.
 *
 */

function toggle(req, res) {

    try {

        const id =
            Number(req.params.id);


        const section =
            sectionModel.getById(id);


        if (!section) {

            return res
                .status(404)
                .send(
                    "Seksi tidak ditemukan."
                );

        }


        const newStatus =
            section.aktif === 1
                ? 0
                : 1;


        sectionModel.setStatus(
            id,
            newStatus
        );


        return res.redirect(
            "/admin/sections"
        );

    } catch (error) {

        console.error(
            "ADMIN SECTION TOGGLE ERROR:",
            error
        );

        return res
            .status(500)
            .send(
                "Gagal mengubah status Seksi."
            );

    }

}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {

    index,

    create,

    store,

    edit,

    update,

    toggle

};