// Service Worker for PWA support
// 提供离线访问、缓存管理和推送通知支持

const _CACHE_NAME = 'creation-ring-v1.0.0'
const STATIC_CACHE = 'creation-ring-static-v1.0.0'
const DYNAMIC_CACHE = 'creation-ring-dynamic-v1.0.0'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// 运行时缓存的API路径
const _API_CACHE_PATTERNS = [
  /\/api\/narratives\/\d+$/, // 单个叙事
  /\/api\/users\/profile$/, // 用户资料
  /\/api\/plugins$/, // 插件列表
  /\/api\/templates$/, // 模板列表
]

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker installed')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
            return Promise.resolve(false) // 不需要删除的缓存，返回false
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// 网络请求拦截 - 实现缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理GET请求
  if (request.method !== 'GET') return

  // 跳过Chrome扩展和非HTTP请求
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return
  if (url.hostname === 'chrome-extension') return

  // API请求使用网络优先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // 静态资源使用缓存优先策略
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // 其他资源使用缓存优先策略
  event.respondWith(cacheFirstStrategy(request))
})

// 缓存优先策略
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('Cache first strategy failed:', error)

    // 返回离线页面
    if (request.destination === 'document') {
      return caches.match('/offline.html')
    }

    return new Response('Offline', { status: 503 })
  }
}

// 网络优先策略
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('Network request failed, trying cache:', error)

    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // 返回API离线响应
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: '网络不可用，请检查网络连接',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// 推送通知事件
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: '查看',
          icon: '/icons/action-view.png',
        },
        {
          action: 'dismiss',
          title: '忽略',
          icon: '/icons/action-dismiss.png',
        },
      ],
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
    }

    event.waitUntil(self.registration.showNotification(data.title || '创世星环', options))
  } catch (error) {
    console.error('Failed to show push notification:', error)
  }
})

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data || {}

  if (action === 'view') {
    // 打开相关页面
    event.waitUntil(clients.openWindow(data.url || '/'))
  } else if (action === 'dismiss') {
    // 忽略通知
    console.log('Notification dismissed')
  }
})

// 后台同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// 周期性后台同步
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(doPeriodicSync())
  }
})

// 工具函数
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
  ]
  return staticExtensions.some((ext) => pathname.endsWith(ext))
}

async function doBackgroundSync() {
  console.log('Performing background sync...')

  try {
    // 同步本地更改到服务器
    const cache = await caches.open(DYNAMIC_CACHE)
    const keys = await cache.keys()

    // 这里应该实现具体的同步逻辑
    console.log(`Found ${keys.length} cached requests to sync`)

    // 模拟同步过程
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log('Background sync completed')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

async function doPeriodicSync() {
  console.log('Performing periodic sync...')

  try {
    // 检查更新、清理缓存等周期性任务
    await cleanupOldCaches()
    await checkForUpdates()

    console.log('Periodic sync completed')
  } catch (error) {
    console.error('Periodic sync failed:', error)
  }
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys()
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE]

  await Promise.all(
    cacheNames.map((cacheName) => {
      if (!validCaches.includes(cacheName)) {
        console.log('Deleting old cache:', cacheName)
        return caches.delete(cacheName)
      }
      return Promise.resolve(false) // 不需要删除的缓存，返回false
    })
  )
}

async function checkForUpdates() {
  try {
    // 检查应用更新
    const response = await fetch('/version.json')
    const versionData = await response.json()

    // 通知客户端有更新
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: versionData.version,
      })
    })
  } catch (error) {
    console.warn('Failed to check for updates:', error)
  }
}

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason)
})
