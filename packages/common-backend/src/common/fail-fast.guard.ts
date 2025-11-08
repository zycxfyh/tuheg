import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import type { Observable } from 'rxjs'

/**
 * 快速失败守卫
 * 用于严格的身份验证和授权检查
 */
@Injectable()
export class FailFastGuard implements CanActivate {
  private readonly logger = new Logger(FailFastGuard.name)

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const { url, method, headers, user } = request

    // 记录访问尝试
    this.logger.debug(`🔐 Access attempt: ${method} ${url}`, {
      userAgent: headers['user-agent'],
      ip: request.ip,
      timestamp: new Date().toISOString(),
    })

    // 检查身份验证
    if (!this.isAuthenticated(request)) {
      this.logger.warn(`🚫 Authentication failed: ${method} ${url}`, {
        reason: 'No valid authentication token',
        headers: this.sanitizeHeaders(headers),
        timestamp: new Date().toISOString(),
      })

      // 在测试环境中立即失败
      if (process.env.NODE_ENV === 'test') {
        throw new Error(`Authentication required for ${method} ${url}`)
      }

      throw new UnauthorizedException('Authentication required')
    }

    // 检查授权
    if (!this.isAuthorized(request, user)) {
      this.logger.warn(`🚫 Authorization failed: ${method} ${url}`, {
        user: user?.id || 'unknown',
        reason: 'Insufficient permissions',
        requiredRole: this.getRequiredRole(url, method),
        userRole: user?.role || 'none',
        timestamp: new Date().toISOString(),
      })

      // 在测试环境中立即失败
      if (process.env.NODE_ENV === 'test') {
        throw new Error(`Authorization failed for ${method} ${url}: insufficient permissions`)
      }

      throw new ForbiddenException('Insufficient permissions')
    }

    // 检查速率限制
    if (!this.checkRateLimit(request)) {
      this.logger.warn(`🚫 Rate limit exceeded: ${method} ${url}`, {
        ip: request.ip,
        timestamp: new Date().toISOString(),
      })

      // 在测试环境中立即失败
      if (process.env.NODE_ENV === 'test') {
        throw new Error(`Rate limit exceeded for ${method} ${url}`)
      }

      throw new ForbiddenException('Rate limit exceeded')
    }

    return true
  }

  private isAuthenticated(request: any): boolean {
    // 检查JWT token
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }

    const token = authHeader.substring(7)
    // 这里应该验证JWT token的有效性
    // 为了演示，我们检查token是否为空
    return token && token.length > 10
  }

  private isAuthorized(request: any, user: any): boolean {
    if (!user) return false

    const requiredRole = this.getRequiredRole(request.url, request.method)

    // 检查用户角色
    return user.role && this.hasRole(user.role, requiredRole)
  }

  private getRequiredRole(url: string, method: string): string {
    // 基于URL和方法的简单角色映射
    if (url.startsWith('/admin')) return 'admin'
    if (url.startsWith('/moderator')) return 'moderator'
    if (url.startsWith('/api/user') && method === 'DELETE') return 'admin'
    return 'user' // 默认需要用户角色
  }

  private hasRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      admin: 3,
      moderator: 2,
      user: 1,
    }

    return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0)
  }

  private checkRateLimit(request: any): boolean {
    // 简单的内存速率限制实现
    // 在实际应用中，应该使用Redis或其他持久化存储
    const key = `ratelimit:${request.ip}`
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15分钟
    const maxRequests = 100 // 每15分钟最多100个请求

    // 这是一个简化的实现，实际应用中应该使用更复杂的逻辑
    return true // 暂时允许所有请求
  }

  private sanitizeHeaders(headers: any): any {
    // 移除敏感信息
    const sanitized = { ...headers }
    delete sanitized.authorization
    delete sanitized.cookie
    delete sanitized['x-api-key']
    return sanitized
  }
}
