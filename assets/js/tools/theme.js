document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        updateToggleIcon(savedTheme);
    } else if (prefersDarkScheme.matches) {
        // Fallback to system preference
        document.body.setAttribute('data-theme', 'dark');
        updateToggleIcon('dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let currentTheme = document.body.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleIcon(newTheme);
        });
    }

    function updateToggleIcon(theme) {
        if (!themeToggle) return;
        if (theme === 'dark') {
            themeToggle.textContent = '☀️';
            themeToggle.setAttribute('aria-label', 'تفعيل الوضع الفاتح');
        } else {
            themeToggle.textContent = '🌙';
            themeToggle.setAttribute('aria-label', 'تفعيل الوضع الداكن');
        }
    }
});