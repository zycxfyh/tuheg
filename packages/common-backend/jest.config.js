// Jest configuration for common-backend package
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['src', 'test'],
  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.test.ts',
    '**/*.spec.ts',
    '**/*.test.ts',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          isolatedModules: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'packages/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.d.ts',
    '!**/*.config.ts',
    '!**/*.config.js',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@tuheg/common-backend$': '<rootDir>/src/index.ts',
    '^@tuheg/common-backend/(.*)$': '<rootDir>/src/$1',
    '^@tuheg/(.*)$': '<rootDir>/../$1/src',
    '^langfuse$': '<rootDir>/../tests/mocks/langfuse.ts',
    '^langfuse/(.*)$': '<rootDir>/../tests/mocks/langfuse.ts',
    '^jsonrepair$': '<rootDir>/../tests/mocks/jsonrepair.ts',
  },
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts',
  ],
  testTimeout: 10000,
  maxWorkers: '50%',
  bail: 1,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
}
