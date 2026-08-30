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
                currentDate
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

    createExceptionForm,

    createException

};

