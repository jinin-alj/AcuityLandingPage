 window.ACUITY_CONFIG = {
  SUPABASE_URL: "https://crsppyakczjlmfwurpbt.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyc3BweWFrY3pqbG1md3VycGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzU2NjEsImV4cCI6MjA5NjYxMTY2MX0.lW3FRPj7CJPC-YF002vSSQDxuT-gsTPdYl-b6y3GSos",
  FUNCTIONS_URL: "",
  SITE_URL: "https://acuityfocus.com"
};
(function () {
  var v;
  try { v = localStorage.getItem("acuity_ab"); } catch (_) {}
  if (v !== "A" && v !== "B") {
    v = Math.random() < 0.5 ? "A" : "B";
    try { localStorage.setItem("acuity_ab", v); } catch (_) {}
  }
  window.ACUITY_AB = v;
})();
