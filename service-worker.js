const CACHE_NAME = "arhub-cache-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/about.css",
  "/about.js",
  "/appdoc.css",
  "/appdoc.js",
  "/code.css",
  "/code.js",
  "/footer.css",
  "/header.css",
  "/header.js",
  "/testimonial.css",
  "/testimonial.js",
  "/logo.avif",
  "/google2234add1ffaf6569.html",
  "/google9f153d279b746567.html"
];

// Install Service Worker & Cache Files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch Cached Files When Offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Update Cache When a New Version is Available
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
