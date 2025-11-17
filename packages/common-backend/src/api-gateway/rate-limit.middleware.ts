import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { RedisService } from '../cache/redis.service'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'
import type { TenantRequest } from '../multi-tenant/tenant.middleware'

export interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求数
  skipSuccessfulRequests?: boolean // 是否跳过成功请求
  skipFailedRequests?: boolean // 是否跳过失败请求
  keyGenerator?: (req: TenantRequest) => string // 自定义key生成器
}

export interface RateLimitInfo {
  remaining: number
  resetTime: Date
  total: number
  current: number
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name)
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100, // 每15分钟100个请求
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }

  constructor(
    private redisService: RedisService,
    private configService: ConfigService
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      const config = this.getRateLimitConfig(req)
      const key = this.generateKey(req, config)

      // 检查是否需要跳过限流
      if (this.shouldSkip(req, config)) {
        return next()
      }

      // 检查限流
      const isAllowed = await this.checkRateLimit(key, config)

      if (!isAllowed) {
        const resetTime = await this.getResetTime(key, config)
        const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000)

        res.setHeader('X-RateLimit-Reset', resetTime.toISOString())
        res.setHeader('Retry-After', retryAfter.toString())

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again after ${retryAfter} seconds.`,
            retryAfter,
            resetTime: resetTime.toISOString()
          },
          HttpStatus.TOO_MANY_REQUESTS
        )
      }

      // 添加限流信息到响应头
      await this.setRateLimitHeaders(res, key, config)

      next()
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error('Rate limit middleware error:', error)
      // 如果限流服务出错，为了不影响正常业务，继续处理请求
      next()
    }
  }

  /**
   * 获取限流配置
   */
  private getRateLimitConfig(req: TenantRequest): RateLimitConfig {
    // 基于租户计划获取不同的限流配置
    const tenant = req.tenant
    const baseConfig = { ...this.defaultConfig }

    if (tenant) {
      switch (tenant.plan) {
        case 'FREE':
          return {
            ...baseConfig,
            maxRequests: 50,
            windowMs: 60 * 60 * 1000, // 1小时
          }
        case 'STANDARD':
          return {
            ...baseConfig,
            maxRequests: 500,
            windowMs: 60 * 60 * 1000, // 1小时
          }
        case 'PROFESSIONAL':
          return {
            ...baseConfig,
            maxRequests: 2000,
            windowMs: 60 * 60 * 1000, // 1小时
          }
        case 'ENTERPRISE':
          return {
            ...baseConfig,
            maxRequests: 10000,
            windowMs: 60 * 60 * 1000, // 1小时
          }
        default:
          return baseConfig
      }
    }

    return baseConfig
  }

  /**
   * 生成限流key
   */
  private generateKey(req: TenantRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req)
    }

    // 默认key生成策略：基于IP地址、用户ID和租户ID
    const parts = []

    // 添加租户ID
    if (req.tenant?.id) {
      parts.push(`tenant:${req.tenant.id}`)
    }

    // 添加用户ID
    if (req.user?.id) {
      parts.push(`user:${req.user.id}`)
    } else {
      // 如果没有用户ID，使用IP地址
      const ip = this.getClientIP(req)
      parts.push(`ip:${ip}`)
    }

    // 添加请求路径（粗粒度）
    const path = req.path.split('/').slice(0, 3).join('/') // 只取前三级路径
    parts.push(`path:${path}`)

    return `ratelimit:${parts.join(':')}`
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIP(req: TenantRequest): string {
    const forwarded = req.headers['x-forwarded-for'] as string
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const realIP = req.headers['x-real-ip'] as string
    if (realIP) {
      return realIP
    }

    return req.ip || req.connection?.remoteAddress || 'unknown'
  }

  /**
   * 检查是否需要跳过限流
   */
  private shouldSkip(req: TenantRequest, config: RateLimitConfig): boolean {
    if (config.skipSuccessfulRequests || config.skipFailedRequests) {
      // 这里可以根据响应状态决定是否跳过，但中间件阶段无法知道响应状态
      // 可以考虑在响应拦截器中处理
      return false
    }

    // 跳过健康检查端点
    if (req.path === '/health' || req.path.startsWith('/health/')) {
      return true
    }

    // 跳过静态资源
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      return true
    }

    return false
  }

  /**
   * 检查限流
   */
  private async checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    try {
      const now = Date.now()
      const windowStart = now - config.windowMs

      // 使用Redis的原子操作
      const multi = this.redisService.getClient().multi()

      // 移除过期请求
      multi.zremrangebyscore(key, 0, windowStart)

      // 添加当前请求
      multi.zadd(key, now, `${now}:${Math.random()}`)

      // 获取当前请求数量
      multi.zcount(key, windowStart, now)

      // 设置过期时间
      multi.expire(key, Math.ceil(config.windowMs / 1000))

      const results = await multi.exec()
      const currentCount = results ? results[2][1] as number : 0

      return currentCount <= config.maxRequests
    } catch (error) {
      this.logger.error('Redis rate limit check failed:', error)
      // Redis出错时允许请求通过，避免影响业务
      return true
    }
  }

  /**
   * 获取重置时间
   */
  private async getResetTime(key: string, config: RateLimitConfig): Promise<Date> {
    try {
      const scores = await this.redisService.getClient().zrange(key, 0, 0, 'WITHSCORES')
      if (scores && scores.length >= 2) {
        const oldestTimestamp = parseInt(scores[1])
        return new Date(oldestTimestamp + config.windowMs)
      }
    } catch (error) {
      this.logger.error('Failed to get reset time:', error)
    }

    // 默认重置时间
    return new Date(Date.now() + config.windowMs)
  }

  /**
   * 设置限流响应头
   */
  private async setRateLimitHeaders(
    res: Response,
    key: string,
    config: RateLimitConfig
  ): Promise<void> {
    try {
      const now = Date.now()
      const windowStart = now - config.windowMs

      const [count, oldest] = await Promise.all([
        this.redisService.getClient().zcount(key, windowStart, now),
        this.redisService.getClient().zrange(key, 0, 0, 'WITHSCORES')
      ])

      const currentCount = count as number
      const remaining = Math.max(0, config.maxRequests - currentCount)

      let resetTime = new Date(now + config.windowMs)
      if (oldest && oldest.length >= 2) {
        const oldestTimestamp = parseInt(oldest[1])
        resetTime = new Date(oldestTimestamp + config.windowMs)
      }

      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', resetTime.toISOString())
      res.setHeader('X-RateLimit-Window', config.windowMs.toString())

    } catch (error) {
      this.logger.error('Failed to set rate limit headers:', error)
    }
  }
}
