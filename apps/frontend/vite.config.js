import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'shared-types': fileURLToPath(new URL('../../packages/shared-types/src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
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
})
