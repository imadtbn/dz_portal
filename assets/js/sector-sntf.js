
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


// Search functionality
document.querySelector('.search-trigger').addEventListener('click', () => {

    const query = prompt('ابحث عن خط ، إتجاه أو خدمة:');

    if (!query) return;

    const cards = document.querySelectorAll(
        '.service-item, .train-card'
    );

    cards.forEach(card => {

        const text = card.textContent.toLowerCase();

        card.style.display =
            text.includes(query.toLowerCase())
                ? ''
                : 'none';

    });

});




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


