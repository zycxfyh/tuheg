import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { PrismaService } from '../prisma/prisma.service'

export interface TenantRequest extends Request {
  tenant?: {
    id: string
    name: string
    plan: string
    limits: any
    features: string[]
  }
  tenantUser?: {
    id: string
    role: string
    permissions: string[]
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      // 从请求头、域名或JWT中提取租户信息
      const tenantInfo = await this.extractTenantInfo(req)

      if (tenantInfo) {
        req.tenant = tenantInfo.tenant
        req.tenantUser = tenantInfo.tenantUser
      }

      next()
    } catch (error) {
      // 如果租户验证失败，继续处理（某些端点可能不需要租户）
      next()
    }
  }

  /**
   * 从请求中提取租户信息
   */
  private async extractTenantInfo(req: TenantRequest): Promise<{
    tenant: any
    tenantUser?: any
  } | null> {
    // 方法1: 从请求头获取租户ID
    let tenantId = req.headers['x-tenant-id'] as string

    // 方法2: 从域名获取租户信息
    if (!tenantId && req.hostname) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { domain: req.hostname }
      })
      if (tenant) {
        tenantId = tenant.id
      }
    }

    // 方法3: 从JWT token中获取用户所属租户
    if (!tenantId && req.user) {
      const userId = (req.user as any).id
      const tenantUser = await this.prisma.tenantUser.findFirst({
        where: { userId },
        include: {
          tenant: true
        }
      })

      if (tenantUser) {
        return {
          tenant: {
            id: tenantUser.tenant.id,
            name: tenantUser.tenant.name,
            plan: tenantUser.tenant.plan,
            limits: tenantUser.tenant.limits,
            features: tenantUser.tenant.features
          },
          tenantUser: {
            id: tenantUser.id,
            role: tenantUser.role,
            permissions: tenantUser.permissions as string[]
          }
        }
      }
    }

    // 如果找到了租户ID，直接查询
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      })

      if (tenant) {
        return {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            plan: tenant.plan,
            limits: tenant.limits,
            features: tenant.features
          }
        }
      }
    }

    return null
  }
}
