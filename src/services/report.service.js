const workorderModel =
    require("../models/workorder.model");


/*
 * =====================================
 * Helper
 * =====================================
 */

function normalizeMonth(month) {
    const value = Number(month);

    if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 12
    ) {
        return null;
    }

    return value;
}


function normalizeYear(year) {
    const value = Number(year);

    if (
        !Number.isInteger(value) ||
        value < 2000 ||
        value > 2100
    ) {
        return null;
    }

    return value;
}


/*
 * =====================================
 * REKAP BULANAN WORK ORDER
 * =====================================
 */

function getMonthlyReport(year, month) {

    const normalizedYear =
        normalizeYear(year);

    const normalizedMonth =
        normalizeMonth(month);

    if (
        !normalizedYear ||
        !normalizedMonth
    ) {
        throw new Error(
            "Periode laporan tidak valid."
        );
    }


    /*
     * Ambil seluruh Work Order
     * melalui model yang sudah ada.
     *
     * Tidak membuat query database baru
     * pada tahap ini.
     */

    const workorders =
        workorderModel.getAll();


    /*
     * Batas periode:
     *
     * awal bulan
     * sampai sebelum awal bulan berikutnya.
     */

    const startDate =
        new Date(
            normalizedYear,
            normalizedMonth - 1,
            1
        );

    const endDate =
        new Date(
            normalizedYear,
            normalizedMonth,
            1
        );


    /*
     * Filter berdasarkan
     * tanggal Work Order dibuat.
     */

    const rows =
        workorders.filter(
            function (wo) {

                if (!wo.createdAt) {
                    return false;
                }

                const createdDate =
                    new Date(
                        wo.createdAt
                    );

                return (
                    createdDate >= startDate &&
                    createdDate < endDate
                );
            }
        );


    /*
     * Bentuk dataset laporan.
     *
     * Dataset ini nantinya menjadi
     * sumber yang sama untuk:
     *
     * - Web
     * - PDF
     * - Excel
     */

    const data =
        rows.map(
            function (wo, index) {

                return {
                    no:
                        index + 1,

                    nomor:
                        wo.nomor || "-",

                    tanggal:
                        wo.createdAt || null,

                    subkategori:
                        wo.subkategori || "-",

                    uraian:
                        wo.judul || "-",

                    status:
                        wo.status || "-",

                    tindakan:
                        wo.resolutionDescription ||
                        "-",

                    pemohon:
                        wo.pelapor || "-",

                    petugas:
                        wo.teknisi || "-"
                };
            }
        );


    /*
     * =====================================
     * RINGKASAN
     * =====================================
     */

    const total =
        data.length;


    const diproses =
        data.filter(
            function (item) {
                return item.status === "Diproses";
            }
        ).length;


    const selesai =
        data.filter(
            function (item) {

                return (
                    item.status === "Selesai" ||
                    item.status === "Ditutup"
                );
            }
        ).length;


    /*
     * =====================================
     * SUBKATEGORI
     * =====================================
     */

    const subkategoriMap =
        new Map();


    data.forEach(
        function (item) {

            const nama =
                item.subkategori ||
                "-";

            const current =
                subkategoriMap.get(nama) ||
                0;

            subkategoriMap.set(
                nama,
                current + 1
            );
        }
    );


    const subkategori =
        Array.from(
            subkategoriMap.entries()
        )
        .map(
            function ([nama, jumlah]) {

                return {
                    nama,
                    jumlah
                };
            }
        )
        .sort(
            function (a, b) {
                return b.jumlah - a.jumlah;
            }
        );


    return {

        periode: {
            tahun:
                normalizedYear,

            bulan:
                normalizedMonth
        },

        summary: {

            total,

            diproses,

            selesai
        },

        subkategori,

        data
    };
}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {
    getMonthlyReport
};