(() => {
    "use strict";

    const totalServicesEl = document.getElementById("totalServices");
    const totalSectorsEl = document.getElementById("totalSectors");
    const averageServicesEl = document.getElementById("averageServices");
    const topSectorCountEl = document.getElementById("topSectorCount");
    const topSectorLabelEl = document.getElementById("topSectorLabel");
    const sectorListEl = document.getElementById("sectorList");
    const statsStateEl = document.getElementById("statsState");
    const statsStatusEl = document.getElementById("statsStatus");
    const sectorFilterEl = document.getElementById("sectorFilter");
    const numberFormatter = new Intl.NumberFormat("ar-DZ");

    const serviceSelectors = [
        ".service-item",
        ".train-card",
        ".promo-card",
        ".video-card"
    ];

    function formatNumber(value) {
        return numberFormatter.format(Number(value) || 0);
    }

    async function getSectorLinks() {
        const indexUrl = new URL("../index.html", window.location.href);
        const response = await fetch(indexUrl.href, { credentials: "same-origin" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const indexDocument = new DOMParser().parseFromString(html, "text/html");
        const links = [...indexDocument.querySelectorAll(".sector-card[href]")]
            .map(link => ({
                title: link.querySelector("h3, h4")?.textContent.trim()
                    || link.getAttribute("aria-label")
                    || link.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
                url: new URL(link.getAttribute("href"), indexUrl.href).href
            }))
            .filter(item => item.url.includes("/sectors/") && item.title);

        return [...new Map(links.map(item => [item.url, item])).values()];
    }

    function countServices(documentObject) {
        const standardCount = documentObject.querySelectorAll(".service-item").length;
        if (standardCount) return standardCount;

        return serviceSelectors.slice(1)
            .reduce((total, selector) => total + documentObject.querySelectorAll(selector).length, 0);
    }

    function getPageTitle(documentObject, fallback) {
        const titleElement = documentObject.querySelector(".sector-hero h2")
            || documentObject.querySelector(".sector-hero h1")
            || documentObject.querySelector("main h1")
            || documentObject.querySelector("h1");
        return titleElement?.textContent.trim()
            || documentObject.title.split("|")[0].trim()
            || fallback;
    }

    async function fetchSector(link) {
        try {
            const response = await fetch(link.url, { credentials: "same-origin" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const page = new DOMParser().parseFromString(html, "text/html");
            return {
                ...link,
                title: getPageTitle(page, link.title),
                count: countServices(page),
                ok: true
            };
        } catch (error) {
            return { ...link, count: 0, ok: false, error: error.message };
        }
    }

    function renderRows(rows) {
        const query = (sectorFilterEl?.value || "").trim().toLocaleLowerCase("ar");
        const filtered = rows.filter(row => row.title.toLocaleLowerCase("ar").includes(query));
        const maximum = Math.max(...rows.map(row => row.count), 1);

        if (!filtered.length) {
            sectorListEl.hidden = false;
            sectorListEl.innerHTML = '<div class="stats-empty">لا توجد قطاعات مطابقة.</div>';
            return;
        }

        sectorListEl.hidden = false;
        sectorListEl.innerHTML = filtered.map(row => {
            const width = Math.max((row.count / maximum) * 100, 2);
            const status = row.ok ? "" : " (تعذر التحميل)";
            return `
                <div class="sector-row">
                    <a class="sector-name" href="${row.url.replace(/"/g, "&quot;")}">${row.title.replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;", "'":"&#39;", '"':"&quot;"}[character]))}${status}</a>
                    <div class="sector-bar" aria-label="${formatNumber(row.count)} خدمة"><div class="sector-bar-fill" style="width:${width}%"></div></div>
                    <span class="sector-count">${formatNumber(row.count)} خدمة</span>
                </div>
            `;
        }).join("");
    }

    function renderSummary(rows) {
        const loadedRows = rows.filter(row => row.ok);
        const totalServices = loadedRows.reduce((sum, row) => sum + row.count, 0);
        const average = loadedRows.length ? totalServices / loadedRows.length : 0;
        const topSector = [...loadedRows].sort((a, b) => b.count - a.count)[0];

        totalServicesEl.textContent = formatNumber(totalServices);
        totalSectorsEl.textContent = formatNumber(loadedRows.length);
        averageServicesEl.textContent = average.toLocaleString("ar-DZ", { maximumFractionDigits: 1 });
        topSectorCountEl.textContent = topSector ? formatNumber(topSector.count) : "—";
        topSectorLabelEl.textContent = topSector ? `أعلى قطاع: ${topSector.title}` : "أعلى قطاع";

        renderRows(rows);
        const failedCount = rows.length - loadedRows.length;
        const timestamp = new Intl.DateTimeFormat("ar-DZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
        statsStatusEl.textContent = failedCount
            ? `تم تحليل ${formatNumber(loadedRows.length)} قطاعًا. تعذر تحميل ${formatNumber(failedCount)}. آخر تحديث: ${timestamp}`
            : `تم احتساب الخدمات من ${formatNumber(loadedRows.length)} قطاعًا مباشرة من صفحات الموقع. آخر تحديث: ${timestamp}`;
    }

    async function loadStatistics() {
        let links;
        try {
            links = await getSectorLinks();
        } catch (error) {
            statsStateEl.className = "stats-error";
            statsStateEl.textContent = "تعذر تحميل قائمة القطاعات من الصفحة الرئيسية.";
            return;
        }
        if (!links.length) {
            statsStateEl.className = "stats-error";
            statsStateEl.textContent = "لم يتم العثور على روابط قطاعات صالحة في الصفحة الرئيسية.";
            return;
        }

        const rows = [];
        const batchSize = 8;
        for (let index = 0; index < links.length; index += batchSize) {
            const batch = await Promise.all(links.slice(index, index + batchSize).map(fetchSector));
            rows.push(...batch);
            statsStateEl.textContent = `جارٍ تحليل القطاع ${formatNumber(Math.min(index + batch.length, links.length))} من ${formatNumber(links.length)}...`;
        }

        statsStateEl.hidden = true;
        renderSummary(rows.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "ar")));
        sectorFilterEl?.addEventListener("input", () => renderRows(rows));
    }

    loadStatistics();
})();
