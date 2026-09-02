(() => {
    "use strict";

    const triggers = document.querySelectorAll(".search-trigger");
    if (!triggers.length) return;

    const CARD_SELECTORS = [
        ".service-item",
        ".train-card",
        ".promo-card",
        ".video-card",
        ".support-card",
        ".contact-card"
    ];
    const RESULT_LIMIT = 8;
    const pageTitle = document.querySelector(".sector-hero h2, .sector-hero h1, main h1, h1")?.textContent.trim()
        || document.title.split("|")[0].trim();
    const pageDescription = document.querySelector('meta[name="description"]')?.content || "";
    const pageKeywords = document.querySelector('meta[name="keywords"]')?.content || "";

    function normalizeSearchText(value) {
        return String(value || "")
            .toLocaleLowerCase("ar")
            .normalize("NFKC")
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
            .replace(/[أإآٱ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ؤ/g, "و")
            .replace(/ئ/g, "ي")
            .replace(/ة/g, "ه")
            .replace(/ـ/g, "")
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .trim();
    }

    function escapeHTML(value) {
        return String(value || "").replace(/[&<>'"]/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[character]));
    }

    function getCardLink(card) {
        const link = card.matches("a[href]") ? card : card.querySelector("a[href]");
        const href = link?.getAttribute("href") || "";
        if (href && !href.startsWith("javascript:")) return href;
        if (card.id) return `#${card.id}`;
        const section = card.closest(".section-card");
        return section?.id ? `#${section.id}` : "#";
    }

    function getCardTitle(card, sectionTitle) {
        return card.querySelector("h2, h3, h4, h5, .service-title, strong")?.textContent.trim()
            || sectionTitle
            || pageTitle;
    }

    function buildLocalSearchIndex() {
        const items = [];
        const seen = new Set();
        const selector = CARD_SELECTORS.join(", ");

        document.querySelectorAll(selector).forEach(card => {
            if (card.closest("footer, .sidebar, .quick-links, .quick-access")) return;

            const section = card.closest(".section-card");
            const sectionTitle = section?.querySelector(".section-title, h2, h3")?.textContent.trim() || "";
            const title = getCardTitle(card, sectionTitle);
            const description = card.querySelector("p, .service-description, .promo-description, .video-content")?.textContent.trim()
                || card.textContent.trim().replace(title, "").replace(/\s+/g, " ").slice(0, 300);
            const url = getCardLink(card);
            const key = `${title}|${url}`;

            if (!title || seen.has(key)) return;
            seen.add(key);
            items.push({
                title,
                desc: description || `${pageTitle} - خدمة محلية`,
                url,
                keywords: [pageTitle, pageDescription, pageKeywords, sectionTitle, card.textContent]
            });
        });

        if (!items.length) {
            document.querySelectorAll(".section-card").forEach(section => {
                const title = section.querySelector(".section-title, h2, h3")?.textContent.trim() || pageTitle;
                const description = section.textContent.trim().replace(title, "").replace(/\s+/g, " ").slice(0, 300);
                const url = section.id ? `#${section.id}` : "#";
                items.push({
                    title,
                    desc: description,
                    url,
                    keywords: [pageTitle, pageDescription, pageKeywords, title, description]
                });
            });
        }

        return items;
    }

    function getSearchMatches(rawQuery, index) {
        const query = normalizeSearchText(rawQuery);
        const terms = query.split(/\s+/).filter(term => term.length >= 2);
        if (query.length < 2 || !terms.length) return [];

        return index
            .map(item => {
                const title = normalizeSearchText(item.title);
                const desc = normalizeSearchText(item.desc);
                const keywords = normalizeSearchText(item.keywords.join(" "));
                const searchable = `${title} ${desc} ${keywords}`;
                if (!terms.every(term => searchable.includes(term))) return null;

                let score = 1;
                if (title === query) score += 120;
                if (title.includes(query)) score += 80;
                if (keywords.includes(query)) score += 50;
                if (desc.includes(query)) score += 30;
                terms.forEach(term => {
                    if (title.startsWith(term)) score += 12;
                    else if (title.includes(term)) score += 8;
                    if (keywords.includes(term)) score += 4;
                });
                return { item, score };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "ar"));
    }

    const style = document.createElement("style");
    style.textContent = `
        .local-search-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: none;
            align-items: flex-start;
            justify-content: center;
            padding: 8vh 1rem;
            background: rgba(0, 35, 20, .72);
            backdrop-filter: blur(6px);
        }
        .local-search-dialog {
            width: min(700px, 100%);
            position: relative;
            direction: rtl;
            background: #fff;
            border-radius: 20px;
            padding: 1.25rem;
            box-shadow: 0 20px 50px rgba(0, 0, 0, .25);
        }
        .local-search-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: .9rem;
            color: #006233;
        }
        .local-search-header h3 { margin: 0; font-size: 1.1rem; }
        .local-search-close {
            border: 0;
            background: transparent;
            color: #777;
            cursor: pointer;
            font-size: 1.25rem;
        }
        .local-search-box-wrapper { position: relative; display: flex; align-items: center; }
        .local-search-input {
            width: 100%;
            height: 60px;
            border: 1px solid #dce8df;
            outline: none;
            border-radius: 16px;
            padding: 0 20px 0 130px;
            font-size: 1rem;
            direction: rtl;
            background: #fff;
            box-shadow: 0 8px 25px rgba(0, 98, 51, .1);
        }
        .local-search-input:focus { border-color: #006233; box-shadow: 0 10px 30px rgba(0, 98, 51, .18); }
        .local-search-action {
            position: absolute;
            left: 10px;
            width: 44px;
            height: 44px;
            border: 0;
            border-radius: 12px;
            background: #006233;
            color: #fff;
            cursor: pointer;
        }
        .local-search-voice { left: 60px; background: #b71c1c; }
        .local-search-results {
            display: none;
            max-height: 420px;
            overflow-y: auto;
            margin-top: .8rem;
            border-radius: 16px;
            box-shadow: 0 12px 35px rgba(0, 0, 0, .12);
        }
        .local-search-result {
            display: flex;
            align-items: center;
            gap: .85rem;
            padding: .85rem;
            color: #222;
            text-decoration: none;
            border-bottom: 1px solid #f1f1f1;
            transition: .2s ease;
        }
        .local-search-result:hover { background: #f8f8f8; transform: translateX(-3px); }
        .local-search-result-icon {
            width: 42px;
            height: 42px;
            min-width: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: #006233;
            color: #fff;
        }
        .local-search-result h4 { margin: 0; font-size: .96rem; }
        .local-search-result p { margin: .25rem 0 0; color: #666; font-size: .8rem; }
        .local-search-empty { padding: 1rem; text-align: center; color: #777; }
        .local-search-scope { margin-top: .8rem; color: #6b776f; text-align: center; font-size: .78rem; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.className = "local-search-overlay";
    overlay.innerHTML = `
        <div class="local-search-dialog" role="dialog" aria-modal="true" aria-labelledby="localSearchTitle">
            <div class="local-search-header">
                <h3 id="localSearchTitle"><i class="fas fa-search"></i> البحث في هذه الصفحة</h3>
                <button class="local-search-close" type="button" aria-label="إغلاق البحث" title="إغلاق البحث">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="local-search-box-wrapper">
                <input class="local-search-input" type="search" autocomplete="off"
                    placeholder="ابحث في خدمات هذه الصفحة..." aria-label="البحث في خدمات الصفحة"
                    aria-controls="localSearchResults" aria-autocomplete="list">
                <button class="local-search-action" type="button" aria-label="تنفيذ البحث" title="تنفيذ البحث">
                    <i class="fas fa-search"></i>
                </button>
                <button class="local-search-action local-search-voice" type="button" aria-label="البحث الصوتي"
                    title="البحث الصوتي">
                    <i class="fas fa-microphone"></i>
                </button>
            </div>
            <div class="local-search-results" id="localSearchResults" role="listbox"></div>
            <div class="local-search-scope">نطاق البحث: الخدمات والبطاقات الموجودة في هذه الصفحة فقط</div>
        </div>
    `;
    document.body.appendChild(overlay);

    const dialog = overlay.querySelector(".local-search-dialog");
    const input = overlay.querySelector(".local-search-input");
    const results = overlay.querySelector(".local-search-results");
    const closeButton = overlay.querySelector(".local-search-close");
    const submitButton = overlay.querySelector(".local-search-action");
    const voiceButton = overlay.querySelector(".local-search-voice");
    let searchIndex = [];
    let previousOverflow = "";

    function renderResults() {
        const matches = getSearchMatches(input.value, searchIndex);
        results.innerHTML = "";
        if (normalizeSearchText(input.value).length < 2) {
            results.style.display = "none";
            return matches;
        }
        if (!matches.length) {
            results.innerHTML = '<div class="local-search-empty" role="status">لا توجد نتائج داخل هذه الصفحة</div>';
            results.style.display = "block";
            return matches;
        }
        results.innerHTML = matches.slice(0, RESULT_LIMIT).map(({ item }) => `
            <a class="local-search-result" role="option" href="${escapeHTML(item.url)}">
                <div class="local-search-result-icon"><i class="fas fa-search"></i></div>
                <div>
                    <h4>${escapeHTML(item.title)}</h4>
                    <p>${escapeHTML(item.desc)}</p>
                </div>
            </a>
        `).join("");
        results.style.display = "block";
        return matches;
    }

    function closeSearch() {
        overlay.style.display = "none";
        document.body.style.overflow = previousOverflow;
    }

    function openSearch() {
        searchIndex = buildLocalSearchIndex();
        input.value = "";
        results.innerHTML = '<div class="local-search-empty">ابدأ بكتابة اسم خدمة أو معاملة</div>';
        results.style.display = "block";
        previousOverflow = document.body.style.overflow;
        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";
        window.setTimeout(() => input.focus(), 0);
    }

    let localSearchDebounceTimer = null;

    function handleLocalSearchInput() {
        const matches = renderResults();
        const query = input.value.trim();

        clearTimeout(localSearchDebounceTimer);
        if (query.length >= 2) {
            localSearchDebounceTimer = setTimeout(() => {
                if (typeof window.dzTrackEvent === "function") {
                    window.dzTrackEvent("search", {
                        search_term: query,
                        search_type: "sector_local_search",
                        results_count: matches.length,
                        page_sector: pageTitle
                    });
                }
            }, 600);
        }
    }

    triggers.forEach(trigger => trigger.addEventListener("click", event => {
        event.preventDefault();
        openSearch();
        if (typeof window.dzTrackEvent === "function") {
            window.dzTrackEvent("open_local_search", { page_sector: pageTitle });
        }
    }));
    closeButton.addEventListener("click", closeSearch);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeSearch();
    });
    input.addEventListener("input", handleLocalSearchInput);
    submitButton.addEventListener("click", handleLocalSearchInput);

    results.addEventListener("click", event => {
        const itemLink = event.target.closest(".local-search-result");
        if (!itemLink) return;

        const title = itemLink.querySelector("h4")?.textContent?.trim() || "";
        const url = itemLink.getAttribute("href") || "";
        if (typeof window.dzTrackEvent === "function") {
            window.dzTrackEvent("select_content", {
                content_type: "sector_search_result",
                item_name: title,
                item_id: url,
                search_term: input.value.trim(),
                page_sector: pageTitle
            });
        }
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Escape") closeSearch();
        if (event.key === "Enter") {
            const matches = renderResults();
            if (matches.length) {
                if (typeof window.dzTrackEvent === "function") {
                    window.dzTrackEvent("select_content", {
                        content_type: "sector_search_result_enter",
                        item_name: matches[0].item.title,
                        item_id: matches[0].item.url,
                        search_term: input.value.trim(),
                        page_sector: pageTitle
                    });
                }
                window.location.href = matches[0].item.url;
            }
        }
    });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        voiceButton.style.display = "none";
    } else {
        const recognition = new SpeechRecognition();
        let listening = false;
        recognition.lang = "ar-DZ";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const updateVoiceButton = isListening => {
            listening = isListening;
            voiceButton.setAttribute("aria-pressed", String(isListening));
            voiceButton.title = isListening ? "إيقاف البحث الصوتي" : "البحث الصوتي";
            voiceButton.innerHTML = `<i class="fas ${isListening ? "fa-stop" : "fa-microphone"}"></i>`;
        };

        voiceButton.addEventListener("click", () => {
            if (listening) recognition.stop();
            else {
                try { recognition.start(); } catch (error) { updateVoiceButton(false); }
            }
        });
        recognition.onstart = () => updateVoiceButton(true);
        recognition.onresult = event => {
            input.value = event.results[0][0].transcript.trim();
            renderResults();
        };
        recognition.onerror = () => updateVoiceButton(false);
        recognition.onend = () => updateVoiceButton(false);
        updateVoiceButton(false);
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && overlay.style.display === "flex") closeSearch();
    });
})();
