console.log("LIVE SEARCH JS LOADED");


document.addEventListener("DOMContentLoaded", () => {

    /*
    |--------------------------------------------------------------------------
    | LIVE SEARCH INPUT
    |--------------------------------------------------------------------------
    */

    const inputs =
        document.querySelectorAll(
            "input[data-live-search='true']"
        );

    console.log(
        "LIVE SEARCH INPUTS:",
        inputs.length
    );


    inputs.forEach(input => {

        const endpoint =
            input.dataset.searchEndpoint;

        const targetSelector =
            input.dataset.searchTarget;

        const target =
            document.querySelector(
                targetSelector
            );


        if (!endpoint || !target) {

            console.warn(
                "LIVE SEARCH CONFIG INVALID",
                {
                    endpoint,
                    targetSelector
                }
            );

            return;
        }


        let timer = null;


        /*
        |--------------------------------------------------------------------------
        | LIVE SEARCH
        |--------------------------------------------------------------------------
        */

        input.addEventListener(
            "input",
            () => {

                console.log(
                    "SEARCH INPUT:",
                    input.value
                );


                clearTimeout(timer);


                timer = setTimeout(
                    () => {

                        loadSearchPage(
                            input.value.trim(),
                            1
                        );

                    },
                    200
                );

            }
        );

    });


    /*
    |--------------------------------------------------------------------------
    | INTERCEPT PAGINATION
    |--------------------------------------------------------------------------
    |
    | Pagination reusable kita tetap menggunakan <a href="...">.
    | Di sini kita cegah browser reload ketika Live Search aktif.
    |
    */

    document.addEventListener(
        "click",
        event => {

            const link =
                event.target.closest(
                    "#user-pagination a"
                );


            if (!link) {
                return;
            }


            const input =
                document.querySelector(
                    "input[data-live-search='true']"
                );


            if (!input) {
                return;
            }


            const query =
                input.value.trim();


            /*
            |--------------------------------------------------------------------------
            | Kalau tidak sedang search,
            | biarkan pagination normal.
            |--------------------------------------------------------------------------
            */

            if (!query) {
                return;
            }


            /*
            |--------------------------------------------------------------------------
            | Ambil page dari href pagination
            |--------------------------------------------------------------------------
            */

            const href =
                link.getAttribute("href");


            if (!href) {
                return;
            }


            const url =
                new URL(
                    href,
                    window.location.origin
                );


            const page =
                Number(
                    url.searchParams.get(
                        "page"
                    )
                ) || 1;


            /*
            |--------------------------------------------------------------------------
            | STOP browser reload
            |--------------------------------------------------------------------------
            */

            event.preventDefault();
            event.stopPropagation();


            console.log(
                "LIVE PAGINATION:",
                {
                    query,
                    page
                }
            );


            loadSearchPage(
                query,
                page
            );

        },
        true
    );

});


/*
|--------------------------------------------------------------------------
| LOAD SEARCH PAGE
|--------------------------------------------------------------------------
*/

