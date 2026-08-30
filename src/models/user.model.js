const db =
    require("../config/database");

const crypto =
    require("crypto");

function hashPassword(password) {

    if (
        typeof password !== "string" ||
        !password
    ) {
        throw new Error(
            "Password wajib diisi."
        );
    }

    const salt =
        crypto.randomBytes(16)
            .toString("hex");

    const hash =
        crypto.scryptSync(
            password,
            salt,
            64
        ).toString("hex");

    return `scrypt$${salt}$${hash}`;
}

function verifyPassword(
    password,
    storedHash
) {

    if (
        typeof password !== "string" ||
        !password ||
        typeof storedHash !== "string"
    ) {
        return false;
    }

    const parts =
        storedHash.split("$");

    if (
        parts.length !== 3 ||
        parts[0] !== "scrypt"
    ) {
        return false;
    }

    const salt =
        parts[1];

    const storedHashBuffer =
        Buffer.from(
            parts[2],
            "hex"
        );

    const derivedHash =
        crypto.scryptSync(
            password,
            salt,
            64
        );

    if (
        storedHashBuffer.length !==
        derivedHash.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        storedHashBuffer,
        derivedHash
    );
}

function getAll() {

    return db
        .prepare(`
            SELECT
                id,
                nama,
                username,
                role,
                seksi,
                bagian
            FROM users
            ORDER BY id
        `)
        .all();

}


function getPaginated({
    page = 1,
    limit = 15,
    search = ""
} = {}) {

    const currentPage =
        Math.max(
            Number(page) || 1,
            1
        );


    const perPage =
        Math.max(
            Number(limit) || 15,
            1
        );


    const offset =
        (currentPage - 1) * perPage;


    const keyword =
        String(
            search || ""
        ).trim();


    let where = "";

    let params = [];


    if (keyword) {

        where = `
            WHERE
                nama LIKE ?
                OR username LIKE ?
                OR role LIKE ?
        `;


        const pattern =
            `%${keyword}%`;


        params = [
            pattern,
            pattern,
            pattern
        ];

    }


    const total =
        db
            .prepare(`
                SELECT
                    COUNT(*) AS total
                FROM users
                ${where}
            `)
            .get(
                ...params
            )
            .total;


    const users =
        db
            .prepare(`
                SELECT
                    id,
                    nama,
                    username,
                    role,
                    seksi,
                    bagian
                FROM users

                ${where}

                ORDER BY id

                LIMIT ?
                OFFSET ?
            `)
            .all(
                ...params,
                perPage,
                offset
            );


    const totalPages =
        Math.ceil(
            total / perPage
        );


    return {

        users,

        pagination: {

            page: currentPage,

            limit: perPage,

            total,

            totalPages

        }

    };

}


function findByUsername(
    username
) {

    return db
        .prepare(`
            SELECT
                id,
                nama,
                username,
                password_hash,
                role,
                seksi,
                bagian
            FROM users
            WHERE username = ?
        `)
        .get(
            username
        );

}


function findById(
    id
) {

    return db
        .prepare(`
            SELECT
                id,
                nama,
                username,
                role,
                seksi,
                bagian
            FROM users
            WHERE id = ?
        `)
        .get(
            id
        );

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
        db
            .prepare(`
                UPDATE users

                SET
                    nama = ?

                WHERE id = ?
            `)
            .run(
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
                role,
                seksi,
                bagian
            FROM users
            WHERE role = 'teknisi'
            ORDER BY nama
        `)
        .all();

}


function create(
    data
) {

    const result =
        db
            .prepare(`
                INSERT INTO users (
                    nama,
                    username,
                    role,
                    seksi,
                    bagian
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `)
            .run(
                data.nama,
                data.username,
                data.role,
                data.seksi || null,
                data.bagian || null
            );


    return findById(
        Number(
            result.lastInsertRowid
        )
    );

}


function update(
    id,
    data
) {

    db
        .prepare(`
            UPDATE users

            SET
                nama = ?,
                role = ?,
                seksi = ?,
                bagian = ?

            WHERE id = ?
        `)
        .run(
            data.nama,
            data.role,
            data.seksi || null,
            data.bagian || null,
            id
        );


    return findById(id);

}


function remove(
    id
) {

    const result =
        db
            .prepare(`
                DELETE FROM users
                WHERE id = ?
            `)
            .run(id);


    return (
        result.changes > 0
    );

}


function getUserStats() {

    const total =
        db
            .prepare(`
                SELECT
                    COUNT(*) AS total
                FROM users
            `)
            .get()
            .total;


    const rows =
        db
            .prepare(`
                SELECT
                    role,
                    COUNT(*) AS total
                FROM users
                GROUP BY role
            `)
            .all();


    const stats = {

        totalUsers: total,

        pelapor: 0,

        teknisi: 0,

        asman: 0,

        manager: 0,

        admin: 0

    };


    rows.forEach(
        row => {

            if (
                Object.prototype.hasOwnProperty.call(
                    stats,
                    row.role
                )
            ) {

                stats[row.role] =
                    row.total;

            }

        }
    );


    return stats;

}


function setPassword(
    id,
    password
) {

    const passwordHash =
        hashPassword(password);

    const result =
        db
            .prepare(`
                UPDATE users
                SET password_hash = ?
                WHERE id = ?
            `)
            .run(
                passwordHash,
                id
            );

    return (
        result.changes > 0
    );
}


module.exports = {

    getAll,

    getPaginated,

    findByUsername,

    findById,

    updateProfile,

    getTechnicians,

    getUserStats,

    create,

    update,

    remove,

    hashPassword,
    verifyPassword,
    setPassword

};