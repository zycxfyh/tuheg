import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { PrismaService } from '@tuheg/common-backend'
import { PrismaClient } from '@prisma/client'
import { createMock } from '@golevelup/ts-jest'

// Database connection for testing
export const createTestDatabase = (): PrismaClient => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
      },
    },
  })

  return prisma
}

// Mock services
export const mockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  game: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  character: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  worldBookEntry: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  aiConfiguration: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
})

export const mockJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
})

export const mockRedisService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn(),
})

export const mockAiProviderFactory = () => ({
  createProvider: jest.fn(),
})

// Test application factory
export async function createTestApp(
  module: any,
  providers: any[] = [],
  controllers: any[] = []
): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [module],
    providers: [
      {
        provide: PrismaService,
        useValue: mockPrismaService(),
      },
      ...providers,
    ],
    controllers,
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))

  await app.init()

  return app
}

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createTestGame = (overrides = {}) => ({
  id: 'game-123',
  name: 'Test Game',
  ownerId: 'user-123',
  description: 'A test game',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createTestCharacter = (overrides = {}) => ({
  id: 'character-123',
  gameId: 'game-123',
  name: 'Test Character',
  description: 'A test character',
  stats: { health: 100, mana: 50 },
  inventory: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createTestAiConfiguration = (overrides = {}) => ({
  id: 'ai-config-123',
  ownerId: 'user-123',
  provider: 'OpenAI',
  apiKey: 'test-api-key',
  modelId: 'gpt-4',
  baseUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// HTTP request helpers
export const createTestRequest = (overrides = {}) => ({
  user: createTestUser(),
  body: {},
  query: {},
  params: {},
  headers: {},
  ...overrides,
})

export const createTestResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

// Validation helpers
export const expectValidationError = (errors: any[], field: string, constraint: string) => {
  const error = errors.find(err => err.property === field)
  expect(error).toBeDefined()
  expect(error.constraints).toHaveProperty(constraint)
}

// Database cleanup helpers
export const cleanupDatabase = async (prisma: PrismaClient) => {
  const tableNames = [
    'AuditLog',
    'TenantApiKey',
    'TenantIntegration',
    'WorkspaceMember',
    'Workspace',
    'TenantUser',
    'Tenant',
    'PluginDependency',
    'PluginDownload',
    'PluginReview',
    'PluginVersion',
    'PluginMarketplace',
    'WorldBookEntry',
    'Character',
    'GameAction',
    'Game',
    'AiConfiguration',
    'Role',
    'User',
  ]

  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`)
    } catch (error) {
      // Table might not exist or be empty, continue
    }
  }
}

// Time helpers for testing
export const advanceTime = (ms: number) => {
  jest.advanceTimersByTime(ms)
}

export const waitForNextTick = () => new Promise(resolve => setImmediate(resolve))

// Mock external services
export const mockExternalApi = (url: string, response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    } as Response)
  )
}

// Environment helpers
export const setTestEnvironment = () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'
}

export const restoreEnvironment = () => {
  delete process.env.NODE_ENV
  delete process.env.JWT_SECRET
  delete process.env.DATABASE_URL
  delete process.env.REDIS_URL
  delete process.env.ENCRYPTION_KEY
}

// Performance testing helpers
export const measureExecutionTime = async <T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> => {
  const start = process.hrtime.bigint()
  const result = await fn()
  const end = process.hrtime.bigint()
  const duration = Number(end - start) / 1_000_000 // Convert to milliseconds

  if (label) {
    console.log(`${label} took ${duration.toFixed(2)}ms`)
  }

  return { result, duration }
}

// Memory usage helpers
export const getMemoryUsage = () => {
  const usage = process.memoryUsage()
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`,
  }
}

// File system helpers for testing
export const createTempFile = async (content: string, extension = 'txt'): Promise<string> => {
  const fs = require('fs').promises
  const path = require('path')
  const os = require('os')

  const tempDir = os.tmpdir()
  const fileName = `test-${Date.now()}.${extension}`
  const filePath = path.join(tempDir, fileName)

  await fs.writeFile(filePath, content, 'utf8')
  return filePath
}

export const cleanupTempFile = async (filePath: string) => {
  const fs = require('fs').promises
  try {
    await fs.unlink(filePath)
  } catch (error) {
    // File might not exist, ignore
  }
}
