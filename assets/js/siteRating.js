(() => {
    "use strict";

    const scriptUrl = document.currentScript?.src || "";
    const dataUrl = scriptUrl
        ? new URL("../data/site-rating.json", scriptUrl).href
        : "assets/data/site-rating.json";
    const numberFormatter = new Intl.NumberFormat("ar-DZ");
    const dateFormatter = new Intl.DateTimeFormat("ar-DZ", { dateStyle: "medium" });

    function starMarkup(average) {
        const roundedAverage = Math.round(average * 2) / 2;
        return Array.from({ length: 5 }, (_, index) => {
            const position = index + 1;
            const type = roundedAverage >= position ? "full" : roundedAverage >= position - 0.5 ? "half" : "empty";
            const icon = type === "half" ? "fa-star-half-stroke" : "fa-star";
            return `<i class="fas ${icon} rating-star rating-star-${type}" aria-hidden="true"></i>`;
        }).join("");
    }

    function distributionMarkup(distribution, total) {
        return [5, 4, 3, 2, 1].map(score => {
            const count = Number(distribution?.[String(score)] || 0);
            const width = total ? (count / total) * 100 : 0;
            return `<span class="rating-distribution-row"><span>${score}<i class="fas fa-star" aria-hidden="true"></i></span><span class="rating-distribution-bar"><span style="width:${width.toFixed(2)}%"></span></span><small>${numberFormatter.format(count)}</small></span>`;
        }).join("");
    }

    function renderRating(data) {
        const average = Number(data.average) || 0;
        const responses = Number(data.responses) || 0;
        const date = data.syncedAt ? new Date(data.syncedAt) : null;
        const dateLabel = date && !Number.isNaN(date.valueOf()) ? dateFormatter.format(date) : "";

        document.querySelectorAll("[data-rating-widget]").forEach(widget => {
            const stars = widget.querySelector("[data-rating-stars]");
            const value = widget.querySelector("[data-rating-value]");
            const meta = widget.querySelector("[data-rating-meta]");
            const distribution = widget.querySelector("[data-rating-distribution]");
            const updated = widget.querySelector("[data-rating-updated]");

            if (stars) {
                stars.innerHTML = starMarkup(average);
                stars.setAttribute("aria-label", `تقييم الموقع ${average.toFixed(2)} من 5`);
            }
            if (value) value.textContent = `${average.toFixed(2)} / 5`;
            if (meta) meta.textContent = `استنادًا إلى ${numberFormatter.format(responses)} تقييمًا`;
            if (distribution) distribution.innerHTML = distributionMarkup(data.distribution, responses);
            if (updated) updated.textContent = dateLabel ? `آخر مزامنة: ${dateLabel}` : "";
        });
    }

    function renderError() {
        document.querySelectorAll("[data-rating-widget]").forEach(widget => {
            const meta = widget.querySelector("[data-rating-meta]");
            if (meta) meta.textContent = "تعذر تحميل التقييمات حاليًا";
        });
    }

    fetch(dataUrl, { cache: "no-cache" })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(renderRating)
        .catch(renderError);
})();
