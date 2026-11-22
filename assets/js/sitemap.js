(() => {
  "use strict";
  const DATA_URL = "assets/data/sitemap-data.json";
  const root = document.getElementById("sitemap-content");
  const searchInput = document.getElementById("sitemap-search");
  const clearButton = document.getElementById("clear-search");
  const filtersRoot = document.getElementById("section-filters");
  const status = document.getElementById("results-status");
  const error = document.getElementById("load-error");
  const sectionOrder = ["القطاعات والخدمات","الأدوات الرقمية","الإجراءات الرقمية","الإشعارات","الفيديوهات والشروحات","صفحات البوابة","الأدلة","الصفحة الرئيسية"];
  const typeLabels = {
    sector:"قطاع", service:"خدمة", "dynamic-service":"خدمة تفاعلية",
    tool:"أداة رقمية", "tools-index":"دليل الأدوات", procedure:"إجراء",
    notice:"إشعار", "notices-index":"دليل الإشعارات", video:"فيديو",
    "video-index":"مكتبة الفيديو", guide:"دليل", page:"صفحة", home:"الرئيسية"
  };
  const icons = {
    "القطاعات والخدمات":"fa-building-columns","الأدوات الرقمية":"fa-toolbox",
    "الإجراءات الرقمية":"fa-list-check","الإشعارات":"fa-bell",
    "الفيديوهات والشروحات":"fa-circle-play","صفحات البوابة":"fa-layer-group",
    "الأدلة":"fa-book-open","الصفحة الرئيسية":"fa-house"
  };
  let records = [];
  let activeSection = "all";

  function normalize(value) {
    return String(value || "").toLocaleLowerCase("ar")
      .normalize("NFD").replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
      .replace(/[ـ\s]+/g, " ").trim();
  }
  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function createLink(record) {
    const link = make("a", "directory-link");
    link.href = record.path.split("/").map(encodeURIComponent).join("/");
    link.dataset.record = "true";
    link.dataset.section = record.section_name;
    link.dataset.path = record.path;
    link.dataset.search = normalize([
      record.title, record.section_name, record.sector_name,
      ...(Array.isArray(record.keywords) ? record.keywords : [])
    ].filter(Boolean).join(" "));
    const title = make("span", "link-title", record.title || record.path);
    const type = make("span", "link-type", typeLabels[record.content_type] || "صفحة");
    link.append(title, type);
    return link;
  }
  function makeSectionGroup(section, items) {
    const details = make("details", "section-group");
    details.dataset.section = section;
    const summary = make("summary", "section-summary");
    const titleWrap = make("span", "summary-title");
    const iconWrap = make("span", "summary-icon");
    const icon = make("i");
    icon.className = "fa-solid " + (icons[section] || "fa-folder");
    icon.setAttribute("aria-hidden", "true");
    iconWrap.append(icon);
    titleWrap.append(iconWrap, make("strong", "", section));
    const meta = make("span", "summary-meta");
    meta.append(make("span", "summary-count", String(items.length)));
    const chevron = make("i", "summary-chevron fa-solid fa-chevron-down");
    chevron.setAttribute("aria-hidden", "true");
    meta.append(chevron);
    summary.append(titleWrap, meta);
    details.append(summary);
    const body = make("div", "section-body");
    if (section === "القطاعات والخدمات") {
      const sectorList = make("div", "sector-list");
      const parents = items.filter(item => item.content_type === "sector");
      const children = items.filter(item => item.content_type === "service" || item.content_type === "dynamic-service");
      const used = new Set();
      parents.forEach(parent => {
        const related = children.filter(child => child.parent_sector_path === parent.path);
        related.forEach(child => used.add(child.path));
        const group = make("details", "sector-group");
        group.dataset.sector = parent.sector_name || parent.title;
        const head = make("summary", "sector-summary");
        const label = make("span", "sector-label");
        const building = make("i");
        building.className = "fa-solid fa-building";
        building.setAttribute("aria-hidden", "true");
        label.append(building, make("span", "", parent.sector_name || parent.title));
        const meta = make("span", "summary-meta");
        meta.append(make("span", "summary-count", String(related.length + 1)));
        const chevron = make("i", "summary-chevron fa-solid fa-chevron-down");
        chevron.setAttribute("aria-hidden", "true");
        meta.append(chevron);
        head.append(label, meta);
        group.append(head);
        const links = make("div", "sector-links");
        links.append(createLink(parent));
        related.forEach(child => links.append(createLink(child)));
        group.append(links);
        sectorList.append(group);
      });
      const orphans = items.filter(item => item.content_type !== "sector" && !used.has(item.path));
      if (orphans.length) {
        const grid = make("div", "directory-grid");
        orphans.forEach(item => grid.append(createLink(item)));
        sectorList.append(grid);
      }
      body.append(sectorList);
    } else {
      const grid = make("div", "directory-grid");
      items.forEach(item => grid.append(createLink(item)));
      body.append(grid);
    }
    details.append(body);
    return details;
  }
  function buildFilters() {
    filtersRoot.replaceChildren();
    const sections = [...new Set(records.map(item => item.section_name))].sort((a,b) => {
      const ai = sectionOrder.indexOf(a), bi = sectionOrder.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
    const allButton = make("button", "filter-chip");
    allButton.type = "button";
    allButton.dataset.filter = "all";
    allButton.setAttribute("aria-pressed", "true");
    allButton.append(make("span", "", "كل الأقسام"), make("span", "count", String(records.length)));
    filtersRoot.append(allButton);
    sections.forEach(section => {
      const count = records.filter(item => item.section_name === section).length;
      const button = make("button", "filter-chip");
      button.type = "button";
      button.dataset.filter = section;
      button.setAttribute("aria-pressed", "false");
      button.append(make("span", "", section), make("span", "count", String(count)));
      filtersRoot.append(button);
    });
  }
  function render() {
    root.replaceChildren();
    const grouped = new Map();
    records.forEach(record => {
      if (!grouped.has(record.section_name)) grouped.set(record.section_name, []);
      grouped.get(record.section_name).push(record);
    });
    const sections = [...grouped.keys()].sort((a,b) => {
      const ai = sectionOrder.indexOf(a), bi = sectionOrder.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
    sections.forEach((section, index) => {
      const group = makeSectionGroup(section, grouped.get(section));
      if (index < 2) group.open = true;
      root.append(group);
    });
    if (!records.length) root.append(make("div", "empty-state", "لا توجد صفحات قابلة للعرض في مصدر البيانات."));
    applyFilters();
  }
  function applyFilters() {
    const query = normalize(searchInput.value);
    let visible = 0;
    root.querySelectorAll("[data-record]").forEach(link => {
      const sectionMatch = activeSection === "all" || link.dataset.section === activeSection;
      const textMatch = !query || link.dataset.search.includes(query);
      const show = sectionMatch && textMatch;
      link.hidden = !show;
      if (show) visible++;
    });
    root.querySelectorAll(".sector-group").forEach(group => {
      const hasVisible = Boolean(group.querySelector(".directory-link:not([hidden])"));
      group.hidden = !hasVisible;
      if (query && hasVisible) group.open = true;
    });
    root.querySelectorAll(".section-group").forEach(group => {
      const hasVisible = Boolean(group.querySelector(".directory-link:not([hidden])"));
      group.hidden = !hasVisible;
      if (query && hasVisible) group.open = true;
    });
    root.querySelectorAll(".filter-chip").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeSection));
    });
    clearButton.hidden = !searchInput.value;
    status.textContent = query
      ? "نتائج البحث: " + visible + " من " + records.length + " صفحة."
      : (activeSection === "all" ? "عرض جميع الصفحات المتاحة: " : "عرض قسم " + activeSection + ": ") + visible + " صفحة.";
    let none = root.querySelector(".empty-state");
    if (visible === 0 && !none) {
      none = make("div", "empty-state", "لا توجد نتائج مطابقة. جرّب تغيير عبارة البحث أو القسم.");
      none.dataset.noResults = "true";
      root.append(none);
    } else if (visible > 0 && none && none.dataset.noResults) none.remove();
  }
  function initTheme() {
    const button = document.getElementById("theme-toggle");
    let theme = "light";
    try { theme = localStorage.getItem("dzPortalTheme") === "dark" ? "dark" : "light"; } catch (_) {}
    const apply = value => {
      document.body.classList.toggle("dark-mode", value === "dark");
      button.setAttribute("aria-pressed", String(value === "dark"));
      button.setAttribute("aria-label", value === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الليلي");
      button.innerHTML = '<i class="fa-solid ' + (value === "dark" ? "fa-sun" : "fa-moon") + '" aria-hidden="true"></i>';
    };
    apply(theme);
    button.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      apply(theme);
      try { localStorage.setItem("dzPortalTheme", theme); } catch (_) {}
    });
  }
  async function init() {
    initTheme();
    searchInput.addEventListener("input", applyFilters);
    clearButton.addEventListener("click", () => { searchInput.value = ""; applyFilters(); searchInput.focus(); });
    document.getElementById("reset-filters").addEventListener("click", () => {
      activeSection = "all"; searchInput.value = ""; applyFilters();
    });
    filtersRoot.addEventListener("click", event => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      activeSection = button.dataset.filter;
      applyFilters();
    });
    try {
      const response = await fetch(DATA_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.records)) throw new Error("Invalid sitemap data");
      records = data.records.filter(item => item.status === "displayable" && item.path && item.title);
      document.getElementById("total-count").textContent = records.length.toLocaleString("ar-DZ");
      document.getElementById("section-count").textContent = new Set(records.map(item => item.section_name)).size.toLocaleString("ar-DZ");
      document.getElementById("sector-count").textContent = records.filter(item => item.content_type === "sector").length.toLocaleString("ar-DZ");
      buildFilters();
      render();
    } catch (err) {
      console.error("Sitemap data loading failed:", err);
      root.replaceChildren();
      error.hidden = false;
      status.textContent = "تعذر تحميل بيانات خريطة الموقع.";
    }
  }
  init();
})();
