// Jest configuration for common-backend package
const baseConfig = require('../../jest.config.js')

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../..',
  roots: ['<rootDir>/packages/common-backend'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      diagnostics: false,
      isolatedModules: true,
      compilerOptions: {
        noEmit: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        exactOptionalPropertyTypes: false,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/packages/common-backend/test/env-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/packages/common-backend/test/setup.ts'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Use source files directly
    '^@tuheg/common-backend$': '<rootDir>/packages/common-backend/src/index.ts',
    '^@tuheg/common-backend/(.*)$': '<rootDir>/packages/common-backend/src/$1',
    // Mock external libraries
    '^langfuse-core$': '<rootDir>/tests/mocks/langfuse-core.ts',
    '^langfuse-core/(.*)$': '<rootDir>/tests/mocks/langfuse-core.ts',
    '^jsonrepair$': '<rootDir>/tests/mocks/jsonrepair.ts',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'json', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
}
