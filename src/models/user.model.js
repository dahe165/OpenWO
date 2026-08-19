const db =
    require("../config/database");


function getAll() {

    return db
        .prepare(`
            SELECT
                id,
                nama,
                username,
                role
            FROM users
            ORDER BY id
        `)
        .all();

}

function findByUsername(username) {

    return db
        .prepare(`
            SELECT
                id,
                nama,
                username,
                role
            FROM users
            WHERE username = ?
        `)
        .get(username);

}


function findById(id) {

    return db
        .prepare(`
            SELECT
                id,
                nama,
                username,
                role
            FROM users
            WHERE id = ?
        `)
        .get(id);

}

function updateProfile(
    id,
    nama
) {

    const cleanNama =
        (nama || "").trim();


    if (!cleanNama) {
        return null;
    }


    const result =
        db.prepare(`
            UPDATE users

            SET
                nama = ?

            WHERE id = ?
        `).run(
            cleanNama,
            id
        );


    if (
        result.changes === 0
    ) {
        return null;
    }


    return findById(id);
}

function getTechnicians() {

    return db
        .prepare(`
            SELECT
                id,
                nama,
                username,
                role
            FROM users
            WHERE role = 'teknisi'
            ORDER BY nama
        `)
        .all();

}

function create(data) {

    const result =
        db.prepare(`
            INSERT INTO users (
                nama,
                username,
                role
            )
            VALUES (?, ?, ?)
        `)
        .run(
            data.nama,
            data.username,
            data.role
        );

    return findById(
        Number(result.lastInsertRowid)
    );

}

function update(id, data) {

    db.prepare(`
        UPDATE users

        SET
            nama = ?,
            role = ?

        WHERE id = ?
    `)
    .run(
        data.nama,
        data.role,
        id
    );

    return findById(id);

}

function remove(id) {

    const result =
        db.prepare(`
            DELETE FROM users
            WHERE id = ?
        `)
        .run(id);

    return result.changes > 0;

}

function getUserStats() {

    const total =
        db.prepare(`
            SELECT COUNT(*) AS total
            FROM users
        `).get().total;


    const rows =
        db.prepare(`
            SELECT
                role,
                COUNT(*) AS total

            FROM users

            GROUP BY role
        `).all();


    const stats = {

        totalUsers: total,

        pelapor: 0,

        teknisi: 0,

        asman: 0,

        manager: 0,

        admin: 0

    };


    rows.forEach(row => {

        if (
            Object.prototype.hasOwnProperty.call(
                stats,
                row.role
            )
        ) {

            stats[row.role] =
                row.total;

        }

    });


    return stats;

}

module.exports = {

    getAll,

    findByUsername,

    findById,

    updateProfile,

    getTechnicians,

    getUserStats,

    create,

    update,

    remove

};