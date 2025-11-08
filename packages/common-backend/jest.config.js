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
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
    '^.+\\.tsx$': ['ts-jest', { useESM: true }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/packages/common-backend/test/env-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/packages/common-backend/test/setup.ts'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
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
