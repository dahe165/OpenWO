const departmentModel =
    require("../models/department.model");


/*
 * =====================================
 * INDEX
 * =====================================
 */

function index(req, res) {

    const departments =
        departmentModel.getAll();

    res.render(
        "admin/departments/index",
        {
            title: "Master Bagian",
            layout: "layouts/app",
            departments
        }
    );

}


/*
 * =====================================
 * CREATE
 * =====================================
 */

function create(req, res) {

    res.render(
        "admin/departments/create",
        {
            title: "Tambah Bagian",
            layout: "layouts/app"
        }
    );

}


/*
 * =====================================
 * STORE
 * =====================================
 */

function store(req, res) {

    const {
        kode,
        nama
    } = req.body;

    if (
        !kode ||
        !nama
    ) {

        return res
            .status(400)
            .send(
                "Kode dan nama Bagian wajib diisi."
            );

    }


    try {

        departmentModel.create({
            kode,
            nama
        });

        res.redirect(
            "/admin/departments"
        );

    } catch (error) {

        console.error(
            "ADMIN CREATE DEPARTMENT:",
            error
        );

        res
            .status(400)
            .send(
                "Kode atau nama Bagian sudah digunakan."
            );

    }

}


/*
 * =====================================
 * EDIT
 * =====================================
 */

function edit(req, res) {

    const id =
        Number(req.params.id);

    const department =
        departmentModel.getById(id);

    if (!department) {

        return res
            .status(404)
            .send(
                "Bagian tidak ditemukan."
            );

    }


    res.render(
        "admin/departments/edit",
        {
            title: "Edit Bagian",
            layout: "layouts/app",
            department
        }
    );

}


/*
 * =====================================
 * UPDATE
 * =====================================
 */

function update(req, res) {

    const id =
        Number(req.params.id);

    const {
        kode,
        nama
    } = req.body;


    if (
        !kode ||
        !nama
    ) {

        return res
            .status(400)
            .send(
                "Kode dan nama Bagian wajib diisi."
            );

    }


    try {

        departmentModel.update(
            id,
            {
                kode,
                nama
            }
        );

        res.redirect(
            "/admin/departments"
        );

    } catch (error) {

        console.error(
            "ADMIN UPDATE DEPARTMENT:",
            error
        );

        res
            .status(400)
            .send(
                "Gagal memperbarui Bagian."
            );

    }

}


/*
 * =====================================
 * TOGGLE
 * =====================================
 */

function toggle(req, res) {

    const id =
        Number(req.params.id);

    const department =
        departmentModel.getById(id);

    if (!department) {

        return res
            .status(404)
            .send(
                "Bagian tidak ditemukan."
            );

    }


    departmentModel.setStatus(
        id,
        !department.aktif
    );

    res.redirect(
        "/admin/departments"
    );

}


module.exports = {

    index,
    create,
    store,
    edit,
    update,
    toggle

};