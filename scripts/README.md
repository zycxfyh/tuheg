# 📜 创世星环 (Creation Ring) - 脚本工具集

## 📁 脚本目录结构

### 🚀 deployment/ - 部署相关脚本

- **deployment-validation.sh** - 部署验证脚本
- **industrial-build.sh** - 工业级构建脚本
- **industrial-deploy.sh** - 工业级部署脚本
- **production-simulation.sh** - 生产环境模拟脚本

### 🧪 testing/ - 测试相关脚本

- **enhance-coverage-strategy.sh** - 提升测试覆盖率策略
- **generate-test-report.sh** - 生成测试报告
- **implement-integration-tests.sh** - 实现集成测试
- **industrial-e2e-test.sh** - 工业级端到端测试
- **industrial-integration-test.sh** - 工业级集成测试
- **industrial-regression-test.sh** - 工业级回归测试
- **industrial-test-runner.sh** - 工业级测试运行器
- **industrial-test.sh** - 工业级测试脚本
- **init-test-db.sql** - 初始化测试数据库
- **migrate-tests-to-github-structure.sh** - 迁移测试到GitHub结构
- **performance-test.sh** - 性能测试脚本
- **performance-testing-setup.sh** - 性能测试环境设置
- **run-integration-tests.sh** - 运行集成测试
- **test-ai-agents-api.sh** - 测试AI代理API

### 📊 monitoring/ - 监控相关脚本

- **failure-config-manager.sh** - 故障配置管理器
- **failure-monitor.sh** - 故障监控脚本
- **industrial-failure-monitor.sh** - 工业级故障监控
- **monitoring-validation.sh** - 监控验证脚本

### 🔄 ci/ - CI/CD相关脚本

- **github-actions-optimization.sh** - GitHub Actions优化脚本

### 🛠️ development/ - 开发工具脚本

- **curl-format.txt** - cURL格式配置
- **demo-fast-failure.sh** - 快速失败演示脚本
- **final-security-audit.sh** - 最终安全审计脚本
- **industrial-demo.sh** - 工业级演示脚本
- **industrial-integration.sh** - 工业级集成脚本
- **industrial-recovery.sh** - 工业级恢复脚本
- **industrial-report.sh** - 工业级报告脚本
- **run-all-improvements.sh** - 运行所有改进脚本
- **setup-ai-providers.js** - 设置AI提供商脚本
- **simple-server.js** - 简单服务器脚本

## 🚀 快速使用

### 运行测试套件

```bash
# 运行所有集成测试
./scripts/testing/run-integration-tests.sh

# 生成测试覆盖率报告
./scripts/testing/generate-test-report.sh
```

### 部署相关操作

```bash
# 验证部署配置
./scripts/deployment/deployment-validation.sh

# 执行生产部署
./scripts/deployment/industrial-deploy.sh
```

### 监控和故障处理

```bash
# 启动故障监控
./scripts/monitoring/failure-monitor.sh

# 验证监控配置
./scripts/monitoring/monitoring-validation.sh
```

### 开发工具

```bash
# 设置AI提供商
node scripts/development/setup-ai-providers.js

# 运行所有改进脚本
./scripts/development/run-all-improvements.sh
```

## 📝 脚本分类说明

| 分类            | 用途                        | 执行环境      |
| --------------- | --------------------------- | ------------- |
| **deployment**  | 部署、构建、发布相关        | 生产/CI环境   |
| **testing**     | 单元测试、集成测试、E2E测试 | 开发/测试环境 |
| **monitoring**  | 系统监控、故障检测、告警    | 生产环境      |
| **ci**          | 持续集成、自动化流程        | CI/CD环境     |
| **development** | 开发工具、演示、调试        | 开发环境      |

## ⚠️ 注意事项

- 大部分脚本需要相应的环境变量和依赖
- 生产环境脚本请谨慎执行
- 监控脚本可能需要系统权限
- 测试脚本会修改数据库状态

---

**脚本维护**: 请在修改脚本时同步更新此索引文件
