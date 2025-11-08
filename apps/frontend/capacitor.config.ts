import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.creationring.app',
  appName: '创世星环',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    // 相机插件 - 用于图像捕获和处理
    Camera: {
      allowEditing: true,
      saveToGallery: false,
      quality: 85
    },
    // 文件系统插件 - 用于文件读写
    Filesystem: {
      directory: 'DATA'
    },
    // 媒体插件 - 用于音频/视频处理
    Media: {},
    // 网络插件 - 用于HTTP请求
    Http: {},
    // 存储插件 - 用于本地数据存储
    Storage: {},
    // 设备插件 - 用于设备信息获取
    Device: {},
    // 地理位置插件 - 用于位置服务（可选）
    Geolocation: {},
    // 推送通知插件
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // 分享插件
    Share: {},
    // 状态栏插件
    StatusBar: {
      style: 'DARK',
      overlaysWebView: false
    },
    // 启动画面插件
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: true,
      spinnerColor: '#00d4ff'
    }
  },
  ios: {
    scheme: '创世星环',
    contentInset: 'automatic',
    backgroundColor: '#1a1a2e',
    limitsNavigationsToAppBoundDomains: false,
    handleApplicationNotifications: true
  },
  android: {
    scheme: '创世星环',
    backgroundColor: '#1a1a2e',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    webViewAssetsPath: 'public'
  }
}

export default config
