/* ============================================================
   COPY_CODE.JS
   Injects a .Code_Lang_Label into every <pre> that carries a
   data-lang attribute.  Clicking the label copies the code,
   swaps the label text for a green tick, then restores after
   10 seconds.

   <pre> blocks with NO data-lang get no label — they still
   scroll and grab via CSS, but have no copy UI.

   <pre class="Code_Output"> blocks are skipped entirely.

   HTML usage
   ----------
   <pre data-lang="JULIA">
     <code class="language-julia">...</code>
   </pre>

   <pre class="Code_Output">
     <code>...output here...</code>
   </pre>
   ============================================================ */


/* ------------------------------------------------------------
   copyToClipboard(text)
   Uses the Clipboard API where available; falls back to the
   execCommand approach for insecure / older contexts.
   ------------------------------------------------------------ */
function copyToClipboard(text) {
  if (window.navigator && window.navigator.clipboard) {
    return window.navigator.clipboard.writeText(text);
  }

  return new Promise(function (resolve, reject) {
    try {
      const el = document.createElement("textarea");
      el.textContent = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(el);
    }
  });
}


/* ------------------------------------------------------------
   getCodeText(pre)
   Pulls the raw text from the <code> child (or the <pre>
   itself if there is no <code>), stripping any trailing
   newline that browsers add.
   ------------------------------------------------------------ */
function getCodeText(pre) {
  const codeEl = pre.querySelector("code");
  return (codeEl ? codeEl.innerText : pre.innerText).replace(/\n$/, "");
}


/* ------------------------------------------------------------
   addCodeLabels()
   Runs once on DOMContentLoaded.  For every <pre> that has
   a data-lang attribute (and is NOT .Code_Output) it builds:

     <span class="Code_Lang_Label" aria-label="Copy JULIA code">
       <span class="Code_Label_Text">JULIA</span>
       <span class="Code_Copy_Icon fa-solid fa-copy"></span>
       <span class="Code_Tick_Icon fa-solid fa-check"></span>
     </span>

   and wires up the click handler.
   ------------------------------------------------------------ */
function addCodeLabels() {
  const blocks = document.querySelectorAll("pre[data-lang]");

  blocks.forEach(function (pre) {
    /* Skip output blocks (safety guard — they shouldn't carry
       data-lang, but be defensive) */
    if (pre.classList.contains("Code_Output")) return;

    const lang = pre.getAttribute("data-lang").trim();

    /* --- Build the label element --- */
    const label = document.createElement("span");
    label.className = "Code_Lang_Label";
    label.setAttribute("role", "button");
    label.setAttribute("tabindex", "0");
    label.setAttribute("aria-label", "Copy " + lang + " code");
    label.setAttribute("title", "Click to copy");

    /* Label text */
    const labelText = document.createElement("span");
    labelText.className = "Code_Label_Text";
    labelText.textContent = lang;

    /* Copy icon (Font Awesome — fa-solid fa-copy rendered via CSS) */
    const copyIcon = document.createElement("span");
    copyIcon.className = "Code_Copy_Icon fa-solid fa-copy";
    copyIcon.setAttribute("aria-hidden", "true");

    /* Tick icon (shown after successful copy) */
    const tickIcon = document.createElement("span");
    tickIcon.className = "Code_Tick_Icon fa-solid fa-check";
    tickIcon.setAttribute("aria-hidden", "true");

    label.appendChild(labelText);
    label.appendChild(copyIcon);
    label.appendChild(tickIcon);

    const wrapper = pre.closest(".Code_Block");
    (wrapper || pre).appendChild(label);

    /* --- Restore timeout handle (so we can clear it on rapid clicks) --- */
    let restoreTimer = null;

    /* --- State: currently in "copied" state? --- */
    let isCopied = false;

    function triggerCopy() {
      if (isCopied) return;          /* ignore rapid double-clicks */

      copyToClipboard(getCodeText(pre)).then(
        function onSuccess() {
          isCopied = true;
          label.classList.add("is-copied");
          label.setAttribute("aria-label", "Copied!");
          label.setAttribute("title", "Copied!");

          /* Clear any existing timer */
          if (restoreTimer) clearTimeout(restoreTimer);

          restoreTimer = setTimeout(function () {
            isCopied = false;
            label.classList.remove("is-copied");
            label.setAttribute("aria-label", "Copy " + lang + " code");
            label.setAttribute("title", "Click to copy");
            restoreTimer = null;
          }, 10000);   /* 10 seconds */
        },
        function onFailure() {
          /* Brief error flash — reuse tick slot with a red X */
          label.classList.add("is-copied");
          tickIcon.classList.remove("fa-check");
          tickIcon.classList.add("fa-xmark");
          tickIcon.style.color = "#cb3c33";

          if (restoreTimer) clearTimeout(restoreTimer);

          restoreTimer = setTimeout(function () {
            isCopied = false;
            label.classList.remove("is-copied");
            tickIcon.classList.add("fa-check");
            tickIcon.classList.remove("fa-xmark");
            tickIcon.style.color = "";
            label.setAttribute("aria-label", "Copy " + lang + " code");
            label.setAttribute("title", "Click to copy");
            restoreTimer = null;
          }, 3000);
        }
      );
    }

    /* Click */
    label.addEventListener("click", triggerCopy);

    /* Keyboard: Enter or Space activates the label */
    label.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerCopy();
      }
    });
  });
}


/* ------------------------------------------------------------
   Boot — wait for DOM if needed.
   ------------------------------------------------------------ */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addCodeLabels);
} else {
  addCodeLabels();
}