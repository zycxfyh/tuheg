import {
  BadRequestException,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import type { PrismaService } from '../prisma/prisma.service'

export interface TenantRequest extends Request {
  tenantId?: string
  tenant?: any
  userTenantRole?: string
}

@Injectable()
export class MultiTenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      // 从请求头或子域名中提取租户信息
      const tenantId = this.extractTenantId(req)

      if (!tenantId) {
        // 如果是公开API，跳过租户验证
        if (this.isPublicEndpoint(req)) {
          return next()
        }

        throw new BadRequestException('Tenant ID is required')
      }

      // 验证租户存在且活跃
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          status: true,
          plan: true,
          limits: true,
          features: true,
          suspendedAt: true,
        },
      })

      if (!tenant) {
        throw new BadRequestException('Tenant not found')
      }

      if (tenant.status !== 'ACTIVE') {
        if (tenant.status === 'SUSPENDED') {
          throw new UnauthorizedException('Tenant is suspended')
        }
        throw new UnauthorizedException('Tenant is not active')
      }

      // 将租户信息添加到请求对象
      req.tenantId = tenant.id
      req.tenant = tenant

      // 如果用户已认证，验证用户是否属于该租户
      if (req.user) {
        await this.validateUserTenantAccess(req, tenant.id)
      }

      // 检查租户资源限制
      await this.checkTenantLimits(req, tenant)

      // 设置租户上下文（用于数据库查询隔离）
      this.setTenantContext(tenant.id)

      next()
    } catch (error) {
      next(error)
    }
  }

  // ==================== 租户ID提取 ====================

  /**
   * 从请求中提取租户ID
   */
  private extractTenantId(req: TenantRequest): string | null {
    // 优先级1: 请求头
    const headerTenantId = req.headers['x-tenant-id'] as string
    if (headerTenantId) {
      return headerTenantId
    }

    // 优先级2: 查询参数
    const queryTenantId = req.query.tenantId as string
    if (queryTenantId) {
      return queryTenantId
    }

    // 优先级3: 子域名
    const subdomain = this.extractSubdomain(req)
    if (subdomain) {
      return this.resolveTenantFromSubdomain(subdomain)
    }

    // 优先级4: JWT token中的租户信息
    const tokenTenantId = this.extractTenantFromToken(req)
    if (tokenTenantId) {
      return tokenTenantId
    }

    return null
  }

  /**
   * 提取子域名
   */
  private extractSubdomain(req: Request): string | null {
    const host = req.headers.host
    if (!host) return null

    // 移除端口号
    const hostname = host.split(':')[0]

    // 检查是否是子域名
    const parts = hostname.split('.')
    if (parts.length > 2) {
      // 排除www子域名
      if (parts[0] !== 'www') {
        return parts[0]
      }
    }

    return null
  }

  /**
   * 从子域名解析租户
   */
  private resolveTenantFromSubdomain(subdomain: string): string | null {
    // 这里可以实现子域名到租户ID的映射
    // 暂时使用简单的映射逻辑
    try {
      // 假设子域名就是租户ID或租户名称
      const tenant = this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: subdomain }, { name: subdomain }],
        },
      })

      return tenant ? tenant.id : null
    } catch {
      return null
    }
  }

  /**
   * 从JWT token提取租户信息
   */
  private extractTenantFromToken(req: TenantRequest): string | null {
    // 如果用户已认证，从用户对象中提取租户信息
    if (req.user && typeof req.user === 'object' && 'tenantId' in req.user) {
      return (req.user as any).tenantId
    }

    return null
  }

  // ==================== 用户访问验证 ====================

  /**
   * 验证用户对租户的访问权限
   */
  private async validateUserTenantAccess(req: TenantRequest, tenantId: string): Promise<void> {
    if (!req.user || typeof req.user !== 'object' || !('id' in req.user)) {
      return // 用户未认证，跳过验证
    }

    const userId = (req.user as any).id

    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    })

    if (!tenantUser) {
      throw new UnauthorizedException('User does not have access to this tenant')
    }

    if (tenantUser.status !== 'ACTIVE') {
      if (tenantUser.status === 'SUSPENDED') {
        throw new UnauthorizedException('User access is suspended')
      }
      throw new UnauthorizedException('User access is not active')
    }

    // 将用户在租户中的角色添加到请求对象
    req.userTenantRole = tenantUser.role
  }

  // ==================== 资源限制检查 ====================

  /**
   * 检查租户资源限制
   */
  private async checkTenantLimits(req: TenantRequest, tenant: any): Promise<void> {
    const limits = tenant.limits as any

    // 检查API调用限制
    if (limits.apiCalls) {
      const currentUsage = await this.getCurrentApiUsage(tenant.id)
      if (currentUsage >= limits.apiCalls) {
        throw new BadRequestException('API call limit exceeded for this tenant')
      }
    }

    // 检查并发请求限制
    if (limits.concurrentRequests) {
      const currentConcurrent = await this.getCurrentConcurrentRequests(tenant.id)
      if (currentConcurrent >= limits.concurrentRequests) {
        throw new BadRequestException('Concurrent request limit exceeded for this tenant')
      }
    }

    // 检查请求频率限制
    if (limits.requestsPerMinute) {
      const recentRequests = await this.getRecentRequests(tenant.id, 60000) // 1分钟
      if (recentRequests >= limits.requestsPerMinute) {
        throw new BadRequestException('Request rate limit exceeded for this tenant')
      }
    }
  }

  // ==================== 租户上下文设置 ====================

  /**
   * 设置租户上下文
   */
  private setTenantContext(tenantId: string): void {
    // 在Prisma中间件或数据库层面实现行级安全
    // 这里可以设置数据库会话变量或连接参数

    // 示例：设置租户ID到异步本地存储
    const asyncLocalStorage = require('async-local-storage')
    if (asyncLocalStorage) {
      asyncLocalStorage.set('tenantId', tenantId)
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 判断是否为公开端点
   */
  private isPublicEndpoint(req: Request): boolean {
    const publicPaths = ['/health', '/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/public']

    const path = req.path
    return publicPaths.some((publicPath) => path.startsWith(publicPath))
  }

  /**
   * 获取当前API使用量
   */
  private async getCurrentApiUsage(tenantId: string): Promise<number> {
    // 这里应该从缓存或数据库中获取当前月的API使用量
    // 暂时返回模拟数据
    return 500
  }

  /**
   * 获取当前并发请求数
   */
  private async getCurrentConcurrentRequests(tenantId: string): Promise<number> {
    // 这里应该从缓存中获取当前活跃请求数
    // 暂时返回模拟数据
    return 5
  }

  /**
   * 获取最近请求数
   */
  private async getRecentRequests(tenantId: string, timeWindow: number): Promise<number> {
    // 这里应该统计最近时间窗口内的请求数
    // 暂时返回模拟数据
    return 30
  }
}
