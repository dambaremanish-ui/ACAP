self.addEventListener('install', (e) => {
    console.log('Service Worker Installed');
});

self.addEventListener('fetch', (e) => {
    // Network-first strategy to ensure real-time data
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
