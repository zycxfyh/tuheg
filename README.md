# 🎨 创世星环 (Creation Ring)

<div align="center">

[![CI](https://img.shields.io/github/actions/workflow/status/your-org/creation-ring/ci.yml?branch=main)](https://github.com/your-org/creation-ring/actions)
[![Coverage](https://img.shields.io/badge/coverage-87.3%25-brightgreen.svg)](industrial-test-results/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

[![Phase 1 Complete](https://img.shields.io/badge/phase_1-✅_complete-brightgreen.svg)](PROJECT-COMPLETION-SUMMARY.md)
[![Industrial Ready](https://img.shields.io/badge/industrial-ready-brightgreen.svg)](docs/System-Technical-Specification.md)
[![Architecture](https://img.shields.io/badge/architecture-microservices-blue.svg)](docs/System-Technical-Specification.md)
[![VCPToolBox](https://img.shields.io/badge/vcp-toolbox-✅_integrated-purple.svg)](packages/common-backend/src/ai/)

</div>

---

> **AI创作操作系统的操作系统** - 让AI成为创作的得力助手，开启创作的新纪元

创世星环是一个全功能的**AI驱动交互式叙事游戏生成系统**，采用先进的微服务架构和多Agent协作技术，为用户提供沉浸式的创作体验。通过四个专门的AI代理（Creation/Logic/Narrative/Backend Gateway）的智能协作，系统能够从简单的概念生成完整的游戏世界。

## 📋 目录

- [🚀 核心特性](#-核心特性)
- [🏗️ 系统架构](#️-系统架构)
- [🛠️ 快速开始](#️-快速开始)
- [📖 使用指南](#-使用指南)
- [🔧 开发](#-开发)
- [📚 文档](#-文档)
- [🏆 里程碑](#-里程碑)
- [📞 支持](#-支持)
- [🤝 贡献](#-贡献)
- [📄 许可证](#-许可证)
- [🙏 致谢](#-致谢)

## 🚀 核心特性

### 🤖 多Agent协作系统
- **Creation Agent**: 从用户概念生成完整的游戏世界
- **Logic Agent**: 解析玩家行动，计算游戏状态变更
- **Narrative Agent**: 将状态变更转换为生动叙事内容
- **Backend Gateway**: API网关和实时通信管理

### 🏗️ 工业级架构
- **微服务架构**: 完全解耦的服务模块
- **消息队列**: RabbitMQ事件驱动通信
- **缓存策略**: Redis多层缓存
- **监控体系**: Prometheus + Grafana

### 🎨 用户体验
- **响应式设计**: 完美适配移动端、平板、桌面
- **主题系统**: 暗色/亮色/自动主题切换
- **国际化**: 中英日韩等多语言支持
- **实时通信**: WebSocket集群 + 流式AI响应

### 🔌 插件生态
- **VCPToolBox**: 完整的插件开发工具链
- **插件市场**: 上传、下载、评分系统
- **多模态支持**: Base64直通 + 文件API

## 🏗️ 系统架构

### 技术栈
- **前端**: Vue 3 + TypeScript + Vite + Tailwind CSS
- **后端**: NestJS + TypeScript + PostgreSQL + Redis
- **消息队列**: RabbitMQ
- **监控**: Prometheus + Grafana
- **容器化**: Docker + Kubernetes
- **测试**: Vitest + Playwright + Jest

### 服务架构

```mermaid
graph TD
    A[Frontend (Vue 3)] --> B[Backend Gateway (NestJS)]
    B --> C[(Database PostgreSQL)]
    B --> D[Creation Agent]
    B --> E[Logic Agent]
    B --> F[Narrative Agent]
    D --> G[(Message Queue RabbitMQ)]
    E --> G
    F --> G
```

### 项目结构

```
creation-ring/
├── 📁 apps/                    # 应用程序
│   ├── backend-gateway/       # API网关服务
│   ├── creation-agent/        # 世界创建代理
│   ├── frontend/              # Vue 3 前端应用
│   ├── logic-agent/           # 逻辑推理代理
│   └── narrative-agent/       # 叙事生成代理
├── 📁 packages/               # 共享包
│   ├── ai-services/           # AI服务包
│   ├── common-backend/        # 通用后端服务
│   ├── game-core/             # 游戏核心逻辑
│   ├── shared-types/          # 共享类型定义
│   └── vcptoolbox-sdk/        # VCPToolBox SDK
├── 📁 docs/                   # 项目文档
│   ├── project/               # 项目文档
│   ├── development/           # 开发文档
│   ├── ai/                    # AI技术文档
│   └── legal/                 # 法律合规
├── 📁 deployment/             # 部署配置
├── 📁 scripts/                # 构建脚本
├── 📁 tools/                  # 开发工具
└── 📁 .github/                # GitHub配置
```

## 🛠️ 快速开始

### 📋 系统要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥18.0.0 | 运行时环境 |
| pnpm | ≥8.0.0 | 包管理器 |
| Docker | ≥20.10 | 容器化 |
| Docker Compose | ≥2.0 | 编排工具 |

### 🚀 一键启动

> 💡 **推荐**: 使用 Docker Compose 一键启动所有服务

```bash
# 克隆项目
git clone https://github.com/your-org/creation-ring.git
cd creation-ring

# 安装依赖
pnpm install

# 启动所有服务（推荐）
docker-compose up -d

# 或者启动开发环境
pnpm run dev
```

### 🔧 手动安装

#### 1. 环境准备
```bash
# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 安装 pnpm
npm install -g pnpm@8
```

#### 2. 数据库设置
```bash
# 启动 PostgreSQL + Redis + RabbitMQ
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d --name redis -p 6379:6379 redis:7
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

#### 3. 安装和配置
```bash
# 安装依赖
pnpm install

# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

#### 4. 启动服务
```bash
# 启动后端服务
pnpm run dev:backend

# 启动前端服务（新终端）
pnpm run dev:frontend

# 启动 AI 代理（可选）
pnpm run dev:agents
```

### ✅ 验证安装

打开浏览器访问 `http://localhost:3000` 查看前端界面。

### 🧪 运行测试

```bash
# 运行所有测试
pnpm test

# 运行带覆盖率的测试
pnpm test:coverage

# 运行端到端测试
pnpm test:e2e
```

## 📖 使用指南

### 🎮 基本使用

1. **创建游戏世界**
   - 在主界面输入你的游戏概念
   - 系统将自动生成完整的游戏世界设定

2. **开始冒险**
   - 选择角色和初始场景
   - 通过文本命令与AI互动

3. **自定义体验**
   - 使用插件市场扩展功能
   - 调整主题和语言偏好

### 🔧 配置选项

#### 环境变量
```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/creation_ring

# Redis 配置
REDIS_URL=redis://localhost:6379

# AI 服务配置
OPENAI_API_KEY=your_api_key_here
ANTHROPIC_API_KEY=your_api_key_here

# 应用配置
NODE_ENV=development
PORT=3000
```

#### 主题配置
系统支持三种主题模式：
- **亮色主题**: 默认现代化界面
- **暗色主题**: 适合长时间使用
- **自动主题**: 根据系统设置切换

### 📱 API 使用

```bash
# 创建新游戏
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{"concept": "科幻冒险", "settings": {}}'

# 获取游戏状态
curl http://localhost:3000/api/games/{gameId}/state

# 发送玩家行动
curl -X POST http://localhost:3000/api/games/{gameId}/action \
  -H "Content-Type: application/json" \
  -d '{"action": "探索森林"}'
```

> 📖 查看完整的 [API 文档](docs/api/) 了解更多接口详情

## 🔧 开发

### 🏗️ 项目结构详解

```
creation-ring/
├── apps/                          # 应用服务
│   ├── frontend/                  # Vue 3 前端应用
│   │   ├── src/
│   │   │   ├── components/        # Vue 组件
│   │   │   ├── views/            # 页面视图
│   │   │   ├── composables/      # Vue 组合式 API
│   │   │   └── types/            # TypeScript 类型
│   │   ├── public/               # 静态资源
│   │   └── tests/                # 前端测试
│   ├── backend-gateway/          # API 网关
│   ├── creation-agent/           # 世界创建代理
│   ├── logic-agent/              # 逻辑推理代理
│   └── narrative-agent/          # 叙事生成代理
├── packages/                      # 共享包
│   ├── ai-services/              # AI 服务集成
│   ├── common-backend/           # 通用后端功能
│   ├── game-core/                # 游戏核心逻辑
│   ├── shared-types/             # 共享类型定义
│   └── vcptoolbox-sdk/           # 插件 SDK
├── docs/                         # 项目文档
├── deployment/                   # 部署配置
├── tools/                        # 开发工具
└── scripts/                      # 构建脚本
```

### 🚀 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 运行测试
pnpm run test

# 代码检查
pnpm run lint

# 格式化代码
pnpm run format

# 类型检查
pnpm run type-check
```

### 🧪 测试策略

项目采用多层次测试策略：

- **单元测试**: Vitest + Vue Test Utils
- **集成测试**: Jest + Supertest
- **端到端测试**: Playwright
- **性能测试**: Lighthouse CI

```bash
# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行 E2E 测试
pnpm test:e2e

# 生成测试覆盖率报告
pnpm test:coverage
```

## 📚 文档

- [📖 系统架构](docs/development/ARCHITECTURE.md)
- [📋 项目总结](docs/project/PROJECT-COMPLETION-SUMMARY.md)
- [🤝 贡献指南](CONTRIBUTING.md)
- [🔒 安全政策](SECURITY.md)
- [📋 API文档](docs/api/)
- [🔧 开发工具](tools/README.md)
- [📚 完整文档](docs/README.md)
- [📋 更新日志](CHANGELOG.md)

## 🏆 里程碑

- [x] **现代化架构重构**: Vue 3 + NestJS + TypeScript ✅
- [x] **多Agent协作系统**: 4个专用AI代理服务 ✅
- [x] **企业级基础设施**: Docker + K8s + 监控体系 ✅
- [x] **插件生态系统**: VCPToolBox + SDK + API平台 ✅
- [ ] **生产环境部署**: 云原生部署和扩展 🚀
- [ ] **社区生态建设**: 插件市场和开发者社区 🚀

## 📞 支持

### 🐛 报告问题

如果你发现了bug或有功能建议，请：

1. 查看[现有问题](https://github.com/your-org/creation-ring/issues)确保没有重复
2. 使用[问题模板](.github/ISSUE_TEMPLATE/bug-report.md)创建新问题
3. 提供详细的复现步骤和环境信息

### 💬 获取帮助

- 📖 [文档中心](docs/README.md) - 完整的使用和开发文档
- 💬 [讨论区](https://github.com/your-org/creation-ring/discussions) - 社区讨论和问答
- 🏷️ [问题标签](https://github.com/your-org/creation-ring/labels) - 按类别查找问题

### 🤝 商业支持

如需商业支持或定制开发，请联系：
- 📧 Email: support@creation-ring.dev
- 💼 [企业服务页面](https://creation-ring.dev/enterprise)

## 🤝 贡献

我们欢迎各种形式的贡献！无论是代码、文档、设计还是想法，都能帮助我们改进项目。

### 🚀 快速开始贡献

1. **Fork** 这个仓库
2. **创建** 你的特性分支 (`git checkout -b feature/amazing-feature`)
3. **提交** 你的更改 (`git commit -m 'Add some amazing feature'`)
4. **推送** 到分支 (`git push origin feature/amazing-feature`)
5. **创建** Pull Request

### 📝 贡献类型

- 🐛 **Bug修复**: 修复现有问题
- ✨ **新功能**: 添加新特性
- 📚 **文档**: 改进文档和注释
- 🎨 **UI/UX**: 界面和用户体验改进
- 🧪 **测试**: 添加或改进测试
- 🔧 **工具**: 开发工具和脚本
- 🌐 **国际化**: 多语言支持

### 📋 开发工作流

```bash
# 安装依赖
pnpm install

# 启动开发环境
pnpm run dev

# 运行测试
pnpm test

# 代码检查和格式化
pnpm run lint
pnpm run format

# 提交前检查
pnpm run pre-commit
```

### 👥 贡献者

感谢所有贡献者！（按字母顺序）

<!-- 未来可以通过 GitHub API 或手动维护此列表 -->

### 🏆 贡献者墙

[![Contributors](https://contrib.rocks/image?repo=your-org/creation-ring)](https://github.com/your-org/creation-ring/graphs/contributors)

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

```text
MIT License

Copyright (c) 2024 Creation Ring Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 致谢

### 🌟 核心贡献者

特别感谢以下贡献者为项目奠定了基础：

- **Creation Ring Team** - 项目发起和核心开发
- **开源社区** - 提供了优秀的工具和库

### 🛠️ 技术栈致谢

感谢以下开源项目和工具：

- **Vue.js** - 渐进式前端框架
- **NestJS** - Node.js 企业级框架
- **TypeScript** - 类型安全的JavaScript
- **PostgreSQL** - 强大的开源数据库
- **Redis** - 高性能键值存储
- **RabbitMQ** - 可靠的消息队列
- **Docker** - 容器化平台

### 📚 灵感来源

这个项目受到以下项目的启发：

- AI驱动的创作工具生态
- 微服务架构最佳实践
- 开源游戏开发社区

---

<div align="center">

**🎨 创世星环 (Creation Ring)**

*"让AI成为每一位创作者的得力助手，共同开创创作的新纪元！"*

[![Star History](https://api.star-history.com/svg?repos=your-org/creation-ring&type=Date)](https://star-history.com/#your-org/creation-ring&Date)

</div>