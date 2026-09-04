const reportService =
    require("../../services/report.service");

const reportPdfService =
    require("../../services/report-pdf.service");


/*
 * ==========================================
 * PDF REPORT CONTROLLER
 * ==========================================
 */

function index(req, res) {

    const now =
        new Date();


    const month =
        Number(req.query.month) ||
        (
            now.getMonth() + 1
        );


    const year =
        Number(req.query.year) ||
        now.getFullYear();


    const model =
        (
            req.query.model ||
            "detail"
        ).toLowerCase();


    /*
     * ======================================
     * AMBIL DATA REPORT
     * ======================================
     */

    const report =
        reportService.getMonthlyReport(
            year,
            month
        );


    /*
     * ======================================
     * PILIH MODEL PDF
     * ======================================
     */

    if (
        model === "summary"
    ) {

        return reportPdfService
            .createSummaryPdf(
                report,
                res
            );
    }


    /*
     * DEFAULT:
     * DETAIL WORK ORDER
     */

    return reportPdfService
        .createDetailPdf(
            report,
            res
        );
}


module.exports = {
    index
};