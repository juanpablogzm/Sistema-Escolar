const CACHE_NAME = 'classroom-app-shell-v1'
const APP_SHELL = new URL('./', self.registration.scope).href
const INDEX_PAGE = new URL('./index.html', self.registration.scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([APP_SHELL, INDEX_PAGE]))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('classroom-app-shell-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return
  const urls = event.data.urls.filter((url) => {
    const parsed = new URL(url)
    return parsed.origin === self.location.origin
  })
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urls)))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(APP_SHELL)))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
        }
        return response
      })
      return cached || network
    })
  )
})
