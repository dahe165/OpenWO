/*
 * ==========================================
 * SLA DASHBOARD SERVICE
 * ==========================================
 *
 * Tugas:
 * - Mengambil Work Order
 * - Menghitung SLA melalui SLA Calculator
 * - Mengagregasi Resolution SLA
 * - Menghasilkan data untuk SLA Health Gauge
 *
 * CATATAN:
 * Target SLA sementara berasal dari
 * sla-target.config.js
 *
 * Jangan melakukan kalkulasi SLA baru di sini.
 * SLA Calculator tetap menjadi sumber perhitungan.
 */

const workOrderModel =
    require("../models/workorder.model");

const slaCalculator =
    require("./sla-calculator.service");

const slaTarget =
    require("../config/sla-target.config");


/*
 * ==========================================
 * WARNING THRESHOLD
 * ==========================================
 *
 * <= 75% target  = ON TRACK
 * > 75% - <=100% = WARNING
 * > 100%         = BREACH
 */

const WARNING_THRESHOLD = 0.75;


/*
 * ==========================================
 * CLASSIFY RESOLUTION SLA
 * ==========================================
 */

function classifyResolutionSla(result) {

    const resolution =
        result.resolution;

    /*
     * Belum mulai.
     *
     * Belum kita masukkan sebagai
     * On Track / Warning / Breach.
     */

    if (!resolution.started) {

        return "NOT_STARTED";

    }


    /*
     * Jika target tidak tersedia,
     * jangan membuat status palsu.
     */

    if (
        resolution.targetMinutes === null ||
        resolution.targetMinutes === undefined ||
        resolution.targetMinutes <= 0
    ) {

        return "NO_TARGET";

    }


    /*
     * Breach berdasarkan hasil calculator.
     */

    if (
        resolution.status === "BREACHED"
    ) {

        return "BREACH";

    }


    /*
     * Hitung pemakaian SLA.
     */

    const usage =
        resolution.elapsedMinutes /
        resolution.targetMinutes;


    /*
     * Sudah melewati 75% target.
     */

    if (
        usage > WARNING_THRESHOLD
    ) {

        return "WARNING";

    }


    /*
     * Masih aman.
     */

    return "ON_TRACK";

}


/*
 * ==========================================
 * GET SLA HEALTH
 * ==========================================
 */

function getSlaHealth() {

    /*
     * Ambil seluruh WO.
     */

    const workOrders =
        workOrderModel.getAll();


    const result = {

        total: 0,

        onTrack: 0,

        warning: 0,

        breach: 0,

        notStarted: 0,

        noTarget: 0

    };


    /*
     * Pastikan data berupa array.
     */

    if (
        !Array.isArray(workOrders)
    ) {

        return result;

    }


    /*
     * Hitung setiap WO.
     */

    for (
        const workOrder
        of workOrders
    ) {

        if (
            !workOrder ||
            !workOrder.id
        ) {

            continue;

        }


        let slaResult;


        try {

            slaResult =
                slaCalculator.calculateSla(
                    workOrder.id,
                    {
                        responseTargetMinutes:
                            slaTarget.responseTargetMinutes,

                        resolutionTargetMinutes:
                            slaTarget.resolutionTargetMinutes
                    }
                );

        }

        catch (error) {

            /*
             * Satu WO bermasalah tidak boleh
             * membuat Dashboard gagal total.
             */

            console.error(
                `[SLA DASHBOARD] Gagal menghitung SLA WO ${workOrder.id}:`,
                error.message
            );

            continue;

        }


        const status =
            classifyResolutionSla(
                slaResult
            );


        switch (status) {

            case "ON_TRACK":

                result.onTrack++;

                break;


            case "WARNING":

                result.warning++;

                break;


            case "BREACH":

                result.breach++;

                break;


            case "NOT_STARTED":

                result.notStarted++;

                break;


            case "NO_TARGET":

                result.noTarget++;

                break;

        }

    }


    /*
     * Total SLA Health hanya menghitung WO
     * yang sudah memiliki Resolution SLA.
     *
     * WO belum mulai / tanpa target tidak
     * dimasukkan ke denominator.
     */

    result.total =
        result.onTrack +
        result.warning +
        result.breach;


    return result;

}

