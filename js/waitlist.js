(function () {
  var cfg = window.ACUITY_CONFIG || {};
  var form = document.getElementById("waitlistForm");
  var nameEl = document.getElementById("wlName");
  var emailEl = document.getElementById("wlEmail");
  var submitEl = document.getElementById("wlSubmit");
  var msgEl = document.getElementById("wlMsg");
  var formWrap = document.getElementById("waitlistFormWrap");
  var successEl = document.getElementById("waitlistSuccess");
  var shareLinkEl = document.getElementById("shareLink");
  var copyBtn = document.getElementById("copyShare");
  var shareBtn = document.getElementById("shareNative");

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function functionsBase() {
    if (cfg.FUNCTIONS_URL) return cfg.FUNCTIONS_URL.replace(/\/$/, "");
    if (cfg.SUPABASE_URL) return cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1";
    return "";
  }

  function setMsg(text, kind) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.className = "w-msg" + (kind ? " " + kind : "");
  }

  function referrerCode() {
    try { return new URLSearchParams(location.search).get("ref") || null; } catch (_) { return null; }
  }

  function buildShareLink(code) {
    var base = (cfg.SITE_URL || location.origin).replace(/\/$/, "");
    return base + "/?ref=" + encodeURIComponent(code);
  }

  function showSuccess(code) {
    var link = buildShareLink(code || "welcome");
    if (shareLinkEl) shareLinkEl.textContent = link;
    if (shareLinkEl) shareLinkEl.dataset.link = link;
    if (formWrap) formWrap.style.display = "none";
    if (successEl) successEl.classList.add("show");
    try { window.scrollTo({ top: document.getElementById("waitlist").offsetTop - 40, behavior: "smooth" }); } catch (_) {}
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = (nameEl.value || "").trim();
      var email = (emailEl.value || "").trim().toLowerCase();

      nameEl.classList.remove("invalid");
      emailEl.classList.remove("invalid");

      if (name.length < 2) { nameEl.classList.add("invalid"); setMsg("Please enter your name.", "err"); nameEl.focus(); return; }
      if (!EMAIL_RE.test(email)) { emailEl.classList.add("invalid"); setMsg("Please enter a valid email address.", "err"); emailEl.focus(); return; }

      var tier = null;
      try { tier = sessionStorage.getItem("acuity_tier"); } catch (_) {}

      if (window.track) window.track("waitlist_submit", { has_referrer: !!referrerCode(), tier: tier || null });

      submitEl.disabled = true;
      var original = submitEl.textContent;
      submitEl.textContent = "Joining…";
      setMsg("");

      var base = functionsBase();

      if (!base || !cfg.SUPABASE_ANON_KEY) {
        setTimeout(function () { showSuccess("welcome"); }, 500);
        submitEl.disabled = false; submitEl.textContent = original;
        return;
      }

      fetch(base + "/waitlist-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY,
          "apikey": cfg.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          name: name,
          email: email,
          referrer_code: referrerCode(),
          tier: tier,
          ab_variant: window.ACUITY_AB || null
        })
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error((res.body && res.body.error) || "Signup failed");
          showSuccess(res.body.referral_code);
        })
        .catch(function (err) {
          setMsg(err.message === "Signup failed" ? "Something went wrong. Please try again." : (err.message || "Network error. Please try again."), "err");
        })
        .finally(function () {
          submitEl.disabled = false;
          submitEl.textContent = original;
        });
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var link = (shareLinkEl && shareLinkEl.dataset.link) || (shareLinkEl && shareLinkEl.textContent) || "";
      navigator.clipboard && navigator.clipboard.writeText(link).then(function () {
        var t = copyBtn.textContent; copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = t; }, 1800);
      });
    });
  }
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var link = (shareLinkEl && shareLinkEl.dataset.link) || "";
      var data = { title: "Acuity", text: "I just joined the Acuity waitlist — the science of staying focused. Join me:", url: link };
      if (navigator.share) { navigator.share(data).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(link); shareBtn.textContent = "Link copied!"; }
    });
  }

  try {
    var params = new URLSearchParams(location.search);
    if (params.get("verified") === "1") {
      if (window.track) window.track("email_confirmed", {});
      showSuccess(params.get("ref") || "welcome");
      setMsg("Email confirmed — you're all set! ✦", "ok");
    }
  } catch (_) {}
})();
