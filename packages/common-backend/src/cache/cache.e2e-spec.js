'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const testing_1 = require('@nestjs/testing')
const cache_service_1 = require('./cache.service')
const cache_module_1 = require('./cache.module')
const config_1 = require('@nestjs/config')
describe('CacheService (e2e)', () => {
  let cacheService
  let module
  let cacheAvailable = false
  beforeAll(async () => {
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
    try {
      module = await testing_1.Test.createTestingModule({
        imports: [
          config_1.ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
          }),
          cache_module_1.CacheModule,
        ],
      }).compile()
      cacheService = module.get(cache_service_1.CacheService)
      await cacheService.set('test-connection', 'ok', { ttl: 1 })
      const testValue = await cacheService.get('test-connection')
      if (testValue === 'ok') {
        cacheAvailable = true
        await cacheService.delete('test-connection')
      }
    } catch (error) {
      console.warn('Cache not available, skipping cache integration tests:', error)
      cacheAvailable = false
    }
  }, 30000)
  afterAll(async () => {
    if (module) {
      await module.close()
    }
  }, 30000)
  beforeEach(async () => {
    if (cacheAvailable && cacheService) {
      await cacheService.delete('test-key')
      await cacheService.delete('test-key-2')
    }
  })
  it('should set and get cache value', async () => {
    if (!cacheAvailable) {
      console.log('Skipping: Cache not available')
      return
    }
    const testValue = { name: 'test', value: 123 }
    await cacheService.set('test-key', testValue, { ttl: 60 })
    const result = await cacheService.get('test-key')
    expect(result).toBeDefined()
    expect(result?.name).toBe('test')
    expect(result?.value).toBe(123)
  })
  it('should handle cache expiration', async () => {
    if (!cacheAvailable) {
      console.log('Skipping: Cache not available')
      return
    }
    await cacheService.set('test-key', 'short-lived', { ttl: 1 })
    const immediate = await cacheService.get('test-key')
    expect(immediate).toBe('short-lived')
    await new Promise((resolve) => setTimeout(resolve, 1100))
    const expired = await cacheService.get('test-key')
    expect(expired).toBeUndefined()
  }, 5000)
  it('should delete cache value', async () => {
    if (!cacheAvailable) {
      console.log('Skipping: Cache not available')
      return
    }
    await cacheService.set('test-key', 'to-delete')
    const before = await cacheService.get('test-key')
    expect(before).toBe('to-delete')
    await cacheService.delete('test-key')
    const after = await cacheService.get('test-key')
    expect(after).toBeUndefined()
  })
  it('should clear all cache', async () => {
    if (!cacheAvailable) {
      console.log('Skipping: Cache not available')
      return
    }
    await cacheService.set('test-key', 'value1')
    await cacheService.set('test-key-2', 'value2')
    expect(await cacheService.get('test-key')).toBe('value1')
    expect(await cacheService.get('test-key-2')).toBe('value2')
    await cacheService.clear()
    expect(await cacheService.get('test-key')).toBeUndefined()
    expect(await cacheService.get('test-key-2')).toBeUndefined()
  })
  it('should handle concurrent cache operations', async () => {
    if (!cacheAvailable) {
      console.log('Skipping: Cache not available')
      return
    }
    const promises = Array(10)
      .fill(null)
      .map(async (_, index) => {
        const key = `concurrent-key-${index}`
        const value = `value-${index}`
        await cacheService.set(key, value)
        return cacheService.get(key)
      })
    const results = await Promise.all(promises)
    expect(results).toHaveLength(10)
    results.forEach((result, index) => {
      expect(result).toBe(`value-${index}`)
    })
  })
})
//# sourceMappingURL=cache.e2e-spec.js.map
