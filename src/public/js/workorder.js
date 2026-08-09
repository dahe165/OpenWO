function bindSearch() {

    const input = document.getElementById("searchInput");

    if (!input) return;

    const cards = document.querySelectorAll(".wo-card");

    input.addEventListener("input", function () {

        const keyword = this.value.trim().toLowerCase();

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

        button.addEventListener("click", () => {

            const filter = button.dataset.filter;

            // Tombol aktif
            buttons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            // Filter card
            const cards = document.querySelectorAll(".wo-card");

            cards.forEach(card => {

                const status = card.dataset.status;

                if (filter === "Semua" || status === filter) {

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

}

async function renderPage(html) {

    const content = document.querySelector("#workorder-content");

    const parser = new DOMParser();

    const doc = parser.parseFromString(html, "text/html");

    const newContent = doc.querySelector("#workorder-content");

    content.innerHTML = newContent.innerHTML;

    const newActive = content.querySelector(".wo-detail");

    if (newActive) {

        newActive.classList.add("card-enter");

        requestAnimationFrame(() => {

            newActive.classList.remove("card-enter");

        });

    }

    initWorkOrder();

}

async function navigate(url, push = true) {

    if (push) {
        history.pushState({}, "", url);
    }

    const response = await fetch(url);

    const html = await response.text();

    renderPage(html);

}

function bindOpenDetail() {

    if (document.body.dataset.openDetailBound === "true") {
        return;
    }

    document.body.dataset.openDetailBound = "true";

    document.addEventListener("click", (e) => {

        const link = e.target.closest(".btn-open");

        if (!link) return;

        e.preventDefault();

        navigate(link.href);

    });

}

window.addEventListener("popstate", () => {

    navigate(location.href, false);

});

document.addEventListener("DOMContentLoaded", () => {

    initWorkOrder();

});

