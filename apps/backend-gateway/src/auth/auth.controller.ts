// 文件路径: apps/backend-gateway/src/auth/auth.controller.ts

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
// [核心修正] 从 @tuheg/common-backend 导入共享的 ZodValidationPipe
import { ZodValidationPipe } from '@tuheg/infrastructure'
import type { Request } from 'express'
import type { AuthService } from './auth.service'
import type { LoginDto } from './dto/login.dto'
import { loginSchema } from './dto/login.dto'
// 导入DTO类型和Zod schema
import type { RegisterDto } from './dto/register.dto'
import { registerSchema } from './dto/register.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  public async register(@Body(new ZodValidationPipe(registerSchema)) registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5次/5分钟
  @HttpCode(HttpStatus.OK)
  @Post('login')
  public async login(@Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  public getProfile(@Req() req: Request) {
    return req.user
  }
}
