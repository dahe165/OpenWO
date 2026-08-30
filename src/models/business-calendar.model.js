const db =
    require("../config/database");


/*
 * =====================================
 * BUSINESS CALENDAR MODEL
 * =====================================
 */


/*
 * =====================================
 * Get Active Calendar
 * =====================================
 */

function getActiveCalendar() {

    return db.prepare(`
        SELECT
            id,
            nama,
            timezone,
            aktif

        FROM business_calendar_settings

        WHERE aktif = 1

        ORDER BY id

        LIMIT 1
    `).get();

}


/*
 * =====================================
 * Get Business Hours
 * =====================================
 */

function getBusinessHours(
    calendarId
) {

    return db.prepare(`
        SELECT
            id,
            calendar_id,
            hari,
            jam_mulai,
            jam_selesai,
            aktif

        FROM business_hours

        WHERE calendar_id = ?
          AND aktif = 1

        ORDER BY
            hari,
            jam_mulai
    `).all(
        calendarId
    );

}


/*
 * =====================================
 * Get Calendar Exceptions
 * =====================================
 */

function getCalendarExceptions(
    calendarId
) {

    return db.prepare(`
        SELECT
            id,
            calendar_id,
            tanggal,
            tipe,
            nama,
            jam_mulai,
            jam_selesai,
            keterangan

        FROM calendar_exceptions

        WHERE calendar_id = ?

        ORDER BY tanggal
    `).all(
        calendarId
    );

}


/*
 * =====================================
 * Get Calendar
 * =====================================
 */

function getCalendar() {

    const calendar =
        getActiveCalendar();


    if (!calendar) {

        return null;

    }


    return {

        ...calendar,

        businessHours:
            getBusinessHours(
                calendar.id
            ),

        exceptions:
            getCalendarExceptions(
                calendar.id
            )

    };

}

/*
 * =====================================
 * Create Calendar Exception
 * =====================================
 */

function createCalendarException(data) {

    const stmt =
        db.prepare(`
            INSERT INTO calendar_exceptions (
                calendar_id,
                tanggal,
                tipe,
                nama,
                jam_mulai,
                jam_selesai,
                keterangan
            )

            VALUES (
                @calendarId,
                @tanggal,
                @tipe,
                @nama,
                @jamMulai,
                @jamSelesai,
                @keterangan
            )
        `);


    return stmt.run({

        calendarId:
            data.calendarId,

        tanggal:
            data.tanggal,

        tipe:
            data.tipe,

        nama:
            data.nama,

        jamMulai:
            data.jamMulai || null,

        jamSelesai:
            data.jamSelesai || null,

        keterangan:
            data.keterangan || null

    });

}

/*
 * =====================================
 * Get Exception By Date
 * =====================================
 */

function getCalendarException(
    calendarId,
    tanggal
) {

    return db.prepare(`
        SELECT
            id,
            calendar_id,
            tanggal,
            tipe,
            nama,
            jam_mulai,
            jam_selesai,
            keterangan

        FROM calendar_exceptions

        WHERE calendar_id = ?
          AND tanggal = ?

        LIMIT 1
    `).get(
        calendarId,
        tanggal
    );

}

module.exports = {

    getActiveCalendar,

    getBusinessHours,

    getCalendarExceptions,

    getCalendar,

    createCalendarException,

    getCalendarException

};

console.log(
    "=== BUSINESS CALENDAR MODEL TEST ==="
);

console.log(
    getCalendar()
);