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
var RateLimitGuard_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.RateLimitGuard = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0
const common_1 = require('@nestjs/common')
const core_1 = require('@nestjs/core')
const rate_limit_service_1 = require('./rate-limit.service')
exports.RATE_LIMIT_KEY = 'rate_limit'
const RateLimit = (options = {}) => {
  return (_target, _propertyKey, descriptor) => {
    Reflect.defineMetadata(exports.RATE_LIMIT_KEY, options, descriptor.value)
  }
}
exports.RateLimit = RateLimit
let RateLimitGuard = (RateLimitGuard_1 = class RateLimitGuard {
  rateLimitService
  reflector
  logger = new common_1.Logger(RateLimitGuard_1.name)
  constructor(rateLimitService, reflector) {
    this.rateLimitService = rateLimitService
    this.reflector = reflector
  }
  async canActivate(context) {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    const options = this.reflector.get(exports.RATE_LIMIT_KEY, context.getHandler()) || {
      windowMs: 60,
      max: 100,
    }
    const keyGenerator = options.keyGenerator || this.defaultKeyGenerator
    const key = keyGenerator(request)
    const result = await this.rateLimitService.checkLimit(key, {
      windowMs: options.windowMs,
      max: options.max,
    })
    response.setHeader('X-RateLimit-Limit', options.max)
    response.setHeader('X-RateLimit-Remaining', result.remaining)
    response.setHeader('X-RateLimit-Reset', result.resetTime)
    if (!result.allowed) {
      const message =
        options.message ||
        `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfter / 1000)} seconds.`
      this.logger.warn(`Rate limit exceeded for key: ${key}, remaining: ${result.remaining}`)
      throw new common_1.HttpException(
        {
          statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
          message,
          retryAfter: Math.ceil(result.retryAfter / 1000),
        },
        common_1.HttpStatus.TOO_MANY_REQUESTS
      )
    }
    return true
  }
  defaultKeyGenerator(request) {
    const ip = request.ip || request.socket.remoteAddress || 'unknown'
    const userId = request.user?.id || 'anonymous'
    const path = request.path
    return `rate_limit:${ip}:${userId}:${path}`
  }
})
exports.RateLimitGuard = RateLimitGuard
exports.RateLimitGuard =
  RateLimitGuard =
  RateLimitGuard_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [rate_limit_service_1.RateLimitService, core_1.Reflector]),
      ],
      RateLimitGuard
    )
//# sourceMappingURL=rate-limit.guard.js.map
