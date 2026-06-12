/* ICML site — interactions: theme, language, nav, reveal, TOC, glossary */
(function () {
  const root = document.documentElement;

  /* ---- Theme ---- */
  const savedTheme = localStorage.getItem("icml-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
    root.setAttribute("data-theme", "dark");

  function syncThemeBtn() {
    const t = root.getAttribute("data-theme") || "light";
    document.querySelectorAll("[data-theme-toggle]").forEach(b => {
      b.textContent = t === "dark" ? "☀" : "☾";
      b.setAttribute("aria-label", t === "dark" ? "Mode clair" : "Mode sombre");
    });
  }

  /* ---- Language ---- */
  const savedLang = localStorage.getItem("icml-lang") || "fr";
  root.setAttribute("data-lang", savedLang);
  function syncLangBtn() {
    const l = root.getAttribute("data-lang");
    document.querySelectorAll("[data-lang-btn]").forEach(b => {
      b.classList.toggle("on", b.getAttribute("data-lang-btn") === l);
    });
    document.documentElement.lang = l;
  }

  document.addEventListener("click", function (e) {
    const themeBtn = e.target.closest("[data-theme-toggle]");
    if (themeBtn) {
      const next = (root.getAttribute("data-theme") === "dark") ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("icml-theme", next);
      syncThemeBtn();
    }
    const langBtn = e.target.closest("[data-lang-btn]");
    if (langBtn) {
      const l = langBtn.getAttribute("data-lang-btn");
      root.setAttribute("data-lang", l);
      localStorage.setItem("icml-lang", l);
      syncLangBtn();
    }
    const menuBtn = e.target.closest("[data-menu]");
    if (menuBtn) {
      document.querySelector(".nav")?.classList.toggle("open");
    }
  });

  /* ---- Scroll reveal ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---- TOC active state ---- */
  const tocLinks = [...document.querySelectorAll(".toc a")];
  if (tocLinks.length) {
    const sections = tocLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const tio = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const id = "#" + en.target.id;
          tocLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === id));
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach(s => tio.observe(s));
  }

  /* ---- Glossary search ---- */
  const gs = document.getElementById("glossSearch");
  if (gs) {
    gs.addEventListener("input", () => {
      const q = gs.value.trim().toLowerCase();
      document.querySelectorAll(".gloss-item").forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }

  /* ---- init ---- */
  syncThemeBtn();
  syncLangBtn();
})();
