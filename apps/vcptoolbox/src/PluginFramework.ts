import { EventEmitter } from 'events'

// VCPToolBox - 创世星环插件框架核心
// 专注于AI叙事创作的插件生态系统

// 插件类型定义 - 围绕AI叙事核心功能
export type PluginType =
  | 'story-generator'      // 故事生成器
  | 'character-creator'    // 角色创建器
  | 'world-builder'        // 世界构建器
  | 'narrative-logic'      // 叙事逻辑
  | 'dialogue-system'      // 对话系统
  | 'plot-engine'          // 情节引擎
  | 'style-template'       // 风格模板
  | 'export-format'        // 导出格式
  | 'ui-theme'            // UI主题
  | 'localization'        // 本地化
  | 'analytics'           // 分析工具
  | 'integration'         // 第三方集成

// 插件接口定义
export interface VCPPlugin {
  // 基础信息
  id: string
  name: string
  version: string
  description: string
  author: PluginAuthor
  type: PluginType

  // 兼容性
  compatibility: PluginCompatibility

  // 功能定义
  capabilities: PluginCapabilities

  // 生命周期钩子
  lifecycle: PluginLifecycle

  // 元数据
  metadata: PluginMetadata
}

// 插件作者信息
export interface PluginAuthor {
  name: string
  email: string
  website?: string
  organization?: string
  verified: boolean
}

// 插件兼容性
export interface PluginCompatibility {
  minVersion: string
  maxVersion?: string
  requiredPlugins: string[]
  conflictsWith: string[]
  platforms: ('web' | 'desktop' | 'mobile')[]
}

// 插件功能定义
export interface PluginCapabilities {
  // 故事生成相关
  storyGeneration?: StoryGenerationCapabilities
  // 角色创建相关
  characterCreation?: CharacterCreationCapabilities
  // 世界构建相关
  worldBuilding?: WorldBuildingCapabilities
  // UI定制相关
  uiCustomization?: UICustomizationCapabilities
  // 数据导出相关
  dataExport?: DataExportCapabilities
  // API扩展相关
  apiExtensions?: APIExtensionsCapabilities
}

// 故事生成能力
export interface StoryGenerationCapabilities {
  supportedGenres: string[]
  supportedLengths: ('short' | 'medium' | 'long' | 'epic')[]
  customPrompts: boolean
  branchingNarratives: boolean
  multipleEndings: boolean
  characterConsistency: boolean
}

// 角色创建能力
export interface CharacterCreationCapabilities {
  personalityTraits: boolean
  backgroundStories: boolean
  relationshipMapping: boolean
  visualDescriptions: boolean
  voiceProfiles: boolean
  customAttributes: string[]
}

// 世界构建能力
export interface WorldBuildingCapabilities {
  geography: boolean
  cultures: boolean
  magicSystems: boolean
  technology: boolean
  history: boolean
  rules: boolean
  customElements: string[]
}

// UI定制能力
export interface UICustomizationCapabilities {
  themes: boolean
  layouts: boolean
  fonts: boolean
  colors: boolean
  animations: boolean
  customComponents: string[]
}

// 数据导出能力
export interface DataExportCapabilities {
  formats: string[]
  includesMetadata: boolean
  batchExport: boolean
  customTemplates: boolean
}

// API扩展能力
export interface APIExtensionsCapabilities {
  customEndpoints: string[]
  webhooks: boolean
  integrations: string[]
  dataSources: string[]
}

// 插件生命周期
export interface PluginLifecycle {
  // 初始化
  onInitialize?: (context: PluginContext) => Promise<void>

  // 激活
  onActivate?: (context: PluginContext) => Promise<void>

  // 停用
  onDeactivate?: (context: PluginContext) => Promise<void>

  // 销毁
  onDestroy?: (context: PluginContext) => Promise<void>

  // 配置变更
  onConfigChange?: (config: any, context: PluginContext) => Promise<void>
}

// 插件上下文
export interface PluginContext {
  // 核心API访问
  api: PluginAPI

  // 配置管理
  config: PluginConfig

  // 事件系统
  events: PluginEvents

  // 存储系统
  storage: PluginStorage

  // UI系统
  ui: PluginUI

  // 日志系统
  logger: PluginLogger
}

// 插件API接口
export interface PluginAPI {
  // 故事相关API
  stories: {
    create: (data: any) => Promise<string>
    update: (id: string, data: any) => Promise<void>
    get: (id: string) => Promise<any>
    list: (filters?: any) => Promise<any[]>
    delete: (id: string) => Promise<void>
  }

