# 测试文档

## 概述

Creation Ring 项目采用严格的测试策略，确保代码质量和系统稳定性。本文档介绍了项目的测试架构、运行方式和质量保证流程。

## 测试策略

### 分层测试架构

```
┌─────────────────┐
│   E2E Tests     │  🌐 端到端测试 (用户视角)
│   (完整流程)    │
└─────────────────┘
         │
┌─────────────────┐
│ Integration     │  🔗 集成测试 (组件间协作)
│   Tests         │
└─────────────────┘
         │
┌─────────────────┐
│   Unit Tests    │  🧪 单元测试 (函数/类级别)
│   (核心逻辑)    │
└─────────────────┘
```

### 测试覆盖率要求

| 类别 | 全局阈值 | 核心源码 | 包源码 |
|------|---------|---------|--------|
| 语句覆盖率 | 80% | 85% | 75% |
| 分支覆盖率 | 80% | 85% | 75% |
| 函数覆盖率 | 80% | 85% | 75% |
| 行覆盖率 | 80% | 85% | 75% |

## 运行测试

### 本地开发测试

```bash
# 运行所有单元测试
pnpm test:unit

# 运行特定应用的测试
pnpm test creation-agent
pnpm test logic-agent

# 监听模式（开发时推荐）
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

### 快速失败测试

```bash
# 快速失败模式（CI 推荐）
pnpm test:fail-fast
```

### CI 测试套件

```bash
# 完整的 CI 测试流程
pnpm test:ci
```

## 测试配置

### Jest 配置

项目使用 Jest 作为主要测试框架，配置包括：

- **测试环境**: Node.js
- **超时时间**: 30秒
- **并行执行**: 4个工作进程 (CI: 2个)
- **覆盖率收集**: 自动化收集和报告

### Mock 策略

```typescript
// 外部依赖 Mock 示例
jest.mock('@tuheg/common-backend', () => ({
  ...jest.requireActual('@tuheg/common-backend'),
  callAiWithGuard: jest.fn(),
}))

// 数据库 Mock 示例
prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
```

## 质量保证流程

### Pre-commit 钩子

每次提交前自动运行：

```bash
pnpm lint:strict
pnpm format:check
pnpm type-check
pnpm test:fail-fast
```

### CI/CD 流水线

GitHub Actions 执行：

```bash
pnpm lint:strict
pnpm format:check
pnpm type-check
pnpm test:all
pnpm audit
```

### 严格类型检查

项目使用双重 TypeScript 配置：

1. **标准配置** (`tsconfig.json`) - 开发时使用
2. **严格配置** (`tsconfig.strict.json`) - CI 强制使用

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

## 测试最佳实践

### 单元测试

```typescript
describe('CreationService', () => {
  let service: CreationService
  let prismaMock: DeepMockProxy<PrismaClient>

  beforeEach(async () => {
    // 设置 Mock
    prismaMock = mockDeep<PrismaClient>()

    // 创建测试模块
    const module = await Test.createTestingModule({
      providers: [CreationService, { provide: PrismaService, useValue: prismaMock }],
    }).compile()

    service = module.get<CreationService>(CreationService)
  })

  it('should create new world successfully', async () => {
    // Arrange
    const payload = { userId: 'user-123', concept: 'A cyberpunk city' }
    prismaMock.game.create.mockResolvedValue(mockGame)

    // Act
    await service.createNewWorld(payload)

    // Assert
    expect(prismaMock.game.create).toHaveBeenCalled()
  })
})
```

### 错误处理测试

```typescript
it('should handle AI generation failure', async () => {
  // Arrange
  const aiError = new AiGenerationException('AI failed')
  schedulerMock.getProviderForRole.mockResolvedValue(mockAiProvider)
  mockedCallAiWithGuard.mockRejectedValue(aiError)

  // Act & Assert
  await expect(service.createNewWorld(payload)).rejects.toThrow()
  expect(eventBusMock.publish).toHaveBeenCalledWith(
    'NOTIFY_USER',
    expect.objectContaining({ event: 'creation_failed' })
  )
})
```

### Mock 最佳实践

```typescript
// ✅ 推荐：使用接口类型
const mockAiProvider: AiProvider = {
  name: 'test-model',
  provider: 'OpenAI',
  generate: jest.fn().mockResolvedValue('response')
}

// ❌ 避免：直接字面量
schedulerMock.getProviderForRole.mockResolvedValue({
  model: MOCK_CHAT_MODEL // 不存在的属性
})
```

## 测试工具链

### 核心工具

- **Jest**: 测试框架和运行器
- **ts-jest**: TypeScript 支持
- **jest-mock-extended**: 高级 Mock 功能
- **jest-junit**: JUnit XML 报告

### 辅助工具

- **Biome**: 代码质量检查
- **TypeScript**: 类型检查
- **audit-ci**: 安全漏洞检查

## 故障排除

### 常见问题

#### 1. 导入路径错误

```bash
# 错误
Cannot find module './creation.service'

# 解决方案：测试文件使用 ../ 而不是 ./
import { CreationService } from '../creation.service'
```

#### 2. Mock 类型不匹配

```typescript
// 错误：使用不存在的属性
{ model: MOCK_CHAT_MODEL }

// 正确：使用实际接口
const mockProvider: AiProvider = {
  name: 'test-model',
  provider: 'OpenAI',
  generate: jest.fn()
}
```

#### 3. 覆盖率不足

```bash
# 检查覆盖率报告
pnpm test:coverage

# 查看详细报告
open coverage/lcov-report/index.html
```

### 调试技巧

```bash
# 调试特定测试
pnpm test -- --testNamePattern="should create new world"

# 调试模式运行
pnpm test:debug

# 查看测试执行详情
pnpm test -- --verbose
```

## 相关文档

- [错误报告](../troubleshooting/ERROR-REPORT-2025-11-09.md)
- [修复计划](../troubleshooting/FIX-PLAN.md)
- [技术栈分析](../development/REQUIRED-TECH-STACK-ANALYSIS.md)
- [代码质量指南](../development/code-quality.md)

## 贡献指南

### 添加新测试

1. 创建测试文件：`*.spec.ts`
2. 遵循命名约定：`describe('ComponentName', () => { ... })`
3. 确保测试覆盖所有主要路径
4. 运行测试验证：`pnpm test`

### 测试驱动开发 (TDD)

```bash
# 1. 编写失败的测试
pnpm test -- --testNamePattern="new feature"

# 2. 实现功能使测试通过
# 3. 重构代码
pnpm test:coverage  # 确保覆盖率达标
```

---

**最后更新**: 2025-11-09
**维护者**: Creation Ring 开发团队
