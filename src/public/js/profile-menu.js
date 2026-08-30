document.addEventListener("DOMContentLoaded", () => {

    const profileToggle =
        document.getElementById("profileToggle");

    const profileDropdown =
        document.getElementById("profileDropdown");


    if (
        !profileToggle ||
        !profileDropdown
    ) {
        return;
    }


    profileToggle.addEventListener(
        "click",
        (e) => {

            e.stopPropagation();


            const isOpen =
                profileDropdown.classList.toggle(
                    "show"
                );


            profileToggle.classList.toggle(
                "open",
                isOpen
            );


            profileToggle.setAttribute(
                "aria-expanded",
                isOpen
            );

        }
    );


    document.addEventListener(
        "click",
        () => {

            profileDropdown.classList.remove(
                "show"
            );


            profileToggle.classList.remove(
                "open"
            );


            profileToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        }
    );

});