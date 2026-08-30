const businessCalendarModel =
    require("../models/business-calendar.model");


/*
 * =====================================
 * BUSINESS CALENDAR SERVICE
 * =====================================
 */


/*
 * =====================================
 * Format Date → YYYY-MM-DD
 * =====================================
 */

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/*
 * =====================================
 * Format Date → HH:MM
 * =====================================
 */

function formatTime(date) {

    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return `${hours}:${minutes}`;

}


/*
 * =====================================
 * Check Business Time
 * =====================================
 */

function isBusinessTime(
    date = new Date()
) {

    const calendar =
        businessCalendarModel
            .getActiveCalendar();


    if (!calendar) {

        return false;

    }


    const tanggal =
        formatDate(date);

    const waktu =
        formatTime(date);


    /*
     * =================================
     * CHECK EXCEPTION
     * =================================
     */

    const exception =
        businessCalendarModel
            .getCalendarException(
                calendar.id,
                tanggal
            );


    /*
     * LIBUR
     */

    if (
        exception &&
        exception.tipe === "LIBUR"
    ) {

        return false;

    }


    /*
     * KHUSUS
     */

    if (
        exception &&
        exception.tipe === "KHUSUS"
    ) {

        if (
            !exception.jam_mulai ||
            !exception.jam_selesai
        ) {

            return false;

        }


        return (
            waktu >= exception.jam_mulai &&
            waktu < exception.jam_selesai
        );

    }


    /*
     * =================================
     * BUSINESS HOURS NORMAL
     * =================================
     */

    const day =
        date.getDay();

    const hari =
        day === 0
            ? 7
            : day;


    const businessHours =
        businessCalendarModel
            .getBusinessHours(
                calendar.id
            );


    return businessHours.some(
        hour => {

            return (
                hour.hari === hari &&
                waktu >= hour.jam_mulai &&
                waktu < hour.jam_selesai
            );

        }
    );

}

/*
 * =====================================
 * Get Next Business Time
 * =====================================
 */

function getNextBusinessTime(
    date = new Date()
) {

    const calendar =
        businessCalendarModel
            .getActiveCalendar();


    if (!calendar) {

        return null;

    }


    const businessHours =
        businessCalendarModel
            .getBusinessHours(
                calendar.id
            );


    /*
     * Maksimal pencarian 14 hari
     * agar tidak terjadi loop tanpa batas.
     */

    const maxDays = 14;


    for (
        let dayOffset = 0;
        dayOffset <= maxDays;
        dayOffset++
    ) {

        const candidate =
            new Date(date);


        candidate.setDate(
            candidate.getDate() + dayOffset
        );


        /*
         * Untuk hari berikutnya,
         * mulai pencarian dari 00:00.
         */

        if (dayOffset > 0) {

            candidate.setHours(
                0,
                0,
                0,
                0
            );

        }


        const tanggal =
            formatDate(candidate);


        const waktu =
            formatTime(candidate);


        /*
         * =================================
         * CHECK EXCEPTION
         * =================================
         */

        const exception =
            businessCalendarModel
                .getCalendarException(
                    calendar.id,
                    tanggal
                );


        /*
         * ---------------------------------
         * LIBUR
         * ---------------------------------
         */

        if (
            exception &&
            exception.tipe === "LIBUR"
        ) {

            continue;

        }


        /*
         * ---------------------------------
         * KHUSUS
         * ---------------------------------
         */

        if (
            exception &&
            exception.tipe === "KHUSUS"
        ) {

            if (
                !exception.jam_mulai ||
                !exception.jam_selesai
            ) {

                continue;

            }


            /*
             * Sudah lewat seluruh jam khusus
             */

            if (
                waktu >=
                exception.jam_selesai
            ) {

                continue;

            }


            /*
             * Sebelum jam khusus
             */

            if (
                waktu <
                exception.jam_mulai
            ) {

                candidate.setHours(
                    Number(
                        exception.jam_mulai
                            .split(":")[0]
                    ),
                    Number(
                        exception.jam_mulai
                            .split(":")[1]
                    ),
                    0,
                    0
                );

            }


            return candidate;

        }


        /*
         * =================================
         * BUSINESS HOURS NORMAL
         * =================================
         */

        const day =
            candidate.getDay();

        const hari =
            day === 0
                ? 7
                : day;


        const hoursForDay =
            businessHours
                .filter(
                    hour =>
                        hour.hari === hari
                )
                .sort(
                    (a, b) =>
                        a.jam_mulai
                            .localeCompare(
                                b.jam_mulai
                            )
                );


        /*
         * Tidak ada jam kerja hari ini.
         */

        if (
            hoursForDay.length === 0
        ) {

            continue;

        }


        /*
         * Cari interval berikutnya.
         */

        for (
            const hour
            of hoursForDay
        ) {

            /*
             * Masih sebelum interval.
             */

            if (
                waktu <
                hour.jam_mulai
            ) {

                candidate.setHours(
                    Number(
                        hour.jam_mulai
                            .split(":")[0]
                    ),
                    Number(
                        hour.jam_mulai
                            .split(":")[1]
                    ),
                    0,
                    0
                );

                return candidate;

            }


            /*
             * Sedang berada dalam interval.
             */

            if (
                waktu >= hour.jam_mulai &&
                waktu < hour.jam_selesai
            ) {

                return candidate;

            }

        }

    }


    return null;

}

