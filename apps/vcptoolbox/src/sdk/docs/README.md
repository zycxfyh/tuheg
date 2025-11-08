# VCPToolBox 开发者文档

欢迎来到创世星环AI叙事平台的插件开发文档中心！

## 📚 文档导航

### 🚀 快速开始
- [安装指南](./getting-started/installation.md) - 如何安装和配置SDK
- [第一个插件](./getting-started/first-plugin.md) - 创建你的第一个VCPToolBox插件
- [开发环境](./getting-started/development.md) - 设置开发环境

### 🏗️ 核心概念
- [插件架构](./concepts/plugin-architecture.md) - 了解VCPToolBox插件系统
- [VCP协议](./concepts/vcp-protocol.md) - 掌握AI工具调用协议
- [插件类型](./concepts/plugin-types.md) - 六大插件类型详解
- [生命周期](./concepts/lifecycle.md) - 插件生命周期管理

### 🔧 开发指南
- [API参考](./api/index.md) - 完整的API文档
- [最佳实践](./guides/best-practices.md) - 开发最佳实践
- [调试技巧](./guides/debugging.md) - 调试和故障排除
- [性能优化](./guides/performance.md) - 性能调优指南

### 🧪 测试
- [单元测试](./testing/unit-tests.md) - 编写单元测试
- [集成测试](./testing/integration-tests.md) - 集成测试指南
- [性能测试](./testing/performance-tests.md) - 性能测试方法

### 📦 发布
- [发布流程](./publishing/publish-process.md) - 插件发布步骤
- [版本管理](./publishing/versioning.md) - 语义化版本控制
- [市场运营](./publishing/marketplace.md) - 插件市场运营

### 🌐 高级主题
- [多模态支持](./advanced/multimodal.md) - 处理多模态内容
- [分布式部署](./advanced/distributed.md) - 分布式插件部署
- [安全性](./advanced/security.md) - 插件安全指南
- [国际化](./advanced/i18n.md) - 插件国际化

### 🤝 社区
- [贡献指南](./community/contributing.md) - 如何贡献代码
- [代码规范](./community/coding-standards.md) - 编码规范
- [问题反馈](./community/issues.md) - 问题反馈流程

## 🎯 核心特性

### 🧠 AI赋能设计
VCPToolBox基于"将AI视为创造者伙伴"的哲学设计，所有功能都围绕AI的认知工学优化。

### 📋 六大插件协议
支持静态、消息预处理、同步、异步、服务、动态六大插件类型，覆盖所有AI能力扩展场景。

### 🔄 非线性超异步工作流
创新的异步任务编排机制，支持AI同时调用多个工具，实现复杂的工作流。

### 🧬 交叉记忆网络
AI自主记忆管理系统，支持记忆的写入、检索、关联和跨模型迁移。

### 🌐 统一多模态文件API
所有插件共享的文件中转层，支持文本、图像、音频、视频等多种模态的无缝流转。

## 💡 快速示例

```typescript
import { VCPPlugin, PluginContext, PluginType } from '@creation-ring/vcptoolbox-sdk'

export class MyStoryGenerator implements VCPPlugin {
  id = 'my-story-generator'
  name = 'My Story Generator'
  version = '1.0.0'
  type: PluginType = 'synchronous'
  description = 'Generate creative stories'

  async activate(context: PluginContext): Promise<void> {
    // 注册故事生成工具
    console.log('Story generator activated!')
  }

  async generateStory(prompt: string): Promise<string> {
    // 使用VCP协议调用AI服务
    const result = await context.vcp.callTool({
      toolName: 'ai-story-generator',
      parameters: { prompt, style: 'fantasy' }
    })

    return result.result
  }
}
```

## 📞 获取帮助

- 📖 [API文档](./api/index.md)
- 💬 [开发者论坛](https://community.creation-ring.com)
- 🐛 [问题跟踪](https://github.com/creation-ring/vcptoolbox-sdk/issues)
- 📧 [技术支持](mailto:support@creation-ring.com)

## 📈 更新日志

- **v1.0.0** (2024-01-15)
  - 初始发布
  - 支持六大插件协议
  - 完整的CLI工具链
  - 集成测试框架

---

*让我们一起构建AI叙事的美好未来！* 🚀✨
