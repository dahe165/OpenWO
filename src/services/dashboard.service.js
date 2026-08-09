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

function getWorkOrderTrend() {

    const workorders = workorderModel.getAll();

    const today = new Date();

    const trend = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date(today);

        date.setHours(0, 0, 0, 0);

        date.setDate(today.getDate() - i);

        const nextDate = new Date(date);

        nextDate.setDate(date.getDate() + 1);

        const total = workorders.filter(wo => {

            const createdAt = new Date(wo.createdAt);

            return createdAt >= date && createdAt < nextDate;

        }).length;

        trend.push({

            date: date.toISOString().split("T")[0],

            label: date.toLocaleDateString("id-ID", {
                weekday: "short"
            }),

            total

        });

    }

    return trend;
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

module.exports = {
    getSummary,
    getWorkOrderTrend,
    getCategoryTrend
};