// Workbox配置文件
// 用于生成PWA的Service Worker

module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{css,ico,png,svg,webp,woff,woff2,js,json,html}'],
  swDest: 'dist/sw.js',
  swSrc: 'public/sw.js',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  runtimeCaching: [
    {
      // API请求缓存策略
      urlPattern: /^https:\/\/api\.creation-ring\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24小时
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          // 移除查询参数以提高缓存命中率
          const url = new URL(request.url)
          url.search = ''
          return url.toString()
        },
      },
    },
    {
      // 图片资源缓存策略
      urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
        },
      },
    },
    {
      // 字体文件缓存策略
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
        },
      },
    },
    {
      // 外部资源缓存策略
      urlPattern: /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'external-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
        },
      },
    },
  ],
  // 预缓存资源列表
  additionalManifestEntries: [
    { url: '/offline.html', revision: null },
    { url: '/manifest.json', revision: null },
  ],
  // 忽略的文件
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^gclid$/],
  // 修改请求
  modifyURLPrefix: {
    // 如果需要重写URL路径
  },
  // 导航回退
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [
    // 不应该回退的URL模式
    /^\/api\//,
    /^\/_nuxt\//,
    /\.(png|jpg|jpeg|svg|webp|ico|woff|woff2)$/,
  ],
  // 跳过等待
  skipWaiting: true,
  // 立即声明客户端
  clientsClaim: true,
}
