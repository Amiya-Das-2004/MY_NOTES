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

// Function: updateThemeIcon()
// Purpose: Updates the theme toggle icon and aria-label for the current theme
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

document.querySelectorAll('.Math, .Equations').forEach(el => {

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    /* Mouse drag */
    el.addEventListener('mousedown', e => {
        isDragging = true;
        startX = e.pageX;
        startScrollLeft = el.scrollLeft;

        el.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        el.style.cursor = 'grab';
    });

    el.addEventListener('mouseleave', () => {
        isDragging = false;
        el.style.cursor = 'grab';
    });

    el.addEventListener('mousemove', e => {
        if (!isDragging) return;

        e.preventDefault();

        const dx = e.pageX - startX;
        el.scrollLeft = startScrollLeft - dx;
    });

    /* Mouse wheel -> horizontal scroll */
    el.addEventListener('wheel', e => {
        if (el.scrollWidth <= el.clientWidth) return;

        e.preventDefault();
        el.scrollLeft += e.deltaY;
    }, { passive: false });

});