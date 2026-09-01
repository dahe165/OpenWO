const WORKFLOW = {

    Menunggu: [
        "Diterima"
    ],

    Diterima: [
        "Ditugaskan"
    ],

    Ditugaskan: [
        "Diproses"
    ],

    Diproses: [
        "Waiting",
        "Selesai"
    ],

    Waiting: [
    "Diproses"
],

    Selesai: [
        "Verifikasi Asman"
    ],

    "Verifikasi Asman": [
        "Ditutup",
        "Menunggu Verifikasi Manager"
    ],

    "Menunggu Verifikasi Manager": [
        "Verifikasi Manager"
    ],

    "Verifikasi Manager": [
        "Ditutup"
    ],

    Ditutup: []

};


function canTransition(
    currentStatus,
    nextStatus
) {

    const allowed =
        WORKFLOW[currentStatus] || [];

    return allowed.includes(
        nextStatus
    );

}


module.exports = {
    WORKFLOW,
    canTransition
};