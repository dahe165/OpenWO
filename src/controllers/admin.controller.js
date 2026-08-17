const userModel =
    require("../models/user.model");


function index(req, res) {

    const users =
        userModel.getAll();

    res.render("admin/users/index", {

        title: "Manajemen Pengguna",

        layout: "layouts/app",

        users

    });

}


function create(req, res) {

    res.render("admin/users/create", {

        title: "Tambah Pengguna",

        layout: "layouts/app"

    });

}


function store(req, res) {

    const {
        nama,
        username,
        role
    } = req.body;


    if (
        !nama ||
        !username ||
        !role
    ) {

        return res.status(400).send(
            "Semua data pengguna wajib diisi."
        );

    }


    try {

        userModel.create({

            nama,
            username,
            role

        });

        res.redirect(
            "/admin/users"
        );

    } catch (error) {

        console.error(
            "ADMIN CREATE USER:",
            error
        );

        res.status(400).send(
            "Username sudah digunakan."
        );

    }

}


function edit(req, res) {

    const id =
        Number(req.params.id);


    const user =
        userModel.findById(id);


    if (!user) {

        return res.status(404).send(
            "User tidak ditemukan."
        );

    }


    res.render("admin/users/edit", {

        title: "Edit Pengguna",

        layout: "layouts/app",

        user

    });

}


function update(req, res) {

    const id =
        Number(req.params.id);


    const {
        nama,
        username,
        role
    } = req.body;


    if (
        !nama ||
        !username ||
        !role
    ) {

        return res.status(400).send(
            "Semua data pengguna wajib diisi."
        );

    }


    try {

        userModel.update(
            id,
            {
                nama,
                username,
                role
            }
        );

        res.redirect(
            "/admin/users"
        );

    } catch (error) {

        console.error(
            "ADMIN UPDATE USER:",
            error
        );

        res.status(400).send(
            "Username sudah digunakan."
        );

    }

}


function remove(req, res) {

    const id =
        Number(req.params.id);


    /*
     * =====================================
     * Jangan hapus akun yang sedang login
     * =====================================
     */

    if (
        id === req.user?.id
    ) {

        return res.status(400).send(
            "Akun yang sedang digunakan tidak dapat dihapus."
        );

    }


    /*
     * =====================================
     * Pastikan user memang ada
     * =====================================
     */

    const targetUser =
        userModel.findById(id);


    if (!targetUser) {

        return res.status(404).send(
            "User tidak ditemukan."
        );

    }


    /*
     * =====================================
     * Jangan hapus satu-satunya Admin
     * =====================================
     */

    if (
        targetUser.role === "admin"
    ) {

        const allUsers =
            userModel.getAll();


        const totalAdmin =
            allUsers.filter(
                user => user.role === "admin"
            ).length;


        if (totalAdmin <= 1) {

            return res.status(400).send(
                "Akun Admin terakhir tidak dapat dihapus."
            );

        }

    }


    /*
     * =====================================
     * Hapus user
     * =====================================
     */

    const success =
        userModel.remove(id);


    if (!success) {

        return res.status(404).send(
            "User tidak ditemukan."
        );

    }


    res.redirect(
        "/admin/users"
    );

}


module.exports = {

    index,

    create,

    store,

    edit,

    update,

    remove

};