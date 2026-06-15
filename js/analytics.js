(function () {
  var cfg = window.ACUITY_CONFIG || {};

  function sessionId() {
    var id;
    try { id = localStorage.getItem("acuity_sid"); } catch (_) {}
    if (!id) {
      id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem("acuity_sid", id); } catch (_) {}
    }
    return id;
  }

  function refParam() {
    try { return new URLSearchParams(location.search).get("ref") || null; } catch (_) { return null; }
  }

  window.track = function (event, props) {
    props = props || {};

    try { if (window.va) window.va("event", { name: event, data: props }); } catch (_) {}

    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
      var payload = {
        event: event,
        props: props,
        session_id: sessionId(),
        ab_variant: window.ACUITY_AB || null,
        referrer_code: refParam(),
        path: location.pathname + location.hash
      };
      try {
        var body = JSON.stringify(payload);
        var url = cfg.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/analytics_events";
        fetch(url, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            "apikey": cfg.SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY,
            "Prefer": "return=minimal"
          },
          body: body
        }).catch(function () {});
      } catch (_) {}
    }
  };
})();
