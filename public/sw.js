const CACHE_NAME = 'classroom-app-shell-v2'
const APP_SHELL = new URL('./', self.registration.scope).href
const INDEX_PAGE = new URL('./index.html', self.registration.scope).href
const STATIC_DESTINATIONS = new Set(['script', 'style', 'image', 'font', 'manifest', 'worker'])
const isStaticAsset = (request) => STATIC_DESTINATIONS.has(request.destination)

// A Response body is a one-shot stream. Clone it before returning it to the
// browser, since the browser may begin consuming the returned response right
// away. If it has already been consumed, simply skip caching that response.
const cacheResponse = (request, response) => {
  if (!response.ok || response.bodyUsed) return

  let copy
  try {
    copy = response.clone()
  } catch {
    return
  }

  caches.open(CACHE_NAME)
    .then((cache) => cache.put(request, copy))
    .catch(() => {})
}

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
    return parsed.origin === self.location.origin &&
      /\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|woff2?|ttf|json)$/i.test(parsed.pathname)
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
          cacheResponse(request, response)
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(APP_SHELL)))
    )
    return
  }

  // Only application files belong in this cache. API and other dynamic
  // requests must reach the network untouched, especially after login.
  if (!isStaticAsset(request)) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          cacheResponse(request, response)
        }
        return response
      })
      return cached || network
    })
  )
})
