# API 参考文档

## 📚 概述

VCPToolBox SDK 提供了完整的TypeScript API，用于开发AI叙事插件。本文档包含所有公共API的详细说明。

## 🔧 核心接口

### VCPPlugin

所有插件必须实现的接口。

```typescript
interface VCPPlugin {
  // 基本信息
  id: string
  name: string
  version: string
  type: PluginType
  description: string

  // 可选属性
  author?: string
  license?: string
  repository?: string
  homepage?: string

  // 兼容性
  compatibility?: PluginCompatibility
  capabilities?: PluginCapabilities

  // 生命周期方法
  activate(context: PluginContext): Promise<void>
  deactivate?(): Promise<void>

  // 自定义方法
  [key: string]: any
}
```

#### 属性

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `id` | `string` | ✅ | 插件唯一标识符 |
| `name` | `string` | ✅ | 插件显示名称 |
| `version` | `string` | ✅ | 插件版本号 |
| `type` | `PluginType` | ✅ | 插件类型 |
| `description` | `string` | ✅ | 插件描述 |
| `author` | `string` | ❌ | 插件作者 |
| `license` | `string` | ❌ | 许可证类型 |
| `repository` | `string` | ❌ | 代码仓库URL |
| `homepage` | `string` | ❌ | 项目主页 |
| `compatibility` | `PluginCompatibility` | ❌ | 兼容性信息 |
| `capabilities` | `PluginCapabilities` | ❌ | 功能描述 |

#### 方法

##### `activate(context: PluginContext): Promise<void>`

插件激活方法，当插件被加载时调用。

**参数:**
- `context: PluginContext` - 插件上下文对象

**返回值:** `Promise<void>`

##### `deactivate(): Promise<void>` (可选)

插件停用方法，当插件被卸载时调用。

**返回值:** `Promise<void>`

### PluginContext

插件运行时上下文接口。

```typescript
interface PluginContext {
  // 核心API访问
  api: PluginAPI

  // 配置管理
  config: PluginConfig

  // 事件系统
  events: PluginEvents

  // 存储系统
  storage: PluginStorage

  // UI系统
  ui: PluginUI

  // 日志系统
  logger: PluginLogger

  // VCP协议
  vcp: VCPProtocolAPI
}
```

### PluginType

插件类型枚举。

```typescript
type PluginType =
  | 'static'              // 静态插件
  | 'messagePreprocessor' // 消息预处理器
  | 'synchronous'         // 同步插件
  | 'asynchronous'        // 异步插件
  | 'service'             // 服务插件
  | 'dynamic'             // 动态插件
```

## 🔌 VCP协议API

### VCPProtocolAPI

VCP协议核心API接口。

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

### VCPToolRequest

工具调用请求接口。

```typescript
interface VCPToolRequest {
  toolName: string
  parameters: Record<string, any>
  priority?: 'low' | 'medium' | 'high' | 'critical'
  timeout?: number
}
```

### VCPToolResponse

工具调用响应接口。

```typescript
interface VCPToolResponse {
  success: boolean
  result: any
  error?: string
  executionTime: number
  toolName: string
}
```

### VCPMemoryEntry

记忆条目接口。

```typescript
interface VCPMemoryEntry {
  id: string
  agentId: string
  type: 'experience' | 'knowledge' | 'preference' | 'context'
  content: string
  tags: string[]
  timestamp: Date
  importance: number
  relatedEntries: string[]
}
```

## 🗂️ 插件API

### PluginAPI

插件可用的核心API接口。

```typescript
interface PluginAPI {
  // 故事相关
  stories: {
    create(data: any): Promise<string>
    update(id: string, data: any): Promise<void>
    get(id: string): Promise<any>
    list(filters: any): Promise<any[]>
    delete(id: string): Promise<void>
  }

  // 角色相关
  characters: {
    create(data: any): Promise<string>
    update(id: string, data: any): Promise<void>
    get(id: string): Promise<any>
    list(filters: any): Promise<any[]>
    delete(id: string): Promise<void>
  }

  // 世界相关
  worlds: {
    create(data: any): Promise<string>
    update(id: string, data: any): Promise<void>
    get(id: string): Promise<any>
    list(filters: any): Promise<any[]>
    delete(id: string): Promise<void>
  }

  // AI服务
  ai: {
    generateStory(prompt: string, options: any): Promise<string>
    generateCharacter(traits: any, options: any): Promise<any>
    generateWorld(theme: string, options: any): Promise<any>
    analyzeText(text: string, type: string): Promise<any>
  }

  // 工具函数
  utils: {
    validateJSON(data: any): boolean
    sanitizeHTML(html: string): string
    generateUUID(): string
    formatDate(date: Date, format: string): string
  }
}
```

