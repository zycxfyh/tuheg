import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// 无障碍配置
export interface AccessibilityConfig {
  highContrast: boolean
  reducedMotion: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
  colorBlindFriendly: boolean
}

// 键盘快捷键配置
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  description: string
  action: () => void
  category: string
}

// 焦点管理
export interface FocusTrap {
  container: HTMLElement
  active: boolean
  restoreFocus?: HTMLElement
}

// 无障碍公告
export interface AccessibilityAnnouncement {
  message: string
  priority: 'polite' | 'assertive'
  timestamp: number
}

// 无障碍引擎
export class AccessibilityEngine {
  private config: AccessibilityConfig
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private focusTraps: FocusTrap[] = []
  private announcements: AccessibilityAnnouncement[] = []
  private liveRegion: HTMLElement | null = null

  constructor() {
    this.config = this.getDefaultConfig()
    this.initLiveRegion()
  }

  // 获取默认配置
  private getDefaultConfig(): AccessibilityConfig {
    return {
      highContrast: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      largeText: false,
      screenReader: this.detectScreenReader(),
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindFriendly: false,
    }
  }

  // 检测屏幕阅读器
  private detectScreenReader(): boolean {
    // 检查常见的屏幕阅读器特征
    const hasScreenReader =
      window.speechSynthesis !== undefined ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver')

    // 检查是否通过键盘导航
    const usingKeyboard = !window.matchMedia('(pointer: fine)').matches

    return hasScreenReader || usingKeyboard
  }

  // 初始化实时区域
  private initLiveRegion() {
    if (typeof document === 'undefined') return

    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.style.position = 'absolute'
    this.liveRegion.style.left = '-10000px'
    this.liveRegion.style.width = '1px'
    this.liveRegion.style.height = '1px'
    this.liveRegion.style.overflow = 'hidden'

    document.body.appendChild(this.liveRegion)
  }

  // 更新配置
  updateConfig(newConfig: Partial<AccessibilityConfig>) {
    this.config = { ...this.config, ...newConfig }
    this.applyConfig()
    this.saveToStorage()
  }

  // 获取配置
  getConfig(): AccessibilityConfig {
    return { ...this.config }
  }

  // 应用配置到DOM
  private applyConfig() {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // 高对比度
    root.setAttribute('data-high-contrast', this.config.highContrast.toString())

    // 减少动画
    root.setAttribute('data-reduced-motion', this.config.reducedMotion.toString())

    // 大字体
    root.setAttribute('data-large-text', this.config.largeText.toString())

    // 色盲友好
    root.setAttribute('data-color-blind', this.config.colorBlindFriendly.toString())

    // 键盘导航
    root.setAttribute('data-keyboard-nav', this.config.keyboardNavigation.toString())

    // 焦点指示器
    root.setAttribute('data-focus-indicators', this.config.focusIndicators.toString())
  }

  // 注册键盘快捷键
  registerShortcut(shortcut: KeyboardShortcut) {
    const key = this.normalizeKey(
      shortcut.key,
      shortcut.ctrlKey,
      shortcut.altKey,
      shortcut.shiftKey
    )
    this.shortcuts.set(key, shortcut)
  }

  // 注销键盘快捷键
  unregisterShortcut(key: string, ctrlKey = false, altKey = false, shiftKey = false) {
    const normalizedKey = this.normalizeKey(key, ctrlKey, altKey, shiftKey)
    this.shortcuts.delete(normalizedKey)
  }

  // 标准化按键
  private normalizeKey(key: string, ctrlKey = false, altKey = false, shiftKey = false): string {
    return `${ctrlKey ? 'ctrl+' : ''}${altKey ? 'alt+' : ''}${shiftKey ? 'shift+' : ''}${key.toLowerCase()}`
  }

