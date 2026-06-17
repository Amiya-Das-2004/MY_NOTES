/**
 * Theme_Changer.js
 * Light/dark theme switching with localStorage persistence.
 */

(function () {
    'use strict';

    var themes = ['light', 'dark'];
    var storedTheme = localStorage.getItem('theme');
    var currentTheme = themes.indexOf(storedTheme) !== -1 ? storedTheme : 'light';
    var toggleBtn = document.getElementById('theme-toggle');

    function updateThemeIcon() {
        if (!toggleBtn) {
            return;
        }

        var iconClass = currentTheme === 'dark' ? 'fa-moon' : 'fa-sun';
        var icon = toggleBtn.querySelector('i');

        if (!icon) {
            icon = document.createElement('i');
            icon.setAttribute('aria-hidden', 'true');
            toggleBtn.textContent = '';
            toggleBtn.appendChild(icon);
        }

        icon.className = 'fa-solid ' + iconClass;
        toggleBtn.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }

    // Initialize theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            var currentIndex = themes.indexOf(currentTheme);
            currentTheme = themes[(currentIndex + 1) % themes.length];

            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            updateThemeIcon();
        });
    }
})();