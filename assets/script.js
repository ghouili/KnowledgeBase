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

  /* ---- Graded QCM (score /60) ---- */
  function initQCM() {
    const data = window.QCM;
    const mount = document.getElementById("qcm-app");
    if (!data || !mount) return;
    const total = data.length;
    const perPoint = 60 / total;
    const L = ["A", "B", "C", "D", "E"];

    let html = '<div class="qcm-quiz">';
    data.forEach((it, qi) => {
      html += `<div class="qcm-q" data-a="${it.a}">`;
      html += `<p class="qcm-question"><span class="qnum">${qi + 1}</span><span class="fr">${it.fr.q}</span><span class="en">${it.en.q}</span></p>`;
      html += '<div class="qcm-opts">';
      it.fr.o.forEach((_, oi) => {
        html += `<label class="qcm-opt"><input type="radio" name="q${qi}" value="${oi}"><span class="opt-mark">${L[oi]}</span><span class="opt-text"><span class="fr">${it.fr.o[oi]}</span><span class="en">${it.en.o[oi]}</span></span></label>`;
      });
      html += "</div>";
      html += `<div class="qcm-explain" hidden><strong><span class="fr">Explication :</span><span class="en">Explanation:</span></strong> <span class="fr">${it.fr.x}</span><span class="en">${it.en.x}</span></div>`;
      html += "</div>";
    });
    html += '<div class="qcm-bar">';
    html += '<button type="button" class="btn btn-primary" id="qcmValidate"><span class="fr">Valider mes réponses</span><span class="en">Check my answers</span></button>';
    html += '<button type="button" class="btn btn-ghost" id="qcmReset" hidden><span class="fr">Recommencer</span><span class="en">Try again</span></button>';
    html += '<span class="qcm-progress"><span class="fr">0 / ' + total + ' répondu</span><span class="en">0 / ' + total + ' answered</span></span>';
    html += "</div>";
    html += '<div class="qcm-score" id="qcmScore" hidden></div>';
    html += "</div>";
    mount.innerHTML = html;

    const qs = [...mount.querySelectorAll(".qcm-q")];
    const progress = mount.querySelector(".qcm-progress");
    const updateProgress = () => {
      const n = qs.filter(q => q.querySelector("input:checked")).length;
      progress.innerHTML = `<span class="fr">${n} / ${total} répondu</span><span class="en">${n} / ${total} answered</span>`;
    };
    mount.addEventListener("change", e => { if (e.target.matches('input[type="radio"]')) updateProgress(); });

    mount.querySelector("#qcmValidate").addEventListener("click", () => {
      let correct = 0, answered = 0;
      qs.forEach(q => {
        const a = +q.dataset.a;
        const sel = q.querySelector("input:checked");
        q.querySelectorAll(".qcm-opt").forEach((opt, oi) => {
          opt.querySelector("input").disabled = true;
          if (oi === a) opt.classList.add("is-correct");
          if (sel && +sel.value === oi && oi !== a) opt.classList.add("is-wrong");
        });
        if (sel) { answered++; if (+sel.value === a) { correct++; q.classList.add("q-correct"); } else q.classList.add("q-wrong"); }
        else q.classList.add("q-skip");
        q.querySelector(".qcm-explain").hidden = false;
      });

      const score = Math.round(correct * perPoint);
      const pct = correct / total;
      let tier, mfr, men;
      if (pct >= 0.85) { tier = "great"; mfr = "Excellent ! Maîtrise solide du chapitre."; men = "Excellent! Strong command of the chapter."; }
      else if (pct >= 0.65) { tier = "good"; mfr = "Bien. Quelques points à revoir."; men = "Good. A few points to review."; }
      else if (pct >= 0.5) { tier = "ok"; mfr = "Passable. Relisez les sections concernées."; men = "Pass. Re-read the relevant sections."; }
      else { tier = "low"; mfr = "À revoir. Reprenez le chapitre puis réessayez."; men = "Needs review. Go through the chapter and try again."; }

      const scoreEl = mount.querySelector("#qcmScore");
      scoreEl.className = "qcm-score tier-" + tier;
      scoreEl.innerHTML =
        '<div class="score-head"><div class="score-num">' + score + ' <small>/ 60</small></div>' +
        '<div class="score-detail"><b>' + correct + ' / ' + total + '</b> ' +
        '<span class="fr">bonnes réponses</span><span class="en">correct answers</span>' +
        (answered < total ? ' · <span class="fr">' + (total - answered) + ' sans réponse</span><span class="en">' + (total - answered) + ' unanswered</span>' : '') +
        '</div></div>' +
        '<div class="score-track"><div class="score-fill" style="width:' + Math.round(pct * 100) + '%"></div></div>' +
        '<p class="score-msg"><span class="fr">' + mfr + '</span><span class="en">' + men + '</span></p>';
      scoreEl.hidden = false;
      mount.querySelector("#qcmValidate").hidden = true;
      mount.querySelector("#qcmReset").hidden = false;
      progress.style.display = "none";
      scoreEl.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    mount.querySelector("#qcmReset").addEventListener("click", () => {
      qs.forEach(q => {
        q.classList.remove("q-correct", "q-wrong", "q-skip");
        q.querySelector(".qcm-explain").hidden = true;
        q.querySelectorAll(".qcm-opt").forEach(opt => {
          opt.classList.remove("is-correct", "is-wrong");
          const i = opt.querySelector("input"); i.disabled = false; i.checked = false;
        });
      });
      mount.querySelector("#qcmScore").hidden = true;
      mount.querySelector("#qcmReset").hidden = true;
      mount.querySelector("#qcmValidate").hidden = false;
      progress.style.display = "";
      updateProgress();
      mount.querySelector(".qcm-quiz").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---- init ---- */
  initQCM();
  syncThemeBtn();
  syncLangBtn();
})();
