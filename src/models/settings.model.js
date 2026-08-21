const db =
    require("../config/database");


function getAll() {

    return db
        .prepare(`
            SELECT
                id,
                key,
                value,
                updated_at
            FROM system_settings
            ORDER BY id
        `)
        .all();

}


function get(key) {

    const row =
        db
            .prepare(`
                SELECT
                    value
                FROM system_settings
                WHERE key = ?
            `)
            .get(key);


    return row
        ? row.value
        : null;

}


function set(
    key,
    value
) {

    const cleanValue =
        (value || "").trim();


    db.prepare(`
        INSERT INTO system_settings (
            key,
            value,
            updated_at
        )

        VALUES (?, ?, CURRENT_TIMESTAMP)

        ON CONFLICT(key)
        DO UPDATE SET

            value = excluded.value,

            updated_at =
                CURRENT_TIMESTAMP
    `)
    .run(
        key,
        cleanValue
    );


    return get(key);

}


module.exports = {

    getAll,

    get,

    set

};