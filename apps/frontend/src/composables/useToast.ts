import { useToastStore } from '@/stores/toast.store'

export function useToast() {
  const toastStore = useToastStore()

  return {
    success: toastStore.success,
    error: toastStore.error,
    warning: toastStore.warning,
    info: toastStore.info,
    add: toastStore.addToast,
    remove: toastStore.removeToast,
    clear: toastStore.clearToasts,
  }
}

// 为了向后兼容，提供一个简单的toast函数
export const toast = {
  success: (title: string, message?: string) => {
    const toastStore = useToastStore()
    return toastStore.success(title, message)
  },
  error: (title: string, message?: string) => {
    const toastStore = useToastStore()
    return toastStore.error(title, message)
  },
  warning: (title: string, message?: string) => {
    const toastStore = useToastStore()
    return toastStore.warning(title, message)
  },
  info: (title: string, message?: string) => {
    const toastStore = useToastStore()
    return toastStore.info(title, message)
  },
}
