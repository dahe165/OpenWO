const categoryModel =
    require("../models/category.model");

const departmentModel =
    require("../models/department.model");


/*
 * =====================================
 * ADMIN CATEGORY CONTROLLER
 * =====================================
 *
 * Controller untuk mengelola:
 *
 * - Kategori
 * - Subkategori
 *
 * Controller tidak berisi query SQL.
 * Semua akses database dilakukan
 * melalui category.model.js.
 *
 */


/*
 * =====================================
 * HALAMAN MASTER KATEGORI
 * =====================================
 *
 * Menampilkan:
 *
 * - Semua kategori
 * - Subkategori dari setiap kategori
 *
 */

function index(req, res) {

    try {

        const categories =
            categoryModel.getAllCategories();


        /*
         * Ambil subkategori untuk
         * masing-masing kategori.
         */

        const data =
            categories.map(
                category => {

                    return {

                        ...category,

                        subcategories:
                            categoryModel
                                .getSubcategories(
                                    category.id
                                )

                    };

                }
            );


        res.render(
            "admin/categories/index",
            {
                layout: "layouts/app",

                title: "Master Kategori",

                categories: data
            }
        );


    } catch (error) {

        console.error(
            "ADMIN CATEGORY INDEX ERROR:",
            error
        );


        res.status(500).send(
            "Gagal memuat Master Kategori."
        );

    }

}


/*
 * =====================================
 * FORM TAMBAH KATEGORI
 * =====================================
 */

function createCategory(req, res) {

    const departments =
        departmentModel.getActive();

    res.render(
        "admin/categories/create",
        {
            title:
                "Tambah Kategori",

            departments
        }
    );

}


/*
 * =====================================
 * SIMPAN KATEGORI
 * =====================================
 */

function storeCategory(req, res) {

    try {

        const nama =
            typeof req.body.nama === "string"
                ? req.body.nama.trim()
                : "";


        const urutan =
            Number(req.body.urutan) || 0;


        const departmentId =
            Number(req.body.department_id);


        /*
         * Validasi nama
         */

        if (!nama) {

            return res.status(400).send(
                "Nama kategori wajib diisi."
            );

        }


        if (!Number.isInteger(departmentId) || departmentId <= 0) {

            return res.status(400).send(
                "Bagian kategori wajib dipilih."
            );

        }


        if (!departmentModel.getById(departmentId)?.aktif) {

            return res.status(400).send(
                "Bagian yang dipilih tidak aktif atau tidak ditemukan."
            );

        }


        /*
         * Pastikan kategori dengan
         * nama yang sama belum ada.
         */

        const existing =
            categoryModel.getCategoryByName(
                nama
            );


        if (existing) {

            return res.status(400).send(
                "Kategori tersebut sudah ada."
            );

        }


        categoryModel.createCategory(
            nama,
            urutan,
            departmentId
        );


        /*
         * Setelah berhasil,
         * kembali ke Master Kategori.
         */

        res.redirect(
            "/admin/categories"
        );


    } catch (error) {

        console.error(
            "ADMIN CATEGORY CREATE ERROR:",
            error
        );


        res.status(500).send(
            "Gagal menambahkan kategori."
        );

    }

}


/*
 * =====================================
 * FORM EDIT KATEGORI
 * =====================================
 */

function editCategory(req, res) {

    try {

        const id =
            Number(req.params.id);


        const category =
            categoryModel.getCategoryById(
                id
            );


        if (!category) {

            return res.status(404).render(
                "errors/404",
                {
                    title:
                        "Kategori Tidak Ditemukan"
                }
            );

        }


        const departments =
            departmentModel.getActive();

        res.render(
            "admin/categories/edit",
            {
                title:
                    "Edit Kategori",

                category,
                departments
            }
        );


    } catch (error) {

        console.error(
            "ADMIN CATEGORY EDIT ERROR:",
            error
        );


        res.status(500).send(
            "Gagal memuat kategori."
        );

    }

}


/*
 * =====================================
 * UPDATE KATEGORI
 * =====================================
 */

function updateCategory(req, res) {

    try {

        const id =
            Number(req.params.id);


        const nama =
            typeof req.body.nama === "string"
                ? req.body.nama.trim()
                : "";


        const urutan =
            Number(req.body.urutan) || 0;


        const departmentId =
            Number(req.body.department_id);


        if (!nama) {

            return res.status(400).send(
                "Nama kategori wajib diisi."
            );

        }


        if (!Number.isInteger(departmentId) || departmentId <= 0) {

            return res.status(400).send(
                "Bagian kategori wajib dipilih."
            );

        }


        if (!departmentModel.getById(departmentId)?.aktif) {

            return res.status(400).send(
                "Bagian yang dipilih tidak aktif atau tidak ditemukan."
            );

        }


        const category =
            categoryModel.getCategoryById(
                id
            );


        if (!category) {

            return res.status(404).render(
                "errors/404",
                {
                    title:
                        "Kategori Tidak Ditemukan"
                }
            );

        }


        /*
         * Cek nama duplikat.
         *
         * Jika nama sama dengan
         * kategori lain, tolak.
         */

        const existing =
            categoryModel.getCategoryByName(
                nama
            );


        if (
            existing &&
            existing.id !== id
        ) {

            return res.status(400).send(
                "Kategori tersebut sudah ada."
            );

        }


        categoryModel.updateCategory(
            id,
            nama,
            urutan,
            departmentId
        );


        res.redirect(
            "/admin/categories"
        );


    } catch (error) {

        console.error(
            "ADMIN CATEGORY UPDATE ERROR:",
            error
        );


        res.status(500).send(
            "Gagal memperbarui kategori."
        );

    }

}


/*
 * =====================================
 * AKTIF / NONAKTIF KATEGORI
 * =====================================
 */

