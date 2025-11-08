# 测试指南

本文档介绍了 Creation Ring 项目的测试策略、运行方式和最佳实践。

## 📋 测试概览

### 测试类型

1. **单元测试** (`*.spec.ts`) - 测试单个函数、类或模块
2. **集成测试** (`*.integration.spec.ts`) - 测试模块间的集成
3. **端到端测试** (`*.e2e.spec.ts`) - 测试完整用户流程

### 测试结构

```
tests/
├── setup.ts                    # 全局测试配置
├── mocks/                      # 测试mock文件
│   ├── jsonrepair.ts
│   ├── langfuse-core.ts
│   └── ...
└── README.md                   # 测试文档

apps/
├── frontend/src/
│   └── __tests__/             # 前端单元测试
├── backend-gateway/src/
│   └── __tests__/             # 后端网关测试
└── logic-agent/src/
    └── __tests__/             # 逻辑代理测试
```

## 🚀 运行测试

### 基本命令

```bash
# 运行所有测试
pnpm test

# 运行测试但不停止（用于开发）
pnpm test:watch

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行失败快速测试（推荐用于CI）
pnpm test:fail-fast
```

### 特定测试运行

```bash
# 运行特定文件的测试
npx jest apps/logic-agent/src/__tests__/logic.service.spec.ts

# 运行特定目录的测试
npx jest apps/logic-agent/src/__tests__/

# 运行包含特定关键词的测试
npx jest -t "processLogic"
```

### 测试覆盖率

```bash
# 生成覆盖率报告
pnpm test:coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

覆盖率阈值：
- 全局：80%
- 源码目录：85%
- 包目录：75%

## 🛠️ 测试配置

### Jest 配置

项目使用以下Jest配置：

- **测试环境**: Node.js
- **超时时间**: 30秒
- **并行运行**: CI环境2个worker，本地4个worker
- **快速失败**: 第一个测试失败即停止
- **Mock重置**: 每个测试后自动重置

### 测试环境变量

测试环境会自动设置以下环境变量：

```typescript
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
```

## 📝 编写测试

### 测试文件命名约定

- 单元测试: `*.spec.ts`
- 集成测试: `*.integration.spec.ts`
- 端到端测试: `*.e2e.spec.ts`

### 测试结构最佳实践

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: MockProxy<Dependency>;

  beforeEach(async () => {
    // 设置测试环境
    const module = await Test.createTestingModule({
      providers: [ServiceName],
    })
      .overrideProvider(Dependency)
      .useValue(mockDependency)
      .compile();

    service = module.get<ServiceName>(ServiceName);
  });

  afterEach(() => {
    // 清理测试状态
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return expected result when input is valid', () => {
      // Arrange
      const input = 'valid input';
      const expected = 'expected output';

      // Act
      const result = service.methodName(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should throw error when input is invalid', () => {
      // Arrange
      const invalidInput = 'invalid input';

      // Act & Assert
      expect(() => service.methodName(invalidInput))
        .toThrow('Expected error message');
    });
  });
});
```

### Mock 使用指南

```typescript
import { mock } from 'jest-mock-extended';

// 创建深度mock对象
const mockService = mock<ServiceInterface>({
  methodName: jest.fn().mockResolvedValue('mock result'),
});

// 验证方法调用
expect(mockService.methodName).toHaveBeenCalledWith(expectedArg);
expect(mockService.methodName).toHaveBeenCalledTimes(1);
```

### 自定义匹配器

项目提供了额外的Jest匹配器：

```typescript
expect(date).toBeValidDate();
expect(uuid).toBeValidUUID();
```

## 🔧 测试工具

### Mock 文件

位于 `tests/mocks/` 目录下的mock文件用于模拟外部依赖：

- `jsonrepair.ts` - JSON修复工具mock
- `langfuse-core.ts` - Langfuse核心功能mock
- `langfuse.ts` - Langfuse API mock
- `rebuff-detect.ts` - Rebuff检测工具mock

### 测试脚本

- `tests/setup.ts` - 全局测试配置和自定义匹配器
- `scripts/health-check.js` - 项目健康检查

## 📊 覆盖率报告

覆盖率报告生成在 `coverage/` 目录中：

- `coverage/lcov-report/index.html` - HTML报告
- `coverage/coverage-summary.json` - JSON摘要
- `coverage/lcov.info` - LCOV格式报告

## 🚨 CI/CD 集成

### GitHub Actions

测试在CI/CD流水线中自动运行：

```yaml
- name: Run Fail-Fast Unit Tests
  run: pnpm test:fail-fast
  timeout-minutes: 15

- name: Check Coverage Threshold
  run: |
    # 检查覆盖率是否达到阈值
    # 失败时立即停止流水线
```

### 质量门禁

- 所有测试必须通过
- 覆盖率必须达到阈值
- 没有linting错误
- 安全审计通过

## 🐛 调试测试

### 运行单个测试

```bash
# 运行特定测试文件
npx jest --testPathPattern=logic.service.spec.ts --verbose

# 运行并显示覆盖率
npx jest --testPathPattern=logic.service.spec.ts --coverage
```

### 调试模式

```bash
# 使用Node.js调试器
node --inspect-brk node_modules/.bin/jest --runInBand logic.service.spec.ts

# 或者使用VS Code调试配置
```

## 📈 性能测试

对于性能敏感的代码，可以添加性能测试：

```typescript
describe('Performance Tests', () => {
  it('should process 1000 items within 1 second', async () => {
    const items = generateLargeDataset(1000);

    const startTime = Date.now();
    await service.processItems(items);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
  });
});
```

## 🔒 安全测试

对于安全相关的功能，应该包含安全测试：

```typescript
describe('Security Tests', () => {
  it('should prevent SQL injection', () => {
    const maliciousInput = "'; DROP TABLE users; --";

    expect(() => service.validateInput(maliciousInput))
      .toThrow('Invalid input detected');
  });

  it('should validate JWT tokens properly', () => {
    const invalidToken = 'invalid.jwt.token';

    expect(service.verifyToken(invalidToken)).toBe(false);
  });
});
```

## 📚 最佳实践

### ✅ 推荐做法

1. **测试命名**: 使用描述性的测试名称
2. **AAA模式**: Arrange-Act-Assert结构
3. **Mock隔离**: 正确mock外部依赖
4. **覆盖率**: 确保高测试覆盖率
5. **独立性**: 测试之间相互独立

### ❌ 避免的做法

1. **硬编码值**: 避免在测试中使用魔法数字
2. **复杂逻辑**: 测试中避免复杂业务逻辑
3. **外部依赖**: 不要依赖外部服务或数据库
4. **副作用**: 避免测试产生副作用
5. **超时**: 不要写需要长时间运行的测试

### 🔧 维护建议

- 定期检查测试覆盖率
- 删除不再需要的测试
- 重构重复的测试代码
- 更新过时的mock数据
- 监控测试执行时间
