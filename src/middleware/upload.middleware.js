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


module.exports = {

    uploadBranding

};