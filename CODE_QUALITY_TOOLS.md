# 代码质量工具集成指南

## 🎯 概述

本项目集成了来自GitHub优秀开源项目的现代化代码质量工具，提供全面的代码检查、格式化和自动修复功能。

## 🛠️ 集成工具

### 1. Biome (推荐替代ESLint + Prettier)
- **来源**: https://github.com/biomejs/biome
- **功能**: 超高速的代码检查、格式化和import排序
- **优势**: 比ESLint+Prettier组合快10-100倍

### 2. Husky + lint-staged
- **Husky**: https://github.com/typicode/husky
- **lint-staged**: https://github.com/lint-staged/lint-staged
- **功能**: Git hooks自动化，只检查staged文件

### 3. commitlint
- **来源**: https://github.com/conventional-changelog/commitlint
- **功能**: 规范Git提交信息格式

## 📋 可用脚本

### 代码检查和修复

```bash
# Biome检查
pnpm lint              # 检查代码问题
pnpm lint:fix          # 自动修复代码问题
pnpm lint:strict       # 严格检查（无警告容忍）

# Biome格式化
pnpm format            # 格式化代码
pnpm format:check      # 检查格式化是否正确

# 综合修复
pnpm fix               # 修复+格式化
pnpm fix:all           # 修复+格式化+import排序
pnpm organize-imports  # 只排序imports

# 自动修复工具
pnpm auto-fix          # 智能自动修复（推荐）
pnpm auto-fix:all      # 修复所有工具（包括ESLint/Prettier）
pnpm auto-fix:check    # 只检查不修复
pnpm auto-fix:staged   # 只修复staged文件
```

### Git提交规范

提交信息必须遵循 [Conventional Commits](https://conventionalcommits.org/) 格式：

```bash
# 正确示例
feat: 添加用户登录功能
fix: 修复登录按钮点击无响应的问题
docs: 更新README安装说明
style: 调整按钮样式
refactor: 重构用户认证模块
test: 添加用户登录测试用例
chore: 更新依赖版本

# 错误示例
修复bug                    # ❌ 缺少类型
feat 登录功能              # ❌ 缺少冒号
登录功能已完成             # ❌ 不符合规范
```

## 🔧 配置说明

### Biome配置 (`biome.json`)

```json
{
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "useConst": "error",
        "useImportType": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### lint-staged配置

在`package.json`中配置，只对staged文件运行检查：

```json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx,json,css,scss,html,vue}": [
      "npx biome check --write --no-errors-on-unmatched",
      "npx biome format --write --no-errors-on-unmatched"
    ],
    "*.{js,ts,jsx,tsx}": [
      "npx biome check --write --no-errors-on-unmatched"
    ]
  }
}
```

### commitlint配置 (`commitlint.config.js`)

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100]
  }
};
```

## 🚀 使用流程

### 开发时

1. **编写代码**
2. **运行自动修复**: `pnpm auto-fix`
3. **检查结果**: `pnpm lint && pnpm format:check`
4. **提交代码**: `git add . && git commit -m "feat: 功能描述"`

### Git提交时

pre-commit hook会自动运行：
1. lint-staged检查staged文件
2. Biome自动修复问题
3. 格式化代码
4. commit-msg检查提交信息格式

## 🎛️ 高级配置

### 自定义Biome规则

在`biome.json`中修改：

```json
{
  "linter": {
    "rules": {
      "style": {
        "noNonNullAssertion": "off"  // 允许非空断言
      },
      "suspicious": {
        "noExplicitAny": "warn"     // any类型警告而不是错误
      }
    }
  }
}
```

### 忽略文件

创建`.biomeignore`文件：

```
node_modules/
dist/
build/
coverage/
*.spec.ts
*.test.ts
```

### CI/CD集成

在GitHub Actions中使用：

```yaml
- name: Run Biome
  run: pnpm lint && pnpm format:check

- name: Run commitlint
  run: npx commitlint --from HEAD~1 --to HEAD --verbose
```

## 🔍 故障排除

### Biome命令找不到

确保使用`npx biome`而不是直接`biome`

### pre-commit hook不工作

检查`.husky`目录和权限：
```bash
ls -la .husky/
chmod +x .husky/*
```

### commitlint报错

检查提交信息格式，参考Conventional Commits规范

## 📚 相关链接

- [Biome官方文档](https://biomejs.dev/)
- [Conventional Commits](https://conventionalcommits.org/)
- [Husky文档](https://typicode.github.io/husky/)
- [lint-staged文档](https://github.com/lint-staged/lint-staged)
- [commitlint文档](https://commitlint.js.org/)

## 🤝 贡献指南

1. 遵循代码规范：运行`pnpm auto-fix`自动修复
2. 提交前检查：`pnpm lint && pnpm format:check`
3. 提交信息规范：使用`feat:`, `fix:`, `docs:`等类型
4. 保持工具更新：定期检查Biome和相关依赖版本