/*
 * ==========================================
 * GET SLA OVERVIEW
 * ==========================================
 *
 * Menghasilkan data detail untuk
 * halaman SLA Monitoring.
 *
 * Catatan:
 * - Tidak menghitung SLA sendiri.
 * - SLA Calculator tetap menjadi sumber.
 * - Response menggunakan status dari Calculator.
 * - Resolution menggunakan classifyResolutionSla().
 */

function getSlaOverview() {

    const workOrders =
        workOrderModel.getAll();


    const result = {

        response: {
            total: 0,
            met: 0,
            running: 0,
            breach: 0,
            notStarted: 0
        },

        resolution: {
            total: 0,
            onTrack: 0,
            warning: 0,
            breach: 0,
            notStarted: 0,
            noTarget: 0
        },

        waiting: {
            totalMinutes: 0,
            workOrders: 0,
            averageMinutes: 0
        }

    };


    if (!Array.isArray(workOrders)) {
        return result;
    }


    let waitingWorkOrderCount = 0;


    for (const workOrder of workOrders) {

        if (
            !workOrder ||
            !workOrder.id
        ) {
            continue;
        }


        let slaResult;


        try {

            slaResult =
                slaCalculator.calculateSla(
                    workOrder.id,
                    {
                        responseTargetMinutes:
                            slaTarget.responseTargetMinutes,

                        resolutionTargetMinutes:
                            slaTarget.resolutionTargetMinutes
                    }
                );

        }
        catch (error) {

            console.error(
                `[SLA OVERVIEW] Gagal menghitung SLA WO ${workOrder.id}:`,
                error.message
            );

            continue;

        }


        /*
         * =================================
         * RESPONSE SLA
         * =================================
         */

        switch (slaResult.response.status) {

            case "MET":

                result.response.met++;

                break;


            case "RUNNING":

                result.response.running++;

                break;


            case "BREACHED":

                result.response.breach++;

                break;


            case "NOT_STARTED":

                result.response.notStarted++;

                break;

        }


        /*
         * =================================
         * RESOLUTION SLA
         * =================================
         */

        const resolutionStatus =
            classifyResolutionSla(
                slaResult
            );


        switch (resolutionStatus) {

            case "ON_TRACK":

                result.resolution.onTrack++;

                break;


            case "WARNING":

                result.resolution.warning++;

                break;


            case "BREACH":

                result.resolution.breach++;

                break;


            case "NOT_STARTED":

                result.resolution.notStarted++;

                break;


            case "NO_TARGET":

                result.resolution.noTarget++;

                break;

        }


        /*
         * =================================
         * WAITING
         * =================================
         */

        const waitingMinutes =
            Number(
                slaResult.resolution.waitingMinutes
            ) || 0;


        if (waitingMinutes > 0) {

            result.waiting.totalMinutes +=
                waitingMinutes;

            waitingWorkOrderCount++;

        }

    }


    /*
     * =================================
     * TOTAL RESPONSE
     * =================================
     */

    result.response.total =
        result.response.met +
        result.response.running +
        result.response.breach +
        result.response.notStarted;


    /*
     * =================================
     * TOTAL RESOLUTION
     * =================================
     */

    result.resolution.total =
        result.resolution.onTrack +
        result.resolution.warning +
        result.resolution.breach;


    /*
     * =================================
     * WAITING SUMMARY
     * =================================
     */

    result.waiting.workOrders =
        waitingWorkOrderCount;


    if (waitingWorkOrderCount > 0) {

        result.waiting.averageMinutes =
            result.waiting.totalMinutes /
            waitingWorkOrderCount;

    }


    return result;

}

