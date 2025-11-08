# 🔧 GitHub 配置

这个目录包含了创世星环项目的 GitHub 配置和自动化工作流。

## 📁 目录结构

```
.github/
├── workflows/              # GitHub Actions 工作流
│   ├── ci-cd.yml          # CI/CD 流水线
│   ├── security-audit.yml # 安全审计
│   └── testing.yml        # 测试工作流
├── ISSUE_TEMPLATE/        # Issue 模板
│   ├── bug-report.md      # Bug 报告模板
│   └── feature-request.md # 功能请求模板
├── PULL_REQUEST_TEMPLATE.md # PR 模板
├── CODEOWNERS            # 代码所有者
└── dependabot.yml        # 依赖更新配置
```

## 🚀 GitHub Actions 工作流

### CI/CD 流水线 (`ci-cd.yml`)

- **触发条件**: push 到 main 分支, PR
- **功能**:
  - 代码质量检查 (ESLint, Prettier)
  - 类型检查 (TypeScript)
  - 单元测试和集成测试
  - 构建和部署

### 安全审计 (`security-audit.yml`)

- **触发条件**: 每日定时, 依赖变更
- **功能**:
  - 依赖安全扫描
  - 代码安全分析
  - 漏洞检测

### 测试工作流 (`testing.yml`)

- **触发条件**: PR, 手动触发
- **功能**:
  - 端到端测试
  - 性能测试
  - 负载测试

## 📋 Issue 和 PR 模板

### Issue 模板

- **Bug Report**: 标准化的bug报告格式
- **Feature Request**: 功能请求模板

### PR 模板

包含变更类型、测试状态、相关链接等必填字段。

## 👥 CODEOWNERS

定义了不同代码区域的维护责任人，自动分配审查者。

## 🔄 Dependabot

自动更新依赖包的安全补丁和版本升级。

## 📝 使用指南

### 添加新的工作流

1. 在 `workflows/` 目录创建新的 `.yml` 文件
2. 遵循命名约定: `feature-name.yml`
3. 添加适当的触发条件和权限

### 修改模板

1. 编辑相应的模板文件
2. 使用 GitHub 的模板语法
3. 测试模板是否正确渲染

### 配置 Dependabot

1. 编辑 `dependabot.yml`
2. 添加新的依赖生态系统
3. 设置更新频率和目标分支
