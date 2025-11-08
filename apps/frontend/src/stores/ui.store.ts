import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 模态框状态
  const isCharacterSheetModalVisible = ref(false)
  const isJournalModalVisible = ref(false)
  const isWeaverConsoleVisible = ref(false)
  const isAiSettingsModalVisible = ref(false)

  // 加载状态
  const isLoading = ref(false)
  const loadingMessage = ref('')

  // 通知状态
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
  }>>([])

  // 模态框控制方法
  const showCharacterSheetModal = () => {
    isCharacterSheetModalVisible.value = true
  }

  const hideCharacterSheetModal = () => {
    isCharacterSheetModalVisible.value = false
  }

  const showJournalModal = () => {
    isJournalModalVisible.value = true
  }

  const hideJournalModal = () => {
    isJournalModalVisible.value = false
  }

  const showWeaverConsole = () => {
    isWeaverConsoleVisible.value = true
  }

  const hideWeaverConsole = () => {
    isWeaverConsoleVisible.value = false
  }

  const showAiSettingsModal = () => {
    isAiSettingsModalVisible.value = true
  }

  const hideAiSettingsModal = () => {
    isAiSettingsModalVisible.value = false
  }

  // 加载状态控制
  const startLoading = (message = '加载中...') => {
    isLoading.value = true
    loadingMessage.value = message
  }

  const stopLoading = () => {
    isLoading.value = false
    loadingMessage.value = ''
  }

  // 通知管理
  const addNotification = (notification: Omit<typeof notifications.value[0], 'id'>) => {
    const id = Date.now().toString()
    notifications.value.push({
      id,
      ...notification
    })

    // 自动移除通知
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // 便捷通知方法
  const showSuccess = (title: string, message = '') => {
    addNotification({ type: 'success', title, message })
  }

  const showError = (title: string, message = '') => {
    addNotification({ type: 'error', title, message })
  }

  const showWarning = (title: string, message = '') => {
    addNotification({ type: 'warning', title, message })
  }

  const showInfo = (title: string, message = '') => {
    addNotification({ type: 'info', title, message })
  }

  return {
    // 模态框状态
    isCharacterSheetModalVisible,
    isJournalModalVisible,
    isWeaverConsoleVisible,
    isAiSettingsModalVisible,

    // 加载状态
    isLoading,
    loadingMessage,

    // 通知状态
    notifications,

    // 模态框控制
    showCharacterSheetModal,
    hideCharacterSheetModal,
    showJournalModal,
    hideJournalModal,
    showWeaverConsole,
    hideWeaverConsole,
    showAiSettingsModal,
    hideAiSettingsModal,

    // 加载控制
    startLoading,
    stopLoading,

    // 通知管理
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})
