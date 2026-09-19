// Renk Ustası — offline kabuk. Uygulama + toner verisi önbelleğe alınır (mimari madde 19).
// AI istekleri (/api/*) her zaman internete gider, önbelleğe girmez.
const V = "renk-ustasi-v2";
const SHELL = ["index.html", "styles.css", "app.js", "manifest.webmanifest", "key.local.js", "toners-data.js",
  "../data/VERSION.json",
  "../data/toners/dynacoat-MM-solid.json",
  "../data/toners/dynacoat-MM-effect-binder.json",
  "../data/toners/renumber-aliases.json"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))));
});
self.addEventListener("fetch", e => {
  if (new URL(e.request.url).pathname.includes("/api/")) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    const kopya = r.clone();
    caches.open(V).then(c => c.put(e.request, kopya));
    return r;
  }).catch(() => caches.match("index.html"))));
});
