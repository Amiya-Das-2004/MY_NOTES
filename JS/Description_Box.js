/* ============================================================
   DESCRIPTION_BOX.JS
   Manages the popup description dialog triggered by clicking
   any element with the attribute  data-description-id="SOME_ID".

   HOW IT WORKS — OVERVIEW
   ────────────────────────
   1.  One overlay + one dialog panel are injected into <body>
       at page load (only ONE of each, shared by all triggers).
   2.  Each trigger link carries  data-description-id="ID"
       that points to a hidden <div id="ID"> inside the page.
   3.  Clicking a trigger copies that div's innerHTML into the
       dialog's scrollable body, sets the title, and opens it.
   4.  The dialog closes via: the × button, clicking the overlay,
       or pressing the Escape key.
   5.  KaTeX is re-rendered inside the dialog after content is
       injected, so maths displays correctly.

   USAGE IN HTML  (no separate file needed)
   ─────────────────────────────────────────
   <!-- 1. The trigger link anywhere in your article -->
   <a class="Description_Link" data-description-id="Greens_Identity">
     Green's Identity
   </a>

   <!-- 2. The hidden content block (put it near the bottom of
            <article> or anywhere in <body>) -->
   <div id="Greens_Identity" class="Description_Box_Content" hidden>
     <p>Green's identity follows from integrating by parts...</p>
     <p class="Math">$$\int_\Omega u\nabla^2 v\,d\Omega = ...$$</p>
   </div>

   CLASS / ID NAMING CONVENTIONS (matching your project rules)
   ────────────────────────────────────────────────────────────
   All class names start with a capital letter; multi-word names
   joined with underscores — e.g. Description_Box_Overlay.
   ============================================================ */

