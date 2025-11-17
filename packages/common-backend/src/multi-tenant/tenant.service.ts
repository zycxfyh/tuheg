import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TenantUsageService } from './tenant-usage.service'
import type {
  Tenant,
  TenantPlan,
  TenantStatus,
  User,
  TenantUser,
  Workspace,
  AuditLog
} from '@prisma/client'

export interface CreateTenantRequest {
  name: string
  displayName: string
  domain?: string
  description?: string
  plan?: TenantPlan
  billingEmail?: string
  ownerId: string
}

export interface UpdateTenantRequest {
  displayName?: string
  description?: string
  plan?: TenantPlan
  limits?: Record<string, any>
  features?: string[]
  billingEmail?: string
  status?: TenantStatus
}

export interface TenantLimits {
  maxUsers: number
  maxWorkspaces: number
  maxStorageGB: number
  maxApiCallsPerMonth: number
  maxAiTokensPerMonth: number
  concurrentUsers: number
  features: string[]
}

export interface TenantUsage {
  currentUsers: number
  currentWorkspaces: number
  usedStorageGB: number
  apiCallsThisMonth: number
  aiTokensThisMonth: number
  activeUsers: number
}

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private usageService: TenantUsageService
  ) {}

  /**
   * 创建新租户
   */
  async createTenant(request: CreateTenantRequest): Promise<Tenant> {
    // 检查租户名称是否已存在
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { name: request.name }
    })

    if (existingTenant) {
      throw new BadRequestException('Tenant name already exists')
    }

    // 检查域名是否已存在（如果提供）
    if (request.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: request.domain }
      })

      if (existingDomain) {
        throw new BadRequestException('Domain already in use')
      }
    }

    // 根据计划设置默认限制
    const defaultLimits = this.getDefaultLimits(request.plan || 'STANDARD')

    const tenant = await this.prisma.tenant.create({
      data: {
        name: request.name,
        displayName: request.displayName,
        domain: request.domain,
        description: request.description,
        plan: request.plan || 'STANDARD',
        limits: defaultLimits,
        billingEmail: request.billingEmail,
        tenantUsers: {
          create: {
            userId: request.ownerId,
            role: 'OWNER'
          }
        }
      },
      include: {
        tenantUsers: {
          include: {
            user: true
          }
        }
      }
    })

    // 创建审计日志
    await this.createAuditLog(tenant.id, 'TENANT_CREATED', {
      createdBy: request.ownerId,
      tenantName: request.name,
      plan: request.plan || 'STANDARD'
    })

    return tenant
  }

  /**
   * 更新租户信息
   */
  async updateTenant(tenantId: string, request: UpdateTenantRequest): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      throw new NotFoundException('Tenant not found')
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        displayName: request.displayName,
        description: request.description,
        plan: request.plan,
        limits: request.limits,
        features: request.features,
        billingEmail: request.billingEmail,
        status: request.status
      }
    })

    // 创建审计日志
    await this.createAuditLog(tenantId, 'TENANT_UPDATED', {
      changes: request,
      updatedBy: 'system' // TODO: 从上下文中获取当前用户
    })

    return updatedTenant
  }

  /**
   * 获取租户详情
   */
  async getTenant(tenantId: string): Promise<Tenant & { usage: TenantUsage }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        tenantUsers: {
          include: {
            user: true
          }
        },
        workspaces: true
      }
    })

    if (!tenant) {
      throw new NotFoundException('Tenant not found')
    }

    const usage = await this.getTenantUsage(tenantId)

    return {
      ...tenant,
      usage
    }
  }

  /**
   * 删除租户
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      throw new NotFoundException('Tenant not found')
    }

    // 软删除：将状态设为SUSPENDED
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date()
      }
    })

    await this.createAuditLog(tenantId, 'TENANT_DELETED', {
      tenantName: tenant.name,
      deletedAt: new Date()
    })
  }

  /**
   * 获取租户使用情况
   */
  async getTenantUsage(tenantId: string, period?: BillingPeriod): Promise<TenantUsage> {
    return this.usageService.getTenantUsage(tenantId, period)
  }

  /**
   * 检查租户资源限制
   */
  async checkTenantLimits(tenantId: string, resource: string, amount: number = 1): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      throw new NotFoundException('Tenant not found')
    }

    const limits = tenant.limits as TenantLimits
    const usage = await this.getTenantUsage(tenantId)

    switch (resource) {
      case 'users':
        return usage.currentUsers + amount <= limits.maxUsers
      case 'workspaces':
        return usage.currentWorkspaces + amount <= limits.maxWorkspaces
      case 'storage':
        return usage.usedStorageGB + amount <= limits.maxStorageGB
      case 'api_calls':
        return usage.apiCallsThisMonth + amount <= limits.maxApiCallsPerMonth
      case 'ai_tokens':
        return usage.aiTokensThisMonth + amount <= limits.maxAiTokensPerMonth
      default:
        return true
    }
  }

  /**
   * 添加用户到租户
   */
  async addUserToTenant(tenantId: string, userId: string, role: string = 'MEMBER'): Promise<TenantUser> {
    // 检查租户用户限制
    const canAddUser = await this.checkTenantLimits(tenantId, 'users')
    if (!canAddUser) {
      throw new BadRequestException('Tenant user limit exceeded')
    }

    const tenantUser = await this.prisma.tenantUser.create({
      data: {
        tenantId,
        userId,
        role: role as any
      },
      include: {
        user: true,
        tenant: true
      }
    })

    await this.createAuditLog(tenantId, 'USER_ADDED_TO_TENANT', {
      userId,
      role,
      addedBy: 'system' // TODO: 从上下文中获取当前用户
    })

    return tenantUser
  }

  /**
   * 从租户移除用户
   */
  async removeUserFromTenant(tenantId: string, userId: string): Promise<void> {
    await this.prisma.tenantUser.deleteMany({
      where: {
        tenantId,
        userId
      }
    })

    await this.createAuditLog(tenantId, 'USER_REMOVED_FROM_TENANT', {
      userId,
      removedBy: 'system' // TODO: 从上下文中获取当前用户
    })
  }

  /**
   * 获取租户的默认限制
   */
  private getDefaultLimits(plan: TenantPlan): TenantLimits {
    const limits: Record<TenantPlan, TenantLimits> = {
      FREE: {
        maxUsers: 5,
        maxWorkspaces: 2,
        maxStorageGB: 1,
        maxApiCallsPerMonth: 1000,
        maxAiTokensPerMonth: 10000,
        concurrentUsers: 2,
        features: ['basic_ai', 'single_workspace']
      },
      STANDARD: {
        maxUsers: 50,
        maxWorkspaces: 10,
        maxStorageGB: 10,
        maxApiCallsPerMonth: 50000,
        maxAiTokensPerMonth: 500000,
        concurrentUsers: 10,
        features: ['advanced_ai', 'multi_workspace', 'api_access', 'basic_analytics']
      },
      PROFESSIONAL: {
        maxUsers: 200,
        maxWorkspaces: 50,
        maxStorageGB: 100,
        maxApiCallsPerMonth: 500000,
        maxAiTokensPerMonth: 2000000,
        concurrentUsers: 50,
        features: ['premium_ai', 'unlimited_workspace', 'advanced_analytics', 'priority_support', 'custom_integrations']
      },
      ENTERPRISE: {
        maxUsers: 1000,
        maxWorkspaces: 200,
        maxStorageGB: 1000,
        maxApiCallsPerMonth: 2000000,
        maxAiTokensPerMonth: 10000000,
        concurrentUsers: 200,
        features: ['enterprise_ai', 'unlimited_workspace', 'enterprise_analytics', 'dedicated_support', 'sso', 'audit_logs', 'custom_features']
      }
    }

    return limits[plan] || limits.STANDARD
  }

  /**
   * 创建审计日志
   */
  private async createAuditLog(tenantId: string, action: string, details: any): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action,
        details,
        userId: 'system', // TODO: 从上下文中获取当前用户
        ipAddress: 'system', // TODO: 从请求中获取IP
        userAgent: 'system'
      }
    })
  }
}
