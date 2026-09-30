const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Theme toggle, persisted in localStorage.
// The saved theme is already applied by the inline script in <head>
// (before first paint, to avoid a flash). This just wires up the button.
const root = document.documentElement;
const toggle = document.getElementById("theme-toggle");

if (toggle) {
  toggle.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark"
      || (!root.hasAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
}

// Mobile menu overlay
const menuToggle = document.getElementById("menu-toggle");
const navOverlay = document.getElementById("nav-overlay");
const siteHeader = document.querySelector(".site-header");

if (menuToggle && navOverlay && siteHeader) {
  const setMenu = (open) => {
    if (open) navOverlay.style.paddingTop = `${siteHeader.offsetHeight + 8}px`;
    navOverlay.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  };

  menuToggle.addEventListener("click", () => {
    setMenu(!navOverlay.classList.contains("open"));
  });

  navOverlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
}

// Logo photo lightbox. Moves the real <img> so the browser can morph it
// from the small circle into the full-screen view natively.
const avatarBtn = document.getElementById("avatar-btn");
const avatarImg = document.getElementById("avatar-img");
const lightbox = document.getElementById("lightbox");
const lightboxClose = document.getElementById("lightbox-close");

if (avatarBtn && avatarImg && lightbox && lightboxClose) {
  const moveAvatar = (toLightbox) => {
    const move = () => {
      if (toLightbox) {
        lightbox.insertBefore(avatarImg, lightboxClose);
        lightbox.classList.add("open");
      } else {
        avatarBtn.insertBefore(avatarImg, avatarBtn.firstChild);
        lightbox.classList.remove("open");
      }
    };
    document.startViewTransition ? document.startViewTransition(move) : move();
  };

  avatarBtn.addEventListener("click", () => moveAvatar(true));
  lightboxClose.addEventListener("click", () => moveAvatar(false));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) moveAvatar(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("open")) moveAvatar(false);
  });
}

// Newsletter form (Home page only). No email provider wired up yet.
const newsletterForm = document.getElementById("newsletter-form");
if (newsletterForm) {
  const note = document.getElementById("newsletter-note");
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    newsletterForm.reset();
    if (note) note.hidden = false;
  });
}
