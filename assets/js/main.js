/* Shared interactions: mobile nav, FAQ accordion, scroll reveal, lead form */
(function () {
  "use strict";

  /* Mobile nav */
  var btn = document.querySelector(".menu-btn");
  var links = document.querySelector(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Lead form: VN phone validation + honeypot + localStorage queue.
     Static hosting cannot append to leads.jsonl server-side, so valid
     leads are queued in localStorage ("lead_queue") and shown as a JSON
     line the operator copies into website/leads.jsonl (or POSTs to a
     backend endpoint when LEAD_ENDPOINT is configured). */
  /* Realtime lead delivery: free FormSubmit AJAX endpoint forwards each
     valid lead to owner inbox instantly (first submit needs one-click
     activation email). localStorage queue + [LEAD_JSONL] console remain
     as offline fallback. */
  var VN_PHONE_RE = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  var LEAD_ENDPOINT = "https://formsubmit.co/ajax/khoaphanofficial@gmail.com";

  function normalizePhone(v) {
    return (v || "").replace(/[\s.]/g, "").replace(/^\+84/, "0");
  }

  document.querySelectorAll("form.lead-form").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      /* Honeypot: bots fill it, humans never see it */
      var hp = form.querySelector('input[name="website_url"]');
      if (hp && hp.value) return; /* silently drop spam */

      var nameEl = form.querySelector('[name="ho_ten"]');
      var phoneEl = form.querySelector('[name="so_dien_thoai"]');
      var needEl = form.querySelector('[name="nhu_cau"]');
      var ok = true;

      function setInvalid(el, bad) {
        var f = el.closest(".field");
        if (f) f.classList.toggle("invalid", bad);
        if (bad) ok = false;
      }

      var name = (nameEl.value || "").trim();
      setInvalid(nameEl, name.length < 2);

      var phone = normalizePhone(phoneEl.value);
      phoneEl.value = phone;
      setInvalid(phoneEl, !VN_PHONE_RE.test(phone));

      var lead = {
        ho_ten: name,
        so_dien_thoai: phone,
        nhu_cau: needEl ? needEl.value : "",
        nguon_trang: location.pathname,
        /* UTM attribution: bio link carries ?utm_campaign=<video_uid> so each
           lead maps back to the exact TikTok video that drove it. */
        utm_campaign: (function () {
          try {
            return new URLSearchParams(location.search).get("utm_campaign") || "";
          } catch (e) { return ""; }
        })(),
        thoi_gian: new Date().toISOString()
      };

      /* .form-ok sits OUTSIDE <form> (sibling) — query the card, not the form. */
      var box = form.parentElement
        ? form.parentElement.querySelector(".form-ok") : null;
      if (!ok) {
        if (box) box.style.display = "none";
        return;
      }

      /* Queue locally (static-site persistence) */
      try {
        var q = JSON.parse(localStorage.getItem("lead_queue") || "[]");
        q.push(lead);
        localStorage.setItem("lead_queue", JSON.stringify(q));
      } catch (e) { /* storage unavailable: still show success */ }

      /* Forward to backend when configured */
      if (LEAD_ENDPOINT) {
        fetch(LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead)
        }).catch(function () {});
      }

      /* Expose JSON line for operator copy into website/leads.jsonl */
      // eslint-disable-next-line no-console
      console.log("[LEAD_JSONL] " + JSON.stringify(lead));

      /* Clipboard fallback: lead copied even if backend endpoint is down
         (e.g. FormSubmit 403 before owner activation) — operator pastes
         into Zalo, zero lead loss. */
      try {
        var summary = "LEAD " + lead.ho_ten + " | " + lead.so_dien_thoai
          + " | " + lead.nhu_cau + " | " + lead.nguon_trang;
        if (navigator.clipboard) navigator.clipboard.writeText(summary).catch(function () {});
      } catch (e) { /* clipboard unavailable: success box still shows */ }

      if (box) {
        box.style.display = "block";
        if (!box.querySelector("[data-zalo-link]")) {
          var zalo = document.createElement("a");
          zalo.setAttribute("data-zalo-link", "true");
          zalo.href = "https://zalo.me/0369441399";
          zalo.target = "_blank";
          zalo.rel = "noopener";
          zalo.textContent = " Cần gấp? Chat Zalo 5 phút.";
          box.appendChild(zalo);
        }
      }
      form.querySelectorAll('input[type="text"],input[type="tel"],textarea').forEach(function (i) {
        if (i.name !== "website_url") i.value = "";
      });
      if (needEl) needEl.selectedIndex = 0;
    });
  });
})();
