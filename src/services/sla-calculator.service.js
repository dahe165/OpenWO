const businessCalendarService =
    require("./business-calendar.service");

const slaEventService =
    require("./sla-event.service");


/*
 * =====================================
 * SLA CALCULATOR SERVICE
 * =====================================
 *
 * Read-only.
 *
 * Tugas:
 * - Membaca SLA events
 * - Menghitung Response Time
 * - Menghitung Resolution Time
 * - Menghitung Waiting Time
 * - Menghitung SLA elapsed
 * - Menentukan status PAUSED / RUNNING / COMPLETED
 *
 * Tidak mengubah database.
 */


/*
 * =====================================
 * EVENT HELPERS
 * =====================================
 */

function getEventDate(event) {

    if (!event || !event.occurred_at) {
        return null;
    }

    const date =
        new Date(event.occurred_at);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;

}


/*
 * =====================================
 * CALCULATE RESPONSE
 * =====================================
 *
 * CREATED
 *    ↓
 * ACCEPTED
 *
 * Response SLA berhenti
 * ketika ACCEPTED terjadi.
 */

function calculateResponse(
    events
) {

    let startDate = null;
    let endDate = null;

    for (const event of events) {

        const date =
            getEventDate(event);

        if (!date) {
            continue;
        }


        if (
            event.event ===
            slaEventService.SLA_EVENTS.CREATED
        ) {

            if (!startDate) {
                startDate = date;
            }

            continue;
        }


        if (
            event.event ===
            slaEventService.SLA_EVENTS.ACCEPTED
        ) {

            if (startDate) {
                endDate = date;
            }

            break;
        }

    }


    if (!startDate) {

        return {
            started: false,
            completed: false,
            elapsedMinutes: 0,
            startDate: null,
            endDate: null
        };

    }


    /*
     * Jika belum ACCEPTED,
     * hitung sampai sekarang.
     */

    const calculationEnd =
        endDate || new Date();


    const elapsedMinutes =
        businessCalendarService
            .getBusinessMinutes(
                startDate,
                calculationEnd
            );


    return {

        started: true,

        completed:
            Boolean(endDate),

        elapsedMinutes,

        startDate,

        endDate

    };

}


/*
 * =====================================
 * CALCULATE RESOLUTION
 * =====================================
 *
 * ASSIGNED / STARTED
 *        ↓
 * WAITING_STARTED
 *        ↓
 * WAITING_ENDED
 *        ↓
 * COMPLETED
 *
 * Waiting tidak dihitung
 * sebagai Resolution Time.
 */

function calculateResolution(
    events
) {

    let resolutionStarted = false;

    let activeStart = null;

    let completedDate = null;

    let waitingStart = null;

    let waitingMinutes = 0;

    let resolutionMinutes = 0;


    for (const event of events) {

        const date =
            getEventDate(event);

        if (!date) {
            continue;
        }


        /*
         * =================================
         * RESOLUTION START
         * =================================
         */

        if (
            event.event ===
            slaEventService.SLA_EVENTS.ASSIGNED
        ) {

            if (!resolutionStarted) {

                resolutionStarted = true;

                activeStart = date;

            }

            continue;
        }


        if (
            event.event ===
            slaEventService.SLA_EVENTS.STARTED
        ) {

            if (!resolutionStarted) {

                resolutionStarted = true;

                activeStart = date;

            }

            continue;
        }


        /*
         * =================================
         * WAITING START
         * =================================
         */

        if (
            event.event ===
            slaEventService.SLA_EVENTS.WAITING_STARTED
        ) {

            if (
                resolutionStarted &&
                activeStart &&
                !waitingStart
            ) {

                resolutionMinutes +=
                    businessCalendarService
                        .getBusinessMinutes(
                            activeStart,
                            date
                        );

                waitingStart = date;

                activeStart = null;

            }

            continue;
        }


        /*
         * =================================
         * WAITING END
         * =================================
         */

        if (
            event.event ===
            slaEventService.SLA_EVENTS.WAITING_ENDED
        ) {

            if (waitingStart) {

                waitingMinutes +=
                    businessCalendarService
                        .getBusinessMinutes(
                            waitingStart,
                            date
                        );

                waitingStart = null;

                /*
                 * SLA Resolution berjalan
                 * kembali dari waktu Resume.
                 */

                activeStart = date;

            }

            continue;
        }


        /*
         * =================================
         * COMPLETED
         * =================================
         */

        if (
            event.event ===
            slaEventService.SLA_EVENTS.COMPLETED
        ) {

            completedDate = date;


            /*
             * Jika sedang Waiting ketika
             * COMPLETED terjadi, tidak ada
             * waktu aktif tambahan.
             */

            if (activeStart) {

                resolutionMinutes +=
                    businessCalendarService
                        .getBusinessMinutes(
                            activeStart,
                            date
                        );

                activeStart = null;

            }


            /*
             * Waiting aktif sampai COMPLETED
             * tetap dihitung sebagai Waiting.
             */

            if (waitingStart) {

                waitingMinutes +=
                    businessCalendarService
                        .getBusinessMinutes(
                            waitingStart,
                            date
                        );

                waitingStart = null;

            }

            break;
        }

    }


    /*
     * =================================
     * ACTIVE / RUNNING
     * =================================
     */

    if (
        resolutionStarted &&
        !completedDate
    ) {

        const now =
            new Date();


        /*
         * Masih Waiting.
         */

        if (waitingStart) {

            waitingMinutes +=
                businessCalendarService
                    .getBusinessMinutes(
                        waitingStart,
                        now
                    );

        }


        /*
         * Masih aktif mengerjakan.
         */

        else if (activeStart) {

            resolutionMinutes +=
                businessCalendarService
                    .getBusinessMinutes(
                        activeStart,
                        now
                    );

        }

    }


    let status = "NOT_STARTED";


    if (resolutionStarted) {

        if (completedDate) {

            status = "COMPLETED";

        }

        else if (waitingStart) {

            status = "PAUSED";

        }

        else {

            status = "RUNNING";

        }

    }


    return {

        started:
            resolutionStarted,

        completed:
            Boolean(completedDate),

        paused:
            Boolean(waitingStart),

        status,

        resolutionMinutes,

        waitingMinutes,

        startDate:
            resolutionStarted
                ? events.find(
                    event =>
                        event.event ===
                            slaEventService.SLA_EVENTS.ASSIGNED ||
                        event.event ===
                            slaEventService.SLA_EVENTS.STARTED
                )?.occurred_at || null
                : null,

        completedDate:
            completedDate
                ? completedDate
                : null

    };

}


