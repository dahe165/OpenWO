const workorderModel = require("../models/workorder.model");

function getSummary() {

    const workorders = workorderModel.getAll();

    const total = workorders.length;

    const menunggu = workorders.filter(
        wo => wo.status === "Menunggu"
    ).length;

    const ditugaskan = workorders.filter(
        wo => wo.status === "Ditugaskan"
    ).length;

    const diproses = workorders.filter(
        wo => wo.status === "Diproses"
    ).length;

    const selesai = workorders.filter(
        wo => wo.status === "Selesai"
    ).length;

    return {
        total,
        menunggu,
        ditugaskan,
        diproses,
        selesai
    };
}

function getPelaporDashboard(pelaporId) {

    const workorders =
        workorderModel
            .getAll()
            .filter(
                wo =>
                    wo.pelaporId === pelaporId
            );


    const total =
        workorders.length;


    const diproses =
        workorders.filter(
            wo => wo.status === "Diproses"
        ).length;


    const selesai =
        workorders.filter(
            wo => wo.status === "Selesai"
        ).length;


    const menunggu =
        workorders.filter(
            wo => wo.status === "Menunggu"
        ).length;


    const diterima =
        workorders.filter(
            wo => wo.status === "Diterima"
        ).length;


    const ditugaskan =
        workorders.filter(
            wo => wo.status === "Ditugaskan"
        ).length;


    const feed =
        [...workorders]
            .sort(
                (a, b) =>
                    new Date(b.updatedAt) -
                    new Date(a.updatedAt)
            )
            .slice(0, 5);


    return {

        summary: {

            total,

            menunggu,

            diterima,

            ditugaskan,

            diproses,

            selesai

        },

        feed

    };

}

/*
 * =====================================
 * FORMAT TANGGAL LOKAL (WIB)
 * Menghindari bug toISOString() mundur 1 hari
 * =====================================
 */
function formatLocalDate(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getWorkOrderTrend() {
    const workorders =
        workorderModel.getAll();

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const trend = [];

    /*
     * 7 HARI PENUH TERAKHIR
     *
     * Jika hari ini:
     * Selasa 25 Agustus 2026
     *
     * Maka:
     * 18 - 24 Agustus
     *
     * Hari ini (25) TIDAK ikut.
     */

    for (let i = 6; i >= 0; i--) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() - i
        );

        const nextDate =
            new Date(date);

        nextDate.setDate(
            date.getDate() + 1
        );

        const total =
            workorders.filter(
                wo => {

                    const createdAt =
                        new Date(
                            wo.createdAt
                        );

                    return (
                        createdAt >= date &&
                        createdAt < nextDate
                    );
                }
            ).length;

        trend.push({

            date:
                formatLocalDate(date),

            label:
                String(
                    date.getDate()
                ).padStart(2, "0"),

            weekday:
                date.toLocaleDateString(
                    "id-ID",
                    {
                        weekday: "short"
                    }
                ),

            total

        });
    }

    console.log(
        "TREND 7 HARI TERAKHIR:",
        JSON.stringify(
            trend,
            null,
            2
        )
    );

    return trend;
}

function getPreviousWorkOrderTrend() {

    const workorders =
        workorderModel.getAll();

    const today =
        new Date();

    const previousTrend = [];

    /*
     * =====================================
     * 7 HARI SEBELUM 7 HARI TERAKHIR
     *
     * Jika hari ini 23 Agustus:
     *
     * trend sekarang:
     * 17 - 23 Agustus
     *
     * previousTrend:
     * 10 - 16 Agustus
     * =====================================
     */

    for (let i = 13; i >= 7; i--) {

        const date =
            new Date(today);

        date.setHours(
            0,
            0,
            0,
            0
        );

        date.setDate(
            today.getDate() - i
        );


        const nextDate =
            new Date(date);

        nextDate.setDate(
            date.getDate() + 1
        );


        const total =
            workorders.filter(wo => {

                const createdAt =
                    new Date(
                        wo.createdAt
                    );

                return (
                    createdAt >= date &&
                    createdAt < nextDate
                );

            }).length;


        previousTrend.push({

            date:
                formatLocalDate(date),

            label:
                String(
                    date.getDate()
                ).padStart(2, "0"),

            weekday:
                date.toLocaleDateString(
                    "id-ID",
                    {
                        weekday: "short"
                    }
                ),

            total

        });

    }

    console.log(
        "TREND 7 HARI SEBELUMNYA:",
        JSON.stringify(
            previousTrend,
            null,
            2
        )
    );

    return previousTrend;
}

