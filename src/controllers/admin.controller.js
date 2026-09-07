const userModel =
    require("../models/user.model");

const departmentModel =
    require("../models/department.model");

const sectionModel =
    require("../models/section.model");


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

    const departments =
        departmentModel.getActive();

    const sections =
        sectionModel.getActive();

    res.render(
        "admin/users/create",
        {
            title:
                "Tambah Pengguna",

            layout:
                "layouts/app",

            departments,
            sections
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

        department_id,

        section_id,

        password

    } = req.body;

    if (
        !validateSectionBelongsToDepartment(
            department_id,
            section_id
        )
    ) {
        return res
            .status(400)
            .send(
                "Seksi yang dipilih tidak sesuai dengan Bagian."
            );
    }

    if (
        !validateRolePlacement(
            role,
            department_id,
            section_id
        )
    ) {
        return res
            .status(400)
            .send(
                "Asman dan Teknisi wajib memiliki Bagian dan Seksi."
            );
    }


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

            department_id,

            section_id

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

    const departments =
        departmentModel.getActive();

    const sections =
        sectionModel.getActive();


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

            user,

            departments,

            sections

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

        department_id,

        section_id,

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

    if (
        !validateSectionBelongsToDepartment(
            department_id,
            section_id
        )
    ) {
        return res
            .status(400)
            .send(
                "Seksi yang dipilih tidak sesuai dengan Bagian."
            );
    }

    if (
        !validateRolePlacement(
            role,
            department_id,
            section_id
        )
    ) {
        return res
            .status(400)
            .send(
                "Asman dan Teknisi wajib memiliki Bagian dan Seksi."
            );
    }


    try {

        userModel.update(

            id,

            {

                nama,

                role,

                department_id,

                section_id

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


function validateSectionBelongsToDepartment(
    departmentId,
    sectionId
) {
    // Seksi boleh kosong sementara
    // untuk menjaga kompatibilitas user lama.
    if (!sectionId) {
        return true;
    }

    if (!departmentId) {
        return false;
    }

    const section =
        sectionModel.getById(
            Number(sectionId)
        );

    if (!section) {
        return false;
    }

    return (
        Number(section.department_id) ===
        Number(departmentId)
    );
}

function validateRolePlacement(
    role,
    departmentId,
    sectionId
) {
    /*
     * =====================================
     * ASMAN + TEKNISI
     * WAJIB MEMILIKI BAGIAN + SEKSI
     * =====================================
     */

    if (
        role === "asman" ||
        role === "teknisi"
    ) {

        if (!departmentId) {
            return false;
        }

        if (!sectionId) {
            return false;
        }
    }

    return true;
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