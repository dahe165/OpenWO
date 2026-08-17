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
            username = ?,
            role = ?

        WHERE id = ?
    `)
    .run(
        data.nama,
        data.username,
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

module.exports = {

    getAll,

    findByUsername,

    findById,

    getTechnicians,

    create,

    update,

    remove

};