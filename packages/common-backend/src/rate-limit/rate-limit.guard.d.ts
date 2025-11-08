import { CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { RateLimitService } from './rate-limit.service'
export declare const RATE_LIMIT_KEY = 'rate_limit'
export interface RateLimitGuardOptions {
  windowMs?: number
  max?: number
  keyGenerator?: (request: Request) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}
export declare const RateLimit: (
  options?: RateLimitGuardOptions
) => (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => void
export declare class RateLimitGuard implements CanActivate {
  private readonly rateLimitService
  private readonly reflector
  private readonly logger
  constructor(rateLimitService: RateLimitService, reflector: Reflector)
  canActivate(context: ExecutionContext): Promise<boolean>
  private defaultKeyGenerator
}
//# sourceMappingURL=rate-limit.guard.d.ts.map
