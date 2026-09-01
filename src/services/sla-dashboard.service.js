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
 * EXPORT
 * ==========================================
 */

module.exports = {

    getSlaHealth,

    classifyResolutionSla

};