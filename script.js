(function () {
  "use strict";

  var CONTACT_EMAIL = "ershultz@gmail.com";

  /* ---------- Window manager ---------- */

  var zTop = 100;

  function bringToFront(win) {
    zTop += 1;
    win.style.zIndex = zTop;
  }

  function openWindow(id) {
    var win = document.getElementById(id);
    if (!win) return;
    win.hidden = false;
    bringToFront(win);
  }

  function closeWindow(id) {
    var win = document.getElementById(id);
    if (!win) return;
    win.hidden = true;
  }

  document.querySelectorAll("[data-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      closeWindow(btn.getAttribute("data-close"));
    });
  });

  document.querySelectorAll(".win98-window").forEach(function (win) {
    win.addEventListener("pointerdown", function () {
      bringToFront(win);
    });
  });

  var MOBILE_QUERY = "(max-width: 720px)";
  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  /* ---------- Drag helper (windows by titlebar, icons by whole element) ---------- */

  function makeDraggable(handle, target, opts) {
    opts = opts || {};
    var dragging = false;
    var moved = false;
    var startX, startY, origLeft, origTop, pointerId;

    handle.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      if (opts.pinnedOnMobile && isMobile()) return;

      dragging = true;
      moved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      var rect = target.getBoundingClientRect();
      var parentRect = target.offsetParent.getBoundingClientRect();
      origLeft = rect.left - parentRect.left;
      origTop = rect.top - parentRect.top;
      if (handle.setPointerCapture) handle.setPointerCapture(pointerId);
      e.preventDefault();
    });

    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      if (moved) {
        target.style.left = (origLeft + dx) + "px";
        target.style.top = (origTop + dy) + "px";
        if (opts.onMove) opts.onMove();
      }
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      if (opts.onDragEnd) opts.onDragEnd(moved);
    }

    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);

    return { wasMoved: function () { return moved; } };
  }

  /* ---------- Desktop icons: drag + click ---------- */

  document.querySelectorAll(".icon").forEach(function (icon) {
    var dragState = makeDraggable(icon, icon, {
      onDragEnd: function (moved) {
        icon.classList.remove("dragging");
        if (moved) {
          icon.dataset.suppressClick = "1";
        }
      },
      onMove: function () {
        icon.classList.add("dragging");
      }
    });

    icon.addEventListener("click", function (e) {
      if (icon.dataset.suppressClick) {
        delete icon.dataset.suppressClick;
        return;
      }
      handleIconAction(icon.dataset.action);
    });
  });

  function handleIconAction(action) {
    switch (action) {
      case "case-study":
        window.open("https://zbr-case-study.vercel.app/", "_blank");
        break;
      case "linkedin":
        window.open("https://www.linkedin.com/in/erica-shultz", "_blank");
        break;
      case "figma":
        window.open("https://www.figma.com/design/BRDh9MOMMyjqydulV5Sqqm/Figma-Work?node-id=351-45376&t=F3hilcXVhHnNFwMT-1", "_blank");
        break;
      case "contact":
        openWindow("contactWindow");
        break;
      case "resume":
        window.open("resume.pdf", "_blank");
        break;
      case "recycle-bin":
        openWindow("binWindow");
        break;
      case "vans-work":
        break;
      default:
        break;
    }
  }

  /* ---------- Window titlebar dragging ---------- */

  document.querySelectorAll(".win98-window").forEach(function (win) {
    var handle = win.querySelector("[data-drag-handle]");
    if (handle) makeDraggable(handle, win, { pinnedOnMobile: true });
  });

  /* ---------- Start menu ---------- */

  var startBtn = document.getElementById("startBtn");
  var startMenu = document.getElementById("startMenu");

  startBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var isHidden = startMenu.hidden;
    startMenu.hidden = !isHidden;
    startBtn.classList.toggle("active", !isHidden ? true : false);
  });

  document.addEventListener("click", function (e) {
    if (!startMenu.hidden && !startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.hidden = true;
      startBtn.classList.remove("active");
    }
  });

  document.getElementById("startSolitaire").addEventListener("click", function () {
    openWindow("solitaireWindow");
    startMenu.hidden = true;
    startBtn.classList.remove("active");
  });

  /* ---------- Clock ---------- */

  function updateClock() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    var minStr = minutes < 10 ? "0" + minutes : "" + minutes;
    document.getElementById("clockTime").textContent = hours + ":" + minStr + " " + ampm;
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Contact form ---------- */

  var contactForm = document.getElementById("contactForm");
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(contactForm);
    var firstName = data.get("firstName");
    var lastName = data.get("lastName");
    var email = data.get("email");
    var message = data.get("message");

    var subject = "Portfolio contact from " + firstName + " " + lastName;
    var body = message + "\n\n— " + firstName + " " + lastName + " (" + email + ")";
    var mailto = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    window.location.href = mailto;
  });

})();
