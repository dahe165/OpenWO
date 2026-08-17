function bindSearch() {

    const input =
        document.getElementById("searchInput");

    if (!input) return;

    if (input.dataset.bound === "true") {
        return;
    }

    input.dataset.bound = "true";

    input.addEventListener("input", () => {

        const keyword =
            input.value.trim();

        const url =
            new URL(
                "/workorder",
                window.location.origin
            );

        if (keyword) {

            url.searchParams.set(
                "search",
                keyword
            );

        }

        navigate(
            url.pathname + url.search,
            true
        );

    });

}


function bindFilter() {

    const buttons =
        document.querySelectorAll(
            ".filter-btn"
        );

    if (!buttons.length) return;

    buttons.forEach(button => {

        if (button.dataset.bound === "true") {
            return;
        }

        button.dataset.bound = "true";

        button.addEventListener(
            "click",
            () => {

                const filter =
                    button.dataset.filter;

                const url =
                    new URL(
                        "/workorder",
                        window.location.origin
                    );

                const input =
                    document.getElementById(
                        "searchInput"
                    );

                const keyword =
                    input?.value.trim();

                if (keyword) {

                    url.searchParams.set(
                        "search",
                        keyword
                    );

                }

                if (
                    filter &&
                    filter !== "Semua"
                ) {

                    url.searchParams.set(
                        "status",
                        filter
                    );

                }

                buttons.forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                });

                button.classList.add(
                    "active"
                );

                navigate(
                    url.pathname + url.search,
                    true
                );

            }
        );

    });

}

function bindPagination() {

    const links =
        document.querySelectorAll(
            ".wo-pagination .page-btn"
        );

    if (!links.length) return;

    links.forEach(link => {

        if (link.dataset.bound === "true") {
            return;
        }

        link.dataset.bound = "true";

        link.addEventListener("click", e => {

            e.preventDefault();

            navigate(
                link.href,
                true
            );

        });

    });

}

function initWorkOrder() {

    bindSearch();

    bindFilter();

    bindPagination();

    bindOpenDetail();

    bindCardDetail();

    bindEscalationToggle();

    bindWorkOrderActions();

}

async function renderPage(
    html,
    focusId = null
) {

    const list =
        document.querySelector(
            "#workorder-list"
        );

    if (!list) return;


    // ==========================================
    // PARSE HTML HASIL AJAX
    // ==========================================

    const parser =
        new DOMParser();

    const doc =
        parser.parseFromString(
            html,
            "text/html"
        );


    // ==========================================
    // UPDATE DAFTAR WORK ORDER
    // ==========================================

    const newList =
        doc.querySelector(
            "#workorder-list"
        );

    if (!newList) return;

    list.innerHTML =
        newList.innerHTML;


    // ==========================================
    // UPDATE INFO HASIL
    // ==========================================

    const resultInfo =
        document.querySelector(
            "#wo-result-info"
        );

    const newResultInfo =
        doc.querySelector(
            "#wo-result-info"
        );

    if (
        resultInfo &&
        newResultInfo
    ) {

        resultInfo.innerHTML =
            newResultInfo.innerHTML;

    }


    // ==========================================
    // INISIALISASI ULANG WO
    // ==========================================

    initWorkOrder();


    // ==========================================
    // CARI WO AKTIF
    // ==========================================

    const content =
        list.querySelector(
            "#workorder-content"
        );

    if (!content) return;


    const newActive =
        focusId
            ? content.querySelector(
                `.wo-card[data-id="${focusId}"]`
            )
            : content.querySelector(
                ".wo-detail"
            );


            console.log(
                "🎯 RENDER FOCUS ID:",
                focusId
            );

            console.log(
                "🔎 ACTIVE CARD DITEMUKAN:",
                newActive
            );

            console.log(
                "📄 CURRENT URL:",
                window.location.href
            );


    // ==========================================
    // ANIMASI WO AKTIF
    // ==========================================

    if (newActive) {

        newActive.classList.add(
            "card-enter"
        );

        requestAnimationFrame(() => {

            newActive.classList.remove(
                "card-enter"
            );

        });

        focusCard(
            newActive
        );

    }

}


async function navigate(url, push = true, focusId = null) {

    console.log(
        "🚀 NAVIGATE:",
        url
    );

    console.log(
        "🎯 NAVIGATE FOCUS ID:",
        focusId
    );

    console.log(
        "📌 URL SEBELUM NAVIGATE:",
        window.location.href
    );

    try {

        if (push) {

            history.pushState(
                {},
                "",
                url
            );

        }

        console.log(
            "📍 URL SETELAH PUSHSTATE:",
            window.location.href
        );

        const response =
            await fetch(url);

            console.log(
                "📡 FETCH RESPONSE:",
                response.url
            );

        if (!response.ok) {

            throw new Error(
                "Gagal mengambil halaman Work Order."
            );

        }

        const html =
            await response.text();

        await renderPage(
            html,
            focusId
        );

    } catch (error) {

        console.error(error);

        alert(
            "Terjadi kesalahan saat memuat Work Order."
        );

    }

}


function focusCard(card) {

    if (!card) return;

    const headerOffset = 90;

    const top =
        card.getBoundingClientRect().top +
        window.scrollY -
        headerOffset;

    window.scrollTo({

        top,

        behavior: "smooth"

    });

}