/*
 * ==========================================
 * GET SLA TREND
 * ==========================================
 *
 * Menampilkan hasil Resolution SLA
 * berdasarkan Work Order yang selesai
 * pada masing-masing hari.
 *
 * Periode:
 * 7 hari penuh terakhir.
 *
 * Hari ini tidak ikut, agar setiap titik
 * mewakili satu hari yang sudah lengkap.
 *
 * SLA Calculator tetap menjadi sumber
 * perhitungan SLA.
 */

function getSlaTrend() {

    const workOrders =
        workOrderModel.getAll();

    const result = [];

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    /*
     * =====================================
     * 7 HARI PENUH TERAKHIR
     *
     * Jika hari ini 2 September:
     *
     * 26 Agustus
     * sampai
     * 1 September
     *
     * Hari ini tidak ikut.
     * =====================================
     */

    for (
        let i = 7;
        i >= 1;
        i--
    ) {

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


        const daily = {

            date:
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,

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

            onTrack: 0,

            warning: 0,

            breach: 0,

            total: 0

        };


        /*
         * =================================
         * HITUNG WO SELESAI PADA HARI INI
         * =================================
         */

        if (
            Array.isArray(workOrders)
        ) {

            for (
                const workOrder
                of workOrders
            ) {

                if (
                    !workOrder ||
                    !workOrder.id
                ) {
                    continue;
                }


                let slaResult;


                try {

                    slaResult =
                        slaCalculator.calculateSla(
                            workOrder.id,
                            {
                                responseTargetMinutes:
                                    slaTarget.responseTargetMinutes,

                                resolutionTargetMinutes:
                                    slaTarget.resolutionTargetMinutes
                            }
                        );

                }

                catch (error) {

                    console.error(
                        `[SLA TREND] Gagal menghitung SLA WO ${workOrder.id}:`,
                        error.message
                    );

                    continue;

                }


                const completedDate =
                    slaResult
                        ?.resolution
                        ?.completedDate;


                /*
                 * Belum selesai → bukan bagian
                 * dari trend completed harian.
                 */

                if (!completedDate) {
                    continue;
                }


                const completed =
                    new Date(
                        completedDate
                    );


                if (
                    completed < date ||
                    completed >= nextDate
                ) {
                    continue;
                }


                const status =
                    classifyResolutionSla(
                        slaResult
                    );


                switch (status) {

                    case "ON_TRACK":

                        daily.onTrack++;

                        break;


                    case "WARNING":

                        daily.warning++;

                        break;


                    case "BREACH":

                        daily.breach++;

                        break;

                }

            }

        }


        daily.total =
            daily.onTrack +
            daily.warning +
            daily.breach;


        result.push(
            daily
        );

    }


    return result;

}

/*
 * ==========================================
 * GET TECHNICIAN PERFORMANCE
 * ==========================================
 *
 * Performa Resolution SLA berdasarkan
 * Work Order yang sudah selesai.
 *
 * Hanya WO dengan teknisi yang ditugaskan
 * dan Resolution SLA yang sudah completed
 * yang dihitung.
 *
 * SLA Calculator tetap menjadi sumber
 * perhitungan SLA.
 */

