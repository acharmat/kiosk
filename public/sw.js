// Service Worker for Kiosk Terminal Application
// Provides offline support, caching, and background sync

const CACHE_NAME = 'kiosk-terminal-v1.0.0'
const OFFLINE_URL = '/offline'

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline',
    '/assets/index.js',
    '/assets/index.css',
    '/images/default-category.png',
    '/images/default-product.png',
    '/images/default-channel.png'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/v1\/kiosks\/channels/,
    /\/api\/v1\/kiosks\/categories/,
    /\/api\/v1\/kiosks\/products/
]

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...')

    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME)

                // Cache static assets
                await cache.addAll(STATIC_ASSETS)

                console.log('Static assets cached successfully')

                // Skip waiting to activate immediately
                self.skipWaiting()
            } catch (error) {
                console.error('Failed to cache static assets:', error)
            }
        })()
    )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...')

    event.waitUntil(
        (async () => {
            try {
                // Delete old caches
                const cacheNames = await caches.keys()
                const deletionPromises = cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))

                await Promise.all(deletionPromises)

                // Take control of all clients
                await self.clients.claim()

                console.log('Service Worker activated successfully')
            } catch (error) {
                console.error('Failed to activate service worker:', error)
            }
        })()
    )
})

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const { request } = event
    const { url, method } = request

    // Only handle GET requests
    if (method !== 'GET') {
        return
    }

    // Determine cache strategy based on request
    const strategy = getCacheStrategy(url)

    event.respondWith(
        (async () => {
            try {
                switch (strategy) {
                    case CACHE_STRATEGIES.CACHE_FIRST:
                        return await cacheFirst(request)

                    case CACHE_STRATEGIES.NETWORK_FIRST:
                        return await networkFirst(request)

                    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
                        return await staleWhileRevalidate(request)

                    case CACHE_STRATEGIES.NETWORK_ONLY:
                        return await fetch(request)

                    case CACHE_STRATEGIES.CACHE_ONLY:
                        return await cacheOnly(request)

                    default:
                        return await networkFirst(request)
                }
            } catch (error) {
                console.error('Fetch error:', error)
                return await handleFetchError(request, error)
            }
        })()
    )
})

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag)

    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncTransactions())
    } else if (event.tag === 'sync-errors') {
        event.waitUntil(syncErrors())
    } else if (event.tag === 'sync-heartbeat') {
        event.waitUntil(syncHeartbeat())
    }
})

// Push notifications (for maintenance alerts, etc.)
self.addEventListener('push', (event) => {
    console.log('Push message received:', event)

    const options = {
        body: 'You have a new notification',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/images/xmark.png'
            }
        ]
    }

    if (event.data) {
        const data = event.data.json()
        options.body = data.message || options.body
        options.title = data.title || 'Kiosk Notification'
    }

    event.waitUntil(
        self.registration.showNotification('Kiosk Terminal', options)
    )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event)

    event.notification.close()

    event.waitUntil(
        clients.openWindow('/')
    )
})

// Cache strategy implementations

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)

    if (cached) {
        return cached
    }

    const response = await fetch(request)

    if (response.ok) {
        cache.put(request, response.clone())
    }

    return response
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME)

    try {
        const response = await fetch(request)

        if (response.ok) {
            cache.put(request, response.clone())
        }

        return response
    } catch (error) {
        const cached = await cache.match(request)

        if (cached) {
            return cached
        }

        throw error
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)

    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone())
        }
        return response
    }).catch(() => cached)

    return cached || await fetchPromise
}

async function cacheOnly(request) {
    const cache = await caches.open(CACHE_NAME)
    return await cache.match(request)
}

// Determine cache strategy based on URL
function getCacheStrategy(url) {
    const urlObj = new URL(url)

    // Static assets - cache first
    if (urlObj.pathname.startsWith('/assets/') ||
        urlObj.pathname.startsWith('/images/') ||
        urlObj.pathname.endsWith('.js') ||
        urlObj.pathname.endsWith('.css') ||
        urlObj.pathname.endsWith('.png') ||
        urlObj.pathname.endsWith('.jpg') ||
        urlObj.pathname.endsWith('.svg')) {
        return CACHE_STRATEGIES.CACHE_FIRST
    }

    // API calls for read-only data - stale while revalidate
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url))) {
        return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE
    }

    // Transaction APIs - network only
    if (url.includes('/transaction') ||
        url.includes('/payment') ||
        url.includes('/heartbeat')) {
        return CACHE_STRATEGIES.NETWORK_ONLY
    }

    // HTML pages - network first
    if (urlObj.pathname.endsWith('/') ||
        urlObj.pathname.endsWith('.html') ||
        !urlObj.pathname.includes('.')) {
        return CACHE_STRATEGIES.NETWORK_FIRST
    }

    // Default strategy
    return CACHE_STRATEGIES.NETWORK_FIRST
}

