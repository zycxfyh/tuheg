// 文件路径: apps/backend-gateway/jest.config.js
const baseConfig = require('../../shared/jest.config.js')

module.exports = {
  ...baseConfig,
  // 移除有问题的setupFiles配置
  setupFilesAfterEnv: ['<rootDir>/../../tests/setup.ts'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@tuheg/common-backend$': '<rootDir>/../../packages/common-backend/src/index.ts',
    '^langfuse$': '<rootDir>/../../tests/mocks/langfuse.ts',
    '^langfuse/(.*)$': '<rootDir>/../../tests/mocks/langfuse.ts',
  },
  // 确保只在当前应用目录中查找测试文件
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts',
  ],
}
