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

// Reads carousel (Lifestyle page only). Coverflow: the centered book is
// zoomed in, the others are tilted toward it. Loops forever, auto-advances
// every 4.5s and pauses while hovered or focused. To add a book, just add
// another <article class="book-card"> in lifestyle.html.
const reads = document.getElementById("reads");
const readsStage = document.getElementById("reads-stage");

if (reads && readsStage) {
  const cards = [...readsStage.querySelectorAll(".book-card")];
  const total = cards.length;
  const captionEl = document.getElementById("reads-caption");
  const titleEl = document.getElementById("reads-title");
  const authorEl = document.getElementById("reads-author");
  const dotsEl = document.getElementById("reads-dots");
  const prevBtn = document.getElementById("reads-prev");
  const nextBtn = document.getElementById("reads-next");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AUTOPLAY_MS = 4500;

  let current = 0;
  let lastOffsets = cards.map(() => null);
  let captionTimer;

  reads.classList.add("is-ready");

  const dots = cards.map((card, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show ${card.querySelector("h4").textContent}`);
    dot.addEventListener("click", () => { goTo(i); restartAutoplay(); });
    dotsEl.appendChild(dot);
    return dot;
  });

  // Shortest signed distance from the current book, wrapping around, so
  // the list has no start or end (range: -(n/2 - 1) … n/2).
  const offsetOf = (i) => {
    let o = (i - current) % total;
    if (o > total / 2) o -= total;
    if (o <= -total / 2) o += total;
    return o;
  };

  const render = () => {
    const w = cards[0].offsetWidth;
    cards.forEach((card, i) => {
      const o = offsetOf(i);
      const d = Math.abs(o);
      // A card that wraps from one end to the other jumps without animating
      // (it's invisible at that point anyway); same for the first render.
      const jumped = lastOffsets[i] === null || Math.abs(o - lastOffsets[i]) > 1;
      card.classList.toggle("no-anim", jumped);
      lastOffsets[i] = o;

      const x = o * w * 0.8;
      const scale = d === 0 ? 1.2 : Math.max(0.6, 0.9 - (d - 1) * 0.12);
      const rotate = o === 0 ? 0 : (o > 0 ? -30 : 30);
      card.style.transform = `translateX(${x}px) rotateY(${rotate}deg) scale(${scale})`;
      card.style.opacity = d === 0 ? "1" : d === 1 ? "0.9" : d === 2 ? "0.65" : d === 3 ? "0.3" : "0";
      card.style.filter = d === 0 ? "none" : `brightness(${1 - d * 0.15})`;
      card.style.zIndex = String(10 - d);
      card.style.pointerEvents = d > 2 ? "none" : "";
      card.classList.toggle("is-active", d === 0);
    });
    dots.forEach((dot, i) => dot.setAttribute("aria-current", i === current ? "true" : "false"));
  };

  const updateCaption = () => {
    const card = cards[current];
    const apply = () => {
      titleEl.textContent = card.querySelector("h4").textContent;
      authorEl.textContent = card.querySelector("p").textContent;
      captionEl.classList.remove("is-fading");
    };
    clearTimeout(captionTimer);
    if (reduceMotion || !titleEl.textContent) { apply(); return; }
    captionEl.classList.add("is-fading");
    captionTimer = setTimeout(apply, 220);
  };

  const goTo = (i) => {
    current = ((i % total) + total) % total;
    render();
    updateCaption();
  };

  // Autoplay: runs only while the carousel isn't hovered or focused and the
  // tab is visible. Disabled for users who prefer reduced motion.
  let autoplay = null;
  let hovered = false;
  let focused = false;
  const stopAutoplay = () => { clearInterval(autoplay); autoplay = null; };
  const syncAutoplay = () => {
    const canPlay = !reduceMotion && !hovered && !focused && !document.hidden;
    if (canPlay && !autoplay) autoplay = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
    if (!canPlay) stopAutoplay();
  };
  const restartAutoplay = () => { stopAutoplay(); syncAutoplay(); };

  reads.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovered = true; syncAutoplay(); } });
  reads.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { hovered = false; syncAutoplay(); } });
  reads.addEventListener("focusin", () => { focused = true; syncAutoplay(); });
  reads.addEventListener("focusout", (e) => {
    if (!reads.contains(e.relatedTarget)) { focused = false; syncAutoplay(); }
  });
  document.addEventListener("visibilitychange", syncAutoplay);

  // Controls: arrows, click a side book, keyboard, swipe.
  if (prevBtn) prevBtn.addEventListener("click", () => { goTo(current - 1); restartAutoplay(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { goTo(current + 1); restartAutoplay(); });

  let swiped = false;
  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (swiped || i === current) return;
      goTo(i);
      restartAutoplay();
    });
  });

  reads.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); restartAutoplay(); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); restartAutoplay(); }
  });

  let startX = null;
  readsStage.addEventListener("pointerdown", (e) => { startX = e.clientX; swiped = false; });
  readsStage.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) {
      swiped = true;
      goTo(current + (dx < 0 ? 1 : -1));
      restartAutoplay();
    }
  });
  readsStage.addEventListener("pointercancel", () => { startX = null; });
  readsStage.addEventListener("dragstart", (e) => e.preventDefault());

  window.addEventListener("resize", render);

  goTo(0);
  syncAutoplay();
}

// Photo gallery (Lifestyle page only). To add a photo: drop the file into
// assets/gallery/ and add its filename to this list, in the order you want
// it to appear. Nothing else needs to change.
const galleryPhotos = [
  "pycon-2026-01.jpg", "google-io-2026.jpg", "pycon-2026-02.jpg",
  "gallery-01.jpg", "gallery-02.jpg", "gallery-03.jpg", "gallery-04.jpg",
  "gallery-05.jpg", "gallery-06.jpg", "gallery-08.jpg",
  "gallery-09.jpg", "gallery-10.jpg", "gallery-11.jpg", "gallery-12.jpg",
  "gallery-13.jpg", "gallery-14.jpg", "gallery-15.jpg", 
  "gallery-17.jpg", "gallery-18.jpg", "gallery-20.jpg",
  "gallery-21.jpg", "gallery-22.jpg", "gallery-23.jpg", "gallery-24.jpg",
  "gallery-25.jpg", "gallery-26.jpg", "gallery-27.jpg", "gallery-28.jpg",
  "gallery-29.jpg", "gallery-30.jpg", "gallery-31.jpg", "gallery-32.jpg",
  "gallery-33.jpg", "gallery-34.jpg", "gallery-35.jpg", "gallery-36.jpg",
  "gallery-37.jpg",
  // "your-photo.jpg",
];

const galleryEl = document.getElementById("gallery");
const galleryTrack = document.getElementById("gallery-track");
const galleryEmpty = document.getElementById("gallery-empty");
const galleryControls = document.getElementById("gallery-controls");
const galleryCount = document.getElementById("gallery-count");
const galleryPrev = document.getElementById("gallery-prev");
const galleryNext = document.getElementById("gallery-next");
const galleryLightbox = document.getElementById("gallery-lightbox");
const galleryLightboxImg = document.getElementById("gallery-lightbox-img");
const galleryLightboxClose = document.getElementById("gallery-lightbox-close");
const galleryLightboxPrev = document.getElementById("gallery-lightbox-prev");
const galleryLightboxNext = document.getElementById("gallery-lightbox-next");

if (galleryEl && galleryTrack && galleryLightbox && galleryPhotos.length) {
  if (galleryEmpty) galleryEmpty.hidden = true;
  galleryEl.hidden = false;
  if (galleryControls) galleryControls.hidden = false;

  const imgs = galleryPhotos.map((file, i) => {
    const img = document.createElement("img");
    img.src = `assets/gallery/${file}`;
    img.alt = "";
    img.loading = "lazy";
    img.style.setProperty("--tilt", `${((i % 5) - 2) * 5}deg`);
    img.addEventListener("click", () => openGalleryPhoto(i));
    galleryTrack.appendChild(img);
    return img;
  });

  let index = 0;
  const total = imgs.length;
  const updateCount = () => { if (galleryCount) galleryCount.textContent = `${index + 1} / ${total}`; };
  // Scroll only the gallery strip horizontally. (scrollIntoView would also
  // scroll the whole page down to the gallery on every autoplay tick.)
  const goTo = (i) => {
    index = (i + total) % total;
    const padLeft = parseFloat(getComputedStyle(galleryEl).paddingLeft) || 0;
    const left = imgs[index].getBoundingClientRect().left - galleryEl.getBoundingClientRect().left + galleryEl.scrollLeft - padLeft;
    galleryEl.scrollTo({ left, behavior: "smooth" });
    updateCount();
    if (galleryLightbox.classList.contains("open")) galleryLightboxImg.src = imgs[index].src;
  };
  updateCount();

  let autoplay;
  const startAutoplay = () => { autoplay = setInterval(() => goTo(index + 1), 4000); };
  const stopAutoplay = () => clearInterval(autoplay);
  const resetAutoplay = () => { stopAutoplay(); startAutoplay(); };
  startAutoplay();
  galleryEl.addEventListener("mouseenter", stopAutoplay);
  galleryEl.addEventListener("mouseleave", startAutoplay);

  if (galleryPrev) galleryPrev.addEventListener("click", () => { goTo(index - 1); resetAutoplay(); });
  if (galleryNext) galleryNext.addEventListener("click", () => { goTo(index + 1); resetAutoplay(); });

  const openGalleryPhoto = (i) => {
    index = i;
    updateCount();
    galleryLightboxImg.src = imgs[index].src;
    galleryLightbox.classList.add("open");
    stopAutoplay();
  };
  const closeGalleryPhoto = () => {
    galleryLightbox.classList.remove("open");
    startAutoplay();
  };

  if (galleryLightboxClose) {
    galleryLightboxClose.addEventListener("click", closeGalleryPhoto);
    galleryLightbox.addEventListener("click", (e) => { if (e.target === galleryLightbox) closeGalleryPhoto(); });
    document.addEventListener("keydown", (e) => {
      if (!galleryLightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeGalleryPhoto();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    });
  }
  if (galleryLightboxPrev) galleryLightboxPrev.addEventListener("click", (e) => { e.stopPropagation(); goTo(index - 1); });
  if (galleryLightboxNext) galleryLightboxNext.addEventListener("click", (e) => { e.stopPropagation(); goTo(index + 1); });

  // Swipe: drag left/right on the open photo to move to the next/previous one.
  let touchStartX = null;
  galleryLightboxImg.addEventListener("pointerdown", (e) => { touchStartX = e.clientX; });
  galleryLightboxImg.addEventListener("pointerup", (e) => {
    if (touchStartX === null) return;
    const dx = e.clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 40) return; // too small to count as a swipe
    dx < 0 ? goTo(index + 1) : goTo(index - 1);
  });
  galleryLightboxImg.addEventListener("dragstart", (e) => e.preventDefault());
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

// Skills chips (Home + Experience): cascade in the first time each list
// scrolls into view, plus a press effect on touch screens. The styles
// (including the desktop hover and the mobile color wave) live in style.css.
const skillLists = document.querySelectorAll(".chips-animated");

if (skillLists.length) {
  skillLists.forEach((list) => {
    [...list.children].forEach((li, i) => li.style.setProperty("--i", i));
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    skillLists.forEach((list) => {
      list.classList.add("will-animate");
      io.observe(list);
    });
  }

  skillLists.forEach((list) => {
    list.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      const li = e.target.closest("li");
      if (!li) return;
      li.classList.add("is-tapped");
      clearTimeout(li._tapTimer);
      li._tapTimer = setTimeout(() => li.classList.remove("is-tapped"), 600);
    });
  });
}