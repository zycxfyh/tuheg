# 测试指南

本文档介绍Creation Ring项目的测试策略、运行方法和最佳实践。

## 📋 测试概览

### 测试类型

#### 1. 单元测试 (Unit Tests)
- **位置**: `apps/*/src/**/*.spec.ts`, `packages/*/src/**/*.spec.ts`
- **框架**: Jest (后端), Vitest (前端)
- **覆盖**: 单个函数、类和模块的逻辑测试
- **目标**: 代码逻辑正确性、边界条件处理

#### 2. 集成测试 (Integration Tests)
- **位置**: `tests/integration/**/*.spec.ts`
- **框架**: Jest + Supertest
- **覆盖**: 模块间的交互、数据库操作、外部API调用
- **目标**: 系统组件协同工作能力

#### 3. 端到端测试 (E2E Tests)
- **位置**: `apps/frontend/tests/e2e/**/*.spec.js`
- **框架**: Playwright
- **覆盖**: 用户完整操作流程
- **目标**: 真实用户体验验证

#### 4. 性能测试 (Performance Tests)
- **位置**: `tests/performance/**/*.spec.ts`
- **框架**: Jest + 自定义性能工具
- **覆盖**: 响应时间、并发处理、内存使用
- **目标**: 系统性能基准和瓶颈识别

## 🚀 运行测试

### 快速开始

```bash
# 安装依赖
pnpm install

# 运行所有测试
pnpm test

# 运行特定类型的测试
pnpm test:unit        # 单元测试
pnpm test:integration # 集成测试
pnpm test:e2e         # 端到端测试
pnpm test:performance # 性能测试

# 运行带覆盖率的测试
pnpm test:coverage

# 运行特定文件的测试
pnpm test apps/backend-gateway/src/auth/auth.service.spec.ts
pnpm test apps/frontend/src/components/AiConfigCard.spec.ts
```

### 开发环境测试

```bash
# 监听模式运行测试（自动重新运行）
pnpm test:watch

# 运行失败的测试
pnpm test --onlyFailures

# 调试模式运行测试
pnpm test:debug
```

### CI/CD环境测试

GitHub Actions会自动运行以下测试：

1. **代码质量检查**
   ```bash
   pnpm lint
   pnpm type-check
   ```

2. **单元测试和集成测试**
   ```bash
   pnpm test:ci
   ```

3. **安全扫描**
   ```bash
   # 使用Trivy进行容器安全扫描
   ```

4. **性能基准测试**
   ```bash
   pnpm test:performance
   ```

## 📊 测试覆盖率

### 覆盖率要求

| 组件 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 | 语句覆盖率 |
|------|-----------|-----------|---------|-----------|
| 后端网关 | 80% | 85% | 80% | 80% |
| 公共后端 | 85% | 90% | 85% | 85% |
| 前端组件 | 85% | 90% | 85% | 85% |
| 前端服务 | 90% | 95% | 90% | 90% |
| 前端组合式函数 | 85% | 90% | 85% | 85% |

### 查看覆盖率报告

```bash
# 生成覆盖率报告
pnpm test:coverage

# 报告位置
# 后端: coverage/lcov-report/index.html
# 前端: apps/frontend/coverage/lcov-report/index.html
```

### 覆盖率分析

```bash
# 查看未覆盖的代码
pnpm test:coverage -- --coverageReporters=text-lcov | grep -E "(LF|LH|FN|BR)" | head -20

# 生成详细的覆盖率摘要
pnpm test:coverage -- --coverageReporters=json-summary
```

## 🛠️ 编写测试

### 单元测试示例

#### 后端服务测试

```typescript
// apps/backend-gateway/src/auth/__tests__/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../auth.service'
import { PrismaService } from '@tuheg/common-backend'
import { JwtService } from '@nestjs/jwt'
import {
  mockPrismaService,
  mockJwtService,
  createTestUser,
  setTestEnvironment,
  restoreEnvironment,
} from '../../../../tests/shared/test-helpers'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    setTestEnvironment()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    restoreEnvironment()
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
        name: 'Test User',
      }

      const mockUser = createTestUser({
        email: registerDto.email,
        name: registerDto.name,
      })

      // Mock dependencies
      prismaService.user.findUnique.mockResolvedValue(null)
      prismaService.user.create.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('mock-jwt-token')

      const result = await service.register(registerDto)

      expect(result).toEqual({
        user: mockUser,
        access_token: 'mock-jwt-token',
      })
    })
  })
})
```

#### 前端组件测试

