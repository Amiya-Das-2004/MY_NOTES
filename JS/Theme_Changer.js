/**
 * Theme_Changer.js
 * Light/dark/auto theme switching with localStorage persistence.
 */

(function () {
    'use strict';

    var themes = ['auto', 'light', 'dark'];
    var currentTheme = localStorage.getItem('theme') || 'auto';
    var toggleBtn = document.getElementById('theme-toggle');

    // Initialize theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            var currentIndex = themes.indexOf(currentTheme);
            currentTheme = themes[(currentIndex + 1) % themes.length];

            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
        });
    }

    // Handle auto theme with system preference
    if (currentTheme === 'auto') {
        var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener(function (e) {
            if (localStorage.getItem('theme') === 'auto') {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });

        // Set initial theme based on system preference
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
    }
})();