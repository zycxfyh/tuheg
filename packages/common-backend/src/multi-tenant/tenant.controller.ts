import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
  Logger
} from '@nestjs/common'
import { TenantService, CreateTenantRequest, UpdateTenantRequest } from './tenant.service'
import { TenantGuard, RequiresTenant, TenantPermissions } from './tenant.guard'
import type { TenantRequest } from './tenant.middleware'

@Controller('tenants')
@UseGuards(TenantGuard)
export class TenantController {
  private readonly logger = new Logger(TenantController.name)

  constructor(private readonly tenantService: TenantService) {}

  /**
   * 创建新租户
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() request: CreateTenantRequest, @Req() req: any) {
    this.logger.log(`Creating tenant: ${request.name}`)
    const tenant = await this.tenantService.createTenant({
      ...request,
      ownerId: req.user.id // 从认证上下文中获取用户ID
    })

    return {
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    }
  }

  /**
   * 获取当前用户的租户列表
   */
  @Get()
  async getUserTenants(@Req() req: any) {
    // TODO: 实现获取用户所属租户列表的逻辑
    return {
      success: true,
      data: [],
      message: 'User tenants retrieved successfully'
    }
  }

  /**
   * 获取租户详情
   */
  @Get(':id')
  @RequiresTenant()
  async getTenant(@Param('id') tenantId: string) {
    const tenant = await this.tenantService.getTenant(tenantId)

    return {
      success: true,
      data: tenant
    }
  }

  /**
   * 更新租户信息
   */
  @Put(':id')
  @TenantPermissions({ resource: 'tenant', action: 'update' })
  async updateTenant(
    @Param('id') tenantId: string,
    @Body() request: UpdateTenantRequest
  ) {
    const tenant = await this.tenantService.updateTenant(tenantId, request)

    return {
      success: true,
      data: tenant,
      message: 'Tenant updated successfully'
    }
  }

  /**
   * 删除租户
   */
  @Delete(':id')
  @TenantPermissions({ resource: 'tenant', action: 'delete' })
  async deleteTenant(@Param('id') tenantId: string) {
    await this.tenantService.deleteTenant(tenantId)

    return {
      success: true,
      message: 'Tenant deleted successfully'
    }
  }

  /**
   * 获取租户使用情况
   */
  @Get(':id/usage')
  @RequiresTenant()
  async getTenantUsage(@Param('id') tenantId: string) {
    const usage = await this.tenantService.getTenantUsage(tenantId)

    return {
      success: true,
      data: usage
    }
  }

  /**
   * 检查租户资源限制
   */
  @Get(':id/limits/check')
  @RequiresTenant()
  async checkTenantLimits(
    @Param('id') tenantId: string,
    @Query('resource') resource: string,
    @Query('amount') amount: number = 1
  ) {
    const allowed = await this.tenantService.checkTenantLimits(tenantId, resource, amount)

    return {
      success: true,
      data: {
        resource,
        amount,
        allowed
      }
    }
  }

  /**
   * 添加用户到租户
   */
  @Post(':id/users')
  @TenantPermissions({ resource: 'tenant', action: 'manage_users' })
  async addUserToTenant(
    @Param('id') tenantId: string,
    @Body() body: { userId: string; role?: string }
  ) {
    const tenantUser = await this.tenantService.addUserToTenant(
      tenantId,
      body.userId,
      body.role || 'MEMBER'
    )

    return {
      success: true,
      data: tenantUser,
      message: 'User added to tenant successfully'
    }
  }

  /**
   * 从租户移除用户
   */
  @Delete(':id/users/:userId')
  @TenantPermissions({ resource: 'tenant', action: 'manage_users' })
  async removeUserFromTenant(
    @Param('id') tenantId: string,
    @Param('userId') userId: string
  ) {
    await this.tenantService.removeUserFromTenant(tenantId, userId)

    return {
      success: true,
      message: 'User removed from tenant successfully'
    }
  }

  /**
   * 获取租户成员列表
   */
  @Get(':id/members')
  @RequiresTenant()
  async getTenantMembers(@Param('id') tenantId: string) {
    // TODO: 实现获取租户成员列表的逻辑
    return {
      success: true,
      data: [],
      message: 'Tenant members retrieved successfully'
    }
  }

  /**
   * 获取租户工作区列表
   */
  @Get(':id/workspaces')
  @RequiresTenant()
  async getTenantWorkspaces(@Param('id') tenantId: string) {
    // TODO: 实现获取租户工作区列表的逻辑
    return {
      success: true,
      data: [],
      message: 'Tenant workspaces retrieved successfully'
    }
  }

  /**
   * 获取租户审计日志
   */
  @Get(':id/audit-logs')
  @TenantPermissions({ resource: 'tenant', action: 'view_audit_logs' })
  async getTenantAuditLogs(
    @Param('id') tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50
  ) {
    // TODO: 实现获取租户审计日志的逻辑
    return {
      success: true,
      data: {
        logs: [],
        pagination: {
          page,
          limit,
          total: 0
        }
      },
      message: 'Audit logs retrieved successfully'
    }
  }
}
