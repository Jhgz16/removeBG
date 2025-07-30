const CACHE_NAME = 'bg-remover-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
    'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1/dist/transformers.min.js'
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