async function loadSearchPage(
    query,
    page = 1
) {

    const input =
        document.querySelector(
            "input[data-live-search='true']"
        );


    if (!input) {
        return;
    }


    const endpoint =
        input.dataset.searchEndpoint;


    const targetSelector =
        input.dataset.searchTarget;


    const target =
        document.querySelector(
            targetSelector
        );


    if (!endpoint || !target) {

        console.warn(
            "LIVE SEARCH TARGET INVALID"
        );

        return;
    }


    /*
    |--------------------------------------------------------------------------
    | Endpoint JSON
    |--------------------------------------------------------------------------
    */

    const url =
        new URL(
            endpoint,
            window.location.origin
        );


    if (query) {

        url.searchParams.set(
            "q",
            query
        );

    }


    url.searchParams.set(
        "page",
        page
    );


    try {

        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "LIVE SEARCH RESULT:",
            result
        );


        /*
        |--------------------------------------------------------------------------
        | Render User
        |--------------------------------------------------------------------------
        */

        renderUsers(
            target,
            result.users || []
        );


        /*
        |--------------------------------------------------------------------------
        | Render Pagination
        |--------------------------------------------------------------------------
        */

        renderPagination(
            result.pagination,
            query
        );


    } catch (error) {

        console.error(
            "LIVE SEARCH ERROR:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER USERS
|--------------------------------------------------------------------------
*/

function renderUsers(
    target,
    users
) {

    if (!users.length) {

        target.innerHTML = `
            <div class="empty-users">

                <div class="empty-users-icon">
                    👤
                </div>

                <h3>
                    Pengguna tidak ditemukan
                </h3>

                <p>
                    Coba gunakan kata pencarian lain.
                </p>

            </div>
        `;

        return;
    }


    target.innerHTML =
        users
            .map(user => {

                const avatar =
                    escapeHtml(
                        String(
                            user.nama || "?"
                        )
                        .charAt(0)
                        .toUpperCase()
                    );


                const nama =
                    escapeHtml(
                        user.nama
                    );


                const username =
                    escapeHtml(
                        user.username
                    );


                const role =
                    escapeHtml(
                        user.role
                    );


                return `
                    <div
                        class="user-card"
                        data-user-id="${user.id}"
                    >

                        <div class="user-info">

                            <div class="user-avatar">
                                ${avatar}
                            </div>


                            <div class="user-detail">

                                <div class="user-name">
                                    ${nama}
                                </div>


                                <div class="user-username">
                                    @${username}
                                </div>

                            </div>

                        </div>


                        <div class="user-role">

                            <span
                                class="role-badge role-${role}"
                            >
                                ${role}
                            </span>

                        </div>


                        <div class="user-actions">

                            <a
                                href="/admin/users/${user.id}/edit"
                                class="btn-user-edit"
                            >
                                ✏️
                                <span>Edit</span>
                            </a>


                            <form
                                action="/admin/users/${user.id}/delete"
                                method="POST"
                                class="delete-user-form"
                            >

                                <button
                                    type="submit"
                                    class="btn-user-delete"
                                >
                                    🗑️
                                    <span>Hapus</span>
                                </button>

                            </form>

                        </div>

                    </div>
                `;

            })
            .join("");

}


/*
|--------------------------------------------------------------------------
| RENDER PAGINATION
|--------------------------------------------------------------------------
*/

function renderPagination(
    pagination,
    query
) {

    const container =
        document.getElementById(
            "user-pagination"
        );


    if (!container) {
        return;
    }


    if (
        !pagination ||
        pagination.totalPages <= 1
    ) {

        container.innerHTML = "";

        console.log(
            "PAGINATION HTML:",
            container.innerHTML
        );

        return;
    }


    const currentPage =
        Number(
            pagination.page
        );


    const totalPages =
        Number(
            pagination.totalPages
        );


    const pages = [];


    pages.push(1);


    const start =
        Math.max(
            2,
            currentPage - 1
        );


    const end =
        Math.min(
            totalPages - 1,
            currentPage + 1
        );


    if (start > 2) {
        pages.push("...");
    }


    for (
        let page = start;
        page <= end;
        page++
    ) {

        pages.push(page);

    }


    if (end < totalPages - 1) {
        pages.push("...");
    }


    if (totalPages > 1) {
        pages.push(totalPages);
    }


    let html = `
        <div class="pagination">
    `;


    if (currentPage > 1) {

        html += `
            <button
                type="button"
                class="pagination-link"
                data-live-page="${currentPage - 1}"
            >
                ‹
            </button>
        `;

    }


    pages.forEach(page => {

        if (page === "...") {

            html += `
                <span class="pagination-dots">
                    …
                </span>
            `;

            return;
        }


        html += `
            <button
                type="button"
                class="pagination-link ${
                    page === currentPage
                        ? "active"
                        : ""
                }"
                data-live-page="${page}"
            >
                ${page}
            </button>
        `;

    });


    if (currentPage < totalPages) {

        html += `
            <button
                type="button"
                class="pagination-link"
                data-live-page="${currentPage + 1}"
            >
                ›
            </button>
        `;

    }


    html += `
        </div>
    `;


    container.innerHTML =
        html;


    /*
    |--------------------------------------------------------------------------
    | Event tombol pagination JSON
    |--------------------------------------------------------------------------
    */

    container
        .querySelectorAll(
            "[data-live-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const page =
                        Number(
                            button.dataset.livePage
                        );


                    loadSearchPage(
                        query,
                        page
                    );

                }
            );

        });

}


/*
|--------------------------------------------------------------------------
| HTML ESCAPE
|--------------------------------------------------------------------------
*/

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}