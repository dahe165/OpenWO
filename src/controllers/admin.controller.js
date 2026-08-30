const userModel =
    require("../models/user.model");


function index(req, res) {

    const page =
        Math.max(
            Number(req.query.page) || 1,
            1
        );


    const q =
        String(
            req.query.q || ""
        ).trim();


    const result =
        userModel.getPaginated({

            page,

            limit: 15,

            search: q

        });


    res.render(
        "admin/users/index",
        {

            title:
                "Manajemen Pengguna",

            layout:
                "layouts/app",

            users:
                result.users,

            pagination:
                result.pagination,

            q

        }
    );

}


function search(req, res) {

    const page =
        Math.max(
            Number(req.query.page) || 1,
            1
        );


    const q =
        String(
            req.query.q || ""
        ).trim();


    const result =
        userModel.getPaginated({

            page,

            limit: 15,

            search: q

        });


    res.json({

        success: true,

        users:
            result.users,

        pagination:
            result.pagination

    });

}


function create(
    req,
    res
) {

    res.render(
        "admin/users/create",
        {

            title:
                "Tambah Pengguna",

            layout:
                "layouts/app"

        }
    );

}


function store(
    req,
    res
) {

    const {

        nama,

        username,

        role,

        seksi,

        bagian,

        password

    } = req.body;


    if (
        !nama ||
        !username ||
        !role
    ) {

        return res
            .status(400)
            .send(
                "Nama, username, dan role wajib diisi."
            );

    }


    try {

        userModel.create({

            nama,

            username,

            role,

            seksi,

            bagian

        });


        res.redirect(
            "/admin/users"
        );


    } catch (error) {

        console.error(
            "ADMIN CREATE USER:",
            error
        );


        res
            .status(400)
            .send(
                "Username sudah digunakan."
            );

    }

}


function edit(
    req,
    res
) {

    const id =
        Number(
            req.params.id
        );


    const user =
        userModel.findById(id);


    if (!user) {

        return res
            .status(404)
            .send(
                "User tidak ditemukan."
            );

    }


    res.render(
        "admin/users/edit",
        {

            title:
                "Edit Pengguna",

            layout:
                "layouts/app",

            user

        }
    );

}


function update(
    req,
    res
) {

    const id =
        Number(
            req.params.id
        );


    const {

        nama,

        role,

        seksi,

        bagian,

        password

    } = req.body;


    if (
        !nama ||
        !role
    ) {

        return res
            .status(400)
            .send(
                "Nama dan role wajib diisi."
            );

    }


    try {

        userModel.update(

            id,

            {

                nama,

                role,

                seksi,

                bagian

            }

        );

        if (
            typeof password === "string" &&
            password.trim()
        ) {

            if (password.length < 8) {

                return res
                    .status(400)
                    .send(
                        "Password baru minimal 8 karakter."
                    );

            }

            userModel.setPassword(
                id,
                password
            );

        }


        res.redirect(
            "/admin/users"
        );


    } catch (error) {

        console.error(
            "ADMIN UPDATE USER:",
            error
        );


        res
            .status(400)
            .send(
                "Gagal memperbarui pengguna."
            );

    }

}


function remove(
    req,
    res
) {

    const id =
        Number(
            req.params.id
        );


    /*
     * =====================================
     * Jangan hapus akun yang sedang login
     * =====================================
     */

    if (
        id === req.user?.id
    ) {

        return res
            .status(400)
            .send(
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

        return res
            .status(404)
            .send(
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
                user =>
                    user.role === "admin"
            ).length;


        if (
            totalAdmin <= 1
        ) {

            return res
                .status(400)
                .send(
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

        return res
            .status(404)
            .send(
                "User tidak ditemukan."
            );

    }


    res.redirect(
        "/admin/users"
    );

}


module.exports = {

    index,

    search,

    create,

    store,

    edit,

    update,

    remove

};