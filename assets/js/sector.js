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

// Automatic service counters
// Count every service card in each section instead of relying on manual HTML numbers.
document.querySelectorAll('.section-card').forEach(section => {
    const counter = section.querySelector('.service-count');
    if (!counter) return;

    const services = section.querySelectorAll('.service-item');
    const currentLabel = counter.textContent.trim().replace(/^\s*\d+\s*/u, '');
    const label = currentLabel || 'خدمات';
    const formattedCount = String(services.length).padStart(2, '0');

    counter.textContent = `${formattedCount} ${label}`;
});

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



// زر الطباعة والنشر

function shareNotice(){

    if(navigator.share){

        navigator.share({

            title:"البوابة الجزائرية للخدمات الرقمية",

            text:"بيان / منشور رسمي.",

            url:window.location.href

        });

    }else{

        navigator.clipboard.writeText(window.location.href);

        alert("تم نسخ رابط البيان");

    }

}



function printNotice(){

    const notice=document.querySelector(".official-title").innerHTML;

    const printWindow=window.open("","_blank");

    printWindow.document.write(`

        <html dir="rtl">

        <head>

        <title>طباعة البيان</title>

        <style>

        body{
            font-family:Arial;
            padding:30px;
            text-align:right;
        }

        img{
            max-width:100%;
        }

        </style>

        </head>

        <body>

        ${notice}

        </body>

        </html>

    `);


    printWindow.document.close();

    printWindow.print();

}

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
