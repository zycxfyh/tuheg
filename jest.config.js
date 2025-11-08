/** @type {import('jest').Config} */
export default {
  // 基础配置
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages', '<rootDir>/tools'],

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

  // 转换配置
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },

  // 模块映射
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@apps/(.*)$': '<rootDir>/apps/$1',
    '^@packages/(.*)$': '<rootDir>/packages/$1',
    '^@tools/(.*)$': '<rootDir>/tools/$1',
  },

  // 转换忽略模式
  transformIgnorePatterns: [
    '/node_modules/(?!(@tuheg|packages)/)',
  ],

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
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'cobertura'],
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

  // 测试运行配置
  testTimeout: 30000,
  maxWorkers: process.env.CI ? 2 : 4,
  detectOpenHandles: true,
  forceExit: true,
  bail: true, // 快速失败
  verbose: true,
  notify: false,
  errorOnDeprecated: true,
  fakeTimers: {
    enableGlobally: true,
  },

  // Mock配置
  resetMocks: true,
  restoreMocks: true,
  clearMocks: true,

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // TypeScript配置
  globals: {
    'ts-jest': {
      tsconfig: {
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
      },
    },
  },

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

