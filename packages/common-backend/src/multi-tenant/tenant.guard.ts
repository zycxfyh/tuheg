import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { TenantRequest } from './tenant.middleware'

export interface TenantPermission {
  resource: string
  action: string
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>()

    // 检查是否需要租户权限
    const requiresTenant = this.reflector.get<boolean>('requiresTenant', context.getHandler())
    if (!requiresTenant) {
      return true
    }

    // 检查租户是否存在
    if (!request.tenant) {
      throw new ForbiddenException('Tenant access required')
    }

    // 检查租户状态
    if (request.tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Tenant is not active')
    }

    // 检查用户是否属于此租户
    if (!request.tenantUser) {
      throw new ForbiddenException('User is not a member of this tenant')
    }

    // 检查租户用户状态
    if (request.tenantUser.status !== 'ACTIVE') {
      throw new ForbiddenException('User tenant membership is not active')
    }

    // 检查特定权限
    const requiredPermissions = this.reflector.get<TenantPermission[]>('tenantPermissions', context.getHandler())
    if (requiredPermissions) {
      const userPermissions = request.tenantUser.permissions || []
      const hasAllPermissions = requiredPermissions.every(required =>
        userPermissions.some(userPerm =>
          this.matchesPermission(userPerm, required)
        )
      )

      if (!hasAllPermissions) {
        throw new ForbiddenException('Insufficient tenant permissions')
      }
    }

    return true
  }

  /**
   * 检查权限是否匹配
   */
  private matchesPermission(userPermission: string, required: TenantPermission): boolean {
    // 支持通配符匹配，如 'workspace.*' 匹配 'workspace.create', 'workspace.delete' 等
    const [userResource, userAction] = userPermission.split('.')

    if (userResource === '*' || userResource === required.resource) {
      return userAction === '*' || userAction === required.action
    }

    return false
  }
}

/**
 * 装饰器：标记需要租户权限
 */
export const RequiresTenant = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('requiresTenant', true, descriptor.value)
  }
}

/**
 * 装饰器：指定需要的租户权限
 */
export const TenantPermissions = (...permissions: TenantPermission[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('requiresTenant', true, descriptor.value)
    Reflect.defineMetadata('tenantPermissions', permissions, descriptor.value)
  }
}
