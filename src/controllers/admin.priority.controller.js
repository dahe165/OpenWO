const priorityModel =
    require("../models/priority.model");


/*
 * =====================================
 * ADMIN PRIORITY CONTROLLER
 * =====================================
 *
 * Controller untuk mengelola Master Data
 * Prioritas Work Order.
 *
 */


/*
 * =====================================
 * INDEX
 * =====================================
 *
 * Menampilkan seluruh prioritas.
 *
 */

function index(req, res) {

    try {

        const priorities =
            priorityModel.getAllPriorities();


        res.render(
            "admin/priorities/index",
            {
                title: "Prioritas",
                layout: "layouts/app",
                priorities
            }
        );

    } catch (error) {

        console.error(
            "ADMIN PRIORITY INDEX ERROR:",
            error
        );

        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat mengambil data prioritas."
            );

    }

}
/*
 * =====================================
 * CREATE
 * =====================================
 *
 * Menampilkan form tambah prioritas.
 *
 */

function create(req, res) {

    res.render(
        "admin/priorities/create",
        {
            title: "Tambah Prioritas",
            layout: "layouts/app"
        }
    );

}


/*
 * =====================================
 * STORE
 * =====================================
 *
 * Menyimpan prioritas baru.
 *
 */

function store(req, res) {

    try {

        const {
            nama,
            urutan
        } = req.body;


        /*
         * Validasi dasar
         */

        if (!nama || !nama.trim()) {

            return res
                .status(400)
                .send(
                    "Nama prioritas wajib diisi."
                );

        }


        priorityModel.createPriority(
            nama,
            urutan
        );


        return res.redirect(
            "/admin/priorities"
        );

    } catch (error) {

        console.error(
            "ADMIN PRIORITY STORE ERROR:",
            error
        );


        return res
            .status(500)
            .send(
                "Gagal menyimpan prioritas."
            );

    }

}


/*
 * =====================================
 * EDIT
 * =====================================
 *
 * Menampilkan form edit prioritas.
 *
 */

function edit(req, res) {

    try {

        const {
            id
        } = req.params;


        const priority =
            priorityModel.getPriorityById(
                id
            );


        if (!priority) {

            return res
                .status(404)
                .send(
                    "Prioritas tidak ditemukan."
                );

        }


        res.render(
            "admin/priorities/edit",
            {
                title: "Edit Prioritas",
                layout: "layouts/app",
                priority
            }
        );

    } catch (error) {

        console.error(
            "ADMIN PRIORITY EDIT ERROR:",
            error
        );


        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat mengambil data prioritas."
            );

    }

}


/*
 * =====================================
 * UPDATE
 * =====================================
 *
 * Memperbarui nama dan urutan.
 *
 */

function update(req, res) {

    try {

        const {
            id
        } = req.params;


        const {
            nama,
            urutan
        } = req.body;


        /*
         * Validasi dasar
         */

        if (!nama || !nama.trim()) {

            return res
                .status(400)
                .send(
                    "Nama prioritas wajib diisi."
                );

        }


        const priority =
            priorityModel.getPriorityById(
                id
            );


        if (!priority) {

            return res
                .status(404)
                .send(
                    "Prioritas tidak ditemukan."
                );

        }


        priorityModel.updatePriority(
            id,
            nama,
            urutan
        );


        return res.redirect(
            "/admin/priorities"
        );

    } catch (error) {

        console.error(
            "ADMIN PRIORITY UPDATE ERROR:",
            error
        );


        return res
            .status(500)
            .send(
                "Gagal memperbarui prioritas."
            );

    }

}


/*
 * =====================================
 * TOGGLE STATUS
 * =====================================
 *
 * Mengaktifkan / menonaktifkan prioritas.
 *
 * Tidak menghapus data.
 *
 */

function toggle(req, res) {

    try {

        const {
            id
        } = req.params;


        const priority =
            priorityModel.getPriorityById(
                id
            );


        if (!priority) {

            return res
                .status(404)
                .send(
                    "Prioritas tidak ditemukan."
                );

        }


        /*
         * Balik status saat ini.
         *
         * 1 = Aktif
         * 0 = Tidak Aktif
         */

        const newStatus =
            priority.aktif === 1
                ? 0
                : 1;


        priorityModel.setPriorityStatus(
            id,
            newStatus
        );


        return res.redirect(
            "/admin/priorities"
        );

    } catch (error) {

        console.error(
            "ADMIN PRIORITY TOGGLE ERROR:",
            error
        );


        return res
            .status(500)
            .send(
                "Gagal mengubah status prioritas."
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