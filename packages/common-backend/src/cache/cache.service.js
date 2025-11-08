'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex)
    }
  }
var CacheService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.CacheService = void 0
const common_1 = require('@nestjs/common')
const common_2 = require('@nestjs/common')
const cache_manager_1 = require('@nestjs/cache-manager')
let CacheService = (CacheService_1 = class CacheService {
  cacheManager
  logger = new common_1.Logger(CacheService_1.name)
  constructor(cacheManager) {
    this.cacheManager = cacheManager
  }
  async get(key, options) {
    const fullKey = this.buildKey(key, options?.prefix)
    try {
      const value = await this.cacheManager.get(fullKey)
      return value
    } catch (error) {
      this.logger.error(`Failed to get cache key ${fullKey}:`, error)
      return undefined
    }
  }
  async set(key, value, options) {
    const fullKey = this.buildKey(key, options?.prefix)
    const ttl = options?.ttl ? options.ttl * 1000 : undefined
    try {
      await this.cacheManager.set(fullKey, value, ttl)
    } catch (error) {
      this.logger.error(`Failed to set cache key ${fullKey}:`, error)
    }
  }
  async delete(key, prefix) {
    const fullKey = this.buildKey(key, prefix)
    try {
      await this.cacheManager.del(fullKey)
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${fullKey}:`, error)
    }
  }
  async clear() {
    try {
      const store = this.cacheManager.store
      if (store && typeof store.reset === 'function') {
        await store.reset()
      } else {
        this.logger.warn('Cache store does not support reset operation')
      }
    } catch (error) {
      this.logger.error('Failed to clear cache:', error)
    }
  }
  async getOrSet(key, factory, options) {
    const cached = await this.get(key, options)
    if (cached !== undefined) {
      return cached
    }
    const value = await factory()
    await this.set(key, value, options)
    return value
  }
  buildKey(key, prefix) {
    return prefix ? `${prefix}:${key}` : key
  }
})
exports.CacheService = CacheService
exports.CacheService =
  CacheService =
  CacheService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __param(0, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
        __metadata('design:paramtypes', [Object]),
      ],
      CacheService
    )
//# sourceMappingURL=cache.service.js.map
