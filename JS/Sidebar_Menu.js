/**
 * Sidebar_Menu.js
 * Navigation menu for static documentation site.
 * Uses embedded HTML structure that works without fetch/server.
 */

(function () {
    'use strict';

    /* -- DOM refs ----------------------------------------------- */
    // sidebar: The main sidebar navigation container (nav.Sidebar)
    var sidebar = document.querySelector('.Sidebar');
    // navMount: The ul element where navigation menu is built
    var navMount = document.getElementById('sidebar-menu');
    // toggleBtn: The hamburger button that toggles sidebar visibility on mobile
    var toggleBtn = document.getElementById('Sidebar_Button');

    /* -- Path prefix for relative URLs --------------------------- */
    var pathDepth = (window.location.pathname.match(/\//g) || []).length - 1;
    var rootPrefix = pathDepth > 0 ? '../'.repeat(pathDepth) : '';

    /* -- Helper functions --------------------------------------- */
    // Function: normalisePath(p) - must be defined before use
    function normalisePath(p) { return p.replace(/\/+$/, '') || '/'; }

    /* -- Current page detection --------------------------------- */
    var currentUrl = normalisePath(window.location.pathname);

    /* -- Navigation data --------------------------------------- */
    // NAV_DATA: Menu structure - contains links and folder hierarchies (loaded from JSON)
    var NAV_DATA = null;

    // FALLBACK_NAV_DATA: Embedded menu structure (used if Nav_Menu.json fails)
    var FALLBACK_NAV_DATA = [
        {
            type: 'link',
            title: 'Introduction',
            href: 'MY_NOTES/Index.html',
            active: currentUrl.endsWith('Index.html') || currentUrl === '/' || currentUrl.match(/MY_NOTES\/?(Index\.html)?$/)
        },
        {
            type: 'folder',
            label: 'Topology Optimization',
            id: 'Topology_Optimization',
            open: currentUrl.includes('/Topology_Optimization/'),
            pages: [
                {
                    title: 'Reaction Diffusion',
                    url: 'MY_NOTES/NOTES/Topology_Optimization/RD.html',
                    active: currentUrl.endsWith('RD.html')
                }
            ]
        }
    ];

    // Function: escHtml(s)
    // Purpose: Escapes HTML special characters to prevent XSS when rendering dynamic content
    function escHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Function: processNavData(data)
    // Purpose: Converts Nav_Menu.json format to internal navigation format with active states
    function processNavData(data) {
        var result = [{
            type: 'link',
            title: 'Introduction',
            href: 'Index.html',
            active: currentUrl.endsWith('Index.html') || currentUrl.endsWith('/')
        }];

        data.forEach(function (item) {
            if (item.pages && item.pages.length > 0) {
                var folderItem = {
                    type: 'folder',
                    label: item.label,
                    id: item.folder,
                    open: currentUrl.includes('/' + item.folder + '/') || currentUrl.includes('/' + item.folder),
                    pages: item.pages.map(function (page) {
                        return {
                            title: page.title,
                            url: 'NOTES/' + page.url.replace(/^\/?/, ''),
                            active: currentUrl.endsWith(page.url.split('/').pop())
                        };
                    })
                };
                result.push(folderItem);
            }
        });
        return result;
    }

    /* -- Build navigation menu --------------------------------- */
    // Function: buildNav()
    // Purpose: Builds the sidebar navigation menu from NAV_DATA array
    function buildNav() {
        if (!navMount) return;
        navMount.innerHTML = '';

        (NAV_DATA || FALLBACK_NAV_DATA).forEach(function (item) {
            // Handle simple link (Introduction)
            if (item.type === 'link') {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = rootPrefix + item.href;
                a.textContent = item.title;
                a.className = 'tocitem';
                if (item.active) {
                    a.classList.add('is-active');
                    li.classList.add('is-active');
                }
                li.appendChild(a);
                navMount.appendChild(li);

                // Add heading permalinks container for active top-level link
                if (item.active) {
                    var fileMenu = document.createElement('ul');
                    fileMenu.className = 'file-menu';
                    li.appendChild(fileMenu);
                }
                return;
            }

            // Handle folder entries
            var folderLi = document.createElement('li');
            folderLi.className = 'nav-folder folder';
            folderLi.id = 'nav-folder-' + item.id;
            // Animation: Add is-open class after DOM insertion to trigger CSS transition
            if (item.open) {
                folderLi.dataset.shouldOpen = 'true';
            }

            // Toggle button
            var btn = document.createElement('button');
            btn.className = 'nav-folder-btn tocitem folder-toggle';
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', 'nav-sub-' + item.id);
            btn.innerHTML =
                '<span class="nav-folder-label">' + escHtml(item.label) + '</span>' +
                '<span class="nav-folder-arrow" aria-hidden="true">▶</span>';
            // Animation: Set aria-expanded after DOM insertion to trigger CSS transition
            if (item.open) {
                btn.dataset.shouldExpand = 'true';
            }

            // Sub-list
            var subList = document.createElement('ul');
            subList.className = 'nav-sub folder-menu';
            subList.id = 'nav-sub-' + item.id;
            // Animation: Add is-open class after DOM insertion to trigger CSS transition
            if (item.open) {
                subList.dataset.shouldOpen = 'true';
            }

            // Toggle handler
            btn.addEventListener('click', function () {
                var open = btn.getAttribute('aria-expanded') !== 'true';
                btn.setAttribute('aria-expanded', String(open));
                folderLi.classList.toggle('is-open', open);
                subList.classList.toggle('is-open', open);
                try { sessionStorage.setItem('nav-open:' + item.id, String(open)); } catch (_) { }
            });

            // Page links
            item.pages.forEach(function (page) {
                var li = document.createElement('li');
                li.className = page.active ? 'is-active' : '';
                var a = document.createElement('a');
                a.href = rootPrefix + page.url;
                a.textContent = page.title;
                a.className = 'tocitem' + (page.active ? ' is-active' : '');

                li.appendChild(a);
                subList.appendChild(li);

                // Add heading permalinks container for active page
                if (page.active) {
                    var fileMenu = document.createElement('ul');
                    fileMenu.className = 'file-menu';
                    li.appendChild(fileMenu);
                }
            });

            folderLi.appendChild(btn);
            folderLi.appendChild(subList);
            navMount.appendChild(folderLi);
        });

        // Add heading permalinks for active page
        addHeadingPermalinks();
        scrollSidebarToActive();

        // Animate open folders on initial load (triggers CSS transition)
        setTimeout(function () {
            var shouldOpenSubs = navMount.querySelectorAll('.nav-sub[data-should-open="true"]');
            var shouldOpenFolders = navMount.querySelectorAll('.nav-folder[data-should-open="true"]');
            var shouldExpandBtns = navMount.querySelectorAll('.folder-toggle[data-should-expand="true"]');

            // Force reflow to ensure transition runs
            shouldOpenSubs.forEach(function (el) { el.offsetHeight; });

            shouldOpenSubs.forEach(function (el) {
                el.classList.add('is-open');
                delete el.dataset.shouldOpen;
            });
            shouldOpenFolders.forEach(function (el) {
                el.classList.add('is-open');
                delete el.dataset.shouldOpen;
            });
            shouldExpandBtns.forEach(function (el) {
                el.setAttribute('aria-expanded', 'true');
                delete el.dataset.shouldExpand;
            });
            navMount.querySelectorAll('.nav-sub[data-should-open="true"]').forEach(function (el) {
                el.classList.add('is-open');
                delete el.dataset.shouldOpen;
            });
            navMount.querySelectorAll('.nav-folder[data-should-open="true"]').forEach(function (el) {
                el.classList.add('is-open');
                delete el.dataset.shouldOpen;
            });
            // Set aria-expanded on toggle buttons
            navMount.querySelectorAll('.folder-toggle[data-should-expand="true"]').forEach(function (el) {
                el.setAttribute('aria-expanded', 'true');
                delete el.dataset.shouldExpand;
            });
        }, 10);
    }

    /* -- Heading permalinks for active page -------------------- */
    // Function: addHeadingPermalinks()
    // Purpose: Finds all h1/h2/h3 elements with IDs on the current page and creates
    //          clickable anchor links in the sidebar's file-menu submenu
    // This allows users to navigate directly to specific sections of the page
    function addHeadingPermalinks() {
        var activeLink = navMount.querySelector('a.is-active');
        if (!activeLink) return;

        var headings = document.querySelectorAll('h1[id], h2[id]');
        if (!headings.length) return;

        var fileMenu = activeLink.parentNode.querySelector('.file-menu');
        if (!fileMenu) return;

        var currentH1Li = null;
        var currentH2Group = null;

        headings.forEach(function (h) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + h.id;
            a.className = 'tocitem';
            // Get heading text, excluding nested .Heading_Anchor links
            var anchorEl = h.querySelector('.Heading_Anchor');
            var headingText = anchorEl ? anchorEl.textContent.trim() : h.textContent.trim();
            a.textContent = headingText;
            li.appendChild(a);

            if (h.tagName.toLowerCase() === 'h1') {
                li.className = 'level-h1';
                fileMenu.appendChild(li);
                currentH1Li = li;
                currentH2Group = null;          // reset h2 grouping for the new h1
            } else {                             // h2
                li.className = 'level-h2';
                if (currentH1Li) {
                    // Lazily create the indented h2-group under its parent h1
                    // (first h2 after an h1 is what draws the vertical line)
                    if (!currentH2Group) {
                        currentH2Group = document.createElement('ul');
                        currentH2Group.className = 'h2-group';
                        currentH1Li.appendChild(currentH2Group);
                    }
                    currentH2Group.appendChild(li);
                } else {
                    fileMenu.appendChild(li);   // h2 with no preceding h1 → top-level row
                }
            }
        });
    }

    /* -- Mobile drawer (hamburger toggle) -------------------- */
    // Create overlay element for mobile drawer
    // Provides visual feedback (dark overlay) and click target to close sidebar
    var overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:40;opacity:0;visibility:hidden;';
    document.body.appendChild(overlay);

    // Function: closeSidebar()
    // Purpose: Hides sidebar by removing 'visible' class, hides overlay,
    //          removes body scroll lock, resets aria-expanded state
    function closeSidebar() {
        if (sidebar && sidebar.classList.contains('visible')) {
            sidebar.classList.remove('visible');
            document.body.classList.remove('sidebar-open');
            overlay.classList.remove('active');
            // Reset toggle button aria state
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Function: openSidebar()
    // Purpose: Shows sidebar by adding 'visible' class, shows overlay,
    //          locks body scroll, sets aria-expanded state
    function openSidebar() {
        if (sidebar && !sidebar.classList.contains('visible')) {
            sidebar.classList.add('visible');
            document.body.classList.add('sidebar-open');
            overlay.classList.add('active');
            // Set toggle button aria state
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
        }
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Prevent document click handler from firing
            if (sidebar.classList.contains('visible')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Close sidebar when clicking on overlay
    overlay.addEventListener('click', closeSidebar);

    // Close sidebar when clicking outside (on the content area) - mobile only
    document.addEventListener('click', function (e) {
        // Only on mobile when sidebar is visible
        if (!sidebar || !sidebar.classList.contains('visible') || window.innerWidth > 1055) return;

        // Skip if clicking anywhere in the sidebar or the toggle button
        if ((toggleBtn && toggleBtn.contains(e.target)) || sidebar.contains(e.target)) return;

        closeSidebar();
    });

    // Close sidebar on ESC key press
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('visible')) {
            closeSidebar();
        }
    });

    /* -- Scroll-spy for headings ------------------------------ */
    // Function: initScrollSpy()
    // Purpose: Uses IntersectionObserver to detect which heading is in viewport
    //          and highlights the corresponding sidebar link for navigation feedback
    function initScrollSpy() {
        var headings = Array.from(document.querySelectorAll('.Content h2[id], .Content h3[id]'));
        if (!headings.length) return;

        var headerH = (document.querySelector('.Header') || {}).offsetHeight || 56;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) highlightAnchor(entry.target.id);
            });
        }, { rootMargin: '-' + (headerH + 4) + 'px 0px -75% 0px', threshold: 0 });

        headings.forEach(function (h) { observer.observe(h); });
    }

    // Function: highlightAnchor(id)
    // Purpose: Updates the active state of heading links in sidebar's file-menu
    //          based on which section is currently in view
    function highlightAnchor(id) {
        if (!navMount) return;
        navMount.querySelectorAll('.file-menu a').forEach(function (a) {
            var hash = (a.getAttribute('href') || '').split('#')[1] || '';
            a.classList.toggle('is-active', hash === id);
        });
        scrollSidebarToActive();
    }

    /* -- Helper: Scroll to active item ------------------------ */
    // Function: scrollSidebarToActive()
    // Purpose: Automatically scrolls the sidebar to show the active menu item when page loads
    function scrollSidebarToActive() {
        if (!sidebar) return;
        var active = sidebar.querySelector('a.is-active');
        if (!active) return;
        var sTop = sidebar.scrollTop, sH = sidebar.clientHeight;
        var aTop = active.offsetTop, aH = active.offsetHeight;
        if (aTop < sTop || aTop + aH > sTop + sH) sidebar.scrollTop = aTop - sH / 3;
    }

    /* -- Boot --------------------------------------------------- */
    // Function: getNavJsonPath()
    // Purpose: Returns correct path to Nav_Menu.json based on current page location
    function getNavJsonPath() {
        // Nav_Menu.json is at My_Notes/ root
        // For Index.html: path is 'Nav_Menu.json'
        // For NOTES/pages: path is '../Nav_Menu.json'
        return rootPrefix + 'Nav_Menu.json';
    }

    // Initialize: Try loading from Nav_Menu.json, fallback to embedded data
    document.addEventListener('DOMContentLoaded', function () {
        // Build with fallback first (immediate)
        buildNav();

        // Then try to load from JSON
        var navXhr = new XMLHttpRequest();
        navXhr.open('GET', getNavJsonPath(), true);
        navXhr.onreadystatechange = function () {
            if (navXhr.readyState === 4 && navXhr.status === 200) {
                try {
                    var jsonData = JSON.parse(navXhr.responseText);
                    NAV_DATA = processNavData(jsonData);
                    buildNav(); // Rebuild with loaded data
                } catch (e) {
                    console.warn('Nav_Menu.json parse failed, using fallback');
                }
            }
        };
        navXhr.send();

        initScrollSpy();
    });

})();