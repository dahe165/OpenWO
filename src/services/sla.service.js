const businessCalendarService =
    require("./business-calendar.service");


/*
 * =====================================
 * SLA SERVICE
 * =====================================
 */


/*
 * =====================================
 * Calculate SLA Deadline
 * =====================================
 *
 * startDate     : waktu SLA dimulai
 * targetMinutes : target SLA dalam menit kerja
 *
 * Return:
 * Date deadline
 */

function calculateDeadline(
    startDate,
    targetMinutes
) {

    if (
        !(startDate instanceof Date) ||
        Number.isNaN(startDate.getTime())
    ) {

        return null;

    }


    if (
        !Number.isFinite(targetMinutes) ||
        targetMinutes < 0
    ) {

        return null;

    }


    /*
     * SLA 0 menit:
     * deadline = start time
     */

    if (targetMinutes === 0) {

        return new Date(startDate);

    }


    let current =
        new Date(startDate);

    let remainingMinutes =
        targetMinutes;


    /*
     * =================================
     * Jika mulai di luar jam kerja
     * pindahkan ke business time berikutnya
     * =================================
     */

    if (
        !businessCalendarService
            .isBusinessTime(current)
    ) {

        current =
            businessCalendarService
                .getNextBusinessTime(
                    current
                );


        if (!current) {

            return null;

        }

    }


    /*
     * =================================
     * HITUNG BERDASARKAN BLOK WAKTU
     * =================================
     */

    while (
        remainingMinutes > 0
    ) {

        const nextBusinessTime =
            businessCalendarService
                .getNextBusinessTime(
                    current
                );


        if (!nextBusinessTime) {

            return null;

        }


        /*
         * Pastikan current tidak mundur.
         */

        if (
            nextBusinessTime > current
        ) {

            current =
                nextBusinessTime;

        }


        /*
         * Cari titik akhir interval
         * business time saat ini.
         *
         * Kita gunakan pencarian satu menit
         * sebagai implementasi awal yang
         * sederhana dan mudah diverifikasi.
         */

        let cursor =
            new Date(current);


        let availableMinutes = 0;


        while (
            availableMinutes <
                remainingMinutes
        ) {

            if (
                !businessCalendarService
                    .isBusinessTime(
                        cursor
                    )
            ) {

                break;

            }


            availableMinutes++;

            cursor.setMinutes(
                cursor.getMinutes() + 1
            );

        }


        /*
         * Semua SLA selesai di dalam
         * blok waktu ini.
         */

        if (
            availableMinutes >=
                remainingMinutes
        ) {

            const deadline =
                new Date(current);

            deadline.setMinutes(
                deadline.getMinutes() +
                remainingMinutes
            );


            return deadline;

        }


        /*
         * Blok waktu habis.
         *
         * Lanjutkan dari cursor.
         */

        remainingMinutes -=
            availableMinutes;


        current =
            businessCalendarService
                .getNextBusinessTime(
                    cursor
                );


        if (!current) {

            return null;

        }

    }


    return current;

}


module.exports = {

    calculateDeadline

};