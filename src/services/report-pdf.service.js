const PDFDocument =
    require("pdfkit");


/*
 * ==========================================
 * REPORT PDF SERVICE
 * ==========================================
 *
 * Tanggung jawab:
 * - Membuat PDF laporan Work Order
 * - Detail Work Order
 * - Rekap Subkategori
 *
 * Sumber data tetap dari report.service.js
 * ==========================================
 */


/*
 * ==========================================
 * FORMAT
 * ==========================================
 */

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const year =
        date.getFullYear();

    return `${day}-${month}-${year}`;
}


function getMonthName(month) {

    const names = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    return names[
        Number(month) - 1
    ] || "-";
}


function safeText(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    return String(value);
}


/*
 * ==========================================
 * DRAW CELL
 * ==========================================
 */

function drawCell(
    doc,
    text,
    x,
    y,
    width,
    height,
    options = {}
) {

    const {
        align = "left",
        bold = false,
        background = null,
        fontSize = 7
    } = options;


    if (background) {

        doc
            .save()
            .fillColor(background)
            .rect(
                x,
                y,
                width,
                height
            )
            .fill()
            .restore();
    }


    doc
        .save()
        .lineWidth(0.5)
        .strokeColor("#333333")
        .rect(
            x,
            y,
            width,
            height
        )
        .stroke()
        .restore();


    doc
        .font(
            bold
                ? "Helvetica-Bold"
                : "Helvetica"
        )
        .fontSize(fontSize)
        .fillColor("#111111")
        .text(
            safeText(text),
            x + 4,
            y + 4,
            {
                width:
                    width - 8,
                height:
                    height - 8,
                align,
                lineGap: 0
            }
        );
}


/*
 * ==========================================
 * DETAIL COLUMN
 * ==========================================
 */

const DETAIL_COLUMNS = [
    {
        key: "no",
        label: "No",
        width: 25,
        align: "center"
    },
    {
        key: "nomor",
        label: "No WO",
        width: 65,
        align: "center"
    },
    {
        key: "tanggal",
        label: "Tanggal",
        width: 58,
        align: "center"
    },
    {
        key: "subkategori",
        label: "Sub Kategori",
        width: 75,
        align: "left"
    },
    {
        key: "uraian",
        label: "Uraian",
        width: 155,
        align: "left"
    },
    {
        key: "status",
        label: "Status",
        width: 55,
        align: "center"
    },
    {
        key: "tindakan",
        label: "Tindakan",
        width: 95,
        align: "left"
    },
    {
        key: "pemohon",
        label: "Pemohon",
        width: 100,
        align: "left"
    },
    {
        key: "petugas",
        label: "Petugas",
        width: 110,
        align: "left"
    }
];


/*
 * ==========================================
 * HEADER DETAIL
 * ==========================================
 */

function drawDetailHeader(
    doc,
    x,
    y
) {

    let currentX = x;

    DETAIL_COLUMNS.forEach(
        column => {

            drawCell(
                doc,
                column.label,
                currentX,
                y,
                column.width,
                22,
                {
                    align:
                        "center",
                    bold: true,
                    background:
                        "#eeeeee",
                    fontSize: 7
                }
            );

            currentX +=
                column.width;
        }
    );

    return y + 22;
}


/*
 * ==========================================
 * DETAIL ROW HEIGHT
 * ==========================================
 */

function getDetailRowHeight(
    doc,
    row
) {

    let maxHeight = 22;

    DETAIL_COLUMNS.forEach(
        column => {

            let value =
                row[column.key];

            if (
                column.key ===
                "tanggal"
            ) {
                value =
                    formatDate(value);
            }

            value =
                safeText(value);

            const height =
                doc.heightOfString(
                    value,
                    {
                        width:
                            column.width - 8,
                        font:
                            "Helvetica",
                        fontSize: 7,
                        lineGap: 0
                    }
                ) + 8;

            if (
                height > maxHeight
            ) {
                maxHeight = height;
            }
        }
    );

    return Math.max(
        maxHeight,
        22
    );
}


/*
 * ==========================================
 * DRAW DETAIL ROW
 * ==========================================
 */