  // 角色相关API
  characters: {
    create: (data: any) => Promise<string>
    update: (id: string, data: any) => Promise<void>
    get: (id: string) => Promise<any>
    list: (filters?: any) => Promise<any[]>
    delete: (id: string) => Promise<void>
  }

  // 世界相关API
  worlds: {
    create: (data: any) => Promise<string>
    update: (id: string, data: any) => Promise<void>
    get: (id: string) => Promise<any>
    list: (filters?: any) => Promise<any[]>
    delete: (id: string) => Promise<void>
  }

  // AI服务API
  ai: {
    generateStory: (prompt: string, options?: any) => Promise<string>
    generateCharacter: (traits: any, options?: any) => Promise<any>
    generateWorld: (theme: string, options?: any) => Promise<any>
    analyzeText: (text: string, type: string) => Promise<any>
  }

  // 工具API
  utils: {
    validateJSON: (data: any) => boolean
    sanitizeHTML: (html: string) => string
    generateUUID: () => string
    formatDate: (date: Date, format: string) => string
  }
}

// 插件配置
export interface PluginConfig {
  get: <T>(key: string, defaultValue?: T) => T
  set: (key: string, value: any) => void
  update: (updates: Record<string, any>) => void
  reset: () => void
  export: () => Record<string, any>
  import: (config: Record<string, any>) => void
}

// 插件事件系统
export interface PluginEvents {
  emit: (event: string, data?: any) => void
  on: (event: string, handler: (data?: any) => void) => void
  off: (event: string, handler: (data?: any) => void) => void
  once: (event: string, handler: (data?: any) => void) => void
}

// 插件存储
export interface PluginStorage {
  get: <T>(key: string, defaultValue?: T) => T
  set: (key: string, value: any) => void
  delete: (key: string) => void
  clear: () => void
  keys: () => string[]
  export: () => Record<string, any>
  import: (data: Record<string, any>) => void
}

// 插件UI系统
export interface PluginUI {
  registerComponent: (name: string, component: any) => void
  unregisterComponent: (name: string) => void
  addMenuItem: (menuId: string, item: MenuItem) => void
  removeMenuItem: (menuId: string, itemId: string) => void
  addToolbarButton: (button: ToolbarButton) => void
  removeToolbarButton: (buttonId: string) => void
  showModal: (modal: ModalOptions) => void
  showNotification: (notification: NotificationOptions) => void
}

// UI组件接口
export interface MenuItem {
  id: string
  label: string
  icon?: string
  action: () => void
  submenu?: MenuItem[]
  shortcut?: string
}

export interface ToolbarButton {
  id: string
  icon: string
  label: string
  action: () => void
  tooltip?: string
  disabled?: boolean
}

export interface ModalOptions {
  title: string
  content: any
  buttons?: ModalButton[]
  size?: 'small' | 'medium' | 'large'
  closable?: boolean
}

export interface ModalButton {
  label: string
  action: () => void
  primary?: boolean
  disabled?: boolean
}

export interface NotificationOptions {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    action: () => void
  }
}

// 插件日志系统
export interface PluginLogger {
  debug: (message: string, meta?: any) => void
  info: (message: string, meta?: any) => void
  warn: (message: string, meta?: any) => void
  error: (message: string, meta?: any) => void
}

// 插件元数据
export interface PluginMetadata {
  createdAt: Date
  updatedAt: Date
  downloads: number
  rating: number
  tags: string[]
  license: string
  homepage?: string
  repository?: string
  documentation?: string
  changelog: PluginChangelog[]
}

// 插件更新日志
export interface PluginChangelog {
  version: string
  date: Date
  changes: {
    added: string[]
    changed: string[]
    deprecated: string[]
    removed: string[]
    fixed: string[]
    security: string[]
  }
}

// 插件运行时状态
export interface PluginRuntime {
  id: string
  status: 'loading' | 'active' | 'inactive' | 'error'
  loadedAt?: Date
  activatedAt?: Date
  deactivatedAt?: Date
  error?: string
  memoryUsage?: number
  executionTime?: number
}

// 插件管理系统
export class PluginManager extends EventEmitter {
  private plugins: Map<string, VCPPlugin> = new Map()
  private runtimes: Map<string, PluginRuntime> = new Map()
  private contexts: Map<string, PluginContext> = new Map()

