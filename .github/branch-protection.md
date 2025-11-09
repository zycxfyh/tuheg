# 分支保护策略 (Branch Protection Rules)

## 主要分支保护规则

### `main` 分支 (生产分支)
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI/CD Pipeline / quality-check",
      "CI/CD Pipeline / unit-tests",
      "CI/CD Pipeline / e2e-tests",
      "CI/CD Pipeline / security-scan",
      "CI/CD Pipeline / docker-build",
      "codeql-analysis/TypeScript",
      "codeql-analysis/JavaScript"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 2,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "dismissal_restrictions": {}
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_linear_history": true,
  "allow_merge_commit": false,
  "allow_squash_merge": true,
  "allow_rebase_merge": true
}
```

### `develop` 分支 (开发分支)
```json
{
  "required_status_checks": {
    "strict": false,
    "contexts": [
      "CI/CD Pipeline / quality-check",
      "CI/CD Pipeline / unit-tests"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "dismissal_restrictions": {}
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_linear_history": false,
  "allow_merge_commit": false,
  "allow_squash_merge": true,
  "allow_rebase_merge": true
}
```

## 代码所有者 (CODEOWNERS)

```
# 后端服务
apps/backend-gateway/ @backend-team
apps/creation-agent/ @ai-team
apps/logic-agent/ @ai-team
apps/narrative-agent/ @ai-team

# 前端
apps/frontend/ @frontend-team

# 基础设施
deployment/ @devops-team
.github/ @devops-team

# 包
packages/common-backend/ @backend-team
packages/shared-types/ @backend-team
```

## 自动化规则

### 自动标签 (Auto-labeling)
- `size/XS`: 修改行数 < 10
- `size/S`: 修改行数 10-100
- `size/M`: 修改行数 100-500
- `size/L`: 修改行数 500-1000
- `size/XL`: 修改行数 > 1000

### 自动分配 (Auto-assignment)
- 后端相关: @backend-team
- 前端相关: @frontend-team
- AI相关: @ai-team
- 基础设施: @devops-team

## 质量门禁 (Quality Gates)

### 单元测试覆盖率
- 分支覆盖率: ≥ 80%
- 函数覆盖率: ≥ 80%
- 行覆盖率: ≥ 80%
- 语句覆盖率: ≥ 80%

### 代码质量
- ESLint错误: 0
- TypeScript错误: 0
- 安全漏洞: 0 (高危)

### 性能基准
- Lighthouse性能评分: ≥ 90
- 首次内容绘制 (FCP): < 1.5s
- 最大内容绘制 (LCP): < 2.5s

## 合规要求

### 安全扫描
- SAST扫描通过
- 依赖漏洞检查通过
- 容器镜像扫描通过

### 许可证合规
- 第三方依赖许可证检查
- 导出控制合规检查

## 例外处理

### 紧急修复
对于紧急安全修复，可以：
1. 创建带有 `hotfix` 标签的PR
2. 由技术负责人审批
3. 跳过某些非关键检查

### 文档更新
纯文档更新可以：
1. 跳过单元测试要求
2. 需要一名审查者审批

## 监控和报告

### 指标收集
- PR合并时间
- 审查周期
- 质量门禁失败率
- 安全漏洞发现数量

### 定期审查
- 每月审查分支保护规则有效性
- 每季度审查代码所有者配置
- 每年审查整体质量门禁标准
