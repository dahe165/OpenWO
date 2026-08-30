const db =
    require("../config/database");


/*
 * =====================================
 * SLA EVENT DEFINITIONS
 * =====================================
 */

const SLA_EVENTS = {

    CREATED:
        "CREATED",

    ACCEPTED:
        "ACCEPTED",

    ASSIGNED:
        "ASSIGNED",

    STARTED:
        "STARTED",

    WAITING_STARTED:
        "WAITING_STARTED",

    WAITING_ENDED:
        "WAITING_ENDED",

    COMPLETED:
        "COMPLETED",

    VERIFIED_ASMAN:
        "VERIFIED_ASMAN",

    ESCALATED_MANAGER:
        "ESCALATED_MANAGER",

    VERIFIED_MANAGER:
        "VERIFIED_MANAGER",

    CLOSED:
        "CLOSED"

};


/*
 * =====================================
 * SLA EVENT ACTION MAP
 * =====================================
 */

const SLA_ACTIONS = {

    CREATED: {
        response: "START"
    },

    ACCEPTED: {
        response: "STOP"
    },

    ASSIGNED: {
        resolution: "START"
    },

    STARTED: {
        resolution: "START"
    },

    WAITING_STARTED: {
        resolution: "PAUSE",
        waiting: "START"
    },

    WAITING_ENDED: {
        resolution: "RESUME",
        waiting: "STOP"
    },

    COMPLETED: {
        resolution: "STOP",
        waiting: "STOP"
    },

    VERIFIED_ASMAN: {},

    ESCALATED_MANAGER: {},

    VERIFIED_MANAGER: {},

    CLOSED: {}

};


/*
 * =====================================
 * GET SLA ACTION
 * =====================================
 */

function getSlaAction(event) {

    if (!event) {

        return {};

    }

    return SLA_ACTIONS[event] || {};

}


/*
 * =====================================
 * RECORD SLA EVENT
 * =====================================
 */

function recordEvent({

    workOrderId,

    event,

    userId = null,

    reason = null,

    metadata = null,

    occurredAt = new Date()

}) {

    if (!workOrderId) {

        throw new Error(
            "workOrderId wajib diisi."
        );

    }

    if (!event) {

        throw new Error(
            "event wajib diisi."
        );

    }

    const occurredAtValue =
        occurredAt instanceof Date
            ? occurredAt.toISOString()
            : occurredAt;


    const createdAt =
        new Date().toISOString();


    const metadataValue =
        metadata
            ? JSON.stringify(metadata)
            : null;


    const result =
        db.prepare(`
            INSERT INTO work_order_sla_events (

                work_order_id,
                event,
                user_id,
                reason,
                metadata,
                occurred_at,
                created_at

            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(

            workOrderId,
            event,
            userId,
            reason,
            metadataValue,
            occurredAtValue,
            createdAt

        );


    return {

        id: result.lastInsertRowid,

        workOrderId,

        event,

        userId,

        reason,

        metadata,

        occurredAt: occurredAtValue,

        createdAt

    };

}


/*
 * =====================================
 * GET EVENTS BY WORK ORDER
 * =====================================
 */

function getEventsByWorkOrderId(workOrderId) {

    return db.prepare(`
        SELECT
            id,
            work_order_id,
            event,
            user_id,
            reason,
            metadata,
            occurred_at,
            created_at

        FROM work_order_sla_events

        WHERE work_order_id = ?

        ORDER BY occurred_at ASC, id ASC
    `).all(workOrderId);

}


module.exports = {

    SLA_EVENTS,

    getSlaAction,

    recordEvent,

    getEventsByWorkOrderId

};