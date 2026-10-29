/* Service worker: o app abre sem internet. Arquivos do site: rede primeiro, cache como reserva. Supabase nunca é guardado. */
const V = '202610290809', CORE = ['./', 'index.html', 'painel.html', 'app.css', 'app.js', 'painel.js', 'lib.js', 'config.js', 'vendor/supabase.js', 'manifest.webmanifest', 'fonts/lilita.woff2', 'fonts/atk400.woff2', 'fonts/atk700.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => 0)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
