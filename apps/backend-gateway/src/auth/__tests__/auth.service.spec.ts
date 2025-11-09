// 文件路径: apps/backend-gateway/src/auth/__tests__/auth.service.spec.ts (修正版)

import { JwtService } from '@nestjs/jwt'
import { Test, type TestingModule } from '@nestjs/testing'
import { PrismaService } from '@tuheg/common-backend'
import * as bcryptjs from 'bcryptjs' // [核心修正] 导入 bcryptjs
import { AuthService } from '../auth.service'

// [核心修正] 模拟 bcryptjs 而不是 bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}))

// Mock PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    // Reset mocks
    mockPrismaService.user.findUnique.mockReset()
    mockPrismaService.user.create.mockReset()

    // Set default mock behaviors
    mockPrismaService.user.findUnique.mockResolvedValue(null)
    mockPrismaService.user.create.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('jwt-token') } },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('password hashing', () => {
    it('should hash the password during registration', async () => {
      const registerDto = { email: 'test@example.com', password: 'plainPassword' }

      // Override the mock for this test
      ;(service as any).prisma.user.findUnique.mockResolvedValue(null)
      ;(service as any).prisma.user.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      })

      const result = await service.register(registerDto)

      // [核心修正] 断言 bcryptjs.hash 被调用
      expect(bcryptjs.hash).toHaveBeenCalledWith('plainPassword', 10)

      // 验证返回的用户不包含密码
      expect(result).toEqual({ id: '1', email: 'test@example.com' })
      expect(result).not.toHaveProperty('password')
    })
  })
})