  // 注册插件
  async registerPlugin(plugin: VCPPlugin): Promise<void> {
    // 验证插件兼容性
    if (!this.validateCompatibility(plugin)) {
      throw new Error(`Plugin ${plugin.id} is not compatible with current system`)
    }

    // 检查依赖
    if (!this.checkDependencies(plugin)) {
      throw new Error(`Plugin ${plugin.id} has unmet dependencies`)
    }

    this.plugins.set(plugin.id, plugin)

    // 创建运行时状态
    const runtime: PluginRuntime = {
      id: plugin.id,
      status: 'inactive'
    }
    this.runtimes.set(plugin.id, runtime)

    this.emit('pluginRegistered', plugin)
  }

  // 注销插件
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return

    // 如果插件正在运行，先停用
    if (this.runtimes.get(pluginId)?.status === 'active') {
      await this.deactivatePlugin(pluginId)
    }

    this.plugins.delete(pluginId)
    this.runtimes.delete(pluginId)
    this.contexts.delete(pluginId)

    this.emit('pluginUnregistered', plugin)
  }

  // 激活插件
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    const runtime = this.runtimes.get(pluginId)

    if (!plugin || !runtime) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (runtime.status === 'active') return

    try {
      runtime.status = 'loading'

      // 创建插件上下文
      const context = this.createPluginContext(plugin)
      this.contexts.set(pluginId, context)

      // 调用初始化钩子
      if (plugin.lifecycle.onInitialize) {
        await plugin.lifecycle.onInitialize(context)
      }

      // 调用激活钩子
      if (plugin.lifecycle.onActivate) {
        await plugin.lifecycle.onActivate(context)
      }

      runtime.status = 'active'
      runtime.activatedAt = new Date()

      this.emit('pluginActivated', { plugin, context })

    } catch (error) {
      runtime.status = 'error'
      runtime.error = error instanceof Error ? error.message : String(error)
      this.emit('pluginError', { plugin, error })
      throw error
    }
  }

  // 停用插件
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    const runtime = this.runtimes.get(pluginId)
    const context = this.contexts.get(pluginId)

    if (!plugin || !runtime || !context) return

    if (runtime.status !== 'active') return

    try {
      // 调用停用钩子
      if (plugin.lifecycle.onDeactivate) {
        await plugin.lifecycle.onDeactivate(context)
      }

      runtime.status = 'inactive'
      runtime.deactivatedAt = new Date()

      this.emit('pluginDeactivated', plugin)

    } catch (error) {
      runtime.status = 'error'
      runtime.error = error instanceof Error ? error.message : String(error)
      this.emit('pluginError', { plugin, error })
    }
  }

  // 获取插件
  getPlugin(pluginId: string): VCPPlugin | null {
    return this.plugins.get(pluginId) || null
  }

  // 获取所有插件
  getPlugins(): VCPPlugin[] {
    return Array.from(this.plugins.values())
  }

  // 获取活跃插件
  getActivePlugins(): VCPPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => {
      const runtime = this.runtimes.get(plugin.id)
      return runtime?.status === 'active'
    })
  }

  // 获取插件运行时状态
  getPluginRuntime(pluginId: string): PluginRuntime | null {
    return this.runtimes.get(pluginId) || null
  }

  // 获取插件上下文
  getPluginContext(pluginId: string): PluginContext | null {
    return this.contexts.get(pluginId) || null
  }

  // 验证插件兼容性
  private validateCompatibility(plugin: VCPPlugin): boolean {
    // 这里实现具体的兼容性验证逻辑
    // 检查版本要求、平台支持等
    return true
  }

  // 检查依赖关系
  private checkDependencies(plugin: VCPPlugin): boolean {
    for (const depId of plugin.compatibility.requiredPlugins) {
      const depPlugin = this.plugins.get(depId)
      if (!depPlugin) return false

      const depRuntime = this.runtimes.get(depId)
      if (!depRuntime || depRuntime.status !== 'active') return false
    }
    return true
  }

  // 创建插件上下文
  private createPluginContext(plugin: VCPPlugin): PluginContext {
    // 这里实现插件上下文的创建
    // 提供API访问、配置管理等
    return {} as PluginContext
  }

  // 执行插件方法
  async executePluginMethod<T>(
    pluginId: string,
    method: string,
    ...args: any[]
  ): Promise<T> {
    const context = this.contexts.get(pluginId)
    if (!context) {
      throw new Error(`Plugin ${pluginId} context not found`)
    }

    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    // 这里实现插件方法的动态调用
    // 通过反射或预定义接口调用

    return {} as T
  }
}

// 创建单例实例
export const pluginManager = new PluginManager()
