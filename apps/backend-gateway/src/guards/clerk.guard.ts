// 文件路径: apps/backend-gateway/src/guards/clerk.guard.ts

import { createClerkClient } from '@clerk/backend'
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

// [核心修复] 定义 ClerkJWT 类型（兼容 @clerk/backend）
type ClerkJWT = {
  sub: string // 用户 ID（subject）
  [key: string]: unknown // 其他 JWT 字段
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name)
  private readonly clerkClient: ReturnType<typeof createClerkClient>

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY')
    if (!secretKey) {
      this.logger.error('CLERK_SECRET_KEY is not configured in environment variables.')
      throw new Error('Server configuration error: Clerk secret key is missing.')
    }
    this.clerkClient = createClerkClient({ secretKey })
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authorizationHeader = request.headers.authorization

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is missing or malformed.')
    }

    try {
      // Clerk v2 API: 使用 authenticateRequest 方法验证请求
      // 这个方法会验证JWT token并返回用户信息
      const authResult = await this.clerkClient.authenticateRequest({
        headers: new Headers({
          authorization: authorizationHeader,
        }),
      })

      // authenticateRequest 返回的对象应该包含用户信息
      // 如果认证失败，它会抛出异常，所以这里我们假设成功
      if (!authResult || !authResult.userId) {
        this.logger.warn('Clerk authentication succeeded but no userId found in result')
        throw new UnauthorizedException('Authentication succeeded but user identification failed.')
      }

      const jwt: ClerkJWT = {
        sub: authResult.userId,
        userId: authResult.userId,
        // 包含其他可能的认证信息
        ...authResult,
      }

      // 将解码后的用户信息附加到请求对象上，供后续使用
      // 遵循Clerk的官方惯例，将其命名为 `req.auth`
      request.auth = { userId: jwt.sub, ...jwt }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : 'Unknown error'
      this.logger.warn(`Clerk JWT verification failed: ${errorMessage}`)
      throw new UnauthorizedException('Invalid or expired token.')
    }
  }
}