/*
 * =====================================
 * Create Date With Time
 * =====================================
 */

function createDateWithTime(
    date,
    time
) {

    const result =
        new Date(date);


    const [
        hours,
        minutes
    ] =
        time.split(":")
            .map(Number);


    result.setHours(
        hours,
        minutes,
        0,
        0
    );


    return result;

}


/*
 * =====================================
 * Calculate Interval Overlap
 * =====================================
 */

function calculateOverlapMinutes(
    rangeStart,
    rangeEnd,
    intervalStart,
    intervalEnd
) {

    const start =
        rangeStart > intervalStart
            ? rangeStart
            : intervalStart;


    const end =
        rangeEnd < intervalEnd
            ? rangeEnd
            : intervalEnd;


    if (start >= end) {

        return 0;

    }


    return (
        end.getTime() -
        start.getTime()
    ) / 60000;

}

/*
 * =====================================
 * Get Business Minutes
 * =====================================
 */

function getBusinessMinutes(
    startDate,
    endDate
) {

    if (
        !(startDate instanceof Date) ||
        !(endDate instanceof Date)
    ) {

        return 0;

    }


    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
    ) {

        return 0;

    }


    if (
        endDate <= startDate
    ) {

        return 0;

    }


    const calendar =
        businessCalendarModel
            .getActiveCalendar();


    if (!calendar) {

        return 0;

    }


    const businessHours =
        businessCalendarModel
            .getBusinessHours(
                calendar.id
            );


    let totalMinutes = 0;


    /*
     * Mulai dari awal tanggal start.
     */

    const current =
        new Date(startDate);

    current.setHours(
        0,
        0,
        0,
        0
    );


    /*
     * =====================================
     * PROSES SETIAP HARI
     * =====================================
     */

    while (
        current < endDate
    ) {

        const tanggal =
            formatDate(current);


        const day =
            current.getDay();


        const hari =
            day === 0
                ? 7
                : day;


        /*
         * Batas awal dan akhir hari.
         */

        const dayStart =
            new Date(current);

        dayStart.setHours(
            0,
            0,
            0,
            0
        );


        const dayEnd =
            new Date(current);

        dayEnd.setHours(
            24,
            0,
            0,
            0
        );


        /*
         * Batasi dengan startDate/endDate.
         */

        const effectiveStart =
            startDate > dayStart
                ? startDate
                : dayStart;


        const effectiveEnd =
            endDate < dayEnd
                ? endDate
                : dayEnd;


        if (
            effectiveStart < effectiveEnd
        ) {

            /*
             * =================================
             * CHECK EXCEPTION
             * =================================
             */

            const exception =
                businessCalendarModel
                    .getCalendarException(
                        calendar.id,
                        tanggal
                    );


            /*
             * LIBUR
             */

            if (
                exception &&
                exception.tipe === "LIBUR"
            ) {

                // Tidak ada waktu layanan.

            }


            /*
             * KHUSUS
             */

            else if (
                exception &&
                exception.tipe === "KHUSUS"
            ) {

                if (
                    exception.jam_mulai &&
                    exception.jam_selesai
                ) {

                    const specialStart =
                        createDateWithTime(
                            current,
                            exception.jam_mulai
                        );


                    const specialEnd =
                        createDateWithTime(
                            current,
                            exception.jam_selesai
                        );


                    totalMinutes +=
                        calculateOverlapMinutes(
                            effectiveStart,
                            effectiveEnd,
                            specialStart,
                            specialEnd
                        );

                }

            }


            /*
             * BUSINESS HOURS NORMAL
             */

            else {

                const hoursForDay =
                    businessHours.filter(
                        hour =>
                            hour.hari === hari
                    );


                for (
                    const hour
                    of hoursForDay
                ) {

                    const intervalStart =
                        createDateWithTime(
                            current,
                            hour.jam_mulai
                        );


                    const intervalEnd =
                        createDateWithTime(
                            current,
                            hour.jam_selesai
                        );


                    totalMinutes +=
                        calculateOverlapMinutes(
                            effectiveStart,
                            effectiveEnd,
                            intervalStart,
                            intervalEnd
                        );

                }

            }

        }


        /*
         * Hari berikutnya.
         */

        current.setDate(
            current.getDate() + 1
        );


        current.setHours(
            0,
            0,
            0,
            0
        );

    }


    return totalMinutes;

}

module.exports = {

    isBusinessTime,

    getNextBusinessTime,

    getBusinessMinutes

};

