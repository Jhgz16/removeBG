```javascript
const CACHE_NAME = 'bg-remover-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
    'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
    'https://cdn.jsdelivr.net/npm/babel-standalone@7.24.7/babel.min.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.1/dist/transformers.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching assets');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
```
