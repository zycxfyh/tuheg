// 文件路径: apps/backend-gateway/src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import type { User } from '@prisma/client'
// [核心修正] 放弃旧的 '@/' 别名，从 @tuheg/common-backend 导入共享的 PrismaService
import type { PrismaService } from '@tuheg/infrastructure'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    readonly configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    })
  }

  // [注释] validate 方法负责在JWT验证通过后，从数据库中取出完整的用户信息
  public async validate(payload: { sub: string; email: string }): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      throw new UnauthorizedException('User not found.')
    }

    // Remove password from user object before returning
    // biome-ignore lint/correctness/noUnusedVariables: password is intentionally destructured and not used
    const { password, ...result } = user
    return result
  }
}
