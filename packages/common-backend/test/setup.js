'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
require('reflect-metadata')
jest.mock('jsonrepair', () => ({
  jsonrepair: jest.fn().mockImplementation((jsonString) => {
    console.log('jsonrepair called with:', JSON.stringify(jsonString))
    try {
      JSON.parse(jsonString)
      console.log('jsonrepair returning original (already valid):', JSON.stringify(jsonString))
      return jsonString
    } catch {
      let repaired = jsonString
      repaired = repaired.replace(/,(\s*)\]/g, ']')
      repaired = repaired.replace(/,(\s*)\}/g, '}')
      repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '')
      repaired = repaired.replace(/\/\/.*$/gm, '')
      try {
        JSON.parse(repaired.trim())
        console.log('jsonrepair returning repaired:', JSON.stringify(repaired.trim()))
        return repaired.trim()
      } catch (repairError) {
        console.log(
          `jsonrepair failed to repair: ${JSON.stringify(jsonString)} -> ${JSON.stringify(repaired)}, error:`,
          repairError
        )
        return jsonString
      }
    }
  }),
}))
beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.PORT = '3000'
  process.env.CORS_ORIGIN = 'http://localhost:5173'
  process.env.QDRANT_URL = 'http://localhost:6333'
})
afterAll(async () => {
  jest.clearAllMocks()
})
//# sourceMappingURL=setup.js.map
