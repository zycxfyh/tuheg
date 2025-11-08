# VCPToolBox SDK

🚀 **创世星环AI创作平台 JavaScript SDK**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/zycxfyh/tuheg)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

一个强大的 TypeScript SDK，用于与创世星环AI创作平台进行无缝集成。提供完整的 API 访问、实时通信、插件管理和认证功能。

## ✨ 特性

- 🔐 **完整的认证系统** - 支持登录、注册、令牌刷新和会话管理
- 🎮 **游戏管理** - 创建、更新、分享和管理AI创作游戏
- 🔌 **插件生态** - 安装、更新和管理VCPToolBox插件
- 🌐 **实时通信** - WebSocket支持，实时游戏事件和通知
- 📱 **跨平台** - 支持浏览器和Node.js环境
- 🛡️ **类型安全** - 完整的TypeScript类型定义
- 📚 **现代化API** - Promise-based异步接口
- 🔄 **自动重连** - 网络故障时的智能重连机制
- 💾 **持久化存储** - 安全的本地令牌存储

## 🚀 快速开始

### 安装

```bash
npm install @tuheg/vcptoolbox-sdk
# 或者
yarn add @tuheg/vcptoolbox-sdk
# 或者
pnpm add @tuheg/vcptoolbox-sdk
```

### 基本使用

```typescript
import { VCPToolBox } from '@tuheg/vcptoolbox-sdk';

// 创建SDK实例
const sdk = new VCPToolBox({
  baseURL: 'https://api.tuheg.dev',
  timeout: 10000
});

// 或者使用工厂方法
const sdk = VCPToolBox.create('https://api.tuheg.dev');
```

### 认证

```typescript
// 用户登录
try {
  const tokenData = await sdk.auth.login({
    username: 'your-username',
    password: 'your-password'
  });
  console.log('登录成功!', tokenData);
} catch (error) {
  console.error('登录失败:', error.message);
}

// 注册新用户
try {
  const result = await sdk.auth.register({
    username: 'newuser',
    email: 'user@example.com',
    password: 'securepassword'
  });
  console.log('注册成功!', result.data);
} catch (error) {
  console.error('注册失败:', error.message);
}
```

### 游戏管理

```typescript
// 创建新游戏
const game = await sdk.games.createGame({
  name: '我的AI冒险',
  description: '一个精彩的AI生成的故事',
  settings: {
    maxPlayers: 4,
    isPublic: true,
    aiModels: ['gpt-4', 'claude-3']
  }
});

// 获取游戏列表
const games = await sdk.games.getGames({
  status: 'active',
  limit: 10
});

// 提交游戏动作
await sdk.games.submitAction({
  gameId: game.data.id,
  action: {
    type: 'option',
    payload: { choice: 'explore_forest' }
  }
});
```

### 插件管理

```typescript
// 搜索插件
const plugins = await sdk.plugins.searchPlugins({
  q: 'image generation',
  category: 'ai-tools',
  limit: 20
});

// 安装插件
await sdk.plugins.installPlugin('image-generator-v2', 'latest');

// 获取已安装插件
const installed = await sdk.plugins.getInstalledPlugins();
```

### 实时通信

```typescript
// 连接WebSocket
await sdk.connectWebSocket();

// 监听游戏事件
sdk.ws.on('gameUpdate', (event) => {
  console.log('游戏更新:', event.payload);
});

// 发送游戏事件
sdk.ws.sendGameEvent(gameId, 'playerAction', {
  action: 'move',
  direction: 'north'
});
```

## 📖 API 文档

### 核心类

#### `VCPToolBox`

主SDK类，提供所有功能的统一入口。

```typescript
const sdk = new VCPToolBox(config);
```

#### `VCPToolBoxClient`

底层HTTP客户端，处理所有API请求。

```typescript
const client = sdk.client;
```

### 认证模块 (`AuthManager`)

```typescript
// 登录
await sdk.auth.login(credentials);

// 注册
await sdk.auth.register(userData);

// 刷新令牌
await sdk.auth.refreshToken();

// 登出
await sdk.auth.logout();

// 获取当前用户
await sdk.auth.getCurrentUser();
```

### 游戏模块 (`GameManager`)

```typescript
// 游戏CRUD操作
await sdk.games.createGame(gameData);
await sdk.games.getGame(gameId);
await sdk.games.updateGame(gameId, updates);
await sdk.games.deleteGame(gameId);

// 游戏动作
await sdk.games.submitAction(actionData);

// 高级功能
await sdk.games.exportGame(gameId);
await sdk.games.duplicateGame(gameId);
```

