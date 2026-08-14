
// Smooth scroll for quick links
document.querySelectorAll('.quick-link, .sidebar-menu a').forEach(link => {
    link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// Active state for quick links
const sections = document.querySelectorAll('.section-card');
const quickLinks = document.querySelectorAll('.quick-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    quickLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

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