function getCategoryTrend() {

    const workorders = workorderModel.getAll();

    const categories = {};

    workorders.forEach(wo => {

        const kategori = wo.kategori || "Lainnya";

        if (!categories[kategori]) {

            categories[kategori] = {
                kategori,
                total: 0,
                subkategori: {}
            };

        }

        categories[kategori].total++;

        const subkategori =
            wo.subkategori || "Lainnya";

        if (!categories[kategori].subkategori[subkategori]) {

            categories[kategori].subkategori[subkategori] = 0;

        }

        categories[kategori].subkategori[subkategori]++;

    });

    return Object.values(categories);

}

function getTechnicianLoad() {

    const workorders =
        workorderModel.getAll();

    const activeWorkorders =
        workorders.filter(
            wo =>
                wo.teknisiId &&
                (
                    wo.status === "Ditugaskan" ||
                    wo.status === "Diproses"
                )
        );

    const grouped = {};

    activeWorkorders.forEach(wo => {

        const id =
            Number(wo.teknisiId);

        if (!grouped[id]) {

            grouped[id] = {
                teknisiId: id,
                teknisi: wo.teknisi || "Tanpa Nama",
                total: 0
            };

        }

        grouped[id].total++;

    });


    const result =
        Object.values(grouped)
            .sort(
                (a, b) =>
                    b.total - a.total
            );


    const max =
        result.length
            ? result[0].total
            : 0;


    return result.map(item => ({

        ...item,

        percentage:
            max > 0
                ? Math.round(
                    (item.total / max) * 100
                )
                : 0

    }));

}

/*
 * =====================================
 * KPI Comparison
 *
 * 7 hari terakhir
 * VS
 * 7 hari sebelumnya
 *
 * Timezone: Asia/Jakarta (WIB)
 * =====================================
 */
