const db =
    require("../config/database");

const userModel =
    require("../models/user.model");


function index(req, res) {

    const userId =
        Number(req.session?.user?.id);


    if (!userId) {

        return res.status(401).send(
            "User belum login."
        );

    }


    const user =
        db.prepare(`
            SELECT
                id,
                nama,
                username,
                role

            FROM users

            WHERE id = ?
        `).get(userId);


    if (!user) {

        return res.status(404).send(
            "Data pengguna tidak ditemukan."
        );

    }


    res.render(
        "profile/index",
        {
            title: "Profil Saya",
            layout: "layouts/app",
            user
        }
    );

}


function edit(req, res) {

    const userId =
        Number(req.session?.user?.id);


    if (!userId) {

        return res.status(401).send(
            "User belum login."
        );

    }


    const user =
        db.prepare(`
            SELECT
                id,
                nama,
                username,
                role

            FROM users

            WHERE id = ?
        `).get(userId);


    if (!user) {

        return res.status(404).send(
            "Data pengguna tidak ditemukan."
        );

    }


    res.render(
        "profile/edit",
        {
            title: "Edit Profil",
            layout: "layouts/app",
            user
        }
    );

}


function update(req, res) {

    const userId =
        Number(req.session?.user?.id);


    if (!userId) {

        return res.status(401).send(
            "User belum login."
        );

    }


    const nama =
        (req.body?.nama || "").trim();


    if (!nama) {

        return res.status(400).send(
            "Nama wajib diisi."
        );

    }


    const user =
        userModel.updateProfile(
            userId,
            nama
        );


    if (!user) {

        return res.status(404).send(
            "Data pengguna tidak ditemukan."
        );

    }


    /*
     * Perbarui session juga.
     *
     * Supaya setelah nama berubah,
     * Topbar + Sidebar langsung
     * menggunakan nama terbaru.
     */
    req.session.user = {
        ...req.session.user,
        nama: user.nama
    };


    res.redirect(
        "/profile"
    );

}


module.exports = {

    index,

    edit,

    update

};