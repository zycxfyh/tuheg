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
Object.defineProperty(exports, '__esModule', { value: true })
exports.CacheModule = void 0
const common_1 = require('@nestjs/common')
const cache_manager_1 = require('@nestjs/cache-manager')
const cache_manager_redis_store_1 = require('cache-manager-redis-store')
const config_1 = require('@nestjs/config')
const cache_service_1 = require('./cache.service')
let CacheModule = class CacheModule {}
exports.CacheModule = CacheModule
exports.CacheModule = CacheModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [
        cache_manager_1.CacheModule.registerAsync({
          inject: [config_1.ConfigService],
          useFactory: async (configService) => {
            const redisUrl = configService.get('REDIS_URL')
            if (!redisUrl) {
              throw new Error(
                'REDIS_URL is required for caching. Please configure Redis connection.'
              )
            }
            const url = new URL(redisUrl)
            return {
              store: cache_manager_redis_store_1.redisStore,
              host: url.hostname,
              port: parseInt(url.port || '6379'),
              password: url.password || undefined,
              ttl: 3600,
              max: 1000,
            }
          },
        }),
      ],
      providers: [cache_service_1.CacheService],
      exports: [cache_service_1.CacheService, cache_manager_1.CacheModule],
    }),
  ],
  CacheModule
)
//# sourceMappingURL=cache.module.js.map
