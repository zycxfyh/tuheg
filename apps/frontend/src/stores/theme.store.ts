import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const currentTheme = ref<Theme>('auto')
  const systemTheme = ref<'light' | 'dark'>('light')

  // 计算属性
  const isDark = () => {
    if (currentTheme.value === 'auto') {
      return systemTheme.value === 'dark'
    }
    return currentTheme.value === 'dark'
  }

  // 监听系统主题变化
  const watchSystemTheme = () => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemTheme.value = mediaQuery.matches ? 'dark' : 'light'

      mediaQuery.addEventListener('change', (e) => {
        systemTheme.value = e.matches ? 'dark' : 'light'
        applyTheme()
      })
    }
  }

  // 应用主题到DOM
  const applyTheme = () => {
    const dark = isDark()
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  // 设置主题
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
    applyTheme()
  }

  // 初始化主题
  const initTheme = () => {
    // 从localStorage恢复主题设置
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      currentTheme.value = savedTheme
    }

    // 开始监听系统主题
    watchSystemTheme()

    // 应用当前主题
    applyTheme()
  }

  // 切换主题
  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  return {
    // 状态
    currentTheme,
    systemTheme,

    // 计算属性
    isDark,

    // 动作
    setTheme,
    initTheme,
    toggleTheme,
    applyTheme,
  }
})