function getKpiComparison() {

    const workorders =
        workorderModel.getAll();

    const WIB =
        "Asia/Jakarta";

    /*
     * =====================================
     * Ambil tanggal hari ini berdasarkan WIB
     * =====================================
     */
    function getWibTodayParts() {

        const now =
            new Date();

        const parts =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: WIB,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }
            ).formatToParts(now);

        const result = {};

        parts.forEach(part => {

            if (
                part.type !== "literal"
            ) {
                result[part.type] =
                    Number(part.value);
            }

        });

        return result;
    }


    /*
     * =====================================
     * Membuat boundary WIB
     *
     * Indonesia WIB = UTC+7
     * =====================================
     */
    function makeWibDate(
        year,
        month,
        day
    ) {

        return new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                -7,
                0,
                0,
                0
            )
        );
    }


    const todayParts =
        getWibTodayParts();


    const today =
        makeWibDate(
            todayParts.year,
            todayParts.month,
            todayParts.day
        );


    /*
     * =====================================
     * Periode sekarang
     *
     * Contoh hari ini 25 Agustus:
     *
     * 19 - 25 Agustus
     * =====================================
     */
    const currentStart =
        new Date(today);

    currentStart.setUTCDate(
        currentStart.getUTCDate() - 6
    );


    const currentEnd =
        new Date(today);

    currentEnd.setUTCDate(
        currentEnd.getUTCDate() + 1
    );


    /*
     * =====================================
     * Periode sebelumnya
     *
     * 12 - 18 Agustus
     * =====================================
     */
    const previousStart =
        new Date(today);

    previousStart.setUTCDate(
        previousStart.getUTCDate() - 13
    );


    const previousEnd =
        new Date(currentStart);


    /*
     * =====================================
     * Hitung perubahan %
     * =====================================
     */
    function calculateChange(
        current,
        previous
    ) {

        if (previous === 0) {

            if (current === 0) {
                return 0;
            }

            return null;
        }

        return (
            (
                (current - previous) /
                previous
            ) * 100
        );
    }


    /*
     * =====================================
     * Ambil WO berdasarkan periode CREATED
     *
     * Dipakai untuk TOTAL WO.
     * =====================================
     */
    function getCreatedInPeriod(
        start,
        end
    ) {

        return workorders.filter(
            wo => {

                const createdAt =
                    new Date(
                        wo.createdAt
                    );

                return (
                    createdAt >= start &&
                    createdAt < end
                );

            }
        );

    }


    /*
     * =====================================
     * Normalisasi status timeline
     *
     * Timeline OpenWO menggunakan:
     * Dikerjakan
     *
     * Sedangkan dashboard menggunakan:
     * Diproses
     * =====================================
     */
    function normalizeStatus(
        status
    ) {

        switch (status) {

            case "Dibuat":
                return "Menunggu";

            case "Menunggu":
                return "Menunggu";

            case "Diterima":
                return "Diterima";

            case "Ditugaskan":
                return "Ditugaskan";

            case "Dikerjakan":
                return "Diproses";

            case "Diproses":
                return "Diproses";

            case "Selesai":
                return "Selesai";

            /*
             * Setelah masuk proses verifikasi,
             * jangan lagi dihitung sebagai
             * Selesai untuk KPI dashboard.
             */
            case "Verifikasi Asman":
                return null;

            case "Menunggu Verifikasi Manager":
                return null;

            case "Verifikasi Manager":
                return null;

            case "Ditutup":
                return null;

            default:
                return null;
        }

    }


    /*
     * =====================================
     * Tentukan status WO pada suatu waktu
     * =====================================
     */
    function getStatusAt(
        wo,
        cutoff
    ) {

        const createdAt =
            new Date(
                wo.createdAt
            );

        /*
         * WO belum ada pada waktu tersebut.
         */
        if (
            createdAt > cutoff
        ) {
            return null;
        }


        const timeline =
            Array.isArray(
                wo.timeline
            )
                ? wo.timeline
                : [];


        let latestEvent =
            null;


        for (
            const event
            of timeline
        ) {

            const eventDate =
                new Date(
                    event.tanggal
                );

            if (
                eventDate <= cutoff
            ) {

                if (
                    !latestEvent ||
                    eventDate >
                    new Date(
                        latestEvent.tanggal
                    )
                ) {

                    latestEvent =
                        event;

                }

            }

        }


        /*
         * Jika timeline tidak ditemukan,
         * jangan menebak status historis.
         */
        if (!latestEvent) {
            return null;
        }


        return normalizeStatus(
            latestEvent.status
        );

    }


    /*
     * =====================================
     * Snapshot status pada satu waktu
     * =====================================
     */
    function getStatusSnapshot(
        cutoff
    ) {

        const snapshot = {

            menunggu: 0,

            diproses: 0,

            selesai: 0

        };


        workorders.forEach(
            wo => {

                const status =
                    getStatusAt(
                        wo,
                        cutoff
                    );


                if (
                    status ===
                    "Menunggu"
                ) {

                    snapshot.menunggu++;

                }


                if (
                    status ===
                    "Diproses"
                ) {

                    snapshot.diproses++;

                }


                if (
                    status ===
                    "Selesai"
                ) {

                    snapshot.selesai++;

                }

            }
        );


        return snapshot;

    }


    /*
     * =====================================
     * Metric status
     * =====================================
     */
    function buildMetric(
        current,
        previous
    ) {

        const change =
            calculateChange(
                current,
                previous
            );


        let direction =
            "same";


        if (
            change !== null
        ) {

            if (
                change > 0
            ) {

                direction =
                    "up";

            } else if (
                change < 0
            ) {

                direction =
                    "down";

            }

        } else if (
            current > 0
        ) {

            direction =
                "up";

        }


        return {

            current,

            previous,

            change,

            direction

        };

    }


    /*
     * =====================================
     * Sparkline status
     *
     * 7 titik:
     * 6 hari penuh + hari ini sampai sekarang
     * =====================================
     */
    function getStatusTrend(
        statusKey
    ) {

        const result = [];


        for (
            let i = 6;
            i >= 0;
            i--
        ) {

            const dayStart =
                new Date(today);


            dayStart.setUTCDate(
                dayStart.getUTCDate() - i
            );


            const dayEnd =
                new Date(dayStart);


            dayEnd.setUTCDate(
                dayEnd.getUTCDate() + 1
            );


            /*
             * Hari ini belum selesai.
             *
             * Jadi snapshot memakai
             * kondisi saat ini.
             */
            const isToday =
                i === 0;


            const cutoff =
                isToday
                    ? new Date()
                    : new Date(
                        dayEnd.getTime() - 1
                    );


            const snapshot =
                getStatusSnapshot(
                    cutoff
                );


            result.push({
                date:
                    formatLocalDate(dayStart),

                total:
                    snapshot[statusKey]
            });

        }


        return result;

    }

    /*
    * =====================================
    * Sparkline TOTAL WO
    *
    * Jumlah WO yang dibuat per hari.
    * 7 hari terakhir, termasuk hari ini.
    * =====================================
    */
    function getCreatedTrend() {

        const result = [];

        for (
            let i = 6;
            i >= 0;
            i--
        ) {

            const dayStart =
                new Date(today);

            dayStart.setUTCDate(
                dayStart.getUTCDate() - i
            );

            const dayEnd =
                new Date(dayStart);

            dayEnd.setUTCDate(
                dayEnd.getUTCDate() + 1
            );

            const daily =
                getCreatedInPeriod(
                    dayStart,
                    dayEnd
                );

            result.push({
                date:
                    formatLocalDate(dayStart),

                total:
                    daily.length
            });

        }

        return result;

    }

    /*
     * =====================================
     * TOTAL WO
     *
     * Perbandingan jumlah WO yang dibuat
     * selama masing-masing periode.
     * =====================================
     */
    const currentCreated =
        getCreatedInPeriod(
            currentStart,
            currentEnd
        );


    const previousCreated =
        getCreatedInPeriod(
            previousStart,
            previousEnd
        );


    const totalChange =
        calculateChange(
            currentCreated.length,
            previousCreated.length
        );


    const total = {

        current:
            currentCreated.length,

        previous:
            previousCreated.length,

        change:
            totalChange,

        direction:
            totalChange === null
                ? "up"
                : totalChange > 0
                    ? "up"
                    : totalChange < 0
                        ? "down"
                        : "same",

        trend:
            getCreatedTrend()

    };


    /*
     * =====================================
     * SNAPSHOT STATUS
     *
     * Current:
     * kondisi saat ini
     *
     * Previous:
     * kondisi pada akhir periode sebelumnya
     * =====================================
     */
    const currentSnapshot =
        getStatusSnapshot(
            new Date()
        );


    const previousSnapshot =
        getStatusSnapshot(
            new Date(
                previousEnd.getTime() - 1
            )
        );


    const menunggu =
        buildMetric(
            currentSnapshot.menunggu,
            previousSnapshot.menunggu
        );


    menunggu.trend =
        getStatusTrend(
            "menunggu"
        );


    const diproses =
        buildMetric(
            currentSnapshot.diproses,
            previousSnapshot.diproses
        );


    diproses.trend =
        getStatusTrend(
            "diproses"
        );


    const selesai =
        buildMetric(
            currentSnapshot.selesai,
            previousSnapshot.selesai
        );


    selesai.trend =
        getStatusTrend(
            "selesai"
        );


    /*
     * =====================================
     * DEBUG
     * =====================================
     */
    console.log(
        "KPI COMPARISON:",
        JSON.stringify(
            {
                period: {
                    currentStart,
                    currentEnd,
                    previousStart,
                    previousEnd
                },

                total,

                menunggu,

                diproses,

                selesai

            },
            null,
            2
        )
    );


    return {

        period: {

            currentStart,

            currentEnd,

            previousStart,

            previousEnd

        },

        total,

        menunggu,

        diproses,

        selesai

    };

}

module.exports = {
    getSummary,
    getWorkOrderTrend,
    getPreviousWorkOrderTrend,
    getCategoryTrend,
    getPelaporDashboard,
    getKpiComparison,
    getTechnicianLoad
};