# VCPToolBox SDK - 创世星环开发者工具包

## 🎯 概述

VCPToolBox SDK 是专为创世星环AI叙事平台开发的完整开发者工具包，为开发者提供从插件开发、测试、发布到部署的全链路支持。

## 🚀 核心特性

### 🛠️ 开发工具链
- **插件脚手架**: 快速生成插件项目结构
- **类型定义**: 完整的TypeScript类型支持
- **热重载**: 开发时实时预览和调试
- **代码生成**: 自动生成样板代码

### 🧪 测试框架
- **单元测试**: 插件功能测试
- **集成测试**: 与平台API的集成测试
- **性能测试**: 插件性能基准测试
- **兼容性测试**: 多版本兼容性验证

### 📦 发布工具
- **一键发布**: 简化插件发布流程
- **版本管理**: 语义化版本控制
- **市场集成**: 直接发布到插件市场
- **分发管理**: 自动处理插件更新

### 📚 文档系统
- **API文档**: 自动生成的API参考文档
- **开发指南**: 详细的开发教程和最佳实践
- **示例代码**: 丰富的使用示例和模板
- **迁移指南**: 版本升级和迁移说明

## 📦 安装

```bash
# 使用npm
npm install -g @creation-ring/vcptoolbox-sdk

# 使用yarn
yarn global add @creation-ring/vcptoolbox-sdk

# 使用pnpm
pnpm add -g @creation-ring/vcptoolbox-sdk
```

## 🚀 快速开始

### 1. 创建新插件

```bash
# 创建静态插件
vcptoolbox create my-static-plugin --type static

# 创建异步插件
vcptoolbox create my-async-plugin --type asynchronous

# 创建动态插件
vcptoolbox create my-dynamic-plugin --type dynamic
```

### 2. 插件开发

```typescript
import { VCPPlugin, PluginContext } from '@creation-ring/vcptoolbox-sdk'

export class MyPlugin implements VCPPlugin {
  id = 'my-plugin'
  name = 'My Awesome Plugin'
  version = '1.0.0'
  description = 'A plugin that does amazing things'

  async activate(context: PluginContext): Promise<void> {
    // 插件激活逻辑
    context.logger.info('Plugin activated!')

    // 使用VCP协议调用工具
    const result = await context.vcp.callTool({
      toolName: 'story-generator',
      parameters: { prompt: 'Create an epic fantasy tale' }
    })

    // 写入记忆
    await context.vcp.memory.write('agent-001', {
      type: 'experience',
      content: 'Successfully generated a story',
      tags: ['story', 'generation', 'success'],
      importance: 0.8
    })
  }

  async deactivate(): Promise<void> {
    // 插件停用逻辑
  }
}
```

### 3. 测试插件

```bash
# 运行单元测试
vcptoolbox test

# 运行集成测试
vcptoolbox test --integration

# 运行性能测试
vcptoolbox test --performance
```

### 4. 发布插件

```bash
# 构建插件
vcptoolbox build

# 发布到市场
vcptoolbox publish --market

# 验证发布
vcptoolbox verify
```

## 📚 API 参考

### VCPPlugin 接口

```typescript
interface VCPPlugin {
  id: string
  name: string
  version: string
  description: string
  type: PluginType
  compatibility: PluginCompatibility
  capabilities: PluginCapabilities

  activate(context: PluginContext): Promise<void>
  deactivate(): Promise<void>
  [method: string]: any
}
```

### PluginContext 接口

```typescript
interface PluginContext {
  api: PluginAPI
  config: PluginConfig
  events: PluginEvents
  storage: PluginStorage
  ui: PluginUI
  logger: PluginLogger
  vcp: VCPProtocolAPI
}
```

### VCP协议API

```typescript
interface VCPProtocolAPI {
  // 工具调用
  callTool(request: VCPToolRequest): Promise<VCPToolResponse>

  // 变量替换
  replaceVariables(text: string, variables: Record<string, any>): string

  // 记忆系统
  memory: {
    read(agentId: string, query?: string): Promise<VCPMemoryEntry[]>
    write(agentId: string, entry: VCPMemoryEntry): Promise<void>
    search(agentId: string, keywords: string[]): Promise<VCPMemoryEntry[]>
  }

  // 文件API
  files: {
    upload(file: File, metadata?: any): Promise<VCPFileHandle>
    download(handle: string): Promise<VCPFile>
    get(handle: string): Promise<VCPFile>
    list(query?: VCPFileQuery): Promise<VCPFile[]>
  }

  // WebSocket推送
  push(clientId: string, data: any, type?: string): void

  // 异步任务管理
  asyncTasks: {
    create(task: VCPAsyncTask): Promise<string>
    get(taskId: string): Promise<VCPAsyncTask | null>
    update(taskId: string, status: VCPAsyncTaskStatus): Promise<void>
    callback(taskId: string, result: any): Promise<void>
  }
}
```

