const workorderModel =
    require("../models/workorder.model");

const departmentModel =
    require("../models/department.model");

const sectionModel =
    require("../models/section.model");


/*
 * =====================================
 * Helper
 * =====================================
 */

function normalizeMonth(month) {
    const value = Number(month);

    if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 12
    ) {
        return null;
    }

    return value;
}


function normalizeYear(year) {
    const value = Number(year);

    if (
        !Number.isInteger(value) ||
        value < 2000 ||
        value > 2100
    ) {
        return null;
    }

    return value;
}


/*
 * =====================================
 * REKAP BULANAN WORK ORDER
 * =====================================
 */

function getMonthlyReport(year, month, user = null, filters = {}) {

    const normalizedYear =
        normalizeYear(year);

    const normalizedMonth =
        normalizeMonth(month);

    if (
        !normalizedYear ||
        !normalizedMonth
    ) {
        throw new Error(
            "Periode laporan tidak valid."
        );
    }


    /*
     * =====================================
     * SCOPE + FILTER ORGANISASI
     * =====================================
     *
     * Prinsip:
     *
     * - Asman/Teknisi : terkunci pada Seksi user.
     * - Manager       : terkunci pada Bagian user, lalu boleh
     *                   memilih satu Seksi di dalam Bagian tersebut.
     * - Admin         : boleh memilih Bagian dan/atau Seksi.
     *                   Jika Admin memiliki department_id, Bagian
     *                   tersebut menjadi pilihan awal.
     * - Pelapor       : tetap hanya WO yang dibuat/dilaporkannya.
     *
     * Filter organisasi diterapkan di backend sebelum dataset laporan
     * dibentuk. Dengan demikian Web, Diagram, Detail, dan PDF selalu
     * menggunakan dataset yang sama.
     */

    const role =
        String(user?.role || '').toLowerCase();

    const requestedDepartmentId =
        Number.isInteger(Number(filters?.department_id)) &&
        Number(filters?.department_id) > 0
            ? Number(filters.department_id)
            : null;

    const requestedSectionId =
        Number.isInteger(Number(filters?.section_id)) &&
        Number(filters?.section_id) > 0
            ? Number(filters.section_id)
            : null;

    let effectiveDepartmentId = null;
    let effectiveSectionId = null;

    if (role === 'manager') {
        effectiveDepartmentId =
            Number(user?.department_id) > 0
                ? Number(user.department_id)
                : null;

        if (requestedSectionId && effectiveDepartmentId) {
            const section =
                sectionModel.getById(requestedSectionId);

            if (
                section &&
                Number(section.aktif) === 1 &&
                Number(section.department_id) === effectiveDepartmentId
            ) {
                effectiveSectionId = requestedSectionId;
            }
        }
    } else if (role === 'admin') {
        effectiveDepartmentId =
            requestedDepartmentId ||
            (Number(user?.department_id) > 0
                ? Number(user.department_id)
                : null);

        if (requestedSectionId) {
            const section =
                sectionModel.getById(requestedSectionId);

            if (
                section &&
                Number(section.aktif) === 1 &&
                (!effectiveDepartmentId ||
                 Number(section.department_id) === effectiveDepartmentId)
            ) {
                effectiveSectionId = requestedSectionId;
            }
        }
    } else if (role === 'asman' || role === 'teknisi') {
        effectiveSectionId =
            Number(user?.section_id) > 0
                ? Number(user.section_id)
                : null;

        effectiveDepartmentId =
            Number(user?.department_id) > 0
                ? Number(user.department_id)
                : null;
    }

    let workorders = [];

    if (role === 'admin') {
        workorders = workorderModel.getAll();
    } else if (role === 'manager') {
        workorders = workorderModel.getForManagerDepartment(
            effectiveDepartmentId
        );
    } else if (role === 'asman' || role === 'teknisi') {
        workorders = workorderModel.getForAsmanSection(
            effectiveSectionId
        );
    } else if (role === 'pelapor') {
        workorders = workorderModel.getForPelapor(
            user?.id
        );
    } else {
        workorders = [];
    }

    /*
     * Admin dan Manager memakai dataset organisasi yang lebih luas,
     * lalu dipersempit oleh filter Bagian/Seksi yang valid.
     * Asman/Teknisi sudah terkunci melalui query Seksi di atas.
     */
    if (role === 'admin' || role === 'manager') {
        if (effectiveDepartmentId) {
            workorders = workorders.filter(
                wo =>
                    Number(wo.targetDepartmentId) ===
                    effectiveDepartmentId
            );
        }

        if (effectiveSectionId) {
            workorders = workorders.filter(
                wo =>
                    Number(wo.targetSectionId) ===
                    effectiveSectionId
            );
        }
    }

    /*
     * Pilihan filter yang ditampilkan di UI.
     * Manager hanya melihat Seksi dalam Bagian miliknya.
     * Admin dapat melihat seluruh Bagian, tetapi jika sudah memilih
     * Bagian maka dropdown Seksi otomatis mengikuti Bagian tersebut.
     */
    let filterDepartments = [];
    let filterSections = [];
    let allFilterSections = [];

    if (role === 'admin') {
        filterDepartments =
            departmentModel.getActive();

        allFilterSections =
            sectionModel.getActive();

        filterSections =
            effectiveDepartmentId
                ? sectionModel.getActiveByDepartmentId(
                    effectiveDepartmentId
                )
                : allFilterSections;
    } else if (role === 'manager') {
        filterDepartments =
            effectiveDepartmentId
                ? departmentModel.getActive().filter(
                    d => Number(d.id) === effectiveDepartmentId
                )
                : [];

        filterSections =
            effectiveDepartmentId
                ? sectionModel.getActiveByDepartmentId(
                    effectiveDepartmentId
                )
                : [];

        allFilterSections =
            filterSections;
    }


    /*
     * Batas periode:
     *
     * awal bulan
     * sampai sebelum awal bulan berikutnya.
     */

    const startDate =
        new Date(
            normalizedYear,
            normalizedMonth - 1,
            1
        );

    const endDate =
        new Date(
            normalizedYear,
            normalizedMonth,
            1
        );


    /*
     * Filter berdasarkan
     * tanggal Work Order dibuat.
     */

    const rows =
        workorders.filter(
            function (wo) {

                if (!wo.createdAt) {
                    return false;
                }

                const createdDate =
                    new Date(
                        wo.createdAt
                    );

                return (
                    createdDate >= startDate &&
                    createdDate < endDate
                );
            }
        );


    /*
     * Bentuk dataset laporan.
     *
     * Dataset ini nantinya menjadi
     * sumber yang sama untuk:
     *
     * - Web
     * - PDF
     * - Excel
     */

    const data =
        rows.map(
            function (wo, index) {

                return {
                    no:
                        index + 1,

                    nomor:
                        wo.nomor || "-",

                    tanggal:
                        wo.createdAt || null,

                    kategori:
                        wo.kategori || "-",

                    subkategori:
                        wo.subkategori || "-",

                    targetDepartment:
                        wo.targetDepartment || "-",

                    targetSection:
                        wo.targetSection || "-",

                    uraian:
                        wo.judul || "-",

                    status:
                        wo.status || "-",

                    tindakan:
                        wo.resolutionDescription ||
                        "-",

                    pemohon:
                        wo.pelapor || "-",

                    petugas:
                        wo.teknisi || "-"
                };
            }
        );


    /*
     * =====================================
     * RINGKASAN
     * =====================================
     */

    const total =
        data.length;


    const diproses =
        data.filter(
            function (item) {
                return item.status === "Diproses";
            }
        ).length;


    const selesai =
        data.filter(
            function (item) {

                return (
                    item.status === "Selesai" ||
                    item.status === "Ditutup"
                );
            }
        ).length;


    /*
     * =====================================
     * SUBKATEGORI
     * =====================================
     */

    const subkategoriMap =
        new Map();


    data.forEach(
        function (item) {

            const nama =
                item.subkategori ||
                "-";

            const current =
                subkategoriMap.get(nama) ||
                0;

            subkategoriMap.set(
                nama,
                current + 1
            );
        }
    );


    const subkategori =
        Array.from(
            subkategoriMap.entries()
        )
        .map(
            function ([nama, jumlah]) {

                return {
                    nama,
                    jumlah
                };
            }
        )
        .sort(
            function (a, b) {
                return b.jumlah - a.jumlah;
            }
        );


    return {

        periode: {
            tahun:
                normalizedYear,

            bulan:
                normalizedMonth
        },

        summary: {

            total,

            diproses,

            selesai
        },

        scope: {
            role,
            departmentId: effectiveDepartmentId,
            sectionId: effectiveSectionId,
            department: effectiveDepartmentId
                ? (filterDepartments.find(
                    d => Number(d.id) === effectiveDepartmentId
                )?.nama || user?.departmentName || null)
                : null,
            section: effectiveSectionId
                ? (filterSections.find(
                    s => Number(s.id) === effectiveSectionId
                )?.nama || user?.sectionName || null)
                : null,
            filtered: Boolean(
                effectiveDepartmentId ||
                effectiveSectionId
            )
        },

        filters: {
            departmentId: effectiveDepartmentId,
            sectionId: effectiveSectionId,
            requestedDepartmentId,
            requestedSectionId
        },

        filterOptions: {
            departments: filterDepartments,
            sections: filterSections,
            allSections: allFilterSections
        },

        subkategori,

        data
    };
}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {
    getMonthlyReport
};