  // 处理键盘事件
  handleKeydown(event: KeyboardEvent) {
    if (!this.config.keyboardNavigation) return

    const key = this.normalizeKey(event.key, event.ctrlKey, event.altKey, event.shiftKey)
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      event.preventDefault()
      event.stopPropagation()
      shortcut.action()

      // 公告快捷键执行
      this.announce(`${shortcut.description} 已执行`, 'polite')
    }
  }

  // 创建焦点陷阱
  createFocusTrap(container: HTMLElement): FocusTrap {
    const trap: FocusTrap = {
      container,
      active: false,
      restoreFocus: document.activeElement as HTMLElement,
    }

    this.focusTraps.push(trap)
    return trap
  }

  // 激活焦点陷阱
  activateFocusTrap(trap: FocusTrap) {
    trap.active = true

    // 找到陷阱内的所有可聚焦元素
    const focusableElements = trap.container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      ;(focusableElements[0] as HTMLElement).focus()
    }

    // 监听Tab键
    const handleTab = (event: KeyboardEvent) => {
      if (!trap.active) return

      if (event.key === 'Tab') {
        const focusable = Array.from(focusableElements) as HTMLElement[]
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }

      if (event.key === 'Escape') {
        this.deactivateFocusTrap(trap)
      }
    }

    trap.container.addEventListener('keydown', handleTab)
  }

  // 停用焦点陷阱
  deactivateFocusTrap(trap: FocusTrap) {
    trap.active = false

    if (trap.restoreFocus) {
      trap.restoreFocus.focus()
    }

    // 从陷阱列表中移除
    const index = this.focusTraps.indexOf(trap)
    if (index > -1) {
      this.focusTraps.splice(index, 1)
    }
  }

  // 公告消息
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) return

    const announcement: AccessibilityAnnouncement = {
      message,
      priority,
      timestamp: Date.now(),
    }

    this.announcements.push(announcement)

    // 更新实时区域
    this.liveRegion.setAttribute('aria-live', priority)
    this.liveRegion.textContent = message

    // 限制公告历史
    if (this.announcements.length > 10) {
      this.announcements = this.announcements.slice(-10)
    }
  }

  // 获取所有快捷键
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  // 获取快捷键分组
  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    const categories: Record<string, KeyboardShortcut[]> = {}

    this.shortcuts.forEach((shortcut) => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = []
      }
      categories[shortcut.category].push(shortcut)
    })

    return categories
  }

  // 保存配置到存储
  private saveToStorage() {
    try {
      localStorage.setItem('creation-ring-accessibility', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save accessibility config:', error)
    }
  }

  // 从存储加载配置
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('creation-ring-accessibility')
      if (stored) {
        const storedConfig = JSON.parse(stored)
        this.config = { ...this.config, ...storedConfig }
        this.applyConfig()
      }
    } catch (error) {
      console.warn('Failed to load accessibility config:', error)
    }
  }

  // 重置配置
  reset() {
    this.config = this.getDefaultConfig()
    this.applyConfig()
    this.saveToStorage()
  }

  // 清理资源
  destroy() {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion)
    }

    this.focusTraps.forEach((trap) => {
      this.deactivateFocusTrap(trap)
    })

    this.shortcuts.clear()
    this.announcements = []
  }
}

// Vue组合式函数
export function useAccessibility() {
  const engine = new AccessibilityEngine()
  const config = ref<AccessibilityConfig>(engine.getConfig())
  const shortcuts = ref<KeyboardShortcut[]>([])
  const announcements = ref<AccessibilityAnnouncement[]>([])

  // 更新配置
  const updateConfig = (newConfig: Partial<AccessibilityConfig>) => {
    engine.updateConfig(newConfig)
    config.value = engine.getConfig()
  }

  // 注册快捷键
  const registerShortcut = (shortcut: KeyboardShortcut) => {
    engine.registerShortcut(shortcut)
    shortcuts.value = engine.getShortcuts()
  }

  // 注销快捷键
  const unregisterShortcut = (key: string, ctrlKey = false, altKey = false, shiftKey = false) => {
    engine.unregisterShortcut(key, ctrlKey, altKey, shiftKey)
    shortcuts.value = engine.getShortcuts()
  }

  // 创建焦点陷阱
  const createFocusTrap = (container: HTMLElement) => {
    return engine.createFocusTrap(container)
  }

  // 激活焦点陷阱
  const activateFocusTrap = (trap: FocusTrap) => {
    engine.activateFocusTrap(trap)
  }

  // 停用焦点陷阱
  const deactivateFocusTrap = (trap: FocusTrap) => {
    engine.deactivateFocusTrap(trap)
  }

  // 公告消息
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    engine.announce(message, priority)
  }

  // 获取快捷键分组
  const getShortcutsByCategory = () => {
    return engine.getShortcutsByCategory()
  }

  // 重置配置
  const resetAccessibility = () => {
    engine.reset()
    config.value = engine.getConfig()
  }

  // 键盘事件处理
  const handleKeydown = (event: KeyboardEvent) => {
    engine.handleKeydown(event)
  }

  // 初始化
  onMounted(() => {
    engine.loadFromStorage()
    config.value = engine.getConfig()
    shortcuts.value = engine.getShortcuts()

    // 监听系统偏好变化
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')

    const handlePreferenceChange = () => {
      updateConfig({
        reducedMotion: motionQuery.matches,
        highContrast: contrastQuery.matches,
      })
    }

    motionQuery.addEventListener('change', handlePreferenceChange)
    contrastQuery.addEventListener('change', handlePreferenceChange)

    // 全局键盘事件监听
    window.addEventListener('keydown', handleKeydown)

    onUnmounted(() => {
      motionQuery.removeEventListener('change', handlePreferenceChange)
      contrastQuery.removeEventListener('change', handlePreferenceChange)
      window.removeEventListener('keydown', handleKeydown)
    })
  })

  onUnmounted(() => {
    engine.destroy()
  })

  return {
    // 状态
    config: readonly(config),
    shortcuts: readonly(shortcuts),
    announcements: readonly(announcements),

    // 方法
    updateConfig,
    registerShortcut,
    unregisterShortcut,
    createFocusTrap,
    activateFocusTrap,
    deactivateFocusTrap,
    announce,
    getShortcutsByCategory,
    resetAccessibility,
    handleKeydown,
  }
}