```typescript
// apps/frontend/src/components/common/AiConfigCard.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils'
import AiConfigCard from './AiConfigCard.vue'

describe('AiConfigCard', () => {
  it('should render configuration details correctly', () => {
    const config = {
      id: 'config-1',
      provider: 'OpenAI',
      modelId: 'gpt-4',
      apiKey: 'sk-...****',
      baseUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config },
    })

    expect(wrapper.text()).toContain('OpenAI')
    expect(wrapper.text()).toContain('gpt-4')
  })

  it('should emit edit event when edit button is clicked', async () => {
    const config = {
      id: 'config-1',
      provider: 'OpenAI',
      modelId: 'gpt-4',
      apiKey: 'sk-...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, editable: true },
    })

    const editButton = wrapper.find('[data-testid="edit-button"]')
    await editButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('edit')
  })
})
```

### 集成测试示例

```typescript
// tests/integration/auth.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AuthModule } from '../../apps/backend-gateway/src/auth/auth.module'
import { PrismaService } from '@tuheg/common-backend'
import { createTestDatabase, cleanupDatabase } from '../shared/test-helpers'

describe('Auth (Integration)', () => {
  let app: INestApplication
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = createTestDatabase()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }))

    await app.init()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await cleanupDatabase(prisma)
  })

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: 'integration-test@example.com',
        password: 'ValidPassword123!',
        name: 'Integration Test User',
      }

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user')
          expect(res.body).toHaveProperty('access_token')
        })
    })
  })
})
```

### E2E测试示例

```javascript
// apps/frontend/tests/e2e/auth.spec.js
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
  })

  test('should allow a user to log in and be redirected to the nexus hub', async ({ page }) => {
    // 导航到登录页面
    await page.goto('/login')

    // 断言登录表单可见
    await expect(page.locator('.auth-form')).toBeVisible()

    // 填写登录表单
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')

    // 提交表单
    await page.getByRole('button', { name: '登录' }).click()

    // 验证重定向和内容
    await expect(page).toHaveURL('/nexus')
    await expect(page.locator('h2')).toHaveText('观测者中枢')
  })
})
```

## 🧪 测试工具

### 共享测试辅助函数

```typescript
// tests/shared/test-helpers.ts
import { mockPrismaService, createTestUser, cleanupDatabase } from './test-helpers'

// Mock服务
export const mockAiProvider = () => ({
  generateText: jest.fn(),
  generateImage: jest.fn(),
  embedText: jest.fn(),
})

// 测试数据工厂
export const createTestGame = (overrides = {}) => ({
  id: 'game-123',
  name: 'Test Game',
  ownerId: 'user-123',
  description: 'A test game',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// HTTP请求辅助函数
export const createTestRequest = (overrides = {}) => ({
  user: createTestUser(),
  body: {},
  query: {},
  params: {},
  headers: {},
  ...overrides,
})
```

### 前端测试工具

```typescript
// apps/frontend/src/test-utils.ts
import { render } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

// 带完整上下文的渲染函数
export function renderWithProviders(component, options = {}) {
  const pinia = createPinia()
  const i18n = createI18n({
    locale: 'zh-CN',
    messages: { /* ... */ },
  })

  return render(component, {
    global: {
      plugins: [pinia, i18n],
    },
    ...options,
  })
}
```

## 📈 性能测试

### 基准测试

```typescript
// tests/performance/auth-performance.spec.ts
describe('Auth Performance Tests', () => {
  it('should register user within acceptable time', async () => {
    const { duration } = await measureExecutionTime(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
    }, 'User registration')

    expect(duration).toBeLessThan(500) // 500ms
  })

  it('should handle multiple concurrent registrations', async () => {
    const concurrentUsers = 10
    const promises = users.map(user =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send(user)
    )

    const { duration } = await measureExecutionTime(async () => {
      await Promise.all(promises)
    }, `${concurrentUsers} concurrent registrations`)

    expect(duration).toBeLessThan(2000) // 2 seconds
  })
})
```

### 负载测试

```bash
# 使用 Artillery 进行负载测试
npm install -g artillery

# 创建负载测试脚本
echo "
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'User registration'
    weight: 70
    requests:
      - post:
          url: '/auth/register'
          json:
            email: 'load-test-{{ $randomInt }}@example.com'
            password: 'ValidPassword123!'
            name: 'Load Test User'
  - name: 'User login'
    weight: 30
    requests:
      - post:
          url: '/auth/login'
          json:
            email: 'test@example.com'
            password: 'ValidPassword123!'
" > load-test.yml

# 运行负载测试
artillery run load-test.yml
```

## 🔧 测试配置

### Jest配置 (后端)

