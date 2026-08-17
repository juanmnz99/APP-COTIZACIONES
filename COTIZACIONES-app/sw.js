// Service Worker del Cotizador de Grupo Pomiglio.
// Cachea el "shell" de la app (HTML/CSS/JS/datos/íconos) para que funcione sin conexión
// una vez instalada. Las fichas técnicas en PDF no se precachean (son pesadas y muchas);
// se piden a la red normalmente y el navegador las cachea por su cuenta si hace falta.

const VERSION = 'pomiglio-v1';
const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/main.js',
  './js/utils.js',
  './js/tc-compartido.js',
  './js/tab-cotizacion.js',
  './js/tab-cheques.js',
  './js/tab-bna.js',
  './js/pwa.js',
  './js/error-banner.js',
  './data/catalogo.js',
  './manifest.json',
  './assets/logo-pomiglio.png',
  './assets/logo-hangcha.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Las fichas en PDF y cualquier llamada a otro dominio (APIs externas) van directo a red.
  if (url.pathname.includes('/fichas/') || url.origin !== self.location.origin) {
    return;
  }

  // Shell de la app: "stale-while-revalidate" — responde rápido con lo cacheado y
  // actualiza el caché en segundo plano para la próxima vez.
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cacheado = await cache.match(req);
      const redFetch = fetch(req).then((resp) => {
        if (resp && resp.status === 200) cache.put(req, resp.clone());
        return resp;
      }).catch(() => cacheado);
      return cacheado || redFetch;
    })
  );
});
