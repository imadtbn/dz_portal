"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll("#carte-promo .share-promo");

    buttons.forEach(button => {

        button.addEventListener("click", async () => {

            const title = button.dataset.title || document.title;

            const text = button.dataset.text || "";

            const url = button.dataset.url || window.location.href;

            const shareData = {
                title,
                text,
                url
            };

            try {

                if (navigator.share) {

                    await navigator.share(shareData);

                } else {

                    await navigator.clipboard.writeText(url);

                    showToast("تم نسخ رابط البطاقة إلى الحافظة");

                }

            } catch (err) {

                if (err.name !== "AbortError") {

                    console.error(err);

                    showToast("تعذر مشاركة البطاقة");

                }

            }

        });

    });

});

/* Toast */

function showToast(message) {

    let toast = document.getElementById("promo-toast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "promo-toast";

        toast.className = "promo-toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}