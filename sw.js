// Service worker de Amable PC: primero la red (siempre la versión nueva) y, sin conexión, la copia guardada.
// Receta de autoactualización de Amable Sleep. La versión de CACHE la sube publicar.py en cada publicación.
const CACHE = 'amablepc-v3.01';
const CORE = ['./', './index.html', './correo.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload': la copia sin conexión se baja del servidor, nunca de la caché del navegador.
  // Si algún archivo falla, los demás se guardan igual (no se bloquea la instalación).
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(CORE.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => r.ok && c.put(u, r)).catch(() => {}))))
    .then(() => self.skipWaiting())); // la versión nueva entra sin esperar
});

self.addEventListener('activate', e => {
  // Solo se borran las cachés de ESTA app (todas las apps de gcalabro12.github.io comparten origen)
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('amablepc-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())); // y controla ya las pestañas abiertas
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  // Primero la red, preguntando siempre al servidor (GitHub Pages guarda 10 min). Sin red, la copia guardada.
  e.respondWith(fetch(new Request(r.url, { cache: 'no-cache', credentials: 'same-origin' }))
    .then(res => { if (res.ok && !u.search) caches.open(CACHE).then(c => c.put(r, res.clone())); return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
});