(function () {
    "use strict";

    /* ──────────────────────────────────────────────────────────
       STEP 1 — BUILD THE SHARED DIALOG STRUCTURE
       Called once on DOMContentLoaded.  Creates:
         • .Description_Box_Overlay  — backdrop
         • .Description_Box          — the panel
           ├── .Description_Box_Header
           │     ├── .Description_Box_Title  (h3)
           │     └── .Description_Box_Close  (button ×)
           └── .Description_Box_Body        (scrollable)
    ────────────────────────────────────────────────────────── */

    function Build_Dialog() {

        /* --- Overlay (backdrop) --------------------------------- */
        const Overlay = document.createElement("div");
        Overlay.className = "Description_Box_Overlay";
        Overlay.id = "Description_Box_Overlay";
        /* Clicking the backdrop closes the dialog */
        Overlay.addEventListener("click", Close_Dialog);

        /* --- Dialog panel --------------------------------------- */
        const Dialog = document.createElement("div");
        Dialog.className = "Description_Box";
        Dialog.id = "Description_Box";
        Dialog.setAttribute("role", "dialog");
        Dialog.setAttribute("aria-modal", "true");
        Dialog.setAttribute("aria-labelledby", "Description_Box_Title_Text");
        /* Prevent overlay click from firing when clicking inside the dialog */
        Dialog.addEventListener("click", function (Event) {
            Event.stopPropagation();
        });

        /* --- Header -------------------------------------------- */
        const Header = document.createElement("div");
        Header.className = "Description_Box_Header";

        /* Title */
        const Title = document.createElement("h3");
        Title.className = "Description_Box_Title";
        Title.id = "Description_Box_Title_Text";
        Title.textContent = "";           /* filled by Open_Dialog */

        /* Close button */
        const Close_Button = document.createElement("button");
        Close_Button.className = "Description_Box_Close";
        Close_Button.id = "Description_Box_Close";
        Close_Button.type = "button";
        Close_Button.innerHTML = "&times;";   /* × character */
        Close_Button.setAttribute("aria-label", "Close description");
        Close_Button.addEventListener("click", Close_Dialog);

        /* Assemble header */
        Header.appendChild(Title);
        Header.appendChild(Close_Button);

        /* --- Scrollable body ------------------------------------ */
        const Body = document.createElement("div");
        Body.className = "Description_Box_Body";
        Body.id = "Description_Box_Body";
        /* Content injected here by Open_Dialog */

        /* --- Assemble dialog ------------------------------------ */
        Dialog.appendChild(Header);
        Dialog.appendChild(Body);

        /* --- Inject into <body> --------------------------------- */
        document.body.appendChild(Overlay);
        document.body.appendChild(Dialog);
    }


    /* ──────────────────────────────────────────────────────────
       STEP 2 — OPEN THE DIALOG
       Called when a trigger element is clicked.
       Parameters:
         Trigger_Element — the clicked <a> or <span>
    ────────────────────────────────────────────────────────── */

    function Open_Dialog(Trigger_Element) {

        /* Read the id of the content div from data attribute */
        const Content_Id = Trigger_Element.getAttribute("data-description-id");
        if (!Content_Id) return;

        /* Find the hidden content div */
        const Content_Div = document.getElementById(Content_Id);
        if (!Content_Div) {
            console.warn("Description_Box: no element found with id =", Content_Id);
            return;
        }

        /* Grab references to dialog parts */
        const Dialog = document.getElementById("Description_Box");
        const Overlay = document.getElementById("Description_Box_Overlay");
        const Title_El = document.getElementById("Description_Box_Title_Text");
        const Body_El = document.getElementById("Description_Box_Body");

        /* --- Populate title -------------------------------------
           Prefer the  data-description-title  attribute on the
           trigger; fall back to the trigger's own text content.   */
        const Title_Text =
            Trigger_Element.getAttribute("data-description-title") ||
            Trigger_Element.textContent.trim();
        Title_El.textContent = Title_Text;

        /* --- Inject content ------------------------------------
           Clone the hidden div's innerHTML so the original is
           never modified.  This means re-opening always shows
           clean content.                                          */
        Body_El.innerHTML = Content_Div.innerHTML;

        /* --- Re-render KaTeX -----------------------------------
           KaTeX was run on page load, but the cloned content
           is brand-new DOM nodes with raw $...$ strings.
           Call auto-render again, scoped to Body_El only.        */
        if (window.renderMathInElement) {
            window.renderMathInElement(Body_El, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ],
                throwOnError: false
            });
        }

        /* --- Reset scroll position so it always opens at top -- */
        Body_El.scrollTop = 0;

        /* --- Show overlay and dialog ---------------------------
           Adding .Is_Visible triggers the CSS transition.        */
        Overlay.classList.add("Is_Visible");
        Dialog.classList.add("Is_Visible");

        /* --- Lock page scroll while dialog is open ------------ */
        document.body.classList.add("Description_Box_Open");

        /* --- Trap focus inside the dialog --------------------- */
        document.getElementById("Description_Box_Close").focus();

        /* --- Store which element opened the dialog so focus
               can be returned to it when it closes.             */
        Dialog.dataset.Opener_Id =
            Trigger_Element.id || "";
        Dialog._Opener_Element = Trigger_Element;   /* direct reference */
    }


    /* ──────────────────────────────────────────────────────────
       STEP 3 — CLOSE THE DIALOG
    ────────────────────────────────────────────────────────── */

    function Close_Dialog() {
        const Dialog = document.getElementById("Description_Box");
        const Overlay = document.getElementById("Description_Box_Overlay");

        if (!Dialog || !Dialog.classList.contains("Is_Visible")) return;

        /* Hide overlay and panel */
        Overlay.classList.remove("Is_Visible");
        Dialog.classList.remove("Is_Visible");

        /* Unlock page scroll */
        document.body.classList.remove("Description_Box_Open");

        /* Return focus to the element that opened the dialog */
        if (Dialog._Opener_Element) {
            Dialog._Opener_Element.focus();
            Dialog._Opener_Element = null;
        }

        /* Clear content after transition ends so stale math is gone */
        const Transition_Duration = 250;   /* matches --t-normal in CSS */
        setTimeout(function () {
            const Body_El = document.getElementById("Description_Box_Body");
            const Title_El = document.getElementById("Description_Box_Title_Text");
            if (Body_El) Body_El.innerHTML = "";
            if (Title_El) Title_El.textContent = "";
        }, Transition_Duration);
    }


    /* ──────────────────────────────────────────────────────────
       STEP 4 — KEYBOARD HANDLER
       Escape closes the dialog; Tab keeps focus inside it.
    ────────────────────────────────────────────────────────── */

    function Handle_Keydown(Event) {
        const Dialog = document.getElementById("Description_Box");
        if (!Dialog || !Dialog.classList.contains("Is_Visible")) return;

        if (Event.key === "Escape") {
            /* Close on Escape */
            Event.preventDefault();
            Close_Dialog();
            return;
        }

        if (Event.key === "Tab") {
            /* Trap Tab focus inside the dialog */
            const Focusable = Dialog.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const First_Focusable = Focusable[0];
            const Last_Focusable = Focusable[Focusable.length - 1];

            if (Event.shiftKey) {
                /* Shift+Tab: wrap from first to last */
                if (document.activeElement === First_Focusable) {
                    Event.preventDefault();
                    Last_Focusable.focus();
                }
            } else {
                /* Tab: wrap from last to first */
                if (document.activeElement === Last_Focusable) {
                    Event.preventDefault();
                    First_Focusable.focus();
                }
            }
        }
    }


    /* ──────────────────────────────────────────────────────────
       STEP 5 — ATTACH CLICK LISTENERS TO ALL TRIGGERS
       Finds every element with  data-description-id  and wires
       up the Open_Dialog handler.  Also sets a11y attributes.
    ────────────────────────────────────────────────────────── */

    function Attach_Triggers() {
        const Triggers = document.querySelectorAll("[data-description-id]");

        Triggers.forEach(function (Trigger) {
            /* Make non-interactive elements keyboard-reachable */
            if (
                Trigger.tagName !== "A" &&
                Trigger.tagName !== "BUTTON" &&
                !Trigger.hasAttribute("tabindex")
            ) {
                Trigger.setAttribute("tabindex", "0");
            }

            /* ARIA: tells screen readers this element opens a dialog */
            Trigger.setAttribute("aria-haspopup", "dialog");

            /* Click handler */
            Trigger.addEventListener("click", function (Event) {
                Event.preventDefault();     /* stop <a> from navigating */
                Open_Dialog(Trigger);
            });

            /* Also open on Enter / Space for keyboard users */
            Trigger.addEventListener("keydown", function (Event) {
                if (Event.key === "Enter" || Event.key === " ") {
                    Event.preventDefault();
                    Open_Dialog(Trigger);
                }
            });
        });
    }


    /* ──────────────────────────────────────────────────────────
       STEP 6 — ADD SCROLL-LOCK STYLE
       When .Description_Box_Open is on <body>, page scroll stops.
       We inject this as a <style> tag so no extra CSS file is needed.
    ────────────────────────────────────────────────────────── */

    function Inject_Scroll_Lock_Style() {
        const Style_Tag = document.createElement("style");
        Style_Tag.textContent = "body.Description_Box_Open { overflow: hidden; }";
        document.head.appendChild(Style_Tag);
    }


    /* ──────────────────────────────────────────────────────────
       INIT — wire everything up after the DOM is ready
    ────────────────────────────────────────────────────────── */

    document.addEventListener("DOMContentLoaded", function () {
        Inject_Scroll_Lock_Style();   /* 1. scroll-lock rule */
        Build_Dialog();               /* 2. inject overlay + panel */
        Attach_Triggers();            /* 3. wire up all trigger elements */
        document.addEventListener("keydown", Handle_Keydown); /* 4. keyboard */
    });



    let Active_Scroll_Element = null;
    let Is_Dragging = false;
    let Start_X = 0;
    let Start_Scroll_Left = 0;

    /* ----------------------------------------------------------
       Find a valid horizontal-scroll target
    ---------------------------------------------------------- */
    function Get_Scroll_Target(Target) {
        const El = Target.closest(
            '.Scroll_Horizontal, .Math, .Equations'
        );
        if (!El) return null;
        /* Ignore Math/Equation inside Scroll_Horizontal */
        if (
            El.matches('.Math, .Equations') &&
            El.closest('.Scroll_Horizontal')
        ) {
            return null;
        }
        return El;
    }

    /* ----------------------------------------------------------
       Mouse down
    ---------------------------------------------------------- */
    document.addEventListener('mousedown', e => {
        const El = Get_Scroll_Target(e.target);
        if (!El) return;
        Active_Scroll_Element = El;
        Is_Dragging = true;
        Start_X = e.pageX;
        Start_Scroll_Left = El.scrollLeft;
    });

    /* ----------------------------------------------------------
       Mouse move
    ---------------------------------------------------------- */
    document.addEventListener('mousemove', e => {
        if (!Is_Dragging || !Active_Scroll_Element) return;
        e.preventDefault();
        Active_Scroll_Element.scrollLeft =
            Start_Scroll_Left - (e.pageX - Start_X);
    });

    /* ----------------------------------------------------------
       Mouse up
    ---------------------------------------------------------- */
    document.addEventListener('mouseup', () => {
        Is_Dragging = false;
        Active_Scroll_Element = null;
    });

    /* ----------------------------------------------------------
       Wheel scrolling
    ---------------------------------------------------------- */
    document.addEventListener('wheel', e => {
        const El = Get_Scroll_Target(e.target);
        if (!El) return;
        if (El.scrollWidth <= El.clientWidth) return;
        e.preventDefault();
        El.scrollLeft += e.deltaY;
    }, { passive: false });

})();   /* end IIFE — nothing leaks into global scope */
