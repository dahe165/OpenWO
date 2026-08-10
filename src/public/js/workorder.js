function bindSearch() {

    const input = document.getElementById("searchInput");

    if (!input) return;

    // Hindari event listener dobel
    if (input.dataset.bound === "true") return;

    input.dataset.bound = "true";

    input.addEventListener("input", function () {

        const keyword = this.value.trim().toLowerCase();

        const cards = document.querySelectorAll(".wo-card");

        cards.forEach(card => {

            const text = card.dataset.search || "";

            if (text.includes(keyword)) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });

    });

}


function bindFilter() {

    const buttons = document.querySelectorAll(".filter-btn");

    if (!buttons.length) return;

    buttons.forEach(button => {

        if (button.dataset.bound === "true") return;

        button.dataset.bound = "true";

        button.addEventListener("click", () => {

            const filter = button.dataset.filter;

            buttons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            const cards = document.querySelectorAll(".wo-card");

            cards.forEach(card => {

                const status = card.dataset.status;

                if (
                    filter === "Semua" ||
                    status === filter
                ) {

                    card.style.display = "";

                } else {

                    card.style.display = "none";

                }

            });

        });

    });

}


function initWorkOrder() {

    bindSearch();

    bindFilter();

    bindOpenDetail();

    bindWorkOrderActions();

}


async function renderPage(html, focusId = null) {

    const content =
        document.querySelector("#workorder-content");

    if (!content) return;

    const parser = new DOMParser();

    const doc =
        parser.parseFromString(html, "text/html");

    const newContent =
        doc.querySelector("#workorder-content");

    if (!newContent) return;

    content.innerHTML = newContent.innerHTML;

    initWorkOrder();

    const newActive =
        focusId
            ? content.querySelector(
                `.wo-card[data-id="${focusId}"]`
              )
            : content.querySelector(".wo-detail");

    if (newActive) {

        newActive.classList.add("card-enter");

        requestAnimationFrame(() => {

            newActive.classList.remove("card-enter");

        });

        focusCard(newActive);

    }

}


async function navigate(url, push = true, focusId = null) {

    try {

        if (push) {

            history.pushState(
                {},
                "",
                url
            );

        }

        const response =
            await fetch(url);

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

        const link =
            e.target.closest(".btn-open");

        if (!link) return;

        e.preventDefault();

        const id =
            link.dataset.id;

        navigate(
            link.href,
            true,
            id
        );

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
            e.target.closest(".wo-actions form");

        if (!form) return;

        e.preventDefault();

        const button =
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
                        }
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
            const pageResponse =
                await fetch(
                    `/workorder?id=${id}`
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