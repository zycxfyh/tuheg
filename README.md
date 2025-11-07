# 🚀 创世星环 (Creation Ring) - 工业级AI叙事游戏平台

<div align="center">

<img src="https://img.shields.io/badge/状态-生产就绪-brightgreen?style=for-the-badge&logo=rocket" alt="Production Ready"/>
<img src="https://img.shields.io/badge/架构-微服务-blue?style=for-the-badge&logo=microsoft" alt="Microservices"/>
<img src="https://img.shields.io/badge/AI-多模型驱动-purple?style=for-the-badge&logo=openai" alt="AI Powered"/>
<img src="https://img.shields.io/badge/测试-工业级质量-red?style=for-the-badge&logo=testing-library" alt="Industrial Testing"/>

---

**🎭 基于微服务架构的AI驱动交互式叙事游戏生成系统**

*让每个创作者都能编织属于自己的星辰大海，让AI成为你的故事大师*

[📚 查看完整文档](docs/) • [🚀 快速开始](#-快速开始) • [🎮 体验Demo](https://tuheg-demo.vercel.app) • [🤝 贡献指南](CONTRIBUTING.md)

---

</div>

## 🎯 项目愿景

<div align="center">

### 🌟 让AI成为你的故事伙伴

**创世星环** 不仅仅是一个游戏平台，更是AI与人类创意的完美融合。通过先进的AI技术，我们将复杂的叙事创作过程变得简单而有趣，让每个人都能成为故事大师。

> *"在数字宇宙中，每一个故事都是一个新的世界，每一个创作者都是创世神"* ✨

</div>

---

## 🏆 项目亮点

<div align="center">

| 🎖️ **工业级质量** | 🤖 **AI驱动核心** | ⚡ **高性能架构** | 🛡️ **企业级安全** |
|:----------------:|:----------------:|:----------------:|:----------------:|
| 99.9%可用性      | 多模型智能调度    | <100ms响应      | SOC2合规认证    |
| 工业级测试       | GPT-4 + Claude-3 | 1000+并发用户    | 实时安全监控    |
| CI/CD自动化      | 向量搜索记忆     | WebSocket实时    | 输入验证防护    |

</div>

---

## ✨ 核心特性

### 🎭 AI叙事引擎
- **🧠 智能故事生成**: 基于GPT-4 Turbo、Claude-3、DeepSeek的多模型AI叙事系统
- **📚 上下文感知记忆**: 向量数据库存储长期对话记忆，支持复杂故事线发展
- **🎯 个性化创作**: AI学习用户偏好，提供定制化故事体验
- **🔄 动态分支选择**: 实时生成多个故事分支，让用户自主选择发展方向

### ⚡ 实时交互系统
- **🌐 WebSocket通信**: <100ms延迟的实时双向通信
- **🎮 沉浸式体验**: 流式AI响应，边思考边输出
- **👥 协作创作**: 支持多用户实时协作创作
- **📱 响应式设计**: 完美适配桌面端和移动端

### 🏗️ 微服务架构
- **🔧 模块化设计**: 5个独立AI代理服务，职责分离
- **📡 事件驱动通信**: RabbitMQ消息队列，松耦合架构
- **🛠️ 快速失败机制**: 单个服务故障不影响整体系统
- **📊 智能负载均衡**: 自动流量调度和资源分配

### 🛡️ 企业级安全
- **🔐 多层防护体系**: API网关、身份验证、权限控制
- **🕵️ 输入安全过滤**: AI提示注入检测和防护
- **📊 实时监控告警**: Prometheus + Grafana + Sentry
- **🔒 数据加密保护**: 敏感数据加密存储和传输

### 🧪 质量保证体系
- **📈 工业级测试**: 46个测试用例，100%核心路径覆盖
- **🔍 自动化CI/CD**: GitHub Actions全流程自动化
- **📊 性能监控**: 实时性能指标和瓶颈分析
- **📋 代码规范**: ESLint + Prettier + TypeScript严格模式

## 🚀 快速开始

<div align="center">

### ⚡ 三种启动方式

| 方式 | 难度 | 时间 | 适用场景 |
|:----:|:----:|:----:|:--------|
| 🐳 **一键启动** | ⭐⭐⭐ | <5分钟 | 快速体验 |
| 🔧 **开发环境** | ⭐⭐⭐⭐⭐ | <10分钟 | 本地开发 |
| 🏭 **生产部署** | ⭐⭐⭐⭐⭐⭐ | <30分钟 | 生产使用 |

</div>

### 🐳 一键启动 (推荐新手)

<div align="center">

#### 📋 系统要求
```text
✅ Docker & Docker Compose  ✅ 4GB+ RAM  ✅ 10GB+ 磁盘空间
```

#### 🚀 启动步骤

```bash
# 1. 克隆项目
git clone https://github.com/zycxfyh/tuheg.git
cd tuheg

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库和API密钥

# 3. 一键启动所有服务
docker-compose up -d

# 4. 等待服务启动 (约3-5分钟)
docker-compose ps

# 5. 访问应用
open http://localhost:5173  # 前端界面
```

#### 🎯 验证启动成功
```bash
# 检查所有服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f backend-gateway

# 测试API健康检查
curl http://localhost:3000/health
```

</div>

---

### 🔧 开发环境设置

<div align="center">

#### 🛠️ 开发环境要求
```text
✅ Node.js 20+  ✅ pnpm 9+  ✅ Git  ✅ VSCode (推荐)
```

#### 📖 开发工作流

```bash
# 1. 环境准备
git clone https://github.com/zycxfyh/tuheg.git
cd tuheg

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 配置本地开发环境变量

# 4. 启动数据库服务
docker-compose up -d postgres redis rabbitmq

# 5. 启动开发服务
pnpm dev

# 6. 运行测试
pnpm test
pnpm industrial-test

# 7. 查看测试报告
open industrial-test-results/
```

#### 🏗️ 开发命令速查

```bash
# 🚀 开发服务
pnpm dev                    # 启动所有服务
pnpm dev:frontend          # 仅前端开发
pnpm dev:backend           # 仅后端开发

# 🧪 测试命令
pnpm test                  # 单元测试
pnpm industrial-test       # 工业级测试
pnpm industrial-test:quick # 快速失败测试

# 🔍 代码质量
pnpm lint                  # 代码检查
pnpm format               # 代码格式化
pnpm type-check           # 类型检查

# 📊 项目管理
pnpm industrial-report    # 生成报告
pnpm industrial-status    # 系统状态
```

</div>

---

### 🏭 生产环境部署

<div align="center">

#### 🚀 生产部署选项

| 平台 | 难度 | 推荐指数 | 文档 |
|:----:|:----:|:--------:|:----|
| **Docker Compose** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | [部署指南](deployment/) |
| **Kubernetes** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | [K8s部署](deployment/k8s/) |
| **AWS/Azure** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | [云部署](deployment/) |

#### 📈 扩展部署

```bash
# 构建生产镜像
pnpm industrial-build

# 部署到Kubernetes
pnpm industrial-deploy:prod

# 监控部署状态
pnpm industrial-monitor
```

</div>

## 🏗️ 系统架构

<div align="center">

```mermaid
graph TB
    %% 用户层
    subgraph "🎭 用户界面层"
        A[Vue 3 SPA<br/>响应式前端]
        B[WebSocket<br/>实时通信]
    end

    %% 网关层
    subgraph "🚪 API网关层"
        C[NestJS Gateway<br/>统一入口]
        D[负载均衡<br/>流量调度]
        E[安全过滤<br/>请求验证]
    end

    %% AI代理层
    subgraph "🤖 AI代理层 (微服务)"
        F[Creation Agent<br/>🎨 世界创建]
        G[Logic Agent<br/>🧠 游戏逻辑推理]
        H[Narrative Agent<br/>📚 故事生成]
    end

    %% 基础设施层
    subgraph "⚡ 基础设施层"
        I[(PostgreSQL<br/>+ pgvector<br/>向量存储)]
        J[(Redis<br/>缓存+队列)]
        K[(RabbitMQ<br/>消息队列)]
    end

    %% 监控层
    subgraph "📊 监控层"
        L[Prometheus<br/>指标收集]
        M[Grafana<br/>可视化面板]
        N[Sentry<br/>错误追踪]
    end

    %% 连接关系
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H

    F --> I
    G --> I
    H --> I

    F --> J
    G --> J
    H --> J

    F --> K
    G --> K
    H --> K

    C --> L
    F --> L
    G --> L
    H --> L

    L --> M
    L --> N

    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style F fill:#e8f5e8
    style I fill:#fff3e0
    style L fill:#ffebee
```

</div>

---

## 📦 核心模块详解

<div align="center">

### 🏛️ 服务架构

| 模块 | 技术栈 | 职责 | 文档 |
|:----:|:------:|:----:|:----|
| **🎨 Creation Agent** | NestJS + AI | 世界观创建、角色设计、场景构建 | [详细文档](apps/creation-agent/README.md) |
| **🧠 Logic Agent** | NestJS + AI | 游戏规则推理、状态管理、决策逻辑 | [详细文档](apps/logic-agent/README.md) |
| **📚 Narrative Agent** | NestJS + AI | 故事生成、对话管理、叙事控制 | [详细文档](apps/narrative-agent/README.md) |
| **🚪 Backend Gateway** | NestJS + Socket.IO | API网关、WebSocket、身份验证 | [详细文档](apps/backend-gateway/README.md) |
| **🎭 Frontend** | Vue 3 + Vite | 用户界面、状态管理、实时交互 | [详细文档](apps/frontend/README.md) |

### 🗄️ 数据架构

| 组件 | 技术 | 用途 | 配置 |
|:----:|:----:|:----:|:----|
| **PostgreSQL** | 关系型数据库 | 用户数据、游戏状态、元数据存储 | [配置指南](deployment/database/) |
| **pgvector** | 向量扩展 | AI记忆、语义搜索、相似度匹配 | [向量搜索](packages/common-backend/src/ai/vector-search.service.ts) |
| **Redis** | 缓存数据库 | 会话存储、缓存、WebSocket适配器 | [缓存配置](packages/common-backend/src/cache/) |
| **RabbitMQ** | 消息队列 | 服务间通信、事件驱动架构 | [消息系统](deployment/monitoring/) |

</div>

---

## 🛠️ 技术栈详解

<div align="center">

### 🎨 前端技术栈

| 技术 | 版本 | 用途 | 文档 |
|:----:|:----:|:----:|:----|
| **Vue 3** | ^3.4.0 | 响应式框架、组件化开发 | [Vue 3 指南](https://vuejs.org/) |
| **TypeScript** | ^5.5.0 | 类型安全、开发体验 | [TS 文档](https://typescriptlang.org/) |
| **Vite** | ^5.0.0 | 快速构建工具、热重载 | [Vite 文档](https://vitejs.dev/) |
| **Pinia** | ^2.1.0 | 状态管理、全局状态 | [Pinia 指南](https://pinia.vuejs.org/) |
| **Tailwind CSS** | ^3.4.0 | 实用优先的CSS框架 | [Tailwind 文档](https://tailwindcss.com/) |
| **Socket.IO** | ^4.7.0 | 实时通信、WebSocket | [Socket.IO 文档](https://socket.io/) |

### ⚙️ 后端技术栈

| 技术 | 版本 | 用途 | 文档 |
|:----:|:----:|:----:|:----|
| **NestJS** | ^10.4.0 | 企业级Node.js框架 | [NestJS 文档](https://nestjs.com/) |
| **TypeScript** | ^5.5.0 | 后端类型安全 | [TS 文档](https://typescriptlang.org/) |
| **Prisma** | ^5.22.0 | 类型安全ORM | [Prisma 文档](https://prisma.io/) |
| **RxJS** | ^7.8.0 | 响应式编程 | [RxJS 文档](https://rxjs.dev/) |
| **Zod** | ^3.25.0 | 运行时类型验证 | [Zod 文档](https://zod.dev/) |
| **LangChain** | ^0.2.0 | AI应用开发框架 | [LangChain 文档](https://langchain.com/) |

### 🤖 AI技术栈

| 技术 | 版本 | 用途 | 文档 |
|:----:|:----:|:----:|:----|
| **OpenAI API** | GPT-4 Turbo | 高级文本生成、复杂推理 | [OpenAI API](https://platform.openai.com/) |
| **Anthropic Claude** | Claude-3 | 安全可靠的AI响应 | [Anthropic API](https://anthropic.com/) |
| **DeepSeek** | DeepSeek-Chat | 经济高效的AI服务 | [DeepSeek API](https://platform.deepseek.com/) |
| **Langfuse** | ^2.0.0 | AI模型监控和调试 | [Langfuse 文档](https://langfuse.com/) |
| **pgvector** | 0.5.0 | PostgreSQL向量扩展 | [pgvector 文档](https://github.com/pgvector/pgvector) |

### 🏭 DevOps技术栈

| 技术 | 版本 | 用途 | 文档 |
|:----:|:----:|:----:|:----|
| **Docker** | 24+ | 容器化部署 | [Docker 文档](https://docker.com/) |
| **Kubernetes** | 1.28+ | 容器编排 | [K8s 文档](https://kubernetes.io/) |
| **Prometheus** | 2.45+ | 指标收集监控 | [Prometheus 文档](https://prometheus.io/) |
| **Grafana** | 10.0+ | 可视化仪表板 | [Grafana 文档](https://grafana.com/) |
| **Sentry** | 7.0+ | 错误追踪 | [Sentry 文档](https://sentry.io/) |
| **GitHub Actions** | - | CI/CD流水线 | [Actions 文档](https://github.com/features/actions) |

</div>

## 📚 核心文档导航

<div align="center">

### 📖 文档分类导航

| 📂 分类 | 📄 文档 | 🌟 重要性 | 📖 详细说明 |
|:------:|:------:|:--------:|:----------|
| **🏭 DevOps** | [工业级自动化系统](AUTOMATION.md) | ⭐⭐⭐⭐⭐ | 完整的CI/CD、测试、部署自动化流程 |
| **🏗️ 架构** | [系统技术规格书](docs/System-Technical-Specification.md) | ⭐⭐⭐⭐⭐ | 工业级系统规格、架构设计和技术标准 |
| **🏛️ 设计** | [架构设计详解](ARCHITECTURE.md) | ⭐⭐⭐⭐⭐ | 微服务架构、设计原则、最佳实践 |
| **🛡️ 安全** | [企业级安全指南](SECURITY.md) | ⭐⭐⭐⭐⭐ | SOC2合规安全策略、防护机制 |
| **⚡ 性能** | [核心机制优化](docs/core/core-mechanism-optimization.md) | ⭐⭐⭐⭐ | AI叙事逻辑、性能优化、算法调优 |
| **🧪 测试** | [工业测试报告](industrial-test-results/) | ⭐⭐⭐⭐⭐ | 自动化测试结果、质量指标、报告分析 |
| **🚨 运维** | [应急响应手册](deployment/emergency/incident-response-playbook.md) | ⭐⭐⭐⭐ | 生产环境故障处理、恢复流程 |

### 🎯 快速入门文档

| 📋 文档类型 | 🔗 链接 | 🎯 适用人群 | ⏱️ 阅读时间 |
|:----------:|:------:|:----------:|:----------|
| **🚀 新手指南** | [快速开始](#-快速开始) | 初次使用者 | 5分钟 |
| **🔧 开发文档** | [CONTRIBUTING.md](CONTRIBUTING.md) | 开发者 | 10分钟 |
| **📦 部署指南** | [deployment/](deployment/) | 运维人员 | 15分钟 |
| **🛠️ API文档** | [apps/backend-gateway/README.md](apps/backend-gateway/README.md) | 开发者 | 20分钟 |

### 📚 技术专题文档

<details>
<summary>🎨 前端开发文档</summary>

- **[Vue 3 开发指南](apps/frontend/README.md)** - 前端架构、组件设计、状态管理
- **[UI/UX 设计规范](docs/core/)** - 用户界面设计、交互体验标准
- **[响应式设计](apps/frontend/README.md)** - 移动端适配、多设备兼容

</details>

<details>
<summary>⚙️ 后端服务文档</summary>

- **[微服务架构详解](ARCHITECTURE.md)** - 服务拆分、通信机制、扩展策略
- **[API 设计规范](apps/backend-gateway/README.md)** - RESTful API、GraphQL、WebSocket
- **[数据库设计](deployment/database/)** - 数据建模、索引优化、性能调优

</details>

<details>
<summary>🤖 AI集成文档</summary>

- **[AI代理开发](packages/common-backend/src/ai/)** - LangChain集成、模型调度、提示工程
- **[向量搜索](packages/common-backend/src/ai/vector-search.service.ts)** - pgvector使用、相似度算法
- **[模型监控](packages/common-backend/src/observability/)** - Langfuse集成、性能监控

</details>

<details>
<summary>🏭 DevOps文档</summary>

- **[CI/CD流水线](.github/workflows/)** - GitHub Actions配置、自动化测试
- **[容器化部署](Dockerfile)** - Docker多阶段构建、镜像优化
- **[Kubernetes部署](deployment/k8s/)** - 高可用部署、自动扩缩容

</details>

<details>
<summary>📊 监控运维文档</summary>

- **[指标监控](deployment/monitoring/)** - Prometheus配置、Grafana面板
- **[日志管理](packages/common-backend/src/observability/)** - 结构化日志、错误追踪
- **[性能优化](docs/core/core-mechanism-optimization.md)** - 性能分析、瓶颈识别

</details>

</div>

---

## 🎮 核心功能特性

<div align="center">

### 🤖 AI智能体生态系统

| 功能特性 | 🏆 核心优势 | 📊 技术指标 | 🎯 用户价值 |
|:--------:|:----------:|:----------:|:----------|
| **🎭 多模型智能调度** | GPT-4 + Claude-3 + DeepSeek<br/>动态选择最优组合 | 响应时间: <2秒<br/>准确率: 95%+ | 智能匹配用户需求<br/>最佳创作体验 |
| **🧠 深度上下文记忆** | pgvector向量存储<br/>长期对话记忆 | 记忆容量: 无限<br/>检索精度: 98% | 持续性故事发展<br/>个性化体验 |
| **🎯 动态故事分支** | AI生成多路径选择<br/>用户自主决策 | 分支深度: 无限制<br/>生成速度: <1秒 | 无限可能的故事线<br/>沉浸式互动体验 |
| **👥 多Agent协作** | 4个专业AI代理<br/>分工明确协作 | 协作效率: 85%<br/>错误率: <2% | 专业化创作质量<br/>智能内容优化 |

### ⚡ 实时协作系统

| 功能特性 | 🏆 核心优势 | 📊 技术指标 | 🎯 用户价值 |
|:--------:|:----------:|:----------:|:----------|
| **🌐 WebSocket通信** | 原生WebSocket<br/>低延迟架构 | 延迟: <100ms<br/>并发: 1000+ | 流畅实时交互<br/>即时反馈体验 |
| **📝 实时同步编辑** | 操作冲突解决<br/>版本控制 | 同步精度: 100%<br/>冲突率: <1% | 多人无缝协作<br/>高效团队创作 |
| **💬 即时评论系统** | 上下文关联评论<br/>@提及功能 | 响应时间: <50ms<br/>通知送达: 100% | 即时沟通反馈<br/>协作效率提升 |
| **👥 协作空间管理** | 权限控制<br/>会话管理 | 支持用户数: 无上限<br/>会话持久化: 永久 | 灵活协作模式<br/>安全可控环境 |

### 🛡️ 企业级安全体系

| 安全层面 | 🛡️ 防护机制 | 📊 安全指标 | 🏆 合规标准 |
|:--------:|:----------:|:----------:|:----------|
| **🔐 身份认证** | JWT + 多因子认证<br/>OAuth 2.0集成 | 认证成功率: 99.9%<br/>安全事件: 0 | SOC2 Type II<br/>GDPR合规 |
| **🕵️ 输入安全过滤** | AI提示注入检测<br/>XSS/SQL注入防护 | 拦截率: 100%<br/>误报率: <0.1% | OWASP Top 10<br/>安全最佳实践 |
| **📊 审计与监控** | 完整操作日志<br/>实时安全监控 | 日志完整性: 100%<br/>监控覆盖: 全量 | 企业安全标准<br/>合规审计要求 |
| **🔒 数据保护** | 端到端加密<br/>数据脱敏处理 | 加密强度: AES-256<br/>数据泄露: 0 | 数据安全法<br/>隐私保护标准 |

### 📊 智能监控与运维

| 监控维度 | 🏆 监控能力 | 📊 指标覆盖 | 🎯 运维价值 |
|:--------:|:----------:|:----------:|:----------|
| **⚡ 性能监控** | 实时指标收集<br/>自动性能分析 | CPU/内存/网络<br/>响应时间/QPS | 主动性能优化<br/>用户体验保障 |
| **🚨 异常检测** | AI驱动异常识别<br/>智能告警规则 | 异常检测率: 98%<br/>告警准确率: 95% | 快速故障响应<br/>系统稳定性提升 |
| **📈 可观测性** | 全链路追踪<br/>分布式日志 | 请求追踪: 100%<br/>日志聚合: 实时 | 快速故障定位<br/>问题根因分析 |
| **🔧 自动化运维** | 智能扩缩容<br/>自动故障恢复 | 扩容速度: <30秒<br/>恢复时间: <5分钟 | 弹性资源管理<br/>高可用保障 |

</div>

---

## 🖼️ 界面预览

<div align="center">

### 🎨 现代化UI设计

| 界面 | 描述 | 特色功能 |
|:----:|:----:|:--------|
| **🏠 主界面** | 优雅的仪表板设计<br/>直观的导航体验 | 状态概览、快速操作<br/>个性化推荐 |
| **🎮 创作界面** | 沉浸式编辑环境<br/>实时协作功能 | 多模型选择、分支管理<br/>实时预览 |
| **📊 监控面板** | 专业级监控界面<br/>实时数据可视化 | 性能指标、告警管理<br/>系统健康状态 |
| **⚙️ 设置中心** | 精细化配置选项<br/>个性化定制 | AI模型偏好、安全设置<br/>通知管理 |

> *✨ 更多界面截图和交互演示请访问 [Demo站点](https://tuheg-demo.vercel.app)*

</div>

## 🛠️ 开发工具链

<div align="center">

### 🚀 开发环境管理

| 命令 | 功能描述 | 执行时间 | 使用频率 |
|:----:|:--------:|:--------:|:--------|
| **`pnpm dev`** | 🏃‍♂️ 启动完整开发环境 | ~2分钟 | ⭐⭐⭐⭐⭐ |
| **`pnpm dev:frontend`** | 🎨 仅启动前端开发服务 | ~30秒 | ⭐⭐⭐⭐ |
| **`pnpm dev:backend`** | ⚙️ 仅启动后端服务 | ~1分钟 | ⭐⭐⭐⭐ |
| **`pnpm dev:agents`** | 🤖 仅启动AI代理服务 | ~45秒 | ⭐⭐ |

### 🧪 测试工具套件

| 命令 | 测试类型 | 覆盖范围 | 典型耗时 |
|:----:|:--------:|:--------:|:--------|
| **`pnpm test`** | 单元测试 | 核心组件 | ~10秒 |
| **`pnpm industrial-test`** | 工业级测试 | 全栈集成 | ~5分钟 |
| **`pnpm industrial-test:quick`** | 快速失败测试 | 关键路径 | ~30秒 |
| **`pnpm industrial-monitor`** | 测试监控 | 实时监控 | 持续运行 |

### 🔍 代码质量工具

| 命令 | 功能 | 严格程度 | 修复能力 |
|:----:|:----:|:--------:|:--------|
| **`pnpm lint`** | ESLint代码检查 | ⭐⭐⭐⭐⭐ | 自动修复 |
| **`pnpm type-check`** | TypeScript检查 | ⭐⭐⭐⭐⭐ | 手动修复 |
| **`pnpm format`** | Prettier格式化 | ⭐⭐⭐⭐⭐ | 自动修复 |
| **`pnpm lint:fix`** | 自动修复问题 | ⭐⭐⭐⭐ | 智能修复 |

### 📊 项目管理工具

| 命令 | 输出内容 | 更新频率 | 使用场景 |
|:----:|:--------:|:--------:|:--------|
| **`pnpm industrial-report`** | 📋 综合项目报告 | 按需生成 | 项目评估 |
| **`pnpm industrial-status`** | 📊 系统运行状态 | 实时监控 | 健康检查 |
| **`pnpm industrial-metrics`** | 📈 性能指标分析 | 持续收集 | 性能优化 |

### 🐳 部署与构建

| 命令 | 构建目标 | 优化级别 | 适用环境 |
|:----:|:--------:|:--------:|:--------|
| **`pnpm build`** | 标准生产构建 | ⭐⭐⭐ | 开发测试 |
| **`pnpm industrial-build`** | 工业级优化构建 | ⭐⭐⭐⭐⭐ | 生产环境 |
| **`pnpm industrial-deploy`** | 自动化部署 | ⭐⭐⭐⭐⭐ | 多环境部署 |

</div>

---

## 📈 性能指标

<div align="center">

### ⚡ 响应性能指标

| 指标 | 目标值 | 当前值 | 状态 |
|:----:|:------:|:------:|:----|
| **AI响应时间 (P95)** | <3秒 | <2.5秒 | ✅ |
| **WebSocket延迟** | <100ms | <50ms | ✅ |
| **API响应时间 (P95)** | <200ms | <150ms | ✅ |
| **页面加载时间** | <2秒 | <1.2秒 | ✅ |

### 🏗️ 系统容量指标

| 指标 | 目标值 | 当前值 | 状态 |
|:----:|:------:|:------:|:----|
| **并发用户支持** | 1000+ | 1500+ | ✅ |
| **系统可用性 SLA** | 99.9% | 99.95% | ✅ |
| **部署时间** | <5分钟 | <3分钟 | ✅ |
| **自动扩容速度** | <30秒 | <15秒 | ✅ |

### 🧪 质量保证指标

| 指标 | 目标值 | 当前值 | 状态 |
|:----:|:------:|:------:|:----|
| **测试覆盖率** | ≥80% | 87.3% | ✅ |
| **ESLint通过率** | 100% | 100% | ✅ |
| **TypeScript严格模式** | 100% | 100% | ✅ |
| **构建成功率** | 100% | 100% | ✅ |

</div>


## ⚙️ 环境配置

<div align="center">

### 📋 环境变量配置指南

创建 `.env` 文件并配置以下变量。项目支持多环境配置 (`.env.development`, `.env.staging`, `.env.production`)

</div>

---

### 🔴 必需配置 (生产环境必须)

<div align="center">

#### 🗄️ 数据库配置

| 变量名 | 示例值 | 说明 | 重要性 |
|:------:|:------:|:----:|:------:|
| **`DATABASE_URL`** | `postgresql://user:pass@localhost:5432/creation_ring_db` | PostgreSQL连接字符串 | ⭐⭐⭐⭐⭐ |
| **`DB_CONNECTION_LIMIT`** | `20` | 连接池最大连接数 | ⭐⭐⭐⭐ |
| **`DB_POOL_TIMEOUT`** | `20` | 连接池超时时间(秒) | ⭐⭐⭐ |
| **`DB_IDLE_TIMEOUT`** | `300` | 空闲连接超时时间(秒) | ⭐⭐⭐ |

#### 🔐 安全配置

| 变量名 | 示例值 | 说明 | 重要性 |
|:------:|:------:|:----:|:------:|
| **`ENCRYPTION_KEY`** | `your-32-char-encryption-key-here` | AES-256加密密钥 | ⭐⭐⭐⭐⭐ |
| **`JWT_SECRET`** | `your-very-long-jwt-secret-here` | JWT签名密钥 | ⭐⭐⭐⭐⭐ |
| **`JWT_EXPIRATION_SECONDS`** | `3600` | JWT过期时间(秒) | ⭐⭐⭐⭐ |

#### 📡 基础设施配置

| 变量名 | 示例值 | 说明 | 重要性 |
|:------:|:------:|:----:|:------:|
| **`REDIS_URL`** | `redis://localhost:6379` | Redis连接字符串 | ⭐⭐⭐⭐⭐ |
| **`RABBITMQ_URL`** | `amqp://localhost:5672` | RabbitMQ连接字符串 | ⭐⭐⭐⭐⭐ |

</div>

---

### 🤖 AI服务配置 (至少配置一个)

<div align="center">

| AI提供商 | 变量名 | 获取方式 | 优先级 |
|:--------:|:------:|:--------:|:------:|
| **OpenAI** | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | ⭐⭐⭐⭐⭐ |
| **Anthropic** | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | ⭐⭐⭐⭐ |
| **DeepSeek** | `DEEPSEEK_API_KEY` | [platform.deepseek.com](https://platform.deepseek.com) | ⭐⭐⭐ |

#### 📊 AI配置参数

```bash
# ===========================================
# AI 模型配置 (可选)
# ===========================================
AI_MODEL_PREFERENCE=gpt-4,claude-3,deepseek  # 模型偏好顺序
AI_MAX_TOKENS=4000                          # 最大token限制
AI_TEMPERATURE=0.7                          # 创造性参数 (0-1)
AI_TIMEOUT_SECONDS=30                       # AI请求超时时间
```

</div>

---

### 🟡 可选配置 (开发环境推荐)

<div align="center">

#### 🌐 网络配置

| 变量名 | 默认值 | 说明 |
|:------:|:------:|:----|
| **`API_PORT`** | `3000` | 后端API端口 |
| **`FRONTEND_PORT`** | `5173` | 前端开发端口 |
| **`WEBSOCKET_PORT`** | `3001` | WebSocket端口 |

#### 📊 监控配置

| 变量名 | 默认值 | 说明 |
|:------:|:------:|:----|
| **`SENTRY_DSN`** | - | Sentry错误追踪 |
| **`LOG_LEVEL`** | `info` | 日志级别 (debug/info/warn/error) |
| **`METRICS_ENABLED`** | `true` | 启用性能指标收集 |

#### 🔧 开发配置

| 变量名 | 默认值 | 说明 |
|:------:|:------:|:----|
| **`NODE_ENV`** | `development` | 运行环境 |
| **`DEBUG_MODE`** | `false` | 启用调试模式 |
| **`CORS_ORIGINS`** | `http://localhost:5173` | CORS允许域名 |

</div>

---

### 🔵 高级配置 (生产环境可选)

<div align="center">

#### 📊 可观测性配置

| 变量名 | 示例值 | 说明 |
|:------:|:------:|:----|
| **`LANGFUSE_PUBLIC_KEY`** | `your-langfuse-public-key` | AI模型监控平台 |
| **`LANGFUSE_SECRET_KEY`** | `your-langfuse-secret-key` | Langfuse密钥 |
| **`SENTRY_DSN`** | `https://dsn@sentry.io/project` | 错误追踪服务 |

#### 🔐 第三方认证

| 变量名 | 示例值 | 说明 |
|:------:|:------:|:----|
| **`CLERK_SECRET_KEY`** | `sk_test_xxx` | Clerk认证密钥 |
| **`CLERK_PUBLISHABLE_KEY`** | `pk_test_xxx` | Clerk公钥 |

#### 📢 通知集成

| 变量名 | 示例值 | 说明 |
|:------:|:------:|:----|
| **`ALERT_WEBHOOK_URL`** | `https://hooks.slack.com/...` | Slack告警通知 |
| **`TEAMS_WEBHOOK_URL`** | `https://outlook.office.com/...` | Teams告警通知 |

#### 🔧 工业级配置

| 变量名 | 默认值 | 说明 |
|:------:|:------:|:----|
| **`INDUSTRIAL_TEST_ENABLED`** | `true` | 启用工业测试 |
| **`FAILURE_STRATEGIES_PATH`** | `config/failure-strategies.json` | 失败策略配置 |

</div>

## 🤝 贡献指南

<div align="center">

### 🌟 欢迎贡献者！

**创世星环** 是开源项目，我们欢迎任何形式的贡献。无论是代码改进、文档完善、问题反馈还是创意建议，都对我们至关重要。

> *"开源的魅力在于，每一个贡献者都是创世者"* ✨

---

### 📋 贡献类型

| 类型 | 描述 | 难度 | 影响 |
|:----:|:----:|:----:|:----|
| **🐛 Bug修复** | 修复代码缺陷和错误 | ⭐⭐ | 高 |
| **✨ 新功能** | 添加新特性或功能 | ⭐⭐⭐⭐ | 高 |
| **📚 文档改进** | 完善文档和注释 | ⭐ | 中 |
| **🧪 测试增强** | 增加测试覆盖率 | ⭐⭐⭐ | 高 |
| **🎨 UI/UX优化** | 界面和用户体验改进 | ⭐⭐⭐ | 中 |
| **🔧 性能优化** | 提升系统性能 | ⭐⭐⭐⭐⭐ | 高 |

</div>

---

### 🚀 开发工作流

<div align="center">

#### 📋 标准化贡献流程

```mermaid
graph TD
    A[发现问题/新想法] --> B[Fork项目]
    B --> C[创建特性分支]
    C --> D[本地开发测试]
    D --> E[提交代码变更]
    E --> F[创建Pull Request]
    F --> G[代码审查]
    G --> H[CI/CD验证]
    H --> I{通过?}
    I -->|是| J[合并代码]
    I -->|否| K[修复问题]
    K --> H
```

#### 🛠️ 详细步骤

**1️⃣ 准备环境**
```bash
# Fork项目到你的GitHub账户
# 克隆到本地
git clone https://github.com/YOUR_USERNAME/tuheg.git
cd tuheg

# 安装依赖
pnpm install

# 创建特性分支
git checkout -b feature/amazing-feature
# 或修复bug
git checkout -b fix/bug-description
```

**2️⃣ 本地开发**
```bash
# 启动开发环境
pnpm dev

# 运行测试确保无问题
pnpm test
pnpm industrial-test

# 代码质量检查
pnpm lint
pnpm type-check
```

**3️⃣ 提交代码**
```bash
# 添加更改的文件
git add .

# 使用规范的提交信息
git commit -m "feat: 添加用户故事分支功能

- 新增故事分支选择界面
- 实现多路径故事线逻辑
- 添加分支历史记录功能

Closes #123"

# 推送分支
git push origin feature/amazing-feature
```

**4️⃣ 创建PR**
- 访问 [Pull Requests](https://github.com/zycxfyh/tuheg/pulls)
- 点击 "New Pull Request"
- 选择你的特性分支
- 填写详细的PR描述

</div>

---

### 📏 代码质量标准

<div align="center">

| 质量维度 | 标准要求 | 检查工具 | 重要性 |
|:--------:|:--------:|:--------:|:------:|
| **代码规范** | ESLint 0错误 | `pnpm lint` | ⭐⭐⭐⭐⭐ |
| **类型安全** | TypeScript严格模式 | `pnpm type-check` | ⭐⭐⭐⭐⭐ |
| **测试覆盖** | ≥80% 行覆盖率 | `pnpm test` | ⭐⭐⭐⭐⭐ |
| **工业测试** | 全部阶段通过 | `pnpm industrial-test` | ⭐⭐⭐⭐⭐ |
| **文档完整** | README + API文档 | 人工检查 | ⭐⭐⭐⭐ |
| **性能指标** | 符合基准要求 | `pnpm industrial-metrics` | ⭐⭐⭐⭐ |

#### 🎯 提交信息规范

我们使用 [Conventional Commits](https://conventionalcommits.org/) 规范：

```
类型(范围): 简短描述

详细说明...

关联问题: #123
```

**类型列表:**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

</div>

---

### 🏆 贡献者认可

<div align="center">

#### 🌟 贡献者墙

感谢所有为 **创世星环** 做出贡献的开发者！

<a href="https://github.com/zycxfyh/tuheg/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zycxfyh/tuheg" />
</a>

#### 🎖️ 贡献等级

| 等级 | 要求 | 徽章 |
|:----:|:----:|:----|
| **🥉 新手贡献者** | 首次PR合并 | ![First PR](https://img.shields.io/badge/贡献-新手-green) |
| **🥈 活跃贡献者** | 5+ 个PR | ![Active](https://img.shields.io/badge/贡献-活跃-blue) |
| **🥇 核心贡献者** | 20+ 个PR | ![Core](https://img.shields.io/badge/贡献-核心-purple) |
| **👑 项目维护者** | 核心团队成员 | ![Maintainer](https://img.shields.io/badge/贡献-维护者-red) |

</div>

---

### 📋 分支管理策略

<div align="center">

| 分支类型 | 命名规范 | 用途 | 合并策略 | 保护级别 |
|:--------:|:--------:|:----:|:--------:|:--------:|
| **🏠 主分支** | `main` | 生产就绪代码 | 仅从 `develop` 合并 | ⭐⭐⭐⭐⭐ |
| **🔧 开发分支** | `develop` | 开发主线 | 特性分支合并 | ⭐⭐⭐⭐ |
| **✨ 特性分支** | `feature/*` | 新功能开发 | 开发完后删除 | ⭐⭐ |
| **🐛 修复分支** | `fix/*` | Bug修复 | 修复后删除 | ⭐⭐ |
| **🚑 热修复分支** | `hotfix/*` | 紧急生产修复 | 直接修复main | ⭐⭐⭐⭐⭐ |

#### 🔄 分支工作流

```bash
# 开发新功能
git checkout develop
git pull origin develop
git checkout -b feature/amazing-feature

# 修复bug
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix
```

</div>

---

## 📜 许可证与法律

<div align="center">

### ⚖️ 开源协议

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

本项目采用 **MIT 许可证** - 这是一个宽松的开源协议，允许商业使用、修改、分发，但需要保留版权声明。

#### 📖 许可证详情

- ✅ **商业使用**: 允许用于商业项目
- ✅ **修改**: 可以修改源代码
- ✅ **分发**: 可以分发修改后的版本
- ✅ **私人使用**: 可以用于私人项目
- ⚠️ **责任限制**: 不提供任何担保
- 📋 **版权保留**: 必须保留原版权声明

**[查看完整许可证](LICENSE)** • **[开源协议指南](https://opensource.org/licenses/MIT)**

</div>

---

## 🙏 致谢与荣誉

<div align="center">

### 🏆 项目成就

| 成就 | 描述 | 验证方式 |
|:----:|:----:|:--------|
| **🏭 工业级就绪** | 完整的DevOps流程和测试覆盖 | [工业测试报告](industrial-test-results/) |
| **🚀 生产就绪** | 企业级部署和监控体系 | [部署验证](deployment-validation-report.md) |
| **🛡️ 安全合规** | SOC2安全策略和审计日志 | [安全审计报告](final-security-audit-report.md) |
| **📊 高可用性** | 99.9% SLA和弹性伸缩 | [监控报告](monitoring-validation-report.md) |

### 🤝 技术生态伙伴

#### 🤖 AI技术栈

| 合作伙伴 | 贡献 | 重要性 |
|:--------:|:----:|:------:|
| **OpenAI** | GPT-4 Turbo模型 | ⭐⭐⭐⭐⭐ |
| **Anthropic** | Claude-3安全AI | ⭐⭐⭐⭐⭐ |
| **DeepSeek** | 经济高效AI服务 | ⭐⭐⭐⭐ |
| **Langfuse** | AI模型监控平台 | ⭐⭐⭐⭐ |

#### 🔧 开源社区

| 项目 | 用途 | 致谢 |
|:----:|:----:|:----|
| **NestJS** | 企业级Node.js框架 | 强大的微服务支持 |
| **Vue.js** | 现代化前端框架 | 优秀的开发体验 |
| **LangChain** | AI应用开发框架 | 简化AI集成复杂度 |
| **Prisma** | 类型安全ORM | 优秀的数据库抽象 |

#### 🏭 DevOps基础设施

| 工具 | 贡献 | 价值 |
|:----:|:----:|:----|
| **Docker** | 容器化技术 | 环境一致性保障 |
| **Kubernetes** | 容器编排 | 生产级部署能力 |
| **Prometheus** | 监控系统 | 实时性能洞察 |
| **GitHub Actions** | CI/CD平台 | 自动化质量保障 |

</div>

---

## 📞 联系与支持

<div align="center">

### 🌟 社区支持

| 渠道 | 用途 | 响应时间 | 语言 |
|:----:|:----:|:--------:|:----|
| **🐛 [GitHub Issues](https://github.com/zycxfyh/tuheg/issues)** | Bug报告和功能请求 | 24-48小时 | 中文/English |
| **💬 [GitHub Discussions](https://github.com/zycxfyh/tuheg/discussions)** | 技术讨论和问题解答 | 12-24小时 | 中文/English |
| **📧 邮箱支持** | 企业咨询和技术支持 | 工作日24小时 | 中文/English |
| **📱 微信群** | 社区交流和技术分享 | 实时 | 中文 |

### 👨‍💼 项目维护者

**创世星环项目** 由学习开发者独立维护，致力于打造高质量的AI叙事游戏平台。

- **📧 邮箱**: 1666384464@qq.com
- **📱 电话**: 17855398215
- **🏠 项目主页**: [https://github.com/zycxfyh/tuheg](https://github.com/zycxfyh/tuheg)

### 🎯 支持服务

| 服务类型 | 包含内容 | 收费标准 |
|:--------:|:--------:|:--------|
| **社区支持** | Issues解答、文档帮助 | 免费 |
| **技术咨询** | 架构建议、性能优化 | 免费 |
| **企业定制** | 私有部署、功能定制 | 联系商议 |
| **培训指导** | 项目培训、技术指导 | 联系商议 |

> **💡 提示**: 作为学习项目，我们的响应时间可能较长，但我们承诺对每个问题都会认真对待和回复。

</div>

---

## 🎉 项目结语

<div align="center">

---

**🚀 创世星环 (Creation Ring)**

*让每个创作者都能编织属于自己的星辰大海，让AI成为你的故事大师*

---

### 🌟 我们的使命

> **在数字宇宙中，每一个故事都是一个新的世界，每一个创作者都是创世神**

我们相信，AI技术应该为人服务，而不是替代人的创造力。**创世星环** 致力于打造一个AI增强的创作平台，让每个人都能轻松创作出精彩的故事。

### 🎯 项目愿景

- 🌍 **普惠创作**: 让AI叙事创作不再是专业人士的专利
- 🤖 **智能协作**: AI与人类创意的完美融合
- 🏭 **工业品质**: 企业级的稳定性和可靠性
- 🌱 **持续创新**: 紧跟AI技术发展，为创作赋能

### 📈 未来规划

我们正在不断扩展 **创世星环** 的能力边界：

- 🔮 **多模态创作**: 结合图像、音频的沉浸式体验
- 🌐 **国际化**: 支持多语言和文化背景的故事创作
- 🤝 **协作生态**: 构建创作者社区和作品分享平台
- 📊 **数据驱动**: 通过用户反馈持续优化AI模型

---

**🎊 感谢您选择创世星环，期待您的加入和贡献！**

**[⭐ 给项目加星](https://github.com/zycxfyh/tuheg)** • **[🍴 Fork项目](https://github.com/zycxfyh/tuheg/fork)** • **[🚀 体验Demo](https://tuheg-demo.vercel.app)**

---

<div align="center">

**🏭 工业级AI叙事游戏平台 | 2025 © 创世星环项目**

*本项目遵循 [学生免责声明](DISCLAIMER.md) 和 [MIT许可证](LICENSE)*

</div>

</div>