### 插件模块 (`PluginManager`)

```typescript
// 插件搜索和安装
await sdk.plugins.searchPlugins(query);
await sdk.plugins.installPlugin(pluginId);
await sdk.plugins.uninstallPlugin(pluginId);
await sdk.plugins.updatePlugin(pluginId);

// 插件信息
await sdk.plugins.getPlugin(pluginId);
await sdk.plugins.getPluginStats(pluginId);
```

### WebSocket模块 (`WebSocketManager`)

```typescript
// 连接管理
await sdk.ws.connect();
sdk.ws.disconnect();

// 事件处理
sdk.ws.on('eventType', handler);
sdk.ws.off('eventType', handler);

// 发送消息
sdk.ws.send(event);
sdk.ws.sendGameEvent(gameId, type, payload);
```

## 🔧 配置选项

### 客户端配置

```typescript
interface ClientConfig {
  baseURL: string;              // API基础URL
  timeout?: number;             // 请求超时时间（毫秒）
  auth?: AuthConfig;           // 认证配置
  headers?: Record<string, string>; // 自定义请求头
}
```

### WebSocket配置

```typescript
interface WebSocketConfig {
  url?: string;                // WebSocket URL（自动从baseURL推导）
  auth?: AuthConfig;           // 认证配置
  reconnect?: boolean;         // 是否自动重连
  reconnectInterval?: number;  // 重连间隔（毫秒）
  maxReconnectAttempts?: number; // 最大重连次数
}
```

### 认证配置

```typescript
interface AuthConfig {
  apiKey?: string;        // API密钥认证
  bearerToken?: string;   // Bearer令牌认证
  username?: string;      // 用户名（用于基本认证）
  password?: string;      // 密码（用于基本认证）
}
```

## 🎯 事件系统

SDK使用事件驱动架构，支持以下事件：

```typescript
// 客户端事件
sdk.client.on('ready', () => console.log('SDK就绪'));
sdk.client.on('error', (error) => console.error('错误:', error));
sdk.client.on('authenticated', (tokenData) => console.log('认证成功'));

// 游戏事件
sdk.client.on('gameCreated', (game) => console.log('游戏创建:', game));
sdk.client.on('gameUpdated', (game) => console.log('游戏更新:', game));
sdk.client.on('actionSubmitted', (result) => console.log('动作提交:', result));

// 插件事件
sdk.client.on('pluginLoaded', (plugin) => console.log('插件加载:', plugin));
sdk.client.on('pluginUnloaded', (pluginId) => console.log('插件卸载:', pluginId));

// WebSocket事件
sdk.ws.on('connected', () => console.log('WebSocket连接成功'));
sdk.ws.on('disconnected', () => console.log('WebSocket断开连接'));
sdk.ws.on('error', (error) => console.error('WebSocket错误:', error));
```

## 🛠️ 开发和构建

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/zycxfyh/tuheg.git
cd tuheg/packages/vcptoolbox-sdk

# 安装依赖
npm install

# 开发模式构建
npm run dev

# 生产模式构建
npm run build

# 运行测试
npm test
```

### 构建输出

构建后会生成以下文件：

- `dist/index.mjs` - ESM模块
- `dist/index.js` - CommonJS模块
- `dist/index.d.ts` - TypeScript类型定义
- `dist/index.d.ts.map` - 类型定义源映射

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 📦 打包大小

- **ESM**: ~45KB (gzipped: ~12KB)
- **CommonJS**: ~48KB (gzipped: ~13KB)
- **类型定义**: ~25KB

## 🌍 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范

- 使用 TypeScript 编写
- 遵循 ESLint 配置
- 添加完整的测试用例
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情。

## 🆘 支持

- 📖 [官方文档](https://tuheg.dev/docs/sdk)
- 🐛 [问题跟踪](https://github.com/zycxfyh/tuheg/issues)
- 💬 [讨论区](https://github.com/zycxfyh/tuheg/discussions)
- 📧 [邮件支持](mailto:support@tuheg.dev)

## 🙏 致谢

感谢所有为 VCPToolBox SDK 做出贡献的开发者！

特别感谢：
- 创世星环团队
- 开源社区贡献者
- VCPToolBox 生态系统伙伴

---

**Made with ❤️ by the VCPToolBox Team**
