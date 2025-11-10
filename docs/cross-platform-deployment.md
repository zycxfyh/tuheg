# 创世星环 - 跨平台部署指南

## 📱 概述

创世星环支持多平台部署，包括Web、PWA、移动端（iOS/Android）和桌面端（Windows/macOS/Linux），为用户提供一致的AI叙事创作体验。

## 🏗️ 构建系统

### 核心技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **PWA**: 渐进式Web应用
- **Web应用**: 响应式Web应用
- **PWA支持**: Vite PWA插件 + Workbox

### 构建脚本

```bash
# 全平台构建
npm run build:all

# 单独构建
npm run build:web          # Web应用
npm run build:pwa          # PWA应用
# 开发模式
npm run dev                # Web开发
npm run dev:pwa           # PWA开发
```

### 高级构建选项

```bash
# 使用跨平台构建工具
node scripts/build-cross-platform.js [target] [options]

# 选项
--clean     # 清理构建目录
--verbose   # 详细输出
--skip-tests # 跳过测试

# 示例
node scripts/build-cross-platform.js all --clean --verbose
node scripts/build-cross-platform.js web --skip-tests
```

## 🌐 Web平台部署

### 标准Web应用

1. **构建Web应用**
   ```bash
   npm run build
   ```

2. **部署到Web服务器**
   ```bash
   # Nginx配置示例
   server {
       listen 80;
       server_name creation-ring.com;
       root /path/to/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # API代理
       location /api {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Docker部署**
   ```dockerfile
   FROM nginx:alpine
   COPY dist/ /usr/share/nginx/html/
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   ```

### PWA部署

1. **构建PWA应用**
   ```bash
   npm run build:pwa
   ```

2. **PWA特性**
   - 离线访问
   - 安装到桌面
   - 推送通知
   - 后台同步

3. **Service Worker配置**
   - 自动缓存策略
   - 离线页面回退
   - 版本更新提示

## 📱 移动端部署

### 前置要求

- **Node.js**: 18+
- **现代浏览器**: 支持PWA和ES2020+
- **Workbox CLI**: PWA构建工具

### PWA优化特性

- **离线支持**: Service Worker缓存策略
- **安装体验**: Add to Home Screen提示
- **推送通知**: Web Notifications API
- **后台同步**: Background Sync API
- **响应式设计**: 移动端友好的UI适配

## 💻 Web部署

### 前置要求

- **Rust**: 1.70+
- **系统依赖**:
  - Windows: Visual Studio Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: `webkit2gtk`, `openssl`, `curl`

## 🚀 CI/CD部署

### GitHub Actions配置

```yaml
name: Cross-Platform Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: apps/frontend/dist/

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-java@v3
        with:
          java-version: '11'
      - run: npm ci
      - run: npm run capacitor:add:android
      - run: npm run capacitor:build:android
      - uses: actions/upload-artifact@v3
        with:
          name: android-build
          path: android/

  build-desktop:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Setup Rust
        uses: actions-rust-lang/setup-rust-toolchain@v1
      - run: npm ci
      - run: npm run desktop:build
      - uses: actions/upload-artifact@v3
        with:
          name: desktop-build-${{ matrix.os }}
          path: dist/
```

### 自动发布

```yaml
name: Release

on:
  release:
    types: [published]

jobs:
  publish-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build:pwa
      - name: Deploy to Vercel
        run: vercel --prod --yes

  publish-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - name: Deploy to production
        run: |
          # 部署到生产环境
          # 可以是Vercel、Netlify、AWS等
```

## 📊 性能监控

### 平台特定监控

- **Web**: Lighthouse, Web Vitals
- **PWA**: Web App Manifest, Service Worker调试
- **Web应用**: Lighthouse CI, Web Vitals监控

### 错误追踪

```typescript
// Sentry配置
import * as Sentry from '@sentry/vue'

Sentry.init({
  app: app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.PLATFORM || 'web',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
})
```

## 🔧 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 清理依赖缓存
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Web构建失败**
   ```bash
   # 清理缓存
   rm -rf node_modules/.vite

   # 重新构建
   npm run build
   ```

3. **PWA不工作**
   ```bash
   # 检查Service Worker
   # 在浏览器DevTools中查看Application > Service Workers

   # 重新生成Workbox配置
   npm run build:pwa
   ```

### 调试技巧

- **PWA调试**: 使用Application面板检查安装状态
- **Web调试**: 使用Chrome DevTools
- **PWA调试**: 使用Lighthouse和Application面板

## 📈 发布清单

### 预发布检查

- [ ] 所有平台构建成功
- [ ] 单元测试通过
- [ ] E2E测试通过
- [ ] 性能基准测试通过
- [ ] 安全扫描通过
- [ ] 应用图标和截图准备完成
- [ ] 应用描述和元数据更新
- [ ] 隐私政策和使用条款更新

### 发布步骤

1. 创建Git标签和Release
2. 触发CI/CD流水线
3. 上传应用商店
4. 更新文档和网站
5. 通知用户和社区
6. 监控发布后的反馈和崩溃报告

## 🎯 最佳实践

### 开发建议

- **统一代码库**: 保持Web和原生平台的代码一致性
- **渐进增强**: Web功能优先，原生平台增强
- **性能优先**: 针对每个平台优化关键路径
- **用户体验**: 保持跨平台一致的交互设计

### 维护建议

- **版本管理**: 使用统一的版本号策略
- **依赖更新**: 定期更新所有平台的依赖
- **兼容性测试**: 在所有目标平台上测试新功能
- **监控告警**: 设置发布后监控和告警机制

---

*跨平台部署让创世星环能够触达更多用户，提供卓越的AI叙事创作体验。*
