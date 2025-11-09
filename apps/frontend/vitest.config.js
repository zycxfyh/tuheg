import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    // GitHub风格的性能优化配置
    pool: 'threads', // 使用线程池提高性能
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
        isolate: false, // 允许共享内存以提高性能
      },
    },
    testTimeout: 8000, // GitHub标准超时时间
    hookTimeout: 8000,
    // 性能优化
    maxThreads: 4, // 基于CPU核心数
    minThreads: 1,
    // 智能缓存
    cache: {
      dir: '.vitest-cache',
    },
    // 增量测试支持
    changed: !process.env.CI,
    // 性能监控
    benchmark: {
      include: ['**/*.benchmark.test.js'],
      outputFile: 'benchmarks.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        'src/test-utils.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // GitHub风格的分层覆盖率要求
        './src/components/': {
          branches: 85,
          functions: 90,
          lines: 85,
          statements: 85,
        },
        './src/services/': {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90,
        },
        './src/composables/': {
          branches: 85,
          functions: 90,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve('./src'),
    },
  },
  define: {
    'import.meta.env': {
      VITE_API_BASE_URL: 'http://localhost:3000',
    },
  },
  esbuild: {
    target: 'node14',
  },
})
