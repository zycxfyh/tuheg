import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface TouchGesture {
  type: 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'pan'
  startX: number
  startY: number
  endX?: number
  endY?: number
  velocity?: number
  scale?: number
  duration?: number
}

export interface DeviceCapabilities {
  touch: boolean
  multiTouch: boolean
  orientation: 'portrait' | 'landscape'
  screenSize: { width: number; height: number }
  pixelRatio: number
  hapticFeedback: boolean
  vibration: boolean
  geolocation: boolean
  camera: boolean
  microphone: boolean
  accelerometer: boolean
  gyroscope: boolean
  storage: boolean
  notifications: boolean
  bluetooth: boolean
}

export interface NetworkStatus {
  online: boolean
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  downlink: number
  rtt: number
  saveData: boolean
}

export function useMobileOptimization() {
  // 设备检测
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const deviceCapabilities = ref<DeviceCapabilities>({
    touch: false,
    multiTouch: false,
    orientation: 'portrait',
    screenSize: { width: 0, height: 0 },
    pixelRatio: 1,
    hapticFeedback: false,
    vibration: false,
    geolocation: false,
    camera: false,
    microphone: false,
    accelerometer: false,
    gyroscope: false,
    storage: false,
    notifications: false,
    bluetooth: false,
  })

  // 网络状态
  const networkStatus = ref<NetworkStatus>({
    online: navigator.onLine,
    type: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  })

  // 触摸手势
  const touchGestures = ref<TouchGesture[]>([])
  const isGestureActive = ref(false)

  // PWA状态
  const isPWA = ref(false)
  const canInstallPWA = ref(false)
  const isOfflineReady = ref(false)

  // 计算属性
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  const isOnline = computed(() => networkStatus.value.online)

  const screenOrientation = computed(() =>
    deviceCapabilities.value.screenSize.width > deviceCapabilities.value.screenSize.height
      ? 'landscape'
      : 'portrait'
  )

  // 设备检测函数
  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // 检测设备类型
    isMobile.value = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                     screenWidth < 768

    isTablet.value = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
                    (screenWidth >= 768 && screenWidth < 1024)

    isDesktop.value = !isMobile.value && !isTablet.value

    // 检测触摸能力
    deviceCapabilities.value.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    deviceCapabilities.value.multiTouch = navigator.maxTouchPoints > 1

    // 屏幕信息
    deviceCapabilities.value.screenSize = { width: screenWidth, height: screenHeight }
    deviceCapabilities.value.pixelRatio = window.devicePixelRatio || 1

    // 检测传感器和API支持
    deviceCapabilities.value.hapticFeedback = 'vibrate' in navigator
    deviceCapabilities.value.vibration = 'vibrate' in navigator
    deviceCapabilities.value.geolocation = 'geolocation' in navigator
    deviceCapabilities.value.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    deviceCapabilities.value.microphone = deviceCapabilities.value.camera
    deviceCapabilities.value.accelerometer = 'DeviceMotionEvent' in window
    deviceCapabilities.value.gyroscope = 'DeviceOrientationEvent' in window
    deviceCapabilities.value.storage = 'localStorage' in window && 'sessionStorage' in window
    deviceCapabilities.value.notifications = 'Notification' in window
    deviceCapabilities.value.bluetooth = 'bluetooth' in navigator
  }

  // 网络状态检测
  const detectNetworkStatus = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      networkStatus.value = {
        online: navigator.onLine,
        type: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      }
    } else {
      networkStatus.value.online = navigator.onLine
    }
  }

  // PWA检测
  const detectPWA = () => {
    // 检查是否在PWA模式下运行
    isPWA.value = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true

    // 检查是否可以安装PWA
    canInstallPWA.value = 'BeforeInstallPromptEvent' in window || isPWA.value

    // 检查离线就绪状态
    if ('serviceWorker' in navigator && 'caches' in window) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        isOfflineReady.value = registrations.length > 0
      })
    }
  }

  // 触摸手势处理
  const handleTouchStart = (event: TouchEvent) => {
    if (!deviceCapabilities.value.touch) return

    isGestureActive.value = true

    const touch = event.touches[0]
    const gesture: TouchGesture = {
      type: 'tap',
      startX: touch.clientX,
      startY: touch.clientY,
    }

    touchGestures.value.push(gesture)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!isGestureActive.value || touchGestures.value.length === 0) return

    const touch = event.touches[0]
    const currentGesture = touchGestures.value[touchGestures.value.length - 1]

    if (!currentGesture.endX) {
      currentGesture.endX = touch.clientX
      currentGesture.endY = touch.clientY
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    if (!isGestureActive.value || touchGestures.value.length === 0) return

    const currentGesture = touchGestures.value[touchGestures.value.length - 1]

    if (currentGesture.endX !== undefined && currentGesture.endY !== undefined) {
      const deltaX = currentGesture.endX - currentGesture.startX
      const deltaY = currentGesture.endY - currentGesture.startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // 检测手势类型
      if (distance > 50) {
        currentGesture.type = 'swipe'
        currentGesture.velocity = distance / (Date.now() - (currentGesture as any).startTime || 1)
      } else if (event.touches.length === 2) {
        currentGesture.type = 'pinch'
      } else {
        currentGesture.type = 'tap'
      }
    }

    currentGesture.duration = Date.now() - (currentGesture as any).startTime

    // 触发手势事件
    emitGestureEvent(currentGesture)

    isGestureActive.value = false
  }

  const emitGestureEvent = (gesture: TouchGesture) => {
    // 这里可以触发自定义事件或调用回调函数
    console.log('Gesture detected:', gesture)
  }

  // 设备方向变化处理
  const handleOrientationChange = () => {
    deviceCapabilities.value.orientation = screen.orientation?.type.includes('landscape')
      ? 'landscape'
      : 'portrait'

    // 重新检测屏幕尺寸
    deviceCapabilities.value.screenSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  // 网络状态变化处理
  const handleOnlineStatusChange = () => {
    networkStatus.value.online = navigator.onLine
  }

  // 安装PWA提示处理
  const handleBeforeInstallPrompt = (event: Event) => {
    canInstallPWA.value = true
    // 可以保存事件用于后续触发安装
    ;(window as any).deferredPrompt = event
  }

  // 工具函数
  const vibrate = (pattern: number | number[]) => {
    if (deviceCapabilities.value.vibration && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (deviceCapabilities.value.hapticFeedback) {
      // 使用不同的振动模式表示不同类型的触觉反馈
      const patterns = {
        light: 50,
        medium: [50, 50, 50],
        heavy: [100, 50, 100],
      }
      vibrate(patterns[type])
    }
  }

  const requestGeolocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!deviceCapabilities.value.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      })
    })
  }

  const requestCamera = (constraints?: MediaStreamConstraints): Promise<MediaStream> => {
    return new Promise((resolve, reject) => {
      if (!deviceCapabilities.value.camera) {
        reject(new Error('Camera not supported'))
        return
      }

      navigator.mediaDevices.getUserMedia(constraints || {
        video: true,
        audio: false,
      }).then(resolve).catch(reject)
    })
  }

  const requestMicrophone = (constraints?: MediaStreamConstraints): Promise<MediaStream> => {
    return new Promise((resolve, reject) => {
      if (!deviceCapabilities.value.microphone) {
        reject(new Error('Microphone not supported'))
        return
      }

      navigator.mediaDevices.getUserMedia(constraints || {
        video: false,
        audio: true,
      }).then(resolve).catch(reject)
    })
  }

  const installPWA = async (): Promise<boolean> => {
    if (!(window as any).deferredPrompt) {
      return false
    }

    const promptEvent = (window as any).deferredPrompt
    promptEvent.prompt()

    const choice = await promptEvent.userChoice
    ;(window as any).deferredPrompt = null

    return choice.outcome === 'accepted'
  }

  const shareContent = async (data: {
    title?: string
    text?: string
    url?: string
    files?: File[]
  }): Promise<boolean> => {
    if (!navigator.share) {
      return false
    }

    try {
      await navigator.share(data)
      return true
    } catch (error) {
      console.error('Share failed:', error)
      return false
    }
  }

  // 生命周期
  onMounted(() => {
    detectDevice()
    detectNetworkStatus()
    detectPWA()

    // 事件监听器
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 触摸事件监听器
    if (deviceCapabilities.value.touch) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchmove', handleTouchMove, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
    }
  })

  onUnmounted(() => {
    // 清理事件监听器
    window.removeEventListener('resize', handleOrientationChange)
    window.removeEventListener('orientationchange', handleOrientationChange)
    window.removeEventListener('online', handleOnlineStatusChange)
    window.removeEventListener('offline', handleOnlineStatusChange)
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (deviceCapabilities.value.touch) {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  })

  return {
    // 设备信息
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    deviceCapabilities,
    screenOrientation,

    // 网络状态
    networkStatus,
    isOnline,

    // 触摸和手势
    touchGestures,
    isGestureActive,

    // PWA状态
    isPWA,
    canInstallPWA,
    isOfflineReady,

    // 方法
    detectDevice,
    detectNetworkStatus,
    detectPWA,
    vibrate,
    hapticFeedback,
    requestGeolocation,
    requestCamera,
    requestMicrophone,
    installPWA,
    shareContent,
  }
}
