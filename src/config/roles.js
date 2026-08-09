const roles = {

    pelapor: {
        name: "Pelapor",

        permissions: [
            "workorder.create",
            "workorder.view_own"
        ]
    },


    teknisi: {
        name: "Teknisi",

        permissions: [
            "workorder.view_assigned",
            "workorder.process",
            "workorder.update_status"
        ]
    },


    asman: {
        name: "Asman",

        permissions: [
            "workorder.view_all",
            "workorder.assign",
            "workorder.monitor",
            "report.operational"
        ]
    },


    manager: {
        name: "Manager",

        permissions: [
            "workorder.view_all",
            "workorder.monitor",
            "report.operational",
            "report.management"
        ]
    }

};


module.exports = roles;