/*
 * =====================================
 * SLA RESULT
 * =====================================
 */

function calculateSla(
    workOrderId,
    {
        responseTargetMinutes = null,
        resolutionTargetMinutes = null
    } = {}
) {

    if (!workOrderId) {

        throw new Error(
            "workOrderId wajib diisi."
        );

    }


    /*
     * Ambil event.
     */

    const events =
        slaEventService
            .getEventsByWorkOrderId(
                workOrderId
            );


    /*
     * Hitung Response.
     */

    const response =
        calculateResponse(
            events
        );


    /*
     * Hitung Resolution.
     */

    const resolution =
        calculateResolution(
            events
        );


    /*
     * =================================
     * RESPONSE SLA STATUS
     * =================================
     */

    let responseStatus =
        "NOT_STARTED";


    if (response.started) {

        if (
            responseTargetMinutes !== null &&
            response.elapsedMinutes >
                responseTargetMinutes
        ) {

            responseStatus = "BREACHED";

        }

        else if (
            response.completed
        ) {

            responseStatus = "MET";

        }

        else {

            responseStatus = "RUNNING";

        }

    }


    /*
     * =================================
     * RESOLUTION SLA STATUS
     * =================================
     */

    let resolutionStatus =
        "NOT_STARTED";


    if (resolution.started) {

        if (
            resolutionStatus !== "BREACHED" &&
            resolutionTargetMinutes !== null &&
            resolution.resolutionMinutes >
                resolutionTargetMinutes
        ) {

            resolutionStatus =
                "BREACHED";

        }

        else if (
            resolution.completed
        ) {

            resolutionStatus =
                resolutionTargetMinutes !== null &&
                resolution.resolutionMinutes <=
                    resolutionTargetMinutes
                    ? "MET"
                    : "BREACHED";

        }

        else if (
            resolution.paused
        ) {

            resolutionStatus =
                "PAUSED";

        }

        else {

            resolutionStatus =
                "RUNNING";

        }

    }


    /*
     * =================================
     * FINAL RESULT
     * =================================
     */

    return {

        workOrderId,

        response: {

            targetMinutes:
                responseTargetMinutes,

            elapsedMinutes:
                response.elapsedMinutes,

            remainingMinutes:
                responseTargetMinutes === null
                    ? null
                    : Math.max(
                        0,
                        responseTargetMinutes -
                        response.elapsedMinutes
                    ),

            status:
                responseStatus,

            started:
                response.started,

            completed:
                response.completed,

            startDate:
                response.startDate,

            endDate:
                response.endDate

        },


        resolution: {

            targetMinutes:
                resolutionTargetMinutes,

            elapsedMinutes:
                resolution.resolutionMinutes,

            waitingMinutes:
                resolution.waitingMinutes,

            remainingMinutes:
                resolutionTargetMinutes === null
                    ? null
                    : Math.max(
                        0,
                        resolutionTargetMinutes -
                        resolution.resolutionMinutes
                    ),

            status:
                resolutionStatus,

            started:
                resolution.started,

            completed:
                resolution.completed,

            paused:
                resolution.paused,

            startDate:
                resolution.startDate,

            completedDate:
                resolution.completedDate

        },


        eventsCount:
            events.length

    };

}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {

    calculateSla,

    calculateResponse,

    calculateResolution

};