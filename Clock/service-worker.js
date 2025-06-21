// This service worker is primarily for PWA installability and does not include
// aggressive caching for offline functionality as requested by the user.

self.addEventListener('install', (event) => {
    // This event fires when the service worker is installed.
    // We can use it to perform setup tasks.
    console.log('Service Worker: Install event fired.');
    // Force the waiting service worker to become active.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // This event fires when the service worker is activated.
    // It's a good place to clean up old caches.
    console.log('Service Worker: Activate event fired.');
    // Claim control over un-controlled clients.
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // This event fires every time the browser requests a resource.
    // We can intercept requests here.
    // Since offline functionality is not desired, we simply let the browser
    // handle the network request directly.
    event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
    // This event handles push notifications.
    // While the current app doesn't send push notifications from a server,
    // this listener is kept as a placeholder if such functionality were to be added.
    const title = event.data ? event.data.text() : 'Xiaomi Clock Notification';
    const options = {
        body: 'You have a new update or alert!',
        icon: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#5a5a5a" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.87 13.91l-4.73-2.73c-.2-.12-.32-.34-.32-.58V7.5c0-.41.34-.75.75-.75s.75.34.75.75v4.56l4.21 2.43c.36.21.49.66.28 1.02-.21.36-.66.49-1.02.28z"/></svg>')
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    // This event handles clicks on notifications.
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') // Open the app when notification is clicked
    );
});
