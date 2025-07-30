const CACHE_NAME = 'bg-remover-cache-v6'; // Updated cache name to force refresh
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './react.min.js',
    './react-dom.min.js',
    './transformers.min.js',
    './heic2any.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching assets');
            return cache.addAll(urlsToCache);
        }).catch(err => {
            console.error('Cache open error:', err);
        })
    );
});

self.addEventListener('fetch', event => {
    // Bypass caching for transformers.min.js to ensure module context
    if (event.request.url.includes('transformers.min.js')) {
        event.respondWith(fetch(event.request));
        return;
    }
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(err => {
                console.error('Fetch error:', err);
                return new Response('Offline resource unavailable', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});