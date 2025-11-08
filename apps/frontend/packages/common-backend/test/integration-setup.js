'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
require('reflect-metadata')
beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/test_db'
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380'
  process.env.JWT_SECRET = 'test-jwt-secret-integration'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'
}, 30000)
afterAll(async () => {
  jest.clearAllMocks()
}, 30000)
//# sourceMappingURL=integration-setup.js.map
