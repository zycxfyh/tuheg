import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import {
  type Prisma,
  type Project,
  ProjectType,
  type Tenant,
  TenantPlan,
  TenantRole,
  TenantStatus,
  UserTenantStatus,
  type Workspace,
  WorkspaceRole,
  WorkspaceType,
} from '@prisma/client'
import type { PrismaService } from '@tuheg/infrastructure'

export interface CreateTenantData {
  name: string
  displayName: string
  description?: string
  domain?: string
  plan?: TenantPlan
  ownerId: string
  config?: Record<string, any>
  limits?: Record<string, any>
  features?: string[]
}

export interface TenantLimits {
  users: number
  workspaces: number
  projects: number
  storage: number // GB
  apiCalls: number // per month
  aiTokens: number // per month
}

export interface TenantUsage {
  users: number
  workspaces: number
  projects: number
  storage: number // GB used
  apiCalls: number // this month
  aiTokens: number // this month
}

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 租户管理 ====================

  /**
   * 创建新租户
   */
  async createTenant(data: CreateTenantData): Promise<Tenant> {
    // 检查租户名称是否已存在
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { name: data.name },
    })

    if (existingTenant) {
      throw new ConflictException('Tenant name already exists')
    }

    // 检查域名是否已存在（如果提供）
    if (data.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: data.domain },
      })

      if (existingDomain) {
        throw new ConflictException('Domain already in use')
      }
    }

    // 创建租户
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        domain: data.domain,
        plan: data.plan || TenantPlan.STANDARD,
        config: data.config || {},
        limits: data.limits || this.getDefaultLimits(data.plan || TenantPlan.STANDARD),
        features: data.features || this.getDefaultFeatures(data.plan || TenantPlan.STANDARD),
        status: TenantStatus.PENDING,
      },
      include: {
        users: true,
        workspaces: true,
      },
    })

    // 将创建者添加为租户所有者
    await this.addUserToTenant(tenant.id, data.ownerId, TenantRole.OWNER)

    // 创建默认工作区
    await this.createDefaultWorkspace(tenant.id, data.ownerId)

    // 激活租户
    await this.activateTenant(tenant.id)

    this.eventEmitter.emit('tenant.created', { tenant, ownerId: data.ownerId })

    return tenant
  }

  /**
   * 更新租户信息
   */
  async updateTenant(
    id: string,
    updates: Partial<{
      displayName: string
      description: string
      domain: string
      plan: TenantPlan
      config: Record<string, any>
      limits: Record<string, any>
      features: string[]
      billingEmail: string
      billingAddress: any
    }>
  ): Promise<Tenant> {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })

    this.eventEmitter.emit('tenant.updated', { tenant, updates })
    return tenant
  }

  /**
   * 删除租户
   */
  async deleteTenant(id: string): Promise<void> {
    // 检查租户是否有活跃用户
    const activeUsers = await this.prisma.tenantUser.count({
      where: {
        tenantId: id,
        status: UserTenantStatus.ACTIVE,
      },
    })

    if (activeUsers > 0) {
      throw new BadRequestException('Cannot delete tenant with active users')
    }

    await this.prisma.tenant.delete({
      where: { id },
    })

    this.eventEmitter.emit('tenant.deleted', { tenantId: id })
  }

  /**
   * 获取租户详情
   */
  async getTenant(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          include: { user: true },
        },
        workspaces: {
          include: {
            members: {
              include: { user: true },
            },
            _count: {
              select: { projects: true },
            },
          },
        },
        _count: {
          select: {
            users: true,
            workspaces: true,
            auditLogs: true,
          },
        },
      },
    })

    if (!tenant) {
      throw new NotFoundException('Tenant not found')
    }

    return tenant
  }

  /**
   * 获取租户列表（管理员功能）
   */
  async getTenants(filters?: {
    status?: TenantStatus
    plan?: TenantPlan
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ tenants: Tenant[]; total: number }> {
    const where: Prisma.TenantWhereInput = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.plan) {
      where.plan = filters.plan
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { displayName: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              workspaces: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.tenant.count({ where }),
    ])

    return { tenants, total }
  }

  /**
   * 激活租户
   */
  async activateTenant(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.ACTIVE,
        activatedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    this.eventEmitter.emit('tenant.activated', { tenant })
    return tenant
  }

  /**
   * 暂停租户
   */
  async suspendTenant(id: string, reason?: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.SUSPENDED,
        suspendedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    this.eventEmitter.emit('tenant.suspended', { tenant, reason })
    return tenant
  }

  // ==================== 用户管理 ====================

  /**
   * 添加用户到租户
   */
  async addUserToTenant(
    tenantId: string,
    userId: string,
    role: TenantRole = TenantRole.MEMBER,
    invitedBy?: string
  ): Promise<void> {
    // 检查用户是否已在租户中
    const existingUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    })

    if (existingUser) {
      if (existingUser.status === UserTenantStatus.ACTIVE) {
        throw new ConflictException('User is already a member of this tenant')
      } else {
        // 重新激活用户
        await this.prisma.tenantUser.update({
          where: {
            tenantId_userId: {
              tenantId,
              userId,
            },
          },
          data: {
            status: UserTenantStatus.ACTIVE,
            role,
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        return
      }
    }

    // 检查租户用户限制
    await this.checkTenantLimits(tenantId, 'users')

    await this.prisma.tenantUser.create({
      data: {
        tenantId,
        userId,
        role,
        status: invitedBy ? UserTenantStatus.INVITED : UserTenantStatus.ACTIVE,
        invitedBy,
        invitedAt: invitedBy ? new Date() : null,
        joinedAt: invitedBy ? null : new Date(),
      },
    })

    this.eventEmitter.emit('tenant.userAdded', {
      tenantId,
      userId,
      role,
      invitedBy,
    })
  }

  /**
   * 从租户移除用户
   */
  async removeUserFromTenant(tenantId: string, userId: string): Promise<void> {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    })

    if (!tenantUser) {
      throw new NotFoundException('User is not a member of this tenant')
    }

    // 不能移除所有者
    if (tenantUser.role === TenantRole.OWNER) {
      throw new BadRequestException('Cannot remove tenant owner')
    }

    await this.prisma.tenantUser.update({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
      data: {
        status: UserTenantStatus.REMOVED,
        updatedAt: new Date(),
      },
    })

    this.eventEmitter.emit('tenant.userRemoved', { tenantId, userId })
  }

  /**
   * 更新用户在租户中的角色
   */
  async updateUserRole(tenantId: string, userId: string, role: TenantRole): Promise<void> {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    })

    if (!tenantUser) {
      throw new NotFoundException('User is not a member of this tenant')
    }

    // 不能改变所有者的角色
    if (tenantUser.role === TenantRole.OWNER && role !== TenantRole.OWNER) {
      throw new BadRequestException('Cannot change tenant owner role')
    }

    await this.prisma.tenantUser.update({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
      data: {
        role,
        updatedAt: new Date(),
      },
    })

    this.eventEmitter.emit('tenant.userRoleUpdated', {
      tenantId,
      userId,
      oldRole: tenantUser.role,
      newRole: role,
    })
  }

  /**
   * 获取租户用户列表
   */
  async getTenantUsers(tenantId: string): Promise<any[]> {
    return this.prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })
  }

  // ==================== 工作区管理 ====================

  /**
   * 创建工作区
   */
  async createWorkspace(
    tenantId: string,
    name: string,
    type: WorkspaceType = WorkspaceType.PRIVATE,
    createdBy: string,
    settings?: Record<string, any>
  ): Promise<Workspace> {
    // 检查租户工作区限制
    await this.checkTenantLimits(tenantId, 'workspaces')

    const workspace = await this.prisma.workspace.create({
      data: {
        tenantId,
        name,
        type,
        settings: settings || {},
        limits: this.getDefaultWorkspaceLimits(),
      },
    })

    // 将创建者添加为工作区所有者
    await this.addUserToWorkspace(workspace.id, createdBy, WorkspaceRole.OWNER)

    this.eventEmitter.emit('workspace.created', {
      workspace,
      tenantId,
      createdBy,
    })

    return workspace
  }

  /**
   * 获取租户工作区
   */
  async getTenantWorkspaces(tenantId: string): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: { tenantId },
      include: {
        members: {
          include: { user: true },
        },
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 添加用户到工作区
   */
  async addUserToWorkspace(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = WorkspaceRole.VIEWER,
    addedBy: string
  ): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    // 验证用户是租户成员
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: workspace.tenantId,
          userId,
        },
      },
    })

    if (!tenantUser || tenantUser.status !== UserTenantStatus.ACTIVE) {
      throw new BadRequestException('User is not an active member of the tenant')
    }

    // 检查是否已在工作区中
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    })

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace')
    }

    await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
        addedBy,
      },
    })

    this.eventEmitter.emit('workspace.userAdded', {
      workspaceId,
      userId,
      role,
      addedBy,
    })
  }

  // ==================== 项目管理 ====================

  /**
   * 创建项目
   */
  async createProject(
    workspaceId: string,
    name: string,
    type: ProjectType = ProjectType.GENERIC,
    createdBy: string,
    settings?: Record<string, any>
  ): Promise<Project> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { workspaceId },
    })

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    // 检查租户项目限制
    await this.checkTenantLimits(workspace.tenantId, 'projects')

    const project = await this.prisma.project.create({
      data: {
        workspaceId,
        name,
        type,
        settings: settings || {},
        metadata: {},
      },
    })

    // 将创建者添加为项目所有者
    await this.addUserToProject(project.id, createdBy, 'OWNER' as any)

    this.eventEmitter.emit('project.created', {
      project,
      workspaceId,
      createdBy,
    })

    return project
  }

  /**
   * 获取工作区项目
   */
  async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: { user: true },
        },
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 添加用户到项目
   */
  async addUserToProject(projectId: string, userId: string, role: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      include: { workspace: true },
    })

    if (!project) {
      throw new NotFoundException('Project not found')
    }

    // 验证用户是工作区成员
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspaceId,
          userId,
        },
      },
    })

    if (!workspaceMember) {
      throw new BadRequestException('User is not a member of the workspace')
    }

    await this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role: role as any,
      },
    })
  }

  // ==================== 资源限制和使用统计 ====================

  /**
   * 获取租户使用统计
   */
  async getTenantUsage(tenantId: string): Promise<TenantUsage> {
    const [userCount, workspaceCount, projectCount, storageUsage, apiUsage, aiUsage] =
      await Promise.all([
        this.prisma.tenantUser.count({
          where: { tenantId, status: UserTenantStatus.ACTIVE },
        }),
        this.prisma.workspace.count({
          where: { tenantId, status: 'ACTIVE' as any },
        }),
        this.prisma.project.count({
          where: {
            workspace: { tenantId },
            status: 'ACTIVE' as any,
          },
        }),
        this.getTenantStorageUsage(tenantId),
        this.getTenantApiUsage(tenantId),
        this.getTenantAiUsage(tenantId),
      ])

    return {
      users: userCount,
      workspaces: workspaceCount,
      projects: projectCount,
      storage: storageUsage,
      apiCalls: apiUsage,
      aiTokens: aiUsage,
    }
  }

  /**
   * 检查租户资源限制
   */
  async checkTenantLimits(tenantId: string, resource: keyof TenantLimits): Promise<void> {
    const tenant = await this.getTenant(tenantId)
    const usage = await this.getTenantUsage(tenantId)
    const limits = tenant.limits as TenantLimits

    const currentUsage = usage[resource]
    const limit = limits[resource]

    if (currentUsage >= limit) {
      throw new BadRequestException(
        `Tenant has reached the limit for ${resource}. Current: ${currentUsage}, Limit: ${limit}`
      )
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 创建默认工作区
   */
  private async createDefaultWorkspace(tenantId: string, ownerId: string): Promise<Workspace> {
    return this.createWorkspace(tenantId, 'Default Workspace', WorkspaceType.PRIVATE, ownerId, {
      isDefault: true,
    })
  }

  /**
   * 获取默认限制
   */
  private getDefaultLimits(plan: TenantPlan): TenantLimits {
    const limits = {
      [TenantPlan.FREE]: {
        users: 5,
        workspaces: 2,
        projects: 10,
        storage: 1, // 1GB
        apiCalls: 1000,
        aiTokens: 10000,
      },
      [TenantPlan.STANDARD]: {
        users: 50,
        workspaces: 10,
        projects: 100,
        storage: 10, // 10GB
        apiCalls: 10000,
        aiTokens: 100000,
      },
      [TenantPlan.PROFESSIONAL]: {
        users: 200,
        workspaces: 50,
        projects: 500,
        storage: 50, // 50GB
        apiCalls: 50000,
        aiTokens: 500000,
      },
      [TenantPlan.ENTERPRISE]: {
        users: 1000,
        workspaces: 200,
        projects: 2000,
        storage: 200, // 200GB
        apiCalls: 200000,
        aiTokens: 2000000,
      },
    }

    return limits[plan]
  }

  /**
   * 获取默认功能
   */
  private getDefaultFeatures(plan: TenantPlan): string[] {
    const features = {
      [TenantPlan.FREE]: ['basic_ai_generation', 'single_workspace', 'basic_collaboration'],
      [TenantPlan.STANDARD]: [
        'advanced_ai_generation',
        'multiple_workspaces',
        'team_collaboration',
        'basic_analytics',
      ],
      [TenantPlan.PROFESSIONAL]: [
        'premium_ai_models',
        'unlimited_workspaces',
        'advanced_collaboration',
        'detailed_analytics',
        'api_access',
        'custom_integrations',
      ],
      [TenantPlan.ENTERPRISE]: [
        'enterprise_ai_models',
        'unlimited_workspaces',
        'enterprise_collaboration',
        'advanced_analytics',
        'full_api_access',
        'custom_integrations',
        'dedicated_support',
        'sso_integration',
        'audit_logs',
        'compliance_reports',
      ],
    }

    return features[plan]
  }

  /**
   * 获取默认工作区限制
   */
  private getDefaultWorkspaceLimits(): Record<string, any> {
    return {
      projects: 50,
      storage: 5, // 5GB
      members: 20,
    }
  }

  /**
   * 获取租户存储使用量
   */
  private async getTenantStorageUsage(_tenantId: string): Promise<number> {
    // 这里应该计算实际存储使用量
    // 暂时返回模拟数据
    return 2.5 // GB
  }

  /**
   * 获取租户API使用量
   */
  private async getTenantApiUsage(_tenantId: string): Promise<number> {
    // 这里应该计算当月API调用次数
    // 暂时返回模拟数据
    return 1250
  }

  /**
   * 获取租户AI令牌使用量
   */
  private async getTenantAiUsage(_tenantId: string): Promise<number> {
    // 这里应该计算当月AI令牌使用量
    // 暂时返回模拟数据
    return 25000
  }
}