function drawDetailRow(
    doc,
    row,
    x,
    y,
    height
) {

    let currentX = x;

    DETAIL_COLUMNS.forEach(
        column => {

            let value =
                row[column.key];

            if (
                column.key ===
                "tanggal"
            ) {
                value =
                    formatDate(value);
            }

            drawCell(
                doc,
                value,
                currentX,
                y,
                column.width,
                height,
                {
                    align:
                        column.align,
                    fontSize: 7
                }
            );

            currentX +=
                column.width;
        }
    );

    return y + height;
}


/*
 * ==========================================
 * DETAIL PDF
 * ==========================================
 */

function createDetailPdf(
    report,
    res
) {

    const doc =
        new PDFDocument({
            size: "A4",
            layout: "landscape",
            margins: {
                top: 28,
                bottom: 28,
                left: 28,
                right: 28
            },
            bufferPages: true
        });


    res.setHeader(
        "Content-Type",
        "application/pdf"
    );


    res.setHeader(
        "Content-Disposition",
        `inline; filename="laporan-wo-${report.periode.tahun}-${String(
            report.periode.bulan
        ).padStart(2, "0")}.pdf"`
    );


    doc.pipe(res);


    const pageWidth =
        doc.page.width;

    const left =
        doc.page.margins.left;

    const right =
        pageWidth -
        doc.page.margins.right;

    const contentWidth =
        right - left;


    /*
     * ======================================
     * JUDUL
     * ======================================
     */

    doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111111")
        .text(
            "Laporan Bulanan Work Order",
            left,
            30,
            {
                width:
                    contentWidth,
                align: "left"
            }
        );


    doc
        .font("Helvetica")
        .fontSize(9)
        .text(
            `Periode: ${getMonthName(
                report.periode.bulan
            )} ${report.periode.tahun}`,
            left,
            50
        );


    doc
        .font("Helvetica")
        .fontSize(9)
        .text(
            `Total Work Order: ${
                report.summary.total
            }`,
            left,
            64
        );


    /*
     * ======================================
     * TABLE
     * ======================================
     */

    let y = 84;

    y =
        drawDetailHeader(
            doc,
            left,
            y
        );


    const bottom =
        doc.page.height -
        doc.page.margins.bottom -
        15;


    report.data.forEach(
        row => {

            const rowHeight =
                getDetailRowHeight(
                    doc,
                    row
                );


            /*
             * PAGE BREAK
             */

            if (
                y + rowHeight >
                bottom
            ) {

                doc.addPage();

                y = 35;

                y =
                    drawDetailHeader(
                        doc,
                        left,
                        y
                    );
            }


            y =
                drawDetailRow(
                    doc,
                    row,
                    left,
                    y,
                    rowHeight
                );
        }
    );


    /*
     * ======================================
     * PAGE NUMBER
     * ======================================
     */

    addPageNumbers(
        doc
    );


    doc.end();
}


/*
 * ==========================================
 * SUMMARY PDF
 * ==========================================
 */

