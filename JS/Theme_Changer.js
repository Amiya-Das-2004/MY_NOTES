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



document.querySelectorAll('.Math, .Equations, .Eq, pre, .Code_Output').forEach(el => {

    if (el.closest('.Scroll_Horizontal')) return;

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    el.addEventListener('mousedown', e => {
        isDragging = true;
        startX = e.pageX;
        startScrollLeft = el.scrollLeft;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        el.style.userSelect = '';
    });

    el.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        el.scrollLeft = startScrollLeft - (e.pageX - startX);
    });

    el.addEventListener('wheel', e => {
        if (el.scrollWidth <= el.clientWidth) return;
        e.preventDefault();
        el.scrollLeft += e.deltaY;
    }, { passive: false });

});

document.querySelectorAll('.Scroll_Horizontal').forEach(el => {

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    el.addEventListener('mousedown', e => {
        isDragging = true;
        startX = e.pageX;
        startScrollLeft = el.scrollLeft;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    el.addEventListener('mousemove', e => {
        if (!isDragging) return;

        e.preventDefault();
        el.scrollLeft = startScrollLeft - (e.pageX - startX);
    });

    // el.addEventListener('wheel', e => {
    //     if (el.scrollWidth <= el.clientWidth) return;

    //     e.preventDefault();
    //     el.scrollLeft += e.deltaY;
    // }, { passive: false });

});