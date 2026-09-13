const businessCalendarModel =
    require("../models/business-calendar.model");


/*
 * =====================================
 * ADMIN BUSINESS CALENDAR CONTROLLER
 * =====================================
 */


/*
 * =====================================
 * INDEX
 * =====================================
 */

function index(req, res) {

    try {

        const calendar =
            businessCalendarModel.getCalendar();


        if (!calendar) {

            return res
                .status(404)
                .send(
                    "Kalender layanan tidak ditemukan."
                );

        }


        const now = new Date();

        const year =
            Number.isInteger(
                Number(req.query.year)
            )
                ? Number(req.query.year)
                : now.getFullYear();


        const month =
            Number.isInteger(
                Number(req.query.month)
            )
                ? Number(req.query.month)
                : now.getMonth() + 1;


        const currentDate =
            new Date(
                year,
                month - 1,
                1
            );


        res.render(
            "admin/business-calendar/index",
            {
                title: "Kalender Layanan",
                layout: "layouts/app",
                calendar,
                calendarYear: year,
                calendarMonth: month,
                currentDate,
                querySaved: req.query.saved || ""
            }
        );


    } catch (error) {

        console.error(
            "BUSINESS CALENDAR INDEX ERROR:",
            error
        );


        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat mengambil kalender layanan."
            );

    }

}


/*
 * =====================================
 * EDIT BUSINESS HOURS FORM
 * =====================================
 */

function editBusinessHours(req, res) {

    try {

        const calendar =
            businessCalendarModel.getCalendar();

        if (!calendar) {
            return res.status(404).send(
                "Kalender layanan tidak ditemukan."
            );
        }

        res.render(
            "admin/business-calendar/business-hours-form",
            {
                title: "Atur Jam Kerja",
                layout: "layouts/app",
                calendar
            }
        );

    } catch (error) {

        console.error(
            "BUSINESS HOURS EDIT FORM ERROR:",
            error
        );

        return res.status(500).send(
            "Terjadi kesalahan saat membuka pengaturan jam kerja."
        );

    }

}


/*
 * =====================================
 * UPDATE BUSINESS HOURS
 * =====================================
 */

function updateBusinessHours(req, res) {

    try {

        const calendar =
            businessCalendarModel.getActiveCalendar();

        if (!calendar) {
            return res.status(404).send(
                "Kalender layanan tidak ditemukan."
            );
        }

        const hours = [];
        const errors = [];

        for (let hari = 1; hari <= 7; hari++) {

            const enabled =
                req.body?.[`hari_${hari}_aktif`] === "on";

            if (!enabled) continue;

            let starts = req.body?.[`jam_mulai_${hari}`] || [];
            let ends = req.body?.[`jam_selesai_${hari}`] || [];

            if (!Array.isArray(starts)) starts = [starts];
            if (!Array.isArray(ends)) ends = [ends];

            const dayHours = [];

            for (let i = 0; i < Math.max(starts.length, ends.length); i++) {
                const start = String(starts[i] || "").trim();
                const end = String(ends[i] || "").trim();

                if (!start && !end) continue;

                if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
                    !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)) {
                    errors.push(`Jam kerja hari ${hari} tidak valid.`);
                    continue;
                }

                if (start >= end) {
                    errors.push(`Jam mulai harus lebih kecil dari jam selesai pada hari ${hari}.`);
                    continue;
                }

                dayHours.push({
                    hari,
                    jamMulai: start,
                    jamSelesai: end
                });
            }

            if (dayHours.length === 0) {
                errors.push(`Hari ${hari} diaktifkan tetapi belum memiliki jam kerja.`);
                continue;
            }

            dayHours.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

            for (let i = 1; i < dayHours.length; i++) {
                if (dayHours[i].jamMulai < dayHours[i - 1].jamSelesai) {
                    errors.push(`Interval jam kerja hari ${hari} saling bertumpuk.`);
                    break;
                }
            }

            hours.push(...dayHours);
        }

        if (errors.length > 0) {
            return res.status(400).send(errors.join("<br>"));
        }

        businessCalendarModel.updateBusinessHours(
            calendar.id,
            hours
        );

        return res.redirect(
            "/admin/business-calendar?saved=hours"
        );

    } catch (error) {

        console.error(
            "BUSINESS HOURS UPDATE ERROR:",
            error
        );

        return res.status(500).send(
            "Terjadi kesalahan saat menyimpan jam kerja."
        );

    }

}

/*
 * =====================================
 * CREATE EXCEPTION FORM
 * =====================================
 */

function createExceptionForm(req, res) {

    try {

        const calendar =
            businessCalendarModel.getActiveCalendar();


        if (!calendar) {

            return res
                .status(404)
                .send(
                    "Kalender layanan tidak ditemukan."
                );

        }


        res.render(
            "admin/business-calendar/exception-form",
            {
                title: "Tambah Hari Khusus",
                layout: "layouts/app",
                calendar
            }
        );


    } catch (error) {

        console.error(
            "BUSINESS CALENDAR CREATE FORM ERROR:",
            error
        );


        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat membuka form."
            );

    }

}


/*
 * =====================================
 * CREATE EXCEPTION
 * =====================================
 */

function createException(req, res) {

    try {

        const calendar =
            businessCalendarModel.getActiveCalendar();


        if (!calendar) {

            return res
                .status(404)
                .send(
                    "Kalender layanan tidak ditemukan."
                );

        }


        const {
            tanggal,
            tipe,
            nama,
            jam_mulai,
            jam_selesai,
            keterangan
        } = req.body;


        /*
         * ================================
         * VALIDASI DASAR
         * ================================
         */

        if (
            !tanggal ||
            !tipe ||
            !nama
        ) {

            return res
                .status(400)
                .send(
                    "Tanggal, tipe, dan nama wajib diisi."
                );

        }


        if (
            ![
                "LIBUR",
                "KHUSUS"
            ].includes(tipe)
        ) {

            return res
                .status(400)
                .send(
                    "Tipe kalender tidak valid."
                );

        }


        /*
         * ================================
         * KHUSUS WAJIB PUNYA JAM
         * ================================
         */

        if (
            tipe === "KHUSUS" &&
            (
                !jam_mulai ||
                !jam_selesai
            )
        ) {

            return res
                .status(400)
                .send(
                    "Jam mulai dan jam selesai wajib diisi untuk hari kerja khusus."
                );

        }


        /*
         * ================================
         * LIBUR TIDAK MEMERLUKAN JAM
         * ================================
         */

        const jamMulai =
            tipe === "KHUSUS"
                ? jam_mulai
                : null;


        const jamSelesai =
            tipe === "KHUSUS"
                ? jam_selesai
                : null;


        /*
         * ================================
         * SIMPAN
         * ================================
         */

        businessCalendarModel
            .createCalendarException({

                calendarId:
                    calendar.id,

                tanggal,

                tipe,

                nama,

                jamMulai,

                jamSelesai,

                keterangan

            });


        return res.redirect(
            "/admin/business-calendar"
        );


    } catch (error) {

        console.error(
            "BUSINESS CALENDAR CREATE ERROR:",
            error
        );


        /*
         * UNIQUE constraint
         * satu tanggal = satu exception
         */

        if (
            error.code ===
            "SQLITE_CONSTRAINT_UNIQUE"
        ) {

            return res
                .status(400)
                .send(
                    "Tanggal tersebut sudah memiliki hari khusus."
                );

        }


        return res
            .status(500)
            .send(
                "Terjadi kesalahan saat menyimpan hari khusus."
            );

    }

}


module.exports = {

    index,

    editBusinessHours,

    updateBusinessHours,

    createExceptionForm,

    createException

};

