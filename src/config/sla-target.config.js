/*
 * ==========================================
 * SLA TARGET CONFIGURATION
 * ==========================================
 *
 * TEMPORARY CONFIGURATION
 *
 * Tempat ini sengaja dipisahkan agar target SLA
 * tidak hardcode di dashboard / controller.
 *
 * Nanti ketika Master SLA sudah tersedia,
 * sumber data dapat diganti tanpa mengubah
 * SLA Calculator dan SLA Dashboard.
 */

const SLA_TARGET = {

    responseTargetMinutes: 60,

    resolutionTargetMinutes: 180

};


module.exports = SLA_TARGET;