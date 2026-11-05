// Configuration for Student DZ
const CONFIG = {
    BASE_PATH: "/student-dz",
    API: {
        UNIVERSITIES: "/data/universities.json",
        ECOLES: "/data/ecoles.json",
        RESIDENCES: "/data/residences.json",
        VERIFICATION_STATUS: "/data/verification-status.json",
        PLATFORMS: "/data/platforms.json",
        SETTINGS: "/data/settings.json",
        FEEDBACK_SETTINGS: "/data/feedback-settings.json"
    },
    getUrl: function(path) {
        if (!path) return this.BASE_PATH + "/";
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `${this.BASE_PATH}/${cleanPath}`;
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;

/* Dynamic counters for universities, schools/institutes and residences. */
(function initDirectoryCounter() {
    const path = window.location.pathname;
    let type = null;
    let title = '';
    let dataPath = '';
    if (path.includes('/universities/')) { type = 'universities'; title = 'جامعة'; dataPath = CONFIG.API.UNIVERSITIES; }
    else if (path.includes('/ecoles/')) { type = 'ecoles'; title = 'مدرسة / معهد'; dataPath = CONFIG.API.ECOLES; }
    else if (path.includes('/residences/')) { type = 'residences'; title = 'إقامة جامعية'; dataPath = CONFIG.API.RESIDENCES; }
    else return;
    const normalize = value => String(value ?? '').toLowerCase().trim();
    function getRecords(data) {
        if (type === 'universities') return Array.isArray(data?.universities) ? data.universities : [];
        if (type === 'residences') return Array.isArray(data?.residences) ? data.residences : [];
        return Array.isArray(data) ? data : [];
    }
    function createCounter() {
        if (document.getElementById('directoryDataCounter')) return;
        const intro = document.querySelector('main .page-intro');
        const heading = document.querySelector('main h1.section-title');
        const anchor = intro || heading;
        if (!anchor) return;
        const counter = document.createElement('div');
        counter.id = 'directoryDataCounter'; counter.className = 'directory-data-counter'; counter.setAttribute('aria-live', 'polite');
        counter.innerHTML = `<i class="fa-solid ${type === 'universities' ? 'fa-building-columns' : type === 'ecoles' ? 'fa-school' : 'fa-building'}"></i><span class="directory-counter-number" id="directoryCounterNumber">0</span><span class="directory-counter-label" id="directoryCounterLabel">${title}</span>`;
        anchor.insertAdjacentElement('afterend', counter);
    }
    function addStyles() {
        if (document.getElementById('directoryCounterStyles')) return;
        const style = document.createElement('style'); style.id = 'directoryCounterStyles';
        style.textContent = `.directory-data-counter{display:flex;align-items:center;justify-content:center;gap:10px;width:fit-content;max-width:100%;margin:0 auto 22px;padding:11px 18px;border:1px solid var(--border-color);border-radius:var(--radius-lg,14px);background:var(--bg-color,var(--bg-main));color:var(--text-main,var(--text-color));box-shadow:var(--shadow);box-sizing:border-box}.directory-data-counter>i{color:var(--primary-color);font-size:1.2rem}.directory-counter-number{color:var(--primary-color);font-size:1.35rem;font-weight:800;line-height:1;min-width:1.5ch;text-align:center}.directory-counter-label{font-weight:700}@media(max-width:480px){.directory-data-counter{margin-bottom:18px;padding:10px 15px;font-size:.92rem}.directory-counter-number{font-size:1.2rem}}`;
        document.head.appendChild(style);
    }
    function setCount(count, filtered) {
        const number = document.getElementById('directoryCounterNumber'); const label = document.getElementById('directoryCounterLabel');
        if (!number || !label) return;
        number.textContent = Number(count).toLocaleString('ar-DZ'); label.textContent = filtered ? `${title} (المعروض)` : title;
    }
    function filterRecords(records) {
        const search = document.getElementById('searchInput'); const gender = document.getElementById('genderFilter');
        const term = normalize(search?.value); const genderValue = gender?.value || '';
        if (!term && !genderValue) return records;
        return records.filter(item => {
            if (type === 'universities') {
                const specialties = Array.isArray(item.specialties) ? item.specialties : [];
                return normalize(item.name).includes(term) || normalize(item.wilaya).includes(term) || specialties.some(x => normalize(x).includes(term)) || normalize(item.description).includes(term);
            }
            if (type === 'ecoles') {
                const specialties = Array.isArray(item.specialties) ? item.specialties : [];
                return normalize(item.name).includes(term) || normalize(item.wilaya).includes(term) || specialties.some(x => normalize(x).includes(term));
            }
            return (normalize(item.name).includes(term) || normalize(item.wilaya).includes(term)) && (!genderValue || item.gender === genderValue);
        });
    }
    async function start() {
        addStyles(); createCounter();
        try {
            const response = await fetch(CONFIG.getUrl(dataPath)); if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const records = getRecords(await response.json());
            const update = () => { const filtered = filterRecords(records); setCount(filtered.length, filtered.length !== records.length); };
            update();
            ['searchInput', 'genderFilter'].forEach(id => { const element = document.getElementById(id); if (element) element.addEventListener(id === 'genderFilter' ? 'change' : 'input', update); });
        } catch (error) { console.error('Directory counter error:', error); setCount(0, false); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();

/* Global feedback. */
(function loadGlobalFeedback() {
    function load() {
        if (window.__studentDzFeedbackLoader) return;
        window.__studentDzFeedbackLoader = true;
        const src = `${CONFIG.BASE_PATH}/assets/js/feedback.js`;
        if ([...document.scripts].some(script => script.src.includes('/assets/js/feedback.js'))) return;
        const script = document.createElement('script'); script.src = src; script.defer = true; document.head.appendChild(script);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true }); else load();
})();

/* Shared AdSense loader: one responsive ad unit per normal site page. */
(function loadGlobalAds() {
    const EXCLUDED = ['/404.html', '/offline.html'];
    let settings = null;
    function isEligible() { const path = window.location.pathname.replace(/\/+$/, '') || '/'; return !EXCLUDED.some(item => path.endsWith(item)); }
    function getAdType() {
        const path = window.location.pathname.replace(/\/+$/, '');
        if (path === CONFIG.BASE_PATH || path === `${CONFIG.BASE_PATH}/index.html`) return 'homepage';
        if (path.includes(`${CONFIG.BASE_PATH}/tools/`)) return 'tool';
        return 'content';
    }
    function addStylesheet() {
        if (document.getElementById('studentDzAdsCss')) return;
        const link = document.createElement('link'); link.id = 'studentDzAdsCss'; link.rel = 'stylesheet'; link.href = `${CONFIG.BASE_PATH}/assets/css/ads.css`; document.head.appendChild(link);
    }
    function loadAdSenseScript(client) {
        if (document.querySelector('script[data-student-dz-adsense]')) return Promise.resolve();
        return new Promise(resolve => {
            const script = document.createElement('script');
            script.async = true; script.crossOrigin = 'anonymous'; script.dataset.studentDzAdsense = 'true';
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
            script.onload = resolve; script.onerror = resolve; document.head.appendChild(script);
        });
    }
    function findPlacement(type) {
        const main = document.querySelector('main'); if (!main) return null;
        if (type === 'homepage') return main.querySelector('.hero') || main.firstElementChild;
        if (type === 'tool') return main.querySelector('.tool-container,.tool-header,.tool-card,.page-intro') || main.firstElementChild;
        return main.querySelector('.page-intro,.section-title,.breadcrumb') || main.firstElementChild;
    }
    function createAd(type) {
        if (document.getElementById('globalAdUnit') || document.querySelector('.dz-ad-container .adsbygoogle')) return null;
        const placement = findPlacement(type); const slot = settings?.ads?.slots?.[type]; const client = settings?.ads?.publisherId;
        if (!placement || !slot?.id || !client || settings?.ads?.enabled !== true) return null;
        const wrapper = document.createElement('div'); wrapper.id = 'globalAdUnit'; wrapper.className = `dz-ad-container dz-ad-container--${type} dz-ad-container--pending`; wrapper.setAttribute('aria-label', 'إعلان'); wrapper.setAttribute('role', 'complementary');
        const label = document.createElement('span'); label.className = 'dz-ad-label'; label.textContent = 'إعلان';
        const ins = document.createElement('ins'); ins.className = 'adsbygoogle dz-ad-placeholder'; ins.style.display = 'block'; ins.dataset.adClient = client; ins.dataset.adSlot = slot.id; ins.dataset.adFormat = slot.format || 'auto';
        if (slot.fullWidthResponsive === true) ins.dataset.fullWidthResponsive = 'true';
        if (slot.layoutKey) ins.dataset.adLayoutKey = slot.layoutKey;
        wrapper.append(label, ins); placement.insertAdjacentElement('afterend', wrapper);
        return wrapper;
    }
    function activateAd(wrapper, client) {
        if (!wrapper || wrapper.dataset.adInitialized === 'true') return;
        wrapper.dataset.adInitialized = 'true';
        loadAdSenseScript(client).then(() => {
            wrapper.classList.remove('dz-ad-container--pending');
            window.adsbygoogle = window.adsbygoogle || [];
            try { window.adsbygoogle.push({}); } catch (error) { console.warn('AdSense initialization:', error); }
        });
    }
    function lazyActivateAd(wrapper, client) {
        if (!('IntersectionObserver' in window)) { activateAd(wrapper, client); return; }
        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer.disconnect();
            activateAd(wrapper, client);
        }, { rootMargin: '600px 0px' });
        observer.observe(wrapper);
    }
    async function init() {
        if (!isEligible()) return; addStylesheet();
        try {
            const response = await fetch(CONFIG.getUrl(CONFIG.API.SETTINGS), { cache: 'no-store' }); if (!response.ok) throw new Error(`HTTP ${response.status}`);
            settings = await response.json(); if (settings?.ads?.enabled !== true) return;
            const client = settings?.ads?.publisherId; if (!client) return;
            const wrapper = createAd(getAdType());
            lazyActivateAd(wrapper, client);
        } catch (error) { console.error('Global AdSense error:', error); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

/* Shared page-sharing controls: available even on pages without the navigation bundle. */
(function loadStudentShareTools() {
    const base = window.CONFIG?.BASE_PATH || '/student-dz';
    if (!document.getElementById('studentDzShareToolsCss')) {
        const link = document.createElement('link');
        link.id = 'studentDzShareToolsCss';
        link.rel = 'stylesheet';
        link.href = base + '/assets/css/share-tools.css';
        document.head.appendChild(link);
    }
    if (window.__studentDzShareToolsLoader || document.querySelector('script[data-student-share-tools]')) return;
    window.__studentDzShareToolsLoader = true;
    const script = document.createElement('script');
    script.src = base + '/assets/js/share-tools.js';
    script.dataset.studentShareTools = 'true';
    script.defer = true;
    document.head.appendChild(script);
})();
