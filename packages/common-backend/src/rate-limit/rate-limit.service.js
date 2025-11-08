var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
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
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var RateLimitService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.RateLimitService = void 0
const common_1 = require('@nestjs/common')
const ioredis_1 = require('ioredis')
let RateLimitService = (RateLimitService_1 = class RateLimitService {
  logger = new common_1.Logger(RateLimitService_1.name)
  memoryStore = new Map()
  redisClient
  cleanupInterval
  constructor() {
    this.initRedis()
    this.startCleanup()
  }
  initRedis() {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      try {
        this.redisClient = new ioredis_1.Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
        })
        this.redisClient.on('error', (error) => {
          this.logger.warn('Redis connection error, falling back to memory store:', error)
          this.redisClient = undefined
        })
        this.logger.log('Rate limiting using Redis storage')
      } catch (error) {
        this.logger.warn('Failed to initialize Redis, using memory store:', error)
      }
    } else {
      this.logger.log('Rate limiting using memory store (REDIS_URL not configured)')
    }
  }
  async checkLimit(key, options) {
    if (this.redisClient) {
      return this.checkLimitRedis(key, options)
    }
    return this.checkLimitMemory(key, options)
  }
  async checkLimitRedis(key, options) {
    const { windowMs, max } = options
    const now = Date.now()
    const windowStart = now - windowMs
    const redisKey = `rate_limit:${key}`
    try {
      const pipeline = this.redisClient.pipeline()
      pipeline.zremrangebyscore(redisKey, '-inf', String(windowStart))
      pipeline.zadd(redisKey, now, String(now))
      pipeline.zcard(redisKey)
      pipeline.expire(redisKey, Math.ceil(windowMs / 1000))
      const results = await pipeline.exec()
      const count = results?.[2]?.[1] || 0
      const allowed = count < max
      const remaining = Math.max(0, max - count)
      const resetTime = now + windowMs
      const retryAfter = allowed ? 0 : resetTime - now
      return {
        allowed,
        remaining,
        resetTime,
        retryAfter,
      }
    } catch (error) {
      this.logger.error(`Redis rate limit check failed, falling back to memory:`, error)
      return this.checkLimitMemory(key, options)
    }
  }
  checkLimitMemory(key, options) {
    const { windowMs, max } = options
    const now = Date.now()
    const record = this.memoryStore.get(key)
    if (!record || now > record.resetTime) {
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return {
        allowed: true,
        remaining: max - 1,
        resetTime: now + windowMs,
        retryAfter: 0,
      }
    }
    const allowed = record.count < max
    record.count++
    return {
      allowed,
      remaining: Math.max(0, max - record.count),
      resetTime: record.resetTime,
      retryAfter: allowed ? 0 : record.resetTime - now,
    }
  }
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.memoryStore.entries()) {
        if (now > record.resetTime) {
          this.memoryStore.delete(key)
        }
      }
    }, 60000)
  }
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    if (this.redisClient) {
      this.redisClient.quit()
    }
  }
})
exports.RateLimitService = RateLimitService
exports.RateLimitService =
  RateLimitService =
  RateLimitService_1 =
    __decorate([(0, common_1.Injectable)(), __metadata('design:paramtypes', [])], RateLimitService)
//# sourceMappingURL=rate-limit.service.js.map