function createSummaryPdf(
    report,
    res
) {

    const doc =
        new PDFDocument({
            size: "A4",
            layout: "landscape",
            margins: {
                top: 28,
                bottom: 28,
                left: 28,
                right: 28
            }
        });


    res.setHeader(
        "Content-Type",
        "application/pdf"
    );


    res.setHeader(
        "Content-Disposition",
        `inline; filename="rekap-subkategori-${report.periode.tahun}-${String(
            report.periode.bulan
        ).padStart(2, "0")}.pdf"`
    );


    doc.pipe(res);


    const pageWidth =
        doc.page.width;

    const left =
        doc.page.margins.left;

    const contentWidth =
        pageWidth -
        doc.page.margins.left -
        doc.page.margins.right;


    /*
     * ======================================
     * TITLE
     * ======================================
     */

    doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(
            "REKAP WORK ORDER",
            left,
            40,
            {
                width:
                    contentWidth,
                align: "center"
            }
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
            `BULAN ${getMonthName(
                report.periode.bulan
            ).toUpperCase()} ${
                report.periode.tahun
            }`,
            left,
            58,
            {
                width:
                    contentWidth,
                align: "center"
            }
        );


    /*
     * ======================================
     * TABLE
     * ======================================
     */

    const tableWidth =
        620;

    const tableX =
        left +
        (
            contentWidth -
            tableWidth
        ) / 2;

    const categoryWidth =
        450;

    const jumlahWidth =
        80;

    const percentageWidth =
        90;


    let y = 82;


    /*
     * HEADER
     */

    drawCell(
        doc,
        "KATEGORI KEGIATAN PERBAIKAN",
        tableX,
        y,
        categoryWidth,
        24,
        {
            align: "center",
            bold: true,
            background: "#dce8ec",
            fontSize: 8
        }
    );


    drawCell(
        doc,
        "JUMLAH",
        tableX +
            categoryWidth,
        y,
        jumlahWidth,
        24,
        {
            align: "center",
            bold: true,
            background: "#dce8ec",
            fontSize: 8
        }
    );


    drawCell(
        doc,
        "PERSENTASE",
        tableX +
            categoryWidth +
            jumlahWidth,
        y,
        percentageWidth,
        24,
        {
            align: "center",
            bold: true,
            background: "#dce8ec",
            fontSize: 8
        }
    );


    y += 24;


    /*
     * DATA
     */

    const total =
        Number(
            report.summary.total
        ) || 0;


    report.subkategori.forEach(
        item => {

            const percentage =
                total > 0
                    ? (
                        Number(
                            item.jumlah
                        ) /
                        total *
                        100
                    )
                    : 0;


            const percentText =
                `${Math.round(
                    percentage
                )}%`;


            const rowHeight =
                24;


            drawCell(
                doc,
                item.nama,
                tableX,
                y,
                categoryWidth,
                rowHeight,
                {
                    fontSize: 8
                }
            );


            drawCell(
                doc,
                item.jumlah,
                tableX +
                    categoryWidth,
                y,
                jumlahWidth,
                rowHeight,
                {
                    align: "center",
                    fontSize: 8
                }
            );


            drawCell(
                doc,
                percentText,
                tableX +
                    categoryWidth +
                    jumlahWidth,
                y,
                percentageWidth,
                rowHeight,
                {
                    align: "center",
                    fontSize: 8
                }
            );


            y += rowHeight;
        }
    );


    /*
     * ======================================
     * TOTAL
     * ======================================
     */

    drawCell(
        doc,
        `TOTAL KEGIATAN BULAN ${getMonthName(
            report.periode.bulan
        ).toUpperCase()} ${
            report.periode.tahun
        }`,
        tableX,
        y,
        categoryWidth,
        24,
        {
            bold: true,
            background: "#dce8ec",
            fontSize: 8
        }
    );


    drawCell(
        doc,
        total,
        tableX +
            categoryWidth,
        y,
        jumlahWidth,
        24,
        {
            align: "center",
            bold: true,
            background: "#dce8ec",
            fontSize: 8
        }
    );


    drawCell(
        doc,
        "100%",
        tableX +
            categoryWidth +
            jumlahWidth,
        y,
        percentageWidth,
        24,
        {
            align: "center",
            bold: true,
            background: "#dce8ec",
            fontSize: 8
        }
    );


    doc.end();
}


/*
 * ==========================================
 * PAGE NUMBER
 * ==========================================
 */

function addPageNumbers(
    doc
) {

    const range =
        doc.bufferedPageRange();

    for (
        let i = 0;
        i < range.count;
        i++
    ) {

        doc.switchToPage(
            range.start + i
        );


        const pageNumber =
            i + 1;


        const totalPages =
            range.count;


        doc
            .font("Helvetica")
            .fontSize(7)
            .fillColor("#555555")
            .text(
                `Halaman ${pageNumber} / ${totalPages}`,
                0,
                doc.page.height - 22,
                {
                    width:
                        doc.page.width,
                    align: "center"
                }
            );
    }
}


/*
 * ==========================================
 * EXPORT
 * ==========================================
 */

module.exports = {
    createDetailPdf,
    createSummaryPdf
};