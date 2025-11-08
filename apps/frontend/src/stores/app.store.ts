import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AppState {
  version: string
  environment: 'development' | 'staging' | 'production'
  isOnline: boolean
  lastActivity: Date
  sessionStartTime: Date
  userPreferences: {
    showWelcome: boolean
    autoSave: boolean
    enableNotifications: boolean
    language: string
    theme: 'light' | 'dark' | 'auto'
  }
}

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const appState = ref<AppState>({
    version: '1.0.0',
    environment: 'development',
    isOnline: navigator.onLine,
    lastActivity: new Date(),
    sessionStartTime: new Date(),
    userPreferences: {
      showWelcome: true,
      autoSave: true,
      enableNotifications: true,
      language: 'zh-CN',
      theme: 'auto',
    },
  })

  // UI状态
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const sidebarOpen = ref(false)
  const currentView = ref('welcome')

  // 计算属性
  const isDevelopment = computed(() => appState.value.environment === 'development')
  const isProduction = computed(() => appState.value.environment === 'production')
  const sessionDuration = computed(() => {
    return Date.now() - appState.value.sessionStartTime.getTime()
  })

  const appVersion = computed(() => appState.value.version)

  // 应用状态管理
  const updateLastActivity = () => {
    appState.value.lastActivity = new Date()
  }

  const setOnlineStatus = (online: boolean) => {
    appState.value.isOnline = online
  }

  const updateUserPreferences = (preferences: Partial<AppState['userPreferences']>) => {
    Object.assign(appState.value.userPreferences, preferences)
    saveToLocalStorage()
  }

  // UI状态管理
  const setLoading = (loading: boolean, message = '') => {
    isLoading.value = loading
    loadingMessage.value = message
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const setSidebarOpen = (open: boolean) => {
    sidebarOpen.value = open
  }

  const setCurrentView = (view: string) => {
    currentView.value = view
  }

  // 本地存储
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(
        'app-state',
        JSON.stringify({
          userPreferences: appState.value.userPreferences,
          sidebarOpen: sidebarOpen.value,
          currentView: currentView.value,
        })
      )
    } catch (error) {
      console.error('Failed to save app state to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedState = localStorage.getItem('app-state')
      if (savedState) {
        const parsed = JSON.parse(savedState)
        if (parsed.userPreferences) {
          Object.assign(appState.value.userPreferences, parsed.userPreferences)
        }
        if (typeof parsed.sidebarOpen === 'boolean') {
          sidebarOpen.value = parsed.sidebarOpen
        }
        if (parsed.currentView) {
          currentView.value = parsed.currentView
        }
      }
    } catch (error) {
      console.error('Failed to load app state from localStorage:', error)
    }
  }

  // 初始化
  const init = () => {
    loadFromLocalStorage()

    // 监听在线状态变化
    window.addEventListener('online', () => setOnlineStatus(true))
    window.addEventListener('offline', () => setOnlineStatus(false))

    // 监听用户活动
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach((event) => {
      document.addEventListener(event, updateLastActivity, true)
    })

    // 设置环境
    if (import.meta.env.PROD) {
      appState.value.environment = 'production'
    } else if (import.meta.env.VITE_ENV === 'staging') {
      appState.value.environment = 'staging'
    } else {
      appState.value.environment = 'development'
    }
  }

  // 重置用户偏好
  const resetUserPreferences = () => {
    appState.value.userPreferences = {
      showWelcome: true,
      autoSave: true,
      enableNotifications: true,
      language: 'zh-CN',
      theme: 'auto',
    }
    saveToLocalStorage()
  }

  // 清理资源
  const cleanup = () => {
    window.removeEventListener('online', () => setOnlineStatus(true))
    window.removeEventListener('offline', () => setOnlineStatus(false))
  }

  return {
    // 状态
    appState,
    isLoading,
    loadingMessage,
    sidebarOpen,
    currentView,

    // 计算属性
    isDevelopment,
    isProduction,
    sessionDuration,
    appVersion,

    // 应用状态管理
    updateLastActivity,
    setOnlineStatus,
    updateUserPreferences,

    // UI状态管理
    setLoading,
    toggleSidebar,
    setSidebarOpen,
    setCurrentView,

    // 存储方法
    saveToLocalStorage,
    loadFromLocalStorage,

    // 其他方法
    init,
    resetUserPreferences,
    cleanup,
  }
})
