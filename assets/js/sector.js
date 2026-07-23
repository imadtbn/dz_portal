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

// Search functionality
document.querySelector('.search-trigger').addEventListener('click', () => {
    const query = prompt('ابحث عن خدمة:');
    if (query) {
        const services = document.querySelectorAll('.service-item');
        services.forEach(service => {
            const text = service.textContent.toLowerCase();
            service.style.display = text.includes(query.toLowerCase()) ? 'flex' : 'none';
        });
    }
});



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
