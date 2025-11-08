# 🤝 贡献指南

欢迎来到创世星环项目！我们非常感谢您对这个开源项目的贡献。

## 📋 目录

- [快速开始](#快速开始)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试](#测试)
- [文档](#文档)
- [问题报告](#问题报告)
- [功能请求](#功能请求)
- [行为准则](#行为准则)

## 🚀 快速开始

### 1. Fork 项目
点击右上角的 "Fork" 按钮创建你的副本。

### 2. 克隆到本地
```bash
git clone https://github.com/YOUR_USERNAME/tuheg.git
cd tuheg
```

### 3. 安装依赖
```bash
pnpm install
```

### 4. 启动开发环境
```bash
pnpm run dev
```

### 5. 创建特性分支
```bash
git checkout -b feature/your-feature-name
```

## 🛠️ 开发环境设置

### 系统要求
- Node.js ≥18.0.0
- pnpm ≥8.0.0
- Docker ≥20.10 (可选，用于完整环境)

### 推荐工具
- **VS Code** - 主力编辑器
- **Biome** - 代码格式化和检查
- **Nx Console** - Nx工作区管理
- **Docker Desktop** - 容器化开发

### 环境变量
复制 `.env.example` 到 `.env` 并配置你的环境变量：

```bash
cp .env.example .env
```

## 📝 代码规范

### TypeScript/JavaScript
- 使用 TypeScript 进行类型安全
- 使用 Biome 进行代码格式化
- 遵循 ESLint 配置的规则

### Vue.js
- 使用 Composition API
- 使用 `<script setup>` 语法
- 使用 TypeScript 进行组件定义

### 提交信息格式
```
type(scope): description

[optional body]

[optional footer]
```

**类型 (Type)**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码风格调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或工具配置

**示例**:
```
feat(auth): add Google OAuth login

Add support for Google OAuth 2.0 authentication flow.
User can now login using their Google account.

Closes #123
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行特定应用的测试
pnpm nx test frontend

# 监听模式
pnpm test:watch
```

### 测试覆盖率
```bash
pnpm test:coverage
```

### E2E 测试
```bash
pnpm nx e2e frontend
```

## 📚 文档

### 文档类型
- **README**: 项目概述和快速开始
- **API文档**: 自动生成，使用 OpenAPI/Swagger
- **架构文档**: 系统设计和组件说明
- **用户指南**: 功能使用说明

### 更新文档
```bash
# 生成 API 文档
pnpm run docs:api

# 构建文档站点
pnpm run docs:build
```

## 🐛 问题报告

### Bug 报告模板
请使用 [Bug Report Template](.github/ISSUE_TEMPLATE/bug-report.yml) 创建问题报告。

**优秀的问题报告包含**:
- 清晰的标题
- 详细的复现步骤
- 期望的行为 vs 实际行为
- 环境信息 (OS, Node版本等)
- 相关的日志或截图

### 调试技巧
```bash
# 启用调试日志
DEBUG=* pnpm run dev

# 查看应用日志
docker-compose logs -f
```

## ✨ 功能请求

### 功能请求模板
请使用 [Feature Request Template](.github/ISSUE_TEMPLATE/feature-request.yml) 提出功能建议。

**优秀的功能请求包含**:
- 清晰的标题和描述
- 使用场景和用户故事
- 建议的实现方式
- 相关的mockups或原型

## 🎯 开发路线图

### 当前优先级
1. **多Agent协作优化** - 提升Agent间通信效率
2. **插件系统完善** - VCPToolBox SDK开发
3. **用户界面改进** - 响应式设计和无障碍支持
4. **性能优化** - 加载速度和内存使用

### 如何贡献
- 查看 [Issues](../../issues) 中的 `good first issue` 标签
- 查看 [Projects](../../projects) 中的开发计划
- 参与 [Discussions](../../discussions) 讨论

## 🔧 工具和脚本

### 常用命令
```bash
# 代码检查
pnpm lint
pnpm lint:fix

# 格式化
pnpm format
pnpm format:check

# 构建
pnpm build
pnpm build:all

# 清理
pnpm clean
```

### Nx 工作区
```bash
# 查看项目依赖图
pnpm nx graph

# 运行特定任务
pnpm nx run frontend:build

# 受影响的项目
pnpm nx affected:build
```

## 📋 审查流程

### Pull Request 要求
1. **通过所有检查**: CI/CD, 测试, 代码质量
2. **有意义的提交信息**: 遵循提交规范
3. **更新文档**: 如有必要
4. **添加测试**: 新功能需要测试覆盖

### 审查要点
- ✅ 代码质量和规范
- ✅ 测试覆盖率
- ✅ 文档完整性
- ✅ 性能影响
- ✅ 安全考虑

## 🌍 国际化 (i18n)

### 添加新语言
1. 在 `apps/frontend/src/i18n/locales/` 创建新文件
2. 更新 `apps/frontend/src/i18n/index.ts`
3. 添加语言切换支持

### 更新翻译
- 编辑对应的语言文件
- 运行测试确保翻译完整性

## 🔒 安全

### 安全漏洞
- 请勿在公开问题中讨论安全漏洞
- 发送邮件至 security@creation-ring.dev
- 或使用 GitHub Security Advisories

### 安全最佳实践
- 不要提交敏感信息 (API密钥, 密码等)
- 使用环境变量存储配置
- 定期更新依赖包

## 📞 支持

### 获取帮助
- 📖 [文档](docs/)
- 💬 [GitHub Discussions](../../discussions)
- 🐛 [Issues](../../issues)
- 💬 [Discord](https://discord.gg/creation-ring)

### 联系维护者
- 📧 项目维护者: maintainers@creation-ring.dev
- 📧 技术支持: support@creation-ring.dev

## 🎉 致谢

感谢所有贡献者的辛勤工作！您的贡献让创世星环变得更好。

### 贡献者墙
查看 [Contributors](../../graphs/contributors) 页面

### 赞助商
如果您喜欢这个项目，考虑 [赞助我们](../../sponsors)

---

## 📜 行为准则

请阅读我们的 [行为准则](CODE_OF_CONDUCT.md) 了解社区规范。

**简而言之**: 尊重他人，建设性反馈，包容开放。

---

感谢您对创世星环的贡献！🚀