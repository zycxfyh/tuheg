# 📐 系统架构文档中心

## 📋 概述

系统架构文档中心提供创世星环项目的完整技术架构视图，涵盖系统设计原则、组件架构、数据流、部署架构、安全架构等各个方面。

## 📁 文档结构

### 🏛️ 架构设计 (Architecture Design)

- **[SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md)** - 系统整体架构设计
- **[MICROSERVICES-ARCHITECTURE.md](./MICROSERVICES-ARCHITECTURE.md)** - 微服务架构详解
- **[DATA-ARCHITECTURE.md](./DATA-ARCHITECTURE.md)** - 数据架构设计
- **[EVENT-DRIVEN-ARCHITECTURE.md](./EVENT-DRIVEN-ARCHITECTURE.md)** - 事件驱动架构

### 🔧 技术架构 (Technical Architecture)

- **[TECHNOLOGY-STACK.md](./TECHNOLOGY-STACK.md)** - 技术栈选择和架构
- **[API-ARCHITECTURE.md](./API-ARCHITECTURE.md)** - API架构设计
- **[SECURITY-ARCHITECTURE.md](./SECURITY-ARCHITECTURE.md)** - 安全架构
- **[PERFORMANCE-ARCHITECTURE.md](./PERFORMANCE-ARCHITECTURE.md)** - 性能架构

### 🚀 部署架构 (Deployment Architecture)

- **[DEPLOYMENT-ARCHITECTURE.md](./DEPLOYMENT-ARCHITECTURE.md)** - 部署架构设计
- **[SCALING-ARCHITECTURE.md](./SCALING-ARCHITECTURE.md)** - 扩展架构
- **[MONITORING-ARCHITECTURE.md](./MONITORING-ARCHITECTURE.md)** - 监控架构

### 📊 架构决策记录 (Architecture Decision Records)

- **[ADRs/](./ADRs/)** - 架构决策记录目录
  - [ADR-001: 微服务架构选择](./ADRs/ADR-001-microservices-choice.md)
  - [ADR-002: 事件驱动设计](./ADRs/ADR-002-event-driven-design.md)
  - [ADR-003: AI服务抽象层](./ADRs/ADR-003-ai-service-abstraction.md)

## 🗺️ 架构图索引

### 系统层级架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    🎨 创世星环系统架构图                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                用户界面层 (UI Layer)               │   │
│  │  Frontend (Vue 3 + WebSocket)                      │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                       │
│  ┌─────────────────┼─────────────────────────────────────┐ │
│  │            API网关层 (API Gateway Layer)            │ │
│  │  Backend Gateway (NestJS + Auth + WebSocket)        │ │
│  └─────────────────┼─────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼─────────────────────────────────────┐ │
│  │          业务服务层 (Business Services Layer)        │ │
│  │  ┌─────────────┼─────────────┐ ┌─────────────────┐  │ │
│  │  │  Creation   │  Logic      │ │   Narrative     │  │ │
│  │  │  Agent      │  Agent      │ │   Agent         │  │ │
│  │  └─────────────┼─────────────┘ └─────────────────┘  │ │
│  │                │                                     │ │
│  │          ┌─────┼─────┐                               │ │
│  │          │ DLQ      │                               │ │
│  │          │ Consumer │                               │ │
│  │          └───────────┘                               │ │
│  └─────────────────┼─────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼─────────────────────────────────────┐ │
│  │         共享服务层 (Shared Services Layer)           │ │
│  │  ┌─────────────┼─────────────┐ ┌─────────────────┐  │ │
│  │  │  Common     │  AI         │ │   Game          │  │ │
│  │  │  Backend    │  Services   │ │   Core          │  │ │
│  │  └─────────────┼─────────────┘ └─────────────────┘  │ │
│  │         ┌──────┼──────┐ ┌─────┐                      │ │
│  │         │ Shared      │ │ VCP │                      │ │
│  │         │ Types       │ │ SDK │                      │ │
│  │         └─────────────┘ └─────┘                      │ │
│  └─────────────────┼─────────────────────────────────────┘ │
│                    │                                       │
│  ┌─────────────────┼─────────────────────────────────────┐ │
│  │            数据存储层 (Data Layer)                   │ │
│  │  PostgreSQL + Redis + RabbitMQ + Qdrant             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               基础设施层 (Infrastructure)              │ │
│  │  Docker + Kubernetes + Monitoring + CI/CD            │ │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 数据流架构图

```
用户请求 → Frontend → Backend Gateway → Message Queue → AI Agents
    ↓             ↓             ↓               ↓             ↓
   UI更新 ← WebSocket ← 实时推送 ← 事件总线 ← 业务处理结果
```

## 🏗️ 架构原则

### 设计原则

1. **模块化设计** - 每个组件职责单一，便于维护和扩展
2. **松耦合架构** - 服务间通过消息队列和事件总线通信
3. **可扩展性** - 支持水平扩展和功能扩展
4. **容错性** - 完善的错误处理和降级策略

### 技术原则

1. **微服务架构** - 服务拆分，独立部署和扩展
2. **事件驱动** - 异步通信，提高系统响应性
3. **API优先** - RESTful API设计，版本控制
4. **云原生** - 容器化部署，自动化运维

## 📖 阅读指南

### 新手入门

1. **[SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md)** - 了解系统整体架构
2. **[MICROSERVICES-ARCHITECTURE.md](./MICROSERVICES-ARCHITECTURE.md)** - 深入微服务设计
3. **[DATA-ARCHITECTURE.md](./DATA-ARCHITECTURE.md)** - 理解数据流和存储

### 深入学习

1. **技术架构系列** - 了解具体技术实现
2. **部署架构系列** - 掌握部署和扩展策略
3. **ADR系列** - 理解架构决策过程

### 贡献指南

- 修改架构前请查阅相关ADR
- 重大架构变更需要更新相应文档
- 新功能需要评估对现有架构的影响

## 🔄 文档维护

### 更新频率

- **架构文档**: 重大架构变更时更新
- **技术文档**: 新技术引入或技术栈升级时更新
- **部署文档**: 部署策略变更时更新

### 维护责任

- **架构师**: 负责架构文档的准确性和完整性
- **技术负责人**: 负责技术选型的文档化
- **运维团队**: 负责部署和监控文档

## 📞 相关链接

- [项目主文档](../../README.md)
- [开发文档](../development/)
- [API文档](../api/)
- [部署文档](../../deployment/)

---

**📝 文档维护**: 请在修改架构时同步更新此文档