## 🏗️ 插件类型

### 静态插件 (Static)
用于提供实时世界知识和上下文信息。

```typescript
export class WeatherPlugin implements VCPPlugin {
  type: PluginType = 'static'

  async getWeatherData() {
    // 获取实时天气数据
    return await fetchWeatherAPI()
  }
}
```

### 消息预处理器 (Message Preprocessor)
处理用户输入，进行预处理和增强。

```typescript
export class ImageProcessorPlugin implements VCPPlugin {
  type: PluginType = 'messagePreprocessor'

  async process(input: any): Promise<any> {
    if (input.type === 'image') {
      // 图像识别和描述
      const description = await analyzeImage(input.data)
      return { ...input, description }
    }
    return input
  }
}
```

### 同步插件 (Synchronous)
快速执行的任务，阻塞式调用。

```typescript
export class CalculatorPlugin implements VCPPlugin {
  type: PluginType = 'synchronous'

  async calculate(expression: string): Promise<number> {
    // 执行数学计算
    return evaluate(expression)
  }
}
```

### 异步插件 (Asynchronous)
耗时任务，并行处理。

```typescript
export class VideoGeneratorPlugin implements VCPPlugin {
  type: PluginType = 'asynchronous'

  async generateVideo(prompt: string): Promise<string> {
    const taskId = await this.context.vcp.asyncTasks.create({
      toolName: 'video-generator',
      parameters: { prompt }
    })

    // 启动后台视频生成任务
    this.startVideoGeneration(taskId, prompt)

    return `{{VCP_ASYNC_RESULT::VideoGenerator::${taskId}}}`
  }
}
```

### 服务插件 (Service)
持续运行的后台服务。

```typescript
export class NotificationServicePlugin implements VCPPlugin {
  type: PluginType = 'service'

  async activate(context: PluginContext): Promise<void> {
    // 启动通知监听服务
    this.startNotificationListener()
  }
}
```

### 动态插件 (Dynamic)
AI自主学习和创造的插件。

```typescript
export class LearningPlugin implements VCPPlugin {
  type: PluginType = 'dynamic'

  async learnFromExperience(experience: any): Promise<void> {
    // 从经验中学习，动态调整行为
    await this.updateModel(experience)
  }
}
```

## 🧪 测试框架

### 单元测试

```typescript
import { testPlugin } from '@creation-ring/vcptoolbox-sdk'

describe('MyPlugin', () => {
  it('should activate successfully', async () => {
    const plugin = new MyPlugin()
    const context = testPlugin.createMockContext()

    await expect(plugin.activate(context)).resolves.toBeUndefined()
  })
})
```

### 集成测试

```typescript
import { IntegrationTestRunner } from '@creation-ring/vcptoolbox-sdk'

const runner = new IntegrationTestRunner()

test('plugin integration with platform', async () => {
  const result = await runner.testIntegration('my-plugin', {
    input: { prompt: 'test' },
    expected: { success: true }
  })

  expect(result.success).toBe(true)
})
```

### 性能测试

```typescript
import { PerformanceTester } from '@creation-ring/vcptoolbox-sdk'

const tester = new PerformanceTester()

test('plugin performance', async () => {
  const metrics = await tester.runBenchmark('my-plugin', {
    iterations: 1000,
    concurrency: 10
  })

  expect(metrics.avgResponseTime).toBeLessThan(100) // ms
})
```

## 📚 最佳实践

### 插件设计原则

1. **单一职责**: 每个插件只做一件事，并做好
2. **错误处理**: 妥善处理异常情况，提供有意义的错误信息
3. **资源管理**: 正确管理资源，避免内存泄漏
4. **向后兼容**: 保持API的向后兼容性
5. **文档完整**: 提供完整的文档和使用示例

### 性能优化

1. **异步优先**: 优先使用异步操作避免阻塞
2. **缓存策略**: 合理使用缓存减少重复计算
3. **资源池**: 使用连接池和资源池提高效率
4. **监控指标**: 添加性能监控和健康检查

### 安全考虑

1. **输入验证**: 严格验证所有输入数据
2. **权限控制**: 最小权限原则，只请求必要权限
3. **数据隔离**: 确保插件间数据隔离
4. **加密存储**: 敏感数据加密存储

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/creation-ring/vcptoolbox-sdk.git
cd vcptoolbox-sdk

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 构建项目
pnpm build
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

- 📖 [文档中心](https://docs.creation-ring.com/vcptoolbox)
- 💬 [开发者论坛](https://community.creation-ring.com)
- 🐛 [问题跟踪](https://github.com/creation-ring/vcptoolbox-sdk/issues)
- 📧 [技术支持](mailto:support@creation-ring.com)

---

*VCPToolBox SDK - 让每个开发者都能轻松构建AI叙事插件* 🚀✨
