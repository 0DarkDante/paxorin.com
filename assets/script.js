(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const burger = $("#burger");
  const navLinks = $("#navLinks");
  if (burger && navLinks) {
    burger.addEventListener("click", () => navLinks.classList.toggle("open"));
    $$("#navLinks a").forEach(a => a.addEventListener("click", () => navLinks.classList.remove("open")));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") navLinks.classList.remove("open");
    });
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });

  const sections = ["services", "prices", "process", "about", "faq", "contacts"]
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const navMap = new Map();
  $$("#navLinks a").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) navMap.set(href.slice(1), a);
  });

  function updateActiveNav() {
    if (!sections.length) return;
    const y = window.scrollY + 120;
    let current = sections[0].id;
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (s.offsetTop <= y) current = s.id;
    }
    navMap.forEach((a) => a.classList.remove("active"));
    const active = navMap.get(current);
    if (active) active.classList.add("active");
  }
  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  $$("img[data-src]").forEach(img => {
    const src = img.getAttribute("data-src");
    if (!src) return;

    const load = () => {
      img.src = src;
      img.removeAttribute("data-src");
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            load();
            io.disconnect();
          }
        });
      }, { rootMargin: "180px" });
      io.observe(img);
    } else {
      setTimeout(load, 300);
    }
  });

  $$(".faq-item").forEach(item => {
    const btn = $(".faq-q", item);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const open = item.classList.contains("open");
      $$(".faq-item").forEach(i => i.classList.remove("open"));
      if (!open) item.classList.add("open");
    });
  });

  const modal = $("#modal");
  const openModalBtn = $("#openModal");
  const closeModalBtn = $("#closeModal");
  function openModal() {
    if (!modal) return;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#modalTitle") && $("#modalTitle").focus(), 10);
  }
  function closeModal() {
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
  if (openModalBtn) openModalBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  const calc = {
    service: $("#calcService"),
    diameter: $("#calcDiameter"),
    qty: $("#calcQty"),
    runflat: $("#calcRunflat"),
    suv: $("#calcSuv"),
    result: $("#calcResult"),
    details: $("#calcDetails"),
    btn: $("#calcBtn"),
  };

  function basePrice(service) {
    if (service === "change") return 260;      
    if (service === "balance") return 180;    
    if (service === "repair") return 240;      
    if (service === "season") return 190;      
    return 250;
  }
  function diameterCoef(d) {
    const n = parseInt(d, 10);
    if (!n) return 1.0;
    // R13..R22
    return clamp(0.9 + (n - 14) * 0.07, 0.9, 1.55);
  }
  function calcPrice() {
    if (!calc.result || !calc.details) return;

    const service = calc.service ? calc.service.value : "change";
    const d = calc.diameter ? calc.diameter.value : "16";
    const qty = calc.qty ? parseInt(calc.qty.value, 10) : 4;
    const isRunflat = calc.runflat ? calc.runflat.checked : false;
    const isSuv = calc.suv ? calc.suv.checked : false;

    let p = basePrice(service);
    const kDia = diameterCoef(d);

    let multiplier = kDia;
    if (isRunflat) multiplier *= 1.22;
    if (isSuv) multiplier *= 1.14;

    let total = 0;
    if (service === "season") {
      const perMonth = 480 * (isSuv ? 1.12 : 1.0);
      total = Math.round(perMonth);
      calc.details.innerHTML =
        "Розрахунок для <b>зберігання комплекту</b> на 1 місяць. " +
        "Включено: маркування, пакування, облік, контроль температури/вологи.";
      calc.result.textContent = total + " грн/міс";
      return;
    }

    total = Math.round(p * multiplier * clamp(qty, 1, 8));

    // breakdown text
    const parts = [];
    parts.push("База: " + p + " грн/колесо");
    parts.push("Діаметр R" + d + " (коеф. " + kDia.toFixed(2) + ")");
    if (isRunflat) parts.push("RunFlat (+22%)");
    if (isSuv) parts.push("SUV/мікроавтобус (+14%)");
    parts.push("К-сть: " + clamp(qty, 1, 8));

    calc.details.innerHTML = parts.map(s => "• " + s).join("<br>");
    calc.result.textContent = total + " грн (орієнтовно)";
  }

  if (calc.btn) calc.btn.addEventListener("click", calcPrice);
  ["change", "input"].forEach(evt => {
    [calc.service, calc.diameter, calc.qty, calc.runflat, calc.suv].forEach(el => {
      if (!el) return;
      el.addEventListener(evt, calcPrice);
    });
  });
  calcPrice();

  const form = $("#bookForm");
  const toast = $("#toast");
  const toastText = $("#toastText");

  function showToast(text, ok) {
    if (!toast || !toastText) return;
    toastText.textContent = text;
    toast.style.display = "block";
    toast.style.borderColor = ok ? "rgba(60,240,138,.35)" : "rgba(255,77,77,.35)";
    toast.style.boxShadow = ok ? "0 14px 40px rgba(60,240,138,.10)" : "0 14px 40px rgba(255,77,77,.10)";
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.style.display = "none"), 3600);
  }

  function isPhoneUA(s) {
    const t = String(s || "").replace(/\s|\(|\)|\-|\+/g, "");
    return (/^380\d{9}$/).test(t) || (/^0\d{9}$/).test(t);
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("#fName");
      const phone = $("#fPhone");
      const service = $("#fService");
      const msg = $("#fMsg");
      const consent = $("#fConsent");

      const errName = $("#eName");
      const errPhone = $("#ePhone");
      const errConsent = $("#eConsent");
      const okLine = $("#okLine");

      // reset
      [errName, errPhone, errConsent].forEach(el => el && (el.style.display = "none"));
      if (okLine) okLine.style.display = "none";

      let good = true;

      if (!name || String(name.value || "").trim().length < 2) {
        if (errName) errName.style.display = "block";
        good = false;
      }
      if (!phone || !isPhoneUA(phone.value)) {
        if (errPhone) errPhone.style.display = "block";
        good = false;
      }
      if (!consent || !consent.checked) {
        if (errConsent) errConsent.style.display = "block";
        good = false;
      }

      if (!good) {
        showToast("Перевірте поля форми: ім'я, телефон та згоду на обробку даних.", false);
        return;
      }

      const when = new Date();
      const hh = String(when.getHours()).padStart(2, "0");
      const mm = String(when.getMinutes()).padStart(2, "0");

      if (okLine) {
        okLine.style.display = "block";
        okLine.textContent = "Заявка сформована о " + hh + ":" + mm + ". Ми передзвонимо протягом 10–20 хв у робочий час.";
      }

      const s = service ? service.value : "";
      const body =
        "Заявка з paxorin.com\n" +
        "Ім'я: " + name.value + "\n" +
        "Телефон: " + phone.value + "\n" +
        "Послуга: " + s + "\n" +
        "Повідомлення: " + (msg ? msg.value : "") + "\n";

      const mailto = "mailto:info@paxorin.com?subject=" +
        encodeURIComponent("Запис на шиномонтаж (paxorin.com)") +
        "&body=" + encodeURIComponent(body);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(body).catch(() => {});
      }

      showToast("Готово! Відкриваю лист — якщо пошта не налаштована, текст заявки вже скопійовано.", true);
      setTimeout(() => { window.location.href = mailto; }, 450);

      form.reset();
      calcPrice();
    });
  }

  const cookiebar = $("#cookiebar");
  const cAccept = $("#cAccept");
  const cReject = $("#cReject");
  const cSettings = $("#cSettings");

  const key = "paxorin_cookie_choice"; 

  function hasChoice() {
    try { return !!localStorage.getItem(key); }
    catch (_) { return false; }
  }
  function setChoice(val) {
    try { localStorage.setItem(key, val); } catch (_) {}
  }
  function showCookiebar() {
    if (!cookiebar) return;
    cookiebar.style.display = "block";
  }
  function hideCookiebar() {
    if (!cookiebar) return;
    cookiebar.style.display = "none";
  }

  if (!hasChoice()) {
    setTimeout(showCookiebar, 700);
  }

  if (cAccept) cAccept.addEventListener("click", () => {
    setChoice("accept");
    hideCookiebar();
    showToast("Дякуємо! Cookies дозволені (аналітика/покращення сервісу).", true);
  });

  if (cReject) cReject.addEventListener("click", () => {
    setChoice("reject");
    hideCookiebar();
    showToast("Гаразд. Використовуємо лише технічні cookies.", true);
  });

  if (cSettings) cSettings.addEventListener("click", () => {
    window.location.href = "/cookies.html";
  });

  const openNow = $("#openNow");
  if (openNow) {
    const now = new Date();
    const day = now.getDay(); // 0 Sun..6 Sat
    const mins = now.getHours() * 60 + now.getMinutes();
    const isWorkday = (day >= 1 && day <= 6);
    const isOpen = isWorkday && mins >= 9 * 60 && mins <= 19 * 60;

    openNow.innerHTML = (isOpen ? '<span class="pulse"></span>Відкрито зараз' : 'Зараз зачинено') +
      '<span class="kbd" style="margin-left:10px">Пн–Сб 09:00–19:00</span>';
  }
})();
