
// Smooth scroll for quick links
const sectionLinks = document.querySelectorAll('.quick-link, .sidebar-menu a');
const sections = document.querySelectorAll('.section-card');
const quickLinks = document.querySelectorAll('.quick-link');

// Calculate the visible area occupied by the sticky header and quick-links bar.
function getSectionScrollOffset() {
    const header = document.querySelector('.header');
    const quickLinksBar = document.querySelector('.quick-links');
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const quickLinksBottom = quickLinksBar ? quickLinksBar.getBoundingClientRect().bottom : 0;
    const cssOffset = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--section-scroll-offset')
    ) || 0;

    return Math.ceil(Math.max(headerBottom, quickLinksBottom, cssOffset)) + 16;
}

function scrollToSection(target, behavior = 'smooth') {
    const offset = getSectionScrollOffset();
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: reducedMotion ? 'auto' : behavior
    });
}

sectionLinks.forEach(link => {
    link.addEventListener('click', function (event) {
        const href = this.getAttribute('href') || '';
        if (!href.startsWith('#')) return;

        const target = document.getElementById(href.slice(1));
        if (!target) return;

        event.preventDefault();
        history.pushState(null, '', href);
        scrollToSection(target);
    });
});

function updateActiveSection() {
    const offset = getSectionScrollOffset();
    const activationLine = window.scrollY + offset + 1;
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        if (activationLine >= sectionTop) {
            current = section.id;
        }
    });

    quickLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
}

window.addEventListener('scroll', updateActiveSection, { passive: true });
window.addEventListener('resize', updateActiveSection);

// Align direct hash navigation below the sticky controls after the page is laid out.
if (window.location.hash) {
    window.addEventListener('load', () => {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) scrollToSection(target, 'auto');
    }, { once: true });
}

updateActiveSection();

// Modal functionality for train schedules
const modal = document.getElementById('scheduleModal');
const modalImg = document.getElementById('scheduleImage');
const modalTitle = document.getElementById('scheduleTitle');
document.querySelectorAll('.view-schedule-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        modalImg.src = btn.dataset.image;
        modalTitle.textContent = btn.dataset.title;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});
document.querySelector('.close-modal').addEventListener('click', closeModal);
modal.addEventListener('click', e => {
    if (e.target === modal) {
        closeModal();
    }
});

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Automatic page service total
// Update the first hero statistic labeled "خدمة رقمية" from the actual page content.
const digitalServiceStat = Array.from(document.querySelectorAll('.hero-stat')).find(stat => {
    const label = stat.querySelector('.hero-stat-label');
    const text = label ? label.textContent.trim() : '';
    return text.includes('خدمة رقمية') || text.includes('خدمات رقمية');
});

if (digitalServiceStat) {
    const number = digitalServiceStat.querySelector('.hero-stat-number');
    const standardServices = document.querySelectorAll('.service-item').length;
    const specializedServices = document.querySelectorAll('.train-card, .promo-card, .video-card').length;
    const actionServices = document.querySelectorAll('.exam-banner-btn, .video-btn.youtube-btn').length;
    const totalServices = standardServices || specializedServices || actionServices;

    if (number) {
        number.textContent = String(totalServices).padStart(2, '0');
    }
}

// Local page search
function loadLocalPageSearch() {
    if (window.localPageSearchLoaded || document.querySelector('script[data-local-page-search]')) return;

    const script = document.createElement('script');
    const currentScript = document.currentScript;
    script.src = currentScript
        ? new URL('localSearch.js', currentScript.src).href
        : '../assets/js/localSearch.js';
    script.defer = true;
    script.dataset.localPageSearch = 'true';
    script.onload = () => { window.localPageSearchLoaded = true; };
    document.head.appendChild(script);
}

loadLocalPageSearch();




//النافذة التحذيرية

document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("securityAlert");

    if (!modal) return;

    const closeBtn = modal.querySelector(".alert-close");
    const actionBtn = modal.querySelector(".alert-btn");

    function closeModal() {
        modal.style.display = "none";
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (actionBtn && actionBtn.tagName === "BUTTON") {
        actionBtn.addEventListener("click", closeModal);
    }

});


