# Renovate 配置说明

## 为什么选择Renovate？

Renovate 是 GitHub 上最先进的依赖管理工具，具有以下优势：

- **智能分组**: 自动将相关依赖更新分组
- **灵活调度**: 支持复杂的更新时间表
- **安全更新优先**: 自动检测和处理安全漏洞
- **多生态支持**: 支持 npm, Docker, GitHub Actions 等多种包管理器
- **自定义规则**: 强大的配置选项，支持复杂的更新策略

## 如何启用Renovate

1. **安装Renovate App**
   - 访问: https://github.com/apps/renovate
   - 点击 "Install" 按钮
   - 选择你的仓库 `zycxfyh/tuheg`
   - 授予必要的权限

2. **配置生效**
   - Renovate 会自动读取 `renovate.json` 配置文件
   - 开始监控依赖更新
   - 创建自动化的 Pull Request

## 现有配置对比

### 当前: Dependabot
- ✅ 已配置并运行良好
- ✅ 支持基本依赖更新
- ✅ 安全更新支持
- ❌ 分组功能有限
- ❌ 配置选项较少

### 推荐: Renovate + Dependabot
- ✅ 保留 Dependabot 处理日常更新
- ✅ Renovate 处理复杂场景和分组更新
- ✅ 双重保障，提高更新成功率

## 配置说明

`renovate.json` 已预配置以下特性：

- 每周一凌晨4点运行（亚洲时区）
- 自动分组相关依赖（如所有 ESLint 包）
- 主要版本更新需要手动批准
- 支持安全漏洞检测
- 智能忽略策略

## 使用建议

1. 先保持 Dependabot 运行
2. 启用 Renovate 观察其表现
3. 根据实际效果决定是否停用 Dependabot

## 相关链接

- [Renovate 文档](https://docs.renovatebot.com/)
- [配置选项](https://docs.renovatebot.com/configuration-options/)
- [分享配置](https://docs.renovatebot.com/config-presets/)