## ⚙️ 配置管理

### PluginConfig

插件配置管理接口。

```typescript
interface PluginConfig {
  get<T>(key: string, defaultValue: T): T
  set(key: string, value: any): void
  update(updates: Record<string, any>): void
  reset(): void
  export(): Record<string, any>
  import(config: Record<string, any>): void
}
```

## 📢 事件系统

### PluginEvents

插件事件系统接口。

```typescript
interface PluginEvents {
  emit(event: string, data: any): void
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  once(event: string, handler: Function): void
}
```

## 💾 存储系统

### PluginStorage

插件存储接口。

```typescript
interface PluginStorage {
  get<T>(key: string, defaultValue: T): T
  set(key: string, value: any): void
  delete(key: string): void
  clear(): void
  keys(): string[]
  export(): Record<string, any>
  import(data: Record<string, any>): void
}
```

## 🎨 UI系统

### PluginUI

插件UI接口。

```typescript
interface PluginUI {
  registerComponent(name: string, component: any): void
  unregisterComponent(name: string): void
  addMenuItem(menuId: string, item: any): void
  removeMenuItem(menuId: string, itemId: string): void
  addToolbarButton(button: any): void
  removeToolbarButton(buttonId: string): void
  showModal(modal: any): void
  showNotification(notification: any): void
}
```

## 📝 日志系统

### PluginLogger

插件日志接口。

```typescript
interface PluginLogger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
}
```

## 🔍 类型定义

### PluginCompatibility

插件兼容性接口。

```typescript
interface PluginCompatibility {
  minVersion: string
  maxVersion?: string
  requiredPlugins: string[]
  conflictsWith: string[]
  platforms: ('web' | 'desktop' | 'mobile')[]
  vcpProtocolVersion: string
  supportedModels?: string[]
  memoryRequirements?: {
    minRAM: number
    recommendedRAM: number
  }
}
```

### PluginCapabilities

插件功能描述接口。

```typescript
interface PluginCapabilities {
  // 具体功能定义根据插件类型而定
  [key: string]: any
}
```

## 📋 示例

### 基本插件实现

```typescript
import { VCPPlugin, PluginContext, PluginType } from '@creation-ring/vcptoolbox-sdk'

export class ExamplePlugin implements VCPPlugin {
  id = 'example-plugin'
  name = 'Example Plugin'
  version = '1.0.0'
  type: PluginType = 'synchronous'
  description = 'A simple example plugin'

  async activate(context: PluginContext): Promise<void> {
    // 插件激活逻辑
    context.logger.info('Example plugin activated')

    // 注册事件监听
    context.events.on('story-created', this.onStoryCreated.bind(this))

    // 设置配置
    context.config.set('enabled', true)
  }

  async deactivate(): Promise<void> {
    // 插件停用逻辑
  }

  private onStoryCreated(data: any): void {
    console.log('New story created:', data)
  }

  // 自定义方法
  async doSomething(): Promise<string> {
    return 'Something done!'
  }
}
```

### 使用VCP协议

```typescript
// 在插件方法中使用VCP协议
async generateEnhancedStory(prompt: string): Promise<string> {
  // 调用AI生成基础故事
  const baseStory = await context.vcp.callTool({
    toolName: 'ai-story-generator',
    parameters: { prompt }
  })

  // 增强故事（例如添加图像）
  const enhanced = await context.vcp.callTool({
    toolName: 'story-enhancer',
    parameters: {
      story: baseStory.result,
      enhancements: ['images', 'music']
    }
  })

  return enhanced.result
}
```

---

*有关更多详细信息，请查看具体的API方法文档或示例代码。*
