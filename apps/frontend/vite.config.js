import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // PWA插件配置
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '创世星环 - AI叙事创作平台',
        short_name: '创世星环',
        description: 'AI驱动的多Agent协作叙事创作平台，开启全模态沉浸式创作新时代',
        theme_color: '#00d4ff',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['productivity', 'entertainment', 'education'],
      },
      workbox: {
        globPatterns: ['**/*.{css,ico,png,svg,webp,woff,woff2,js,json,html}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.creation-ring\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      // 仅在生产环境启用PWA
      disable: mode === 'development',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'shared-types': fileURLToPath(new URL('../../packages/shared-types/src', import.meta.url)),
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动分包策略
        manualChunks: {
          // Vue生态核心包
          'vue-vendor': ['vue', 'vue-router', 'pinia'],

          // UI库和网络库
          'ui-vendor': ['socket.io-client', 'axios'],

          // 国际化
          'i18n-vendor': ['vue-i18n'],

          // 监控
          'monitoring-vendor': ['@sentry/vue'],
        },
        // 文件名格式优化
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.vue', '')
            : 'chunk'
          return `js/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          let extType = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            extType = 'img'
          } else if (/\.(css)$/i.test(assetInfo.name)) {
            extType = 'css'
          }
          return `${extType}/[name]-[hash].[ext]`
        },
      },
    },

    // 使用esbuild进行更快的压缩（替代terser）
    minify: 'esbuild',
    esbuild: {
      // esbuild配置
      drop: ['console', 'debugger'], // 生产环境移除console和debugger
      legalComments: 'none', // 移除注释
    },

    // 分包大小警告阈值
    chunkSizeWarningLimit: 1000,

    // 生成source map用于错误追踪
    sourcemap: true,
  },

  // 预构建优化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'socket.io-client', 'vue-i18n'],
    exclude: ['@sentry/vue'], // 在需要时动态加载
  },

  // CSS优化
  css: {
    devSourcemap: true,
  },

  // 环境变量定义
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // 开发服务器配置增强
  server: {
    port: 5173,
    host: true, // 允许外部访问
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    // HTTPS支持（可选，用于PWA测试）
    https: false,
    // CORS配置
    cors: true,
  },

  // 环境变量前缀
  envPrefix: ['VITE_'],
}))