function toggleCategory(req, res) {

    try {

        const id =
            Number(req.params.id);


        const category =
            categoryModel.getCategoryById(
                id
            );


        if (!category) {

            return res.status(404).render(
                "errors/404",
                {
                    title:
                        "Kategori Tidak Ditemukan"
                }
            );

        }


        /*
         * Toggle status:
         *
         * 1 → 0
         * 0 → 1
         */

        const aktif =
            category.aktif ? 0 : 1;


        categoryModel.setCategoryStatus(
            id,
            aktif
        );


        res.redirect(
            "/admin/categories"
        );


    } catch (error) {

        console.error(
            "ADMIN CATEGORY STATUS ERROR:",
            error
        );


        res.status(500).send(
            "Gagal mengubah status kategori."
        );

    }

}


/*
 * =====================================
 * TAMBAH SUBKATEGORI
 * =====================================
 */

function storeSubcategory(req, res) {

    try {

        const categoryId =
            Number(
                req.params.categoryId
            );


        const nama =
            typeof req.body.nama === "string"
                ? req.body.nama.trim()
                : "";


        const urutan =
            Number(req.body.urutan) || 0;


        if (!nama) {

            return res.status(400).send(
                "Nama subkategori wajib diisi."
            );

        }


        /*
         * Pastikan kategori induk ada.
         */

        const category =
            categoryModel.getCategoryById(
                categoryId
            );


        if (!category) {

            return res.status(404).render(
                "errors/404",
                {
                    title:
                        "Kategori Tidak Ditemukan"
                }
            );

        }


        /*
         * Cek apakah subkategori
         * dengan nama yang sama
         * sudah ada pada kategori ini.
         */

        const existing =
            categoryModel
                .getSubcategories(
                    categoryId
                )
                .find(
                    item =>
                        item.nama.toLowerCase() ===
                        nama.toLowerCase()
                );


        if (existing) {

            return res.status(400).send(
                "Subkategori tersebut sudah ada."
            );

        }


        categoryModel.createSubcategory(
            categoryId,
            nama,
            urutan
        );


        res.redirect(
            "/admin/categories"
        );


    } catch (error) {

        console.error(
            "ADMIN SUBCATEGORY CREATE ERROR:",
            error
        );


        res.status(500).send(
            "Gagal menambahkan subkategori."
        );

    }

}


/*
 * =====================================
 * FORM EDIT SUBKATEGORI
 * =====================================
 */

function editSubcategory(req, res) {

    try {

        const id =
            Number(req.params.id);


        const subcategory =
            categoryModel
                .getSubcategoryById(id);


        if (!subcategory) {

            return res.status(404).render(
                "errors/404",
                {
                    title:
                        "Subkategori Tidak Ditemukan"
                }
            );

        }


        res.render(
            "admin/categories/subcategory-edit",
            {
                title:
                    "Edit Subkategori",

                subcategory
            }
        );


    } catch (error) {

        console.error(
            "ADMIN SUBCATEGORY EDIT ERROR:",
            error
        );


        res.status(500).send(
            "Gagal memuat subkategori."
        );

    }

}


/*
 * =====================================
 * UPDATE SUBKATEGORI
 * =====================================
 */

function updateSubcategory(req, res) {

    try {

        const id =
            Number(req.params.id);


        const nama =
            typeof req.body.nama === "string"
                ? req.body.nama.trim()
                : "";


        const urutan =
            Number(req.body.urutan) || 0;


        if (!nama) {

            return res.status(400).send(
                "Nama subkategori wajib diisi."
            );

        }


        const subcategory =
            categoryModel
                .getSubcategoryById(id);


        if (!subcategory) {

            return res.status(404).render(
                "errors/404",
                {
                    title:
                        "Subkategori Tidak Ditemukan"
                }
            );

        }


        /*
         * Pastikan tidak ada nama
         * yang sama dalam kategori
         * yang sama.
         */

        const siblings =
            categoryModel
                .getSubcategories(
                    subcategory.category_id
                );


        const duplicate =
            siblings.find(
                item =>
                    item.id !== id &&
                    item.nama.toLowerCase() ===
                    nama.toLowerCase()
            );


        if (duplicate) {

            return res.status(400).send(
                "Subkategori tersebut sudah ada."
            );

        }


        categoryModel.updateSubcategory(
            id,
            nama,
            urutan
        );


        res.redirect(
            "/admin/categories"
        );


    } catch (error) {

        console.error(
            "ADMIN SUBCATEGORY UPDATE ERROR:",
            error
        );


        res.status(500).send(
            "Gagal memperbarui subkategori."
        );

    }

}


/*
 * =====================================
 * AKTIF / NONAKTIF SUBKATEGORI
 * =====================================
 */

function toggleSubcategory(req, res) {

    try {

        const id =
            Number(req.params.id);


        const subcategory =
            categoryModel
                .getSubcategoryById(id);


        if (!subcategory) {

            return res.status(404).render(
                "errors/404",
                {
                    title:
                        "Subkategori Tidak Ditemukan"
                }
            );

        }


        const aktif =
            subcategory.aktif ? 0 : 1;


        categoryModel
            .setSubcategoryStatus(
                id,
                aktif
            );


        res.redirect(
            "/admin/categories"
        );


    } catch (error) {

        console.error(
            "ADMIN SUBCATEGORY STATUS ERROR:",
            error
        );


        res.status(500).send(
            "Gagal mengubah status subkategori."
        );

    }

}


/*
 * =====================================
 * EXPORT
 * =====================================
 */

module.exports = {

    index,

    createCategory,

    storeCategory,

    editCategory,

    updateCategory,

    toggleCategory,

    storeSubcategory,

    editSubcategory,

    updateSubcategory,

    toggleSubcategory

};