function bindOpenDetail() {

    if (
        document.body.dataset.openDetailBound === "true"
    ) {

        return;

    }

    document.body.dataset.openDetailBound = "true";

    document.addEventListener("click", (e) => {

        /*
         * Klik seluruh card WO
         */
        const card =
            e.target.closest(".wo-summary");

        if (!card) return;


        /*
         * Jangan membuka timeline ketika
         * user sedang berinteraksi dengan aksi WO.
         */
        if (
            e.target.closest(
                ".wo-actions"
            )
        ) {

            return;

        }


        /*
         * Jangan membuka timeline ketika
         * user sedang mengisi / mengubah
         * elemen interaktif lainnya.
         */
        if (
            e.target.closest(
                "input, select, textarea, button, a"
            )
        ) {

            return;

        }


        const id =
            card.dataset.id;

        if (!id) return;


        /*
         * Pertahankan URL halaman sekarang.
         *
         * Contoh:
         * /workorder?page=8
         *
         * menjadi:
         * /workorder?page=8&id=40
         */

        const url =
            new URL(
                window.location.href
            );

        url.searchParams.set(
            "id",
            id
        );


        console.log(
            "🎯 WO CARD:",
            id
        );

        console.log(
            "🌐 URL DETAIL:",
            url.pathname +
            url.search
        );


        navigate(
            url.pathname +
            url.search,
            true,
            Number(id)
        );

    });

}

// Detail card sekarang ditangani oleh bindOpenDetail()
function bindCardDetail() {
    return;
}

// Toggle Eskalasi
function bindEscalationToggle() {

    document
        .querySelectorAll(".escalation-toggle-input")
        .forEach(toggle => {

            if (toggle.dataset.bound === "true") {
                return;
            }

            toggle.dataset.bound = "true";

            toggle.addEventListener("change", () => {

                const container =
                    toggle.closest(
                        ".asman-verification-action"
                    );

                if (!container) return;

                const verifyForm =
                    container.querySelector(
                        ".verify-form"
                    );

                const escalateForm =
                    container.querySelector(
                        ".escalate-form"
                    );

                const verifyButton =
                    container.querySelector(
                        ".btn-verify"
                    );

                const escalateButton =
                    container.querySelector(
                        ".btn-escalate-primary"
                    );

                if (
                    !verifyForm ||
                    !escalateForm ||
                    !verifyButton ||
                    !escalateButton
                ) {
                    return;
                }

				if (toggle.checked) {
				
					verifyForm.style.display = "none";
					escalateButton.style.display = "block";
					escalateForm.classList.add("open");

				} else {

					verifyForm.style.display = "";
					escalateButton.style.display = "none";
					escalateForm.classList.remove("open");

				}

            });

        });

}

function bindWorkOrderActions() {

    if (
        document.body.dataset.workorderActionBound === "true"
    ) {

        return;

    }

    document.body.dataset.workorderActionBound = "true";

    document.addEventListener("submit", async (e) => {

        const form =
            e.target.closest(".wo-actions form, .asman-verification-action form");

        if (!form) return;

        e.preventDefault();

        const button =
            e.submitter ||
            form.querySelector("button");

        const card =
            form.closest(".wo-card");

        const id =
            card?.dataset.id;

        if (!button || !id) return;

        const originalText =
            button.innerHTML;

        button.disabled = true;

        button.classList.add(
            "btn-loading"
        );

        button.innerHTML =
            "⏳ Memproses...";

        try {

            const formData =
                new FormData(form);

            const body =
                new URLSearchParams(formData);

            const response =
                await fetch(
                    form.action,
                    {
                        method: "POST",

                        headers: {
                            "X-Requested-With":
                                "XMLHttpRequest",

                            "Accept":
                                "application/json"
                        },

                        body
                    }
                );

            const result =
                await response.json();

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Work Order gagal diperbarui."
                );

            }

            /*
             * Ambil ulang tampilan Work Order
             * terbaru TANPA reload seluruh halaman.
             */
            const currentUrl =
                new URL(
                    window.location.href
                );

            currentUrl.searchParams.set(
                "id",
                id
            );

            const pageResponse =
                await fetch(
                    currentUrl.pathname +
                    currentUrl.search
                );

            if (!pageResponse.ok) {

                throw new Error(
                    "Gagal memperbarui tampilan Work Order."
                );

            }

            const html =
                await pageResponse.text();

            await renderPage(
                html,
                id
            );

            /*
             * Tandai indikator yang baru berubah.
             */
            const updatedCard =
                document.querySelector(
                    `.wo-card[data-id="${id}"]`
                );

            if (updatedCard) {

                const activeStep =
                    updatedCard.querySelector(
                        ".timeline .step.active"
                    );

                if (activeStep) {

                    activeStep.classList.add(
                        "changed"
                    );

                    setTimeout(() => {

                        activeStep.classList.remove(
                            "changed"
                        );

                    }, 900);

                }

            }

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Terjadi kesalahan."
            );

            button.disabled = false;

            button.classList.remove(
                "btn-loading"
            );

            button.innerHTML =
                originalText;

        }

    });

}


window.addEventListener(
    "popstate",
    () => {

        navigate(
            location.href,
            false
        );

    }
);


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initWorkOrder();

    }
);