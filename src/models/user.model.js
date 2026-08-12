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


module.exports = {

    getAll,

    findByUsername,

    findById

};