```javascript
// tests/shared/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../../apps', '<rootDir>/../../packages'],
  collectCoverageFrom: [
    'apps/**/*.ts',
    'packages/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!apps/**/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/../../packages/common-backend/test/setup.ts'],
}
```

### Vitest配置 (前端)

```javascript
// apps/frontend/vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})
```

### Playwright配置

```javascript
// apps/frontend/playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
  ],
})
```

## 🎯 测试最佳实践

### 1. 测试命名约定

```typescript
// ✅ 好的测试名称
describe('AuthService.register', () => {
  it('should successfully register a new user with valid data', () => {})
  it('should throw BadRequestException when email already exists', () => {})
  it('should validate password strength requirements', () => {})
})

// ❌ 不好的测试名称
describe('AuthService', () => {
  it('should work', () => {})
  it('should handle error', () => {})
  it('test registration', () => {})
})
```

### 2. 测试结构

```typescript
describe('Component/Function Name', () => {
  // 全局设置
  beforeAll(() => {})
  afterAll(() => {})

  // 每个测试的设置
  beforeEach(() => {})
  afterEach(() => {})

  describe('Specific behavior', () => {
    it('should handle normal case', () => {
      // Arrange - 设置测试数据
      // Act - 执行被测试的代码
      // Assert - 验证结果
    })

    it('should handle edge case', () => {
      // 测试边界条件
    })

    it('should handle error case', () => {
      // 测试错误处理
    })
  })
})
```

### 3. Mock策略

```typescript
// ✅ 使用共享的mock辅助函数
import { mockPrismaService, mockJwtService } from '../shared/test-helpers'

// ✅ 明确的mock行为
prismaService.user.findUnique.mockResolvedValue(mockUser)

// ❌ 过于宽泛的mock
jest.mock('axios')
```

### 4. 断言最佳实践

```typescript
// ✅ 具体的断言
expect(result.user.email).toBe(registerDto.email)
expect(result.access_token).toBeDefined()

// ✅ 检查错误类型
await expect(service.register(invalidData)).rejects.toThrow(BadRequestException)

// ❌ 模糊的断言
expect(result).toBeTruthy()
expect(error).toBeDefined()
```

### 5. 异步测试

```typescript
// ✅ 正确处理异步操作
it('should handle async operations', async () => {
  const result = await service.asyncMethod()
  expect(result).toBeDefined()
})

// ✅ 使用waitFor处理延时操作
await waitFor(() => {
  expect(mockCallback).toHaveBeenCalled()
}, { timeout: 1000 })
```

## 📊 测试报告

### 生成测试报告

```bash
# 单元测试覆盖率报告
pnpm test:coverage

# E2E测试报告
npx playwright show-report

# 性能测试报告
pnpm test:performance -- --reporter=json > performance-report.json
```

### 集成到CI/CD

```yaml
# .github/workflows/ci-cd.yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    file: ./coverage/lcov.info

- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      coverage/
      test-results/
      playwright-report/
```

## 🐛 调试测试

### 调试Jest测试

```bash
# 调试特定测试
pnpm test -- --testNamePattern="should register user" --verbose

# 使用调试器
pnpm test:debug

# 查看测试执行顺序
pnpm test -- --verbose --runInBand
```

### 调试Playwright测试

```bash
# 运行测试并查看浏览器
npx playwright test --headed

# 调试特定测试
npx playwright test --debug auth.spec.js

# 生成详细日志
DEBUG=pw:api npx playwright test
```

## 🔄 持续改进

### 定期审查

1. **每月审查覆盖率报告**
   - 识别未覆盖的代码路径
   - 添加缺失的测试用例

2. **性能基准跟踪**
   - 监控关键操作的响应时间
   - 识别性能回归

3. **测试质量评估**
   - 审查测试用例的有效性
   - 移除冗余或过时的测试

### 测试驱动开发 (TDD)

```typescript
// 红灯: 编写失败的测试
it('should validate email format', () => {
  expect(() => validateEmail('invalid-email')).toThrow()
})

// 绿灯: 实现最小代码使测试通过
export function validateEmail(email: string): void {
  if (!email.includes('@')) {
    throw new Error('Invalid email format')
  }
}

// 重构: 优化代码而不改变行为
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }
}
```

## 📚 相关资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [Vitest文档](https://vitest.dev/)
- [Playwright文档](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Vue Testing Handbook](https://lmiller1990.github.io/vue-testing-handbook/)

---

通过遵循这个测试指南，我们可以确保Creation Ring项目的代码质量、可靠性和性能，为用户提供稳定可靠的AI叙事创作平台。
