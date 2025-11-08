# 贡献指南

感谢您对创世星环项目的兴趣！我们欢迎各种形式的贡献。

## 🚀 快速开始

### 开发环境设置

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd creation-ring
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **启动开发环境**

   ```bash
   pnpm dev
   ```

### 提交更改

我们使用 [Conventional Commits](https://conventionalcommits.org/) 规范：

```bash
# 功能
git commit -m "feat: add new feature"

# 修复
git commit -m "fix: resolve bug"

# 文档
git commit -m "docs: update documentation"

# 样式
git commit -m "style: format code"

# 重构
git commit -m "refactor: restructure code"

# 测试
git commit -m "test: add test cases"

# 构建
git commit -m "build: update build configuration"
```

## 🧪 测试

### 运行测试

```bash
# 单元测试
pnpm test

# 工业级测试套件
pnpm industrial-test

# 快速失败测试
pnpm industrial-test:quick
```

### 测试标准

- ✅ 所有测试必须通过
- ✅ 代码覆盖率不低于80%
- ✅ ESLint检查通过
- ✅ TypeScript类型检查通过

## 📝 代码规范

### TypeScript/JavaScript

- 使用 TypeScript 进行开发
- 遵循 ESLint 配置
- 使用 Prettier 格式化代码

### 提交信息

- 使用英文提交信息
- 遵循 Conventional Commits 规范
- 提交信息清晰明了

### 分支管理

- `main`: 主分支，生产就绪代码
- `develop`: 开发主分支
- `feature/*`: 新功能分支
- `fix/*`: 修复分支
- `docs/*`: 文档分支

## 🔒 安全

### 报告安全漏洞

如果您发现安全漏洞，请通过以下方式报告：

- 发送邮件至项目维护者
- 在GitHub Issues中标记为安全问题（不要公开细节）

### 安全编码实践

- 永远不要提交敏感信息（如API密钥）
- 使用环境变量管理配置
- 遵循OWASP安全指南

## 📚 文档

### 更新文档

- 修改相关文档以反映代码更改
- 使用清晰简洁的语言
- 提供必要的示例

### 文档标准

- 使用 Markdown 格式
- 保持文档结构清晰
- 及时更新过时的信息

## 🤝 行为准则

### 尊重他人

- 保持友好的沟通
- 尊重不同的观点和经验
- 包容所有贡献者

### 专业性

- 保持专业和建设性的反馈
- 避免侮辱性或贬低性言论
- 专注于技术讨论

## 📞 联系我们

- **邮箱**: <1666384464@qq.com>
- **电话**: 17855398215
- **GitHub Issues**: 用于技术问题和功能请求

## 🙏 感谢

感谢所有为这个项目做出贡献的开发者！您的贡献让这个项目变得更好。
