// 文件路径: apps/backend-gateway/src/auth/auth.service.ts

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import type { User } from '@prisma/client'
// [核心修正] 放弃旧的 '@/' 别名，从 @tuheg/common-backend 导入共享的 PrismaService
import type { PrismaService } from '@tuheg/common-backend'
import * as bcryptjs from 'bcryptjs'
import type { LoginDto } from './dto/login.dto'
// [注释] 导入DTO类型，确保数据结构一致
import type { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  public async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { email, password } = registerDto

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      throw new ConflictException('Email already registered.')
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user
    return result
  }

  public async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })

    // [还原] 使用 bcrypt.compare
    if (user && (await bcryptjs.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user
      return result
    }
    return null
  }
  public async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.')
    }

    const payload = { email: user.email, sub: user.id }

    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
