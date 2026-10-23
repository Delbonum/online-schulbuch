// Erzeugt beim Bauen von AutoCell (build/offline.ts) – nicht von Hand ändern.
const CACHE = "autocell-2.4.1-3445ea95d1";
const FILES = [
  "./",
  "assets/desktopFiles-BdhvWxyr.js",
  "assets/event-xJNu2Rtk.js",
  "assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2",
  "assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2",
  "assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2",
  "assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2",
  "assets/ibm-plex-sans-latin-400-normal-CDDApCn2.woff2",
  "assets/ibm-plex-sans-latin-500-normal-6ng42L7E.woff2",
  "assets/ibm-plex-sans-latin-600-normal-CuJfVYMP.woff2",
  "assets/ibm-plex-sans-latin-700-normal-Bxkt5Cjx.woff2",
  "assets/ibm-plex-sans-latin-ext-400-normal-C5H60-Va.woff2",
  "assets/ibm-plex-sans-latin-ext-500-normal-DakdToA3.woff2",
  "assets/ibm-plex-sans-latin-ext-600-normal-DOrvGEcy.woff2",
  "assets/ibm-plex-sans-latin-ext-700-normal-aMgXseD4.woff2",
  "assets/index-B9lTS2Zk.css",
  "assets/index-ChBJT3N1.js",
  "assets/window-CM4fikXz.js",
  "icon.png",
  "manifest.webmanifest"
];
const PRECACHED = new Set(FILES);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('autocell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const rel = url.pathname.slice(scope.pathname.length);
  const key = rel === '' || rel === 'index.html' ? './' : rel;
  if (!PRECACHED.has(key)) return;
  event.respondWith(
    caches.open(CACHE)
      .then((c) => c.match(key === './' ? scope.href : new URL(key, scope).href))
      .then((hit) => hit || fetch(req)),
  );
});