function getTechnicianPerformance() {

    const workOrders =
        workOrderModel.getAll();


    const grouped = {};


    if (!Array.isArray(workOrders)) {

        return [];

    }


    /*
     * =====================================
     * HITUNG SETIAP WORK ORDER
     * =====================================
     */

    for (
        const workOrder
        of workOrders
    ) {

        if (
            !workOrder ||
            !workOrder.id ||
            !workOrder.teknisiId
        ) {

            continue;

        }


        let slaResult;


        try {

            slaResult =
                slaCalculator.calculateSla(
                    workOrder.id,
                    {
                        responseTargetMinutes:
                            slaTarget.responseTargetMinutes,

                        resolutionTargetMinutes:
                            slaTarget.resolutionTargetMinutes
                    }
                );

        }

        catch (error) {

            console.error(
                `[SLA TECHNICIAN] Gagal menghitung SLA WO ${workOrder.id}:`,
                error.message
            );

            continue;

        }


        const resolution =
            slaResult?.resolution;


        /*
         * Hanya WO yang sudah selesai.
         */

        if (
            !resolution ||
            !resolution.completed ||
            !resolution.completedDate
        ) {

            continue;

        }


        const status =
            classifyResolutionSla(
                slaResult
            );


        /*
         * Jangan masukkan WO tanpa
         * target SLA ke performance.
         */

        if (
            status === "NO_TARGET" ||
            status === "NOT_STARTED"
        ) {

            continue;

        }


        const technicianId =
            Number(
                workOrder.teknisiId
            );


        if (!technicianId) {

            continue;

        }


        /*
         * =================================
         * BUAT GROUP TEKNISI
         * =================================
         */

        if (
            !grouped[technicianId]
        ) {

            grouped[technicianId] = {

                teknisiId:
                    technicianId,

                teknisi:
                    workOrder.teknisi ||
                    "Tanpa Nama",

                total: 0,

                onTrack: 0,

                warning: 0,

                breach: 0,

                totalResolutionMinutes: 0,

                totalWaitingMinutes: 0

            };

        }


        const item =
            grouped[technicianId];


        item.total++;


        /*
         * =================================
         * SLA STATUS
         * =================================
         */

        switch (status) {

            case "ON_TRACK":

                item.onTrack++;

                break;


            case "WARNING":

                item.warning++;

                break;


            case "BREACH":

                item.breach++;

                break;

        }


        /*
         * =================================
         * RESOLUTION TIME
         * =================================
         */

        item.totalResolutionMinutes +=
            Number(
                resolution.elapsedMinutes
            ) || 0;


        /*
         * =================================
         * WAITING TIME
         * =================================
         */

        item.totalWaitingMinutes +=
            Number(
                resolution.waitingMinutes
            ) || 0;

    }


    /*
     * =====================================
     * BENTUKKAN HASIL AKHIR
     * =====================================
     */

    return Object.values(
        grouped
    )
    .map(item => {

        const slaCompleted =
            item.onTrack +
            item.warning +
            item.breach;


        const compliance =
            slaCompleted > 0
                ? Math.round(
                    (
                        item.onTrack /
                        slaCompleted
                    ) * 100
                )
                : 0;


        const averageResolutionMinutes =
            item.total > 0
                ? item.totalResolutionMinutes /
                  item.total
                : 0;


        const averageWaitingMinutes =
            item.total > 0
                ? item.totalWaitingMinutes /
                  item.total
                : 0;


        return {

            teknisiId:
                item.teknisiId,

            teknisi:
                item.teknisi,

            total:
                item.total,

            onTrack:
                item.onTrack,

            warning:
                item.warning,

            breach:
                item.breach,

            compliance,

            averageResolutionMinutes:
                Math.round(
                    averageResolutionMinutes *
                    10
                ) / 10,

            averageWaitingMinutes:
                Math.round(
                    averageWaitingMinutes *
                    10
                ) / 10

        };

    })
    .sort(
        (a, b) => {

            /*
             * Prioritas utama:
             * SLA Compliance tertinggi.
             *
             * Jika sama:
             * total WO terbanyak.
             */

            if (
                b.compliance !==
                a.compliance
            ) {

                return (
                    b.compliance -
                    a.compliance
                );

            }


            return (
                b.total -
                a.total
            );

        }
    );

}


/*
 * ==========================================
 * EXPORT
 * ==========================================
 */

module.exports = {

    getSlaHealth,

    getSlaOverview,

    getSlaTrend,

    getTechnicianPerformance,

    classifyResolutionSla

};