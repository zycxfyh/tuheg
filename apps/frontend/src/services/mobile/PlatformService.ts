// 平台检测服务 - 检测运行环境和平台特性

import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

export interface PlatformInfo {
  isNative: boolean
  platform: 'web' | 'ios' | 'android'
  isIOS: boolean
  isAndroid: boolean
  isWeb: boolean
  deviceInfo: any
  supportsFeature: (feature: string) => boolean
}

export class PlatformService {
  private platformInfo: PlatformInfo | null = null

  async getPlatformInfo(): Promise<PlatformInfo> {
    if (this.platformInfo) {
      return this.platformInfo
    }

    const isNative = Capacitor.isNativePlatform()
    const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android'
    const deviceInfo = await Device.getInfo()

    this.platformInfo = {
      isNative,
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
      deviceInfo,
      supportsFeature: this.checkFeatureSupport.bind(this),
    }

    return this.platformInfo
  }

  private checkFeatureSupport(feature: string): boolean {
    if (!this.platformInfo) return false

    const { isNative, platform, deviceInfo } = this.platformInfo

    switch (feature) {
      case 'camera':
        return isNative // 原生平台支持相机
      case 'filesystem':
        return isNative // 原生平台支持文件系统
      case 'notifications':
        return isNative // 原生平台支持推送通知
      case 'geolocation':
        return isNative || 'geolocation' in navigator // Web也可能支持地理位置
      case 'vibration':
        return 'vibrate' in navigator // 震动API
      case 'fullscreen':
        return 'fullscreenEnabled' in document // 全屏API
      case 'speech-recognition':
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      case 'speech-synthesis':
        return 'speechSynthesis' in window
      case 'webgl':
        try {
          const canvas = document.createElement('canvas')
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        } catch {
          return false
        }
      case 'web-audio':
        return 'AudioContext' in window || 'webkitAudioContext' in window
      case 'indexeddb':
        return 'indexedDB' in window
      case 'service-worker':
        return 'serviceWorker' in navigator
      default:
        return false
    }
  }

  // 平台特定的初始化
  async initializePlatform(): Promise<void> {
    const platformInfo = await this.getPlatformInfo()

    if (platformInfo.isNative) {
      await this.initializeNativePlatform(platformInfo)
    } else {
      await this.initializeWebPlatform(platformInfo)
    }
  }

  private async initializeNativePlatform(platformInfo: PlatformInfo): Promise<void> {
    try {
      // 设置状态栏样式
      if (platformInfo.isIOS || platformInfo.isAndroid) {
        await StatusBar.setStyle({ style: Style.Dark })
        if (platformInfo.isAndroid) {
          await StatusBar.setBackgroundColor({ color: '#1a1a2e' })
        }
      }

      // 隐藏启动画面
      setTimeout(() => {
        SplashScreen.hide({
          fadeOutDuration: 300,
        })
      }, 2000)

      console.log('Native platform initialized:', platformInfo.platform)
    } catch (error) {
      console.warn('Failed to initialize native platform:', error)
    }
  }

  private async initializeWebPlatform(platformInfo: PlatformInfo): Promise<void> {
    // 检查PWA支持
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
      } catch (error) {
        console.warn('Service Worker registration failed:', error)
      }
    }

    // 检查Web App Manifest支持
    if ('manifest' in document.createElement('link')) {
      console.log('Web App Manifest supported')
    }

    console.log('Web platform initialized')
  }

  // 获取安全区域信息（刘海屏适配）
  async getSafeAreaInsets(): Promise<{
    top: number
    bottom: number
    left: number
    right: number
  }> {
    const platformInfo = await this.getPlatformInfo()

    if (platformInfo.isIOS) {
      // iOS安全区域检测
      const testEl = document.createElement('div')
      testEl.style.cssText = `
        position: fixed;
        top: env(safe-area-inset-top);
        bottom: env(safe-area-inset-bottom);
        left: env(safe-area-inset-left);
        right: env(safe-area-inset-right);
        visibility: hidden;
      `
      document.body.appendChild(testEl)

      const styles = getComputedStyle(testEl)
      const insets = {
        top: parseInt(styles.top || '0'),
        bottom: parseInt(styles.bottom || '0'),
        left: parseInt(styles.left || '0'),
        right: parseInt(styles.right || '0'),
      }

      document.body.removeChild(testEl)
      return insets
    }

    if (platformInfo.isAndroid) {
      // Android可以通过viewport meta标签和CSS变量处理
      const testEl = document.createElement('div')
      testEl.style.cssText = `
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        visibility: hidden;
      `
      document.body.appendChild(testEl)

      const styles = getComputedStyle(testEl)
      const insets = {
        top: parseInt(styles.paddingTop || '0'),
        bottom: parseInt(styles.paddingBottom || '0'),
        left: parseInt(styles.paddingLeft || '0'),
        right: parseInt(styles.paddingRight || '0'),
      }

      document.body.removeChild(testEl)
      return insets
    }

    // Web平台返回默认值
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  // 检查是否支持特定的原生功能
  async checkNativeFeature(feature: string): Promise<boolean> {
    const platformInfo = await this.getPlatformInfo()
    return platformInfo.supportsFeature(feature)
  }

  // 获取平台特定的配置
  getPlatformConfig() {
    const isNative = Capacitor.isNativePlatform()
    const platform = Capacitor.getPlatform()

    return {
      // UI配置
      ui: {
        safeAreaEnabled: isNative,
        statusBarHeight: isNative ? (platform === 'ios' ? 44 : 24) : 0,
        navigationBarHeight: isNative ? 50 : 0,
        tabBarHeight: isNative ? 80 : 60,
      },

      // 功能配置
      features: {
        camera: isNative,
        filesystem: isNative,
        notifications: isNative,
        geolocation: isNative || 'geolocation' in navigator,
        vibration: 'vibrate' in navigator,
        fullscreen: 'fullscreenEnabled' in document,
      },

      // 性能配置
      performance: {
        webWorkers: 'Worker' in window,
        webGL: this.checkFeatureSupport('webgl'),
        webAudio: this.checkFeatureSupport('web-audio'),
        indexedDB: this.checkFeatureSupport('indexeddb'),
      },
    }
  }
}

export const platformService = new PlatformService()
