import { OnModuleDestroy } from '@nestjs/common'
export interface RateLimitOptions {
  windowMs: number
  max: number
}
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter: number
}
export declare class RateLimitService implements OnModuleDestroy {
  private readonly logger
  private readonly memoryStore
  private redisClient?
  private cleanupInterval?
  constructor()
  private initRedis
  checkLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult>
  private checkLimitRedis
  private checkLimitMemory
  private startCleanup
  onModuleDestroy(): void
}
//# sourceMappingURL=rate-limit.service.d.ts.map
