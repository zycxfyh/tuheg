import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

export const useToastStore = defineStore('toast', () => {
  // 状态
  const toasts = ref<Toast[]>([])
  const maxToasts = ref(5)

  // 添加通知
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)

    const newToast: Toast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    }

    toasts.value.push(newToast)

    // 限制最大通知数量
    if (toasts.value.length > maxToasts.value) {
      toasts.value.shift()
    }

    // 自动移除通知（如果不是持久通知）
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }

  // 移除通知
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // 清除所有通知
  const clearToasts = () => {
    toasts.value = []
  }

  // 便捷方法
  const success = (title: string, message?: string, duration?: number) => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: duration ?? 5000,
    })
  }

  const error = (title: string, message?: string, duration?: number) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: duration ?? 7000,
    })
  }

  const warning = (title: string, message?: string, duration?: number) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: duration ?? 6000,
    })
  }

  const info = (title: string, message?: string, duration?: number) => {
    return addToast({
      type: 'info',
      title,
      message,
      duration: duration ?? 5000,
    })
  }

  // 显示持久通知（需要手动关闭）
  const persistent = (type: Toast['type'], title: string, message?: string) => {
    return addToast({
      type,
      title,
      message,
      persistent: true,
    })
  }

  return {
    // 状态
    toasts,
    maxToasts,

    // 方法
    addToast,
    removeToast,
    clearToasts,

    // 便捷方法
    success,
    error,
    warning,
    info,
    persistent,
  }
})
