var __importDefault =
  (this && this.__importDefault) || ((mod) => (mod?.__esModule ? mod : { default: mod }))
Object.defineProperty(exports, '__esModule', { value: true })
const vite_1 = require('vite')
const plugin_vue_1 = __importDefault(require('@vitejs/plugin-vue'))
const rollup_plugin_visualizer_1 = require('rollup-plugin-visualizer')
const node_url_1 = require('node:url')
exports.default = (0, vite_1.defineConfig)({
  plugins: [
    (0, plugin_vue_1.default)(),
    (0, rollup_plugin_visualizer_1.visualizer)({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  resolve: {
    alias: {
      '@': (0, node_url_1.fileURLToPath)(new node_url_1.URL('./src', import.meta.url)),
      '@shared-types': (0, node_url_1.fileURLToPath)(
        new node_url_1.URL('../../packages/shared-types/src', import.meta.url)
      ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'query-vendor': ['@tanstack/vue-query'],
          'socket-vendor': ['socket.io-client'],
        },
      },
    },
    sourcemap: true,
  },
})
//# sourceMappingURL=vite.config.bundle-analyzer.js.map
