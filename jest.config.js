/** @type {import('jest').Config} */
export default {
  // 基础配置
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],

  // 测试文件忽略模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/vcptoolbox-core/',
    '/coverage/',
    '/.nx/',
    '\\.d\\.ts$',
  ],

  // 模块映射
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules', 'src', 'apps', 'packages', 'tools'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@apps/(.*)$': '<rootDir>/apps/$1',
    '^@packages/(.*)$': '<rootDir>/packages/$1',
    '^@tools/(.*)$': '<rootDir>/tools/$1',
    '^@tuheg/ai-domain$': '<rootDir>/packages/ai-domain/src/index.ts',
    '^@tuheg/ai-domain/(.*)$': '<rootDir>/packages/ai-domain/src/$1',
    '^@tuheg/infrastructure$': '<rootDir>/packages/infrastructure/src/index.ts',
    '^@tuheg/infrastructure/(.*)$': '<rootDir>/packages/infrastructure/src/$1',
    '^@tuheg/narrative-domain$': '<rootDir>/packages/narrative-domain/src/index.ts',
    '^@tuheg/narrative-domain/(.*)$': '<rootDir>/packages/narrative-domain/src/$1',
    '^@tuheg/enterprise-domain$': '<rootDir>/packages/enterprise-domain/src/index.ts',
    '^@tuheg/enterprise-domain/(.*)$': '<rootDir>/packages/enterprise-domain/src/$1',
  },

  // TypeScript处理配置
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          allowJs: true,
          isolatedModules: true,
          skipLibCheck: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
        },
      },
    ],
  },

  // 转换忽略模式
  transformIgnorePatterns: ['/node_modules/(?!(@tuheg|packages)/)'],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'cobertura', 'clover'],
  coverageDirectory: 'coverage',

  // 覆盖率配置

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'apps/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/vcptoolbox-core/**',
    '!**/*.config.ts',
    '!**/*.config.js',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/__tests__/**',
    '!**/mocks/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './packages/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

  // 增强测试运行配置 - 参考GitHub Actions最佳实践
  testTimeout: 60000, // 60秒超时，适应复杂测试
  maxWorkers: process.env.CI ? 2 : 1, // CI环境使用2个worker
  detectOpenHandles: true,
  forceExit: false, // 让Jest自行管理进程生命周期
  bail: false, // 收集所有测试结果，不因单个失败停止
  verbose: process.env.CI ? false : true, // 本地开发显示详细信息
  notify: false,
  errorOnDeprecated: false,
  passWithNoTests: true, // 空测试套件不失败

  // 高级性能监控 - GitHub Actions风格
  slowTestThreshold: 10000, // 10秒以上的测试标记为慢测试
  openHandlesTimeout: 2000, // 2秒内必须清理资源
  detectLeaks: true, // 启用内存泄漏检测
  testEnvironmentOptions: {
    // 增强的测试环境配置
    url: 'http://localhost:3000',
    userAgent: 'Jest-Test-Agent/1.0',
  },

  // 重试机制 - 应对flaky测试
  retryTimes: process.env.CI ? 2 : 0, // CI环境重试2次

  // 报告增强
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
        suiteNameTemplate: '{filepath}',
        addFileAttribute: 'true',
      },
    ],
    process.env.CI
      ? [
          'github-actions',
          {
            silent: false,
          },
        ]
      : null,
  ].filter(Boolean),

  // 定时器配置
  fakeTimers: {
    enableGlobally: true,
  },

  // Mock配置
  resetMocks: true,
  restoreMocks: true,
  clearMocks: true,

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 报告器配置
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        suiteName: 'Creation Ring Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // 快照配置
  snapshotSerializers: [],

  // 测试环境变量
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // 缓存配置
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
}
