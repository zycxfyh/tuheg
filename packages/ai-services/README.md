# AI Services (AI服务包) - 多AI提供商抽象层

## 📋 概述

AI Services是创世星环系统的AI服务共享包，提供统一的AI服务接口和实现。该包采用多层架构设计，实现AI服务的模块化和可扩展性，为整个系统提供一致的AI能力访问接口。

[![AI Integration](https://img.shields.io/badge/ai--integration-advanced-blue.svg)](../../docs/ai/ai-api-providers.md)
[![Provider Support](https://img.shields.io/badge/providers-openai%7Canthropic-green.svg)](../../docs/ai/AI-PROVIDER-PRICING-INTEGRATION.md)

## 🏗️ 技术栈

- **语言**: TypeScript
- **AI框架**: LangChain.js
- **HTTP客户端**: Axios
- **数据验证**: Zod
- **配置管理**: 环境变量 + 配置对象
- **测试**: Jest + 模拟服务

## 架构设计

### 目录结构

```
packages/ai-services/
├── src/
│   ├── interfaces/           # AI服务接口定义
│   │   ├── ai-provider.interface.ts    # AI提供商接口
│   │   ├── ai-service.interface.ts     # AI服务接口
│   │   └── types.ts                    # 通用类型定义
│   ├── providers/            # AI提供商实现
│   │   ├── openai/           # OpenAI提供商
│   │   │   ├── openai.provider.ts
│   │   │   ├── openai.config.ts
│   │   │   └── openai.types.ts
│   │   ├── anthropic/        # Anthropic提供商
│   │   │   ├── anthropic.provider.ts
│   │   │   ├── anthropic.config.ts
│   │   │   └── anthropic.types.ts
│   │   └── base.provider.ts  # 基础提供商类
│   ├── services/             # AI服务编排层
│   │   ├── ai-orchestrator.service.ts  # AI编排器
│   │   ├── provider-manager.service.ts # 提供商管理器
│   │   ├── fallback.service.ts         # 降级服务
│   │   └── rate-limiter.service.ts     # 速率限制器
│   ├── types/                # AI相关类型定义
│   │   ├── common.types.ts   # 通用类型
│   │   ├── request.types.ts  # 请求类型
│   │   └── response.types.ts # 响应类型
│   ├── utils/                # 工具函数
│   │   ├── token-counter.ts  # Token计数器
│   │   ├── cost-calculator.ts # 成本计算器
│   │   └── retry-logic.ts    # 重试逻辑
│   └── index.ts              # 主入口文件
├── test/                     # 测试文件
│   ├── mocks/                # 模拟数据
│   ├── providers/            # 提供商测试
│   └── services/             # 服务测试
└── README.md
```

### 核心组件架构

#### 1. AI提供商接口层 (interfaces/)

**功能职责**:

- 定义统一的AI提供商接口
- 标准化AI服务调用方式
- 支持不同AI提供商的适配

**核心接口定义**:

```typescript
interface AiProvider {
  readonly name: string;
  readonly supportedModels: string[];

  // 核心方法
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): Promise<ReadableStream>;

  // 管理方法
  validateConfig(): Promise<boolean>;
  getModels(): Promise<ModelInfo[]>;
  getUsage(): Promise<UsageStats>;
}
```

#### 2. 提供商实现层 (providers/)

##### OpenAI提供商

```typescript
@Injectable()
export class OpenAiProvider implements AiProvider {
  constructor(private config: OpenAiConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const client = new OpenAI({ apiKey: this.config.apiKey });
    const response = await client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
    });

    return this.transformResponse(response);
  }
}
```

##### Anthropic提供商

```typescript
@Injectable()
export class AnthropicProvider implements AiProvider {
  constructor(private config: AnthropicConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const client = new Anthropic({ apiKey: this.config.apiKey });
    const response = await client.messages.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
    });

    return this.transformResponse(response);
  }
}
```

#### 3. 服务编排层 (services/)

##### AI编排器 (AiOrchestratorService)

**功能职责**:

- 智能选择最适合的AI提供商
- 处理请求路由和负载均衡
- 实现故障转移和降级策略

```typescript
@Injectable()
export class AiOrchestratorService {
  constructor(
    private providerManager: ProviderManagerService,
    private fallbackService: FallbackService,
  ) {}

  async executeChat(request: ChatRequest): Promise<ChatResponse> {
    // 1. 选择提供商
    const provider = await this.selectProvider(request);

    // 2. 执行请求
    try {
      return await provider.chat(request);
    } catch (error) {
      // 3. 故障转移
      return await this.fallbackService.handleFailure(provider, request, error);
    }
  }
}
```

##### 提供商管理器 (ProviderManagerService)

**功能职责**:

- 管理所有注册的AI提供商
- 监控提供商健康状态
- 实现提供商的动态注册和注销

```typescript
@Injectable()
export class ProviderManagerService {
  private providers = new Map<string, AiProvider>();

  registerProvider(provider: AiProvider): void {
    this.providers.set(provider.name, provider);
  }

  getAvailableProviders(): AiProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => this.isHealthy(provider));
  }

  private isHealthy(provider: AiProvider): boolean {
    // 实现健康检查逻辑
  }
}
```

##### 速率限制器 (RateLimiterService)

**功能职责**:

- 实现API调用频率限制
- 支持不同提供商的配额管理
- 防止API限流和超额费用

```typescript
@Injectable()
export class RateLimiterService {
  private limiters = new Map<string, RateLimiter>();

  async checkLimit(providerName: string, userId: string): Promise<boolean> {
    const limiter = this.getLimiter(providerName);
    return await limiter.checkLimit(userId);
  }

  private getLimiter(providerName: string): RateLimiter {
    // 获取或创建速率限制器
  }
}
```

## 支持的AI提供商

### OpenAI

- **支持模型**: GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **特性**: 函数调用、流式响应、视觉能力
- **优势**: 生态成熟、模型丰富

### Anthropic

- **支持模型**: Claude-3-Opus, Claude-3-Sonnet, Claude-3-Haiku
- **特性**: 长上下文、安全性优化
- **优势**: 推理能力强、安全性高

## 配置管理

### 环境变量配置

```bash
# OpenAI配置
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION=org-...
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic配置
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com

# AI服务配置
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4
AI_REQUEST_TIMEOUT=30000
AI_MAX_RETRIES=3
```

### 运行时配置

```typescript
interface AiServiceConfig {
  defaultProvider: string;
  defaultModel: string;
  requestTimeout: number;
  maxRetries: number;
  rateLimits: {
    [providerName: string]: {
      requestsPerMinute: number;
      tokensPerMinute: number;
    };
  };
  fallbackStrategy: 'round-robin' | 'priority';
}
```

## 智能路由策略

### 1. 基于任务类型的路由

```typescript
enum TaskType {
  CREATION = 'creation',     // 世界创建任务
  LOGIC = 'logic',          // 逻辑推理任务
  NARRATIVE = 'narrative',  // 叙事生成任务
  GENERAL = 'general'       // 通用任务
}

const providerSelectionMatrix = {
  [TaskType.CREATION]: ['openai:gpt-4', 'anthropic:claude-3-opus'],
  [TaskType.LOGIC]: ['anthropic:claude-3-sonnet', 'openai:gpt-4'],
  [TaskType.NARRATIVE]: ['anthropic:claude-3-haiku', 'openai:gpt-4-turbo'],
  [TaskType.GENERAL]: ['openai:gpt-3.5-turbo', 'anthropic:claude-3-haiku'],
};
```

### 2. 基于成本的路由

```typescript
interface CostBasedRouter {
  selectProvider(request: ChatRequest): Promise<AiProvider> {
    const providers = this.getAvailableProviders();
    const costs = await Promise.all(
      providers.map(p => this.calculateCost(p, request))
    );

    return providers[costs.indexOf(Math.min(...costs))];
  }
}
```

### 3. 基于性能的路由

```typescript
interface PerformanceBasedRouter {
  async selectProvider(request: ChatRequest): Promise<AiProvider> {
    const providers = this.getAvailableProviders();
    const performances = await Promise.all(
      providers.map(p => this.getPerformanceMetrics(p))
    );

    // 基于响应时间、成功率等指标选择
    return this.selectBestPerformer(providers, performances);
  }
}
```

## 故障转移和降级

### 自动故障转移

```typescript
@Injectable()
export class FallbackService {
  async handleFailure(
    failedProvider: AiProvider,
    request: ChatRequest,
    error: Error
  ): Promise<ChatResponse> {
    // 1. 记录失败
    await this.logFailure(failedProvider, error);

    // 2. 选择备用提供商
    const fallbackProvider = await this.selectFallbackProvider(failedProvider);

    // 3. 重试请求
    return await this.retryWithFallback(fallbackProvider, request);
  }
}
```

### 降级策略

1. **模型降级**: 从高级模型降级到基础模型
2. **功能降级**: 禁用非核心功能
3. **缓存降级**: 返回缓存的相似结果
4. **静态降级**: 返回预定义的备用响应

## 监控和可观测性

### 指标收集

- **调用次数**: 各提供商的API调用统计
- **成功率**: 各提供商的成功率监控
- **响应时间**: 平均响应时间和P95指标
- **成本统计**: API调用成本分析
- **错误分类**: 不同类型错误的统计

### 健康检查

```typescript
@Injectable()
export class AiHealthIndicator implements HealthIndicator {
  async isHealthy(): Promise<HealthIndicatorResult> {
    const providers = this.providerManager.getAllProviders();

    for (const provider of providers) {
      const isHealthy = await provider.validateConfig();
      if (!isHealthy) {
        return { status: 'unhealthy', details: { provider: provider.name } };
      }
    }

    return { status: 'healthy' };
  }
}
```

## 成本优化

### Token使用优化

```typescript
@Injectable()
export class TokenOptimizerService {
  optimizeRequest(request: ChatRequest): ChatRequest {
    // 1. 移除冗余内容
    request.messages = this.removeRedundancy(request.messages);

    // 2. 压缩上下文
    request.messages = this.compressContext(request.messages);

    // 3. 选择合适的模型
    request.model = this.selectOptimalModel(request);

    return request;
  }
}
```

### 缓存策略

```typescript
@Injectable()
export class AiCacheService {
  async getCachedResponse(request: ChatRequest): Promise<ChatResponse | null> {
    const cacheKey = this.generateCacheKey(request);
    return await this.cache.get(cacheKey);
  }

  async cacheResponse(request: ChatRequest, response: ChatResponse): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    await this.cache.set(cacheKey, response, { ttl: 3600 }); // 1小时TTL
  }
}
```

## 测试策略

### 单元测试

```typescript
describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;
  let mockProviderManager: MockProviderManager;

  beforeEach(() => {
    mockProviderManager = new MockProviderManager();
    service = new AiOrchestratorService(mockProviderManager);
  });

  it('should route request to appropriate provider', async () => {
    const request = createMockChatRequest();
    const response = await service.executeChat(request);

    expect(response).toBeDefined();
    expect(mockProviderManager.selectProvider).toHaveBeenCalledWith(request);
  });
});
```

### 集成测试

- **提供商集成**: 测试真实API调用
- **故障转移**: 测试降级和重试逻辑
- **性能测试**: 并发请求和负载测试

### 模拟测试

```typescript
const mockAiProvider = {
  name: 'mock-provider',
  chat: jest.fn().mockResolvedValue(mockChatResponse),
  validateConfig: jest.fn().mockResolvedValue(true),
};
```

## 使用指南

### 基本使用

```typescript
import { AiServicesModule } from '@tuheg/ai-services';

@Module({
  imports: [AiServicesModule],
  providers: [MyAiService],
})
export class MyModule {}

@Injectable()
export class MyAiService {
  constructor(private aiOrchestrator: AiOrchestratorService) {}

  async generateResponse(prompt: string): Promise<string> {
    const request: ChatRequest = {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    };

    const response = await this.aiOrchestrator.executeChat(request);
    return response.content;
  }
}
```

### 高级配置

```typescript
// 自定义提供商配置
const customConfig: AiServiceConfig = {
  defaultProvider: 'anthropic',
  defaultModel: 'claude-3-sonnet',
  rateLimits: {
    openai: { requestsPerMinute: 60, tokensPerMinute: 40000 },
    anthropic: { requestsPerMinute: 50, tokensPerMinute: 80000 },
  },
  fallbackStrategy: 'priority',
};

const aiModule = AiServicesModule.forRoot(customConfig);
```

## 扩展规划

### 计划功能

- **更多AI提供商**: 支持Google Gemini、Mistral等
- **模型微调**: 集成自定义微调模型
- **A/B测试**: AI模型效果对比测试
- **实时监控**: AI性能实时监控仪表板
- **智能缓存**: 基于语义的智能缓存

### 架构演进

当前架构可以演进为：

- **多区域部署**: 支持全球多区域AI服务
- **边缘计算**: 边缘节点AI推理优化
- **联邦学习**: 分布式AI模型训练
- **AutoML**: 自动化模型选择和优化

## 相关文档

- [AI API提供商集成](../../docs/ai/ai-api-providers.md)
- [AI定价集成](../../docs/ai/AI-PROVIDER-PRICING-INTEGRATION.md)
- [Common Backend文档](../common-backend/README.md)
- [AI代理文档](../../apps/logic-agent/README.md)
