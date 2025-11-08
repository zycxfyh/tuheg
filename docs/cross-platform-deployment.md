# 创世星环 - 跨平台部署指南

## 📱 概述

创世星环支持多平台部署，包括Web、PWA、移动端（iOS/Android）和桌面端（Windows/macOS/Linux），为用户提供一致的AI叙事创作体验。

## 🏗️ 构建系统

### 核心技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **移动端**: Capacitor 6
- **桌面端**: Tauri 2
- **PWA支持**: Vite PWA插件 + Workbox

### 构建脚本

```bash
# 全平台构建
npm run build:all

# 单独构建
npm run build:web          # Web应用
npm run build:pwa          # PWA应用
npm run capacitor:build:android  # Android应用
npm run capacitor:build:ios      # iOS应用
npm run desktop:build      # 桌面应用

# 开发模式
npm run dev                # Web开发
npm run capacitor:dev      # 移动端开发
npm run desktop:dev        # 桌面端开发
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
- **Android Studio**: for Android builds
- **Xcode**: for iOS builds (macOS only)
- **Capacitor CLI**: 已安装

### Android部署

1. **环境配置**
   ```bash
   # 安装Android SDK
   # 配置ANDROID_HOME环境变量

   # 添加Android平台
   npm run capacitor:add:android
   ```

2. **构建和部署**
   ```bash
   # 构建Web资源
   npm run capacitor:build:android

   # 打开Android Studio
   npm run capacitor:open:android

   # 在Android Studio中构建APK
   # Build > Build Bundle(s)/APK(s) > Build APK(s)
   ```

3. **Google Play发布**
   - 生成签名密钥
   - 构建发布版本APK/AAB
   - 上传到Google Play Console
   - 配置应用信息和截图

### iOS部署

1. **环境配置 (macOS only)**
   ```bash
   # 安装Xcode命令行工具
   xcode-select --install

   # 添加iOS平台
   npm run capacitor:add:ios
   ```

2. **构建和部署**
   ```bash
   # 构建Web资源
   npm run capacitor:build:ios

   # 打开Xcode
   npm run capacitor:open:ios

   # 在Xcode中配置签名和证书
   # Product > Archive > Distribute App
   ```

3. **App Store发布**
   - 配置App Store Connect
   - 上传构建版本
   - 填写应用信息和截图
   - 提交审核

### 移动端优化特性

- **原生功能集成**: 相机、文件系统、通知等
- **性能优化**: 针对移动设备优化的打包策略
- **UI适配**: 刘海屏、安全区域适配
- **手势支持**: 触摸友好的交互设计

## 💻 桌面端部署

### 前置要求

- **Rust**: 1.70+
- **系统依赖**:
  - Windows: Visual Studio Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: `webkit2gtk`, `openssl`, `curl`

### Tauri构建

1. **环境配置**
   ```bash
   # 安装Tauri CLI
   npm install -g @tauri-apps/cli

   # 初始化Tauri项目
   npm run tauri:init
   ```

2. **构建桌面应用**
   ```bash
   # 开发模式
   npm run desktop:dev

   # 生产构建
   npm run desktop:build
   ```

3. **平台特定构建**
   ```bash
   # Windows
   npm run desktop:build -- --target x86_64-pc-windows-msvc

   # macOS
   npm run desktop:build -- --target x86_64-apple-darwin

   # Linux
   npm run desktop:build -- --target x86_64-unknown-linux-gnu
   ```

### 桌面端特性

- **原生性能**: Rust核心，高效能
- **小体积**: 相比Electron更轻量
- **系统集成**: 托盘图标、系统通知、文件关联
- **跨平台**: Windows/macOS/Linux统一体验

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
          path: apps/desktop/src-tauri/target/release/bundle/
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

  publish-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run capacitor:build:android
      - name: Upload to Google Play
        run: |
          # 使用Google Play上传工具
          # fastlane supply

  publish-desktop:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run desktop:build
      - name: Upload to GitHub Releases
        uses: actions/upload-release-asset@v1
        with:
          upload_url: ${{ github.event.release.upload_url }}
          asset_path: ./apps/desktop/src-tauri/target/release/bundle/*
          asset_name: creation-ring-${{ matrix.os }}.zip
```

## 📊 性能监控

### 平台特定监控

- **Web**: Lighthouse, Web Vitals
- **移动端**: Android Profiler, Xcode Instruments
- **桌面端**: Tauri DevTools, 系统性能监控

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

1. **Capacitor构建失败**
   ```bash
   # 清理并重新添加平台
   npx cap remove android
   npx cap add android
   ```

2. **Tauri构建失败**
   ```bash
   # 更新Rust工具链
   rustup update

   # 清理Tauri缓存
   npm run tauri:build -- --no-bundle
   ```

3. **PWA不工作**
   ```bash
   # 检查Service Worker
   # 在浏览器DevTools中查看Application > Service Workers

   # 重新生成Workbox配置
   npm run build:pwa
   ```

### 调试技巧

- **移动端调试**: 使用Chrome DevTools远程调试
- **桌面端调试**: 使用Tauri DevTools
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