// Error handling
async function handleFetchError(request, error) {
    const url = new URL(request.url)

    // For HTML requests, show offline page
    if (request.destination === 'document') {
        const cache = await caches.open(CACHE_NAME)
        const offlinePage = await cache.match(OFFLINE_URL)

        if (offlinePage) {
            return offlinePage
        }
    }

    // For API requests, try cache
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)

    if (cached) {
        return cached
    }

    // Return a custom offline response
    return new Response(
        JSON.stringify({
            error: 'Offline',
            message: 'This request requires an internet connection'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    )
}

// Background sync implementations

async function syncTransactions() {
    console.log('Syncing transactions...')

    try {
        // Get pending transactions from IndexedDB or local storage
        const transactions = await getPendingTransactions()

        for (const transaction of transactions) {
            try {
                const response = await fetch('/api/v1/kiosks/transaction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getStoredToken()}`
                    },
                    body: JSON.stringify(transaction.data)
                })

                if (response.ok) {
                    await markTransactionSynced(transaction.id)
                    console.log('Transaction synced:', transaction.id)
                }
            } catch (error) {
                console.error('Failed to sync transaction:', transaction.id, error)
            }
        }
    } catch (error) {
        console.error('Failed to sync transactions:', error)
    }
}

async function syncErrors() {
    console.log('Syncing error reports...')

    try {
        const errors = await getPendingErrors()

        for (const error of errors) {
            try {
                const response = await fetch('/api/v1/kiosks/errors/report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getStoredToken()}`
                    },
                    body: JSON.stringify(error.data)
                })

                if (response.ok) {
                    await markErrorSynced(error.id)
                    console.log('Error report synced:', error.id)
                }
            } catch (error) {
                console.error('Failed to sync error report:', error.id, error)
            }
        }
    } catch (error) {
        console.error('Failed to sync error reports:', error)
    }
}

async function syncHeartbeat() {
    console.log('Sending heartbeat...')

    try {
        const response = await fetch('/api/v1/kiosks/heartbeat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getStoredToken()}`
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                serviceWorker: true
            })
        })

        if (response.ok) {
            console.log('Heartbeat sent successfully')
        }
    } catch (error) {
        console.error('Failed to send heartbeat:', error)
    }
}

// Helper functions for data persistence

async function getPendingTransactions() {
    // In a real implementation, this would fetch from IndexedDB
    return []
}

async function markTransactionSynced(id) {
    // Mark transaction as synced in storage
    console.log('Transaction marked as synced:', id)
}

async function getPendingErrors() {
    // In a real implementation, this would fetch from IndexedDB
    return []
}

async function markErrorSynced(id) {
    // Mark error as synced in storage
    console.log('Error marked as synced:', id)
}

async function getStoredToken() {
    // Get authentication token from storage
    return 'stored-auth-token'
}

// Cache management utilities

async function cleanupOldCaches() {
    const cacheNames = await caches.keys()
    const oldCaches = cacheNames.filter(name =>
        name.startsWith('kiosk-terminal-') && name !== CACHE_NAME
    )

    return Promise.all(oldCaches.map(name => caches.delete(name)))
}

async function getCacheSize() {
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()

    let totalSize = 0
    for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
            const blob = await response.blob()
            totalSize += blob.size
        }
    }

    return totalSize
}

// Message handling from main thread
self.addEventListener('message', (event) => {
    const { type, payload } = event.data

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting()
            break

        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ size })
            })
            break

        case 'CLEANUP_CACHES':
            cleanupOldCaches().then(() => {
                event.ports[0].postMessage({ success: true })
            })
            break

        case 'FORCE_SYNC':
            if (payload === 'transactions') {
                syncTransactions()
            } else if (payload === 'errors') {
                syncErrors()
            }
            break

        default:
            console.log('Unknown message type:', type)
    }
})

// Performance monitoring
self.addEventListener('fetch', (event) => {
    // Track performance metrics
    if (event.request.url.includes('/api/')) {
        const startTime = Date.now()

        event.respondWith(
            fetch(event.request).then(response => {
                const endTime = Date.now()
                const duration = endTime - startTime

                // Log slow API calls
                if (duration > 5000) {
                    console.warn('Slow API call detected:', {
                        url: event.request.url,
                        duration: duration + 'ms'
                    })
                }

                return response
            })
        )
    }
})

console.log('Service Worker loaded successfully')