/**
 * Jest 全局测试设置
 * 配置测试环境的快速失败机制和最佳实践
 */

// 设置更严格的超时
// @ts-expect-error - Jest is available globally in test environment
jest.setTimeout(30000)

// 全局错误处理 - 任何未处理的错误都会导致测试失败
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // 在测试环境中，让未处理的promise rejection导致测试失败
  throw new Error(`Unhandled promise rejection: ${reason}`)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // 在测试环境中，让未处理的异常导致测试失败
  throw error
})

// 配置控制台警告 - 将console.error转换为测试失败
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  originalConsoleError(...args)
  // 在CI环境中，将console.error转换为测试失败
  if (process.env.CI) {
    throw new Error(`Console error detected: ${args.join(' ')}`)
  }
}

// Mock 全局对象以防止意外的网络调用
global.fetch = jest.fn(() => Promise.reject(new Error('fetch should be mocked in tests')))

global.Request = jest.fn()
global.Response = jest.fn()

// Mock ESM modules that cause issues in Jest
jest.mock('langfuse', () => ({
  Langfuse: jest.fn().mockImplementation(() => ({
    trace: jest.fn(),
    generation: jest.fn(),
    span: jest.fn(),
    score: jest.fn(),
    shutdownAsync: jest.fn().mockResolvedValue(undefined),
  })),
}))

// 设置环境变量用于测试
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// 补齐缺失的环境变量
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long'
process.env.ENCRYPTION_SALT = 'test-encryption-salt-16-chars'
process.env.ENCRYPTION_USE_SALT = 'false'
process.env.ENCRYPTION_ALGORITHM = 'aes-256-gcm'
process.env.CLERK_SECRET_KEY = 'test-clerk-secret-key'
process.env.CLERK_PUBLISHABLE_KEY = 'test-clerk-publishable-key'
process.env.CLERK_WEBHOOK_SECRET_KEY = 'test-clerk-webhook-secret'
process.env.RABBITMQ_URL = 'amqp://localhost:5672'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/test'
process.env.SENTRY_ENVIRONMENT = 'test'
process.env.SENTRY_TRACES_SAMPLE_RATE = '0.1'
process.env.QDRANT_URL = 'http://localhost:6333'
process.env.QDRANT_API_KEY = 'test-qdrant-api-key'
process.env.FALLBACK_API_KEY = 'test-fallback-api-key'
process.env.FALLBACK_MODEL_ID = 'deepseek-chat'
process.env.FALLBACK_BASE_URL = 'https://api.deepseek.com'
process.env.DB_CONNECTION_LIMIT = '20'
process.env.DB_POOL_TIMEOUT = '20'
process.env.DB_IDLE_TIMEOUT = '300'
process.env.JWT_EXPIRATION_SECONDS = '3600'
process.env.BACKEND_GATEWAY_PORT = '3000'
process.env.CREATION_AGENT_HTTP_PORT = '8080'
process.env.LOGIC_AGENT_HTTP_PORT = '8081'
process.env.NARRATIVE_AGENT_HTTP_PORT = '8082'

// 清理函数 - 在每个测试后运行
afterEach(() => {
  // 重置所有mock
  jest.clearAllMocks()

  // 清理任何可能的文件系统更改（如果适用）
  // 注意：实际的文件系统操作应该在集成测试中进行

  // 检查是否有未处理的异步操作
  if (jest.getTimerCount() > 0) {
    console.warn(`Warning: ${jest.getTimerCount()} timers still active after test`)
  }
})

afterAll(async () => {
  // 清理测试资源
  jest.clearAllMocks()
}, 5000)

// 自定义匹配器
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !Number.isNaN(received.getTime())
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      }
    }
  },

  toBeValidUUID(received: any) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = typeof received === 'string' && uuidRegex.test(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      }
    }
  },
})

// 导出类型以便在测试中使用
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R
      toBeValidUUID(): R
    }
  }
}

// 内存使用监控
if (process.env.CI) {
  const initialMemory = process.memoryUsage()
  const memoryThreshold = 500 * 1024 * 1024 // 500MB

  afterEach(() => {
    const currentMemory = process.memoryUsage()
    const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed

    if (memoryIncrease > memoryThreshold) {
      console.warn(
        `Warning: Memory usage increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB`
      )
    }
  })
}
