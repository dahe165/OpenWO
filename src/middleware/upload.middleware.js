const multer =
    require("multer");

const path =
    require("path");

const fs =
    require("fs");


/*
 * =====================================
 * FOLDER BRANDING
 * =====================================
 */

const uploadDir =
    path.join(
        __dirname,
        "../public/images/branding"
    );


/*
 * Pastikan folder tersedia
 */

if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(
        uploadDir,
        {
            recursive: true
        }
    );

}


/*
 * =====================================
 * STORAGE
 * =====================================
 */

const storage =
    multer.diskStorage({

        destination:
            (req, file, cb) => {

                cb(
                    null,
                    uploadDir
                );

            },


        filename:
            (req, file, cb) => {

                const ext =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                const filename =
                    `app-logo-${Date.now()}${ext}`;


                cb(
                    null,
                    filename
                );

            }

    });


/*
 * =====================================
 * VALIDASI FILE
 * =====================================
 */

const fileFilter =
    (req, file, cb) => {

        const allowedMimeTypes = [

            "image/png",

            "image/jpeg",

            "image/webp"

        ];


        if (
            allowedMimeTypes.includes(
                file.mimetype
            )
        ) {

            cb(
                null,
                true
            );

        } else {

            cb(
                new Error(
                    "Logo harus berupa PNG, JPG, atau WEBP."
                )
            );

        }

    };


/*
 * =====================================
 * UPLOAD BRANDING
 * =====================================
 */

const uploadBranding =
    multer({

        storage,

        fileFilter,

        limits: {

            fileSize:
                2 * 1024 * 1024

        }

    });

/*
 * =====================================
 * FOLDER FOTO PENYELESAIAN WO
 * =====================================
 */

const completionDir =
    path.join(
        __dirname,
        "../public/images/completions"
    );


if (!fs.existsSync(completionDir)) {

    fs.mkdirSync(
        completionDir,
        {
            recursive: true
        }
    );

}


/*
 * =====================================
 * STORAGE FOTO PENYELESAIAN
 * =====================================
 */

const completionStorage =
    multer.diskStorage({

        destination:
            (req, file, cb) => {

                cb(
                    null,
                    completionDir
                );

            },


        filename:
            (req, file, cb) => {

                const ext =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                const filename =
                    `wo-${req.params.id}-${Date.now()}${ext}`;


                cb(
                    null,
                    filename
                );

            }

    });


/*
 * =====================================
 * VALIDASI FOTO PENYELESAIAN
 * =====================================
 */

const completionFileFilter =
    (req, file, cb) => {

        const allowedMimeTypes = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];


        if (
            allowedMimeTypes.includes(
                file.mimetype
            )
        ) {

            cb(
                null,
                true
            );

        } else {

            cb(
                new Error(
                    "Foto harus berupa PNG, JPG, atau WEBP."
                )
            );

        }

    };


/*
 * =====================================
 * UPLOAD FOTO PENYELESAIAN
 * =====================================
 */

const uploadCompletion =
    multer({

        storage:
            completionStorage,

        fileFilter:
            completionFileFilter,

        limits: {

            fileSize:
                5 * 1024 * 1024

        }

    });


module.exports = {

    uploadBranding,
    uploadCompletion

};