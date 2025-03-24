const CACHE_NAME = "arhub-cache-v3";
const urlsToCache = [
  "index.html",
  "about.css",
  "about.js",
  "appdoc.css",
  "appdoc.js",
  "code.css",
  "code.js",
  "footer.css",
  "header.css",
  "header.js",
  "testimonial.css",
  "testimonial.js",
  "logo.avif",
  "logo-192.png",
  "logo-512.png",
  "google2234add1ffaf6569.html",
  "google9f153d279b746567.html"
];

// Install Service Worker & Cache Files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error("Failed to cache files during install: ", error);
      })
  );
  self.skipWaiting();
});

// Fetch Cached Files When Offline
self.addEventListener("fetch", event => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('api')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request)
            .then(fetchResponse => {
              return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
            });
        })
        .catch(error => {
          console.error("Failed to fetch resource: ", error);
          // Provide a fallback response if needed
        })
    );
  }
});

// Update Cache When a New Version is Available
self.addEventListener("activate", event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (!cacheWhitelist.includes(cache)) {
              return caches.delete(cache);
            }
          })
        );
      })
      .catch(error => {
        console.error("Failed to activate service worker: ", error);
      })
  );
  self.clients.claim();
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

async function syncAttendance() {
  const attendanceQueue = await getAttendanceQueue();
  for (const record of attendanceQueue) {
    try {
      await fetch('/submit-attendance', {
        method: 'POST',
        body: JSON.stringify(record),
        headers: { 'Content-Type': 'application/json' }
      });
      await removeAttendanceQueue(record.id);
    } catch (error) {
      console.error("Failed to sync attendance record: ", error);
    }
  }
}

async function getAttendanceQueue() {
  const db = await openDB('attendance-db', 1);
  return db.transaction('attendance').objectStore('attendance').getAll();
}

async function removeAttendanceQueue(id) {
  const db = await openDB('attendance-db', 1);
  return db.transaction('attendance', 'readwrite').objectStore('attendance').delete(id);
}

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'logo-192.png',
    badge: 'logo-192.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Handle Errors Gracefully
self.addEventListener('error', event => {
  console.error("Service Worker Error: ", event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error("Unhandled Promise Rejection: ", event.reason);
});

// Utility functions
async function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
