// ============================================================================
// 插件框架核心 - VCPToolBox 核心模块
// 实现可扩展架构，支持六种基本协议和AI叙事插件生态
// ============================================================================

import { EventEmitter } from 'events'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  type: PluginType
  capabilities: PluginCapabilities
  compatibility: PluginCompatibility
  configSchema: PluginConfigSchema
  events: PluginEventDefinition[]
  methods: PluginMethodDefinition[]
  lifecycleHooks: PluginLifecycleHooks
  metadata: {
    createdAt: Date
    updatedAt: Date
    tags: string[]
    license: string
    homepage?: string
    repository?: string
  }
}

export type PluginType =
  // VCP六种基本协议
  | 'static' // 静态插件，提供固定功能
  | 'messagePreprocessor' // 消息预处理插件
  | 'synchronous' // 同步调用插件
  | 'asynchronous' // 异步调用插件
  | 'service' // 服务型插件
  | 'dynamic' // 动态插件，可热更新
  // AI叙事专用类型
  | 'story-generator' // 故事生成器
  | 'character-creator' // 角色创建器
  | 'world-builder' // 世界构建器
  | 'narrative-logic' // 叙事逻辑
  | 'dialogue-system' // 对话系统
  | 'plot-engine' // 情节引擎
  | 'style-template' // 风格模板
  | 'export-format' // 导出格式
  | 'ui-theme' // UI主题
  | 'localization' // 本地化
  | 'analytics' // 分析工具
  | 'integration' // 第三方集成

export interface PluginCapabilities {
  storyGeneration?: StoryGenerationCapabilities
  characterCreation?: CharacterCreationCapabilities
  worldBuilding?: WorldBuildingCapabilities
  narrativeLogic?: NarrativeLogicCapabilities
  dialogueSystem?: DialogueSystemCapabilities
  plotEngine?: PlotEngineCapabilities
  styleTemplate?: StyleTemplateCapabilities
  exportFormat?: ExportFormatCapabilities
  uiTheme?: UIThemeCapabilities
  localization?: LocalizationCapabilities
  analytics?: AnalyticsCapabilities
  integration?: IntegrationCapabilities
}

export interface PluginCompatibility {
  minVersion: string
  maxVersion?: string
  requiredPlugins: string[]
  conflictingPlugins: string[]
  platforms: ('web' | 'desktop' | 'mobile')[]
  dependencies: Record<string, string>
}

export interface PluginConfigSchema {
  type: 'object'
  properties: Record<string, any>
  required?: string[]
  additionalProperties?: boolean
}

export interface PluginEventDefinition {
  name: string
  description: string
  payloadSchema: any
  async: boolean
}

export interface PluginMethodDefinition {
  name: string
  description: string
  parameters: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  returnType: string
  async: boolean
}

export interface PluginLifecycleHooks {
  onInstall?: (context: PluginContext) => Promise<void>
  onUninstall?: (context: PluginContext) => Promise<void>
  onEnable?: (context: PluginContext) => Promise<void>
  onDisable?: (context: PluginContext) => Promise<void>
  onUpdate?: (context: PluginContext, oldVersion: string) => Promise<void>
  onDestroy?: (context: PluginContext) => Promise<void>
}

export interface PluginContext {
  id: string
  config: any
  api: PluginAPI
  events: PluginEvents
  storage: PluginStorage
  logger: PluginLogger
  vcp: VCPProtocolAPI
}

export interface PluginAPI {
  stories: {
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    get: (id: string) => Promise<any>
    list: (filters?: any) => Promise<any[]>
  }
  characters: {
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    get: (id: string) => Promise<any>
    list: (filters?: any) => Promise<any[]>
  }
  worlds: {
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    get: (id: string) => Promise<any>
    list: (filters?: any) => Promise<any[]>
  }
  ai: {
    generate: (prompt: string, options?: any) => Promise<any>
    analyze: (content: string, type: string) => Promise<any>
    translate: (text: string, targetLang: string) => Promise<string>
  }
  utils: {
    validate: (data: any, schema: any) => boolean
    format: (data: any, format: string) => string
    parse: (data: any, format: string) => any
  }
}

export interface PluginEvents {
  emit: (event: string, payload: any) => void
  on: (event: string, handler: (payload: any) => void) => () => void
  once: (event: string, handler: (payload: any) => void) => void
  off: (event: string, handler?: (payload: any) => void) => void
}

export interface PluginStorage {
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<void>
  delete: (key: string) => Promise<void>
  list: (prefix?: string) => Promise<string[]>
  clear: () => Promise<void>
}

export interface PluginLogger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

export interface VCPProtocolAPI {
  callTool: (request: any) => Promise<any>
  replaceVariables: (template: string, context?: any) => Promise<string>
  memory: {
    read: (key: string) => Promise<any>
    write: (key: string, value: any) => Promise<void>
    search: (query: any) => Promise<any[]>
  }
  files: {
    upload: (file: any) => Promise<any>
    download: (fileId: string) => Promise<any>
    get: (fileId: string) => Promise<any>
    list: (query?: any) => Promise<any[]>
  }
  push: (event: string, data: any) => void
  asyncTasks: {
    create: (task: any) => Promise<string>
    get: (taskId: string) => Promise<any>
    cancel: (taskId: string) => Promise<void>
  }
}

export interface PluginInstance {
  id: string
  manifest: PluginManifest
  context: PluginContext
  state: 'installed' | 'enabled' | 'disabled' | 'error'
  error?: string
  installedAt: Date
  lastUsed?: Date
  usageCount: number
}

export class PluginFrameworkCore extends EventEmitter {
  private plugins: Map<string, PluginInstance> = new Map()
  private enabledPlugins: Set<string> = new Set()
  private pluginModules: Map<string, any> = new Map()
  private dependencyGraph: Map<string, Set<string>> = new Map()

  // ==================== 插件管理 ====================

  /**
   * 安装插件
   */
  async installPlugin(pluginModule: any, config: any = {}): Promise<string> {
    const manifest = pluginModule.manifest as PluginManifest

    if (!manifest) {
      throw new Error('Invalid plugin: missing manifest')
    }

    // 验证插件兼容性
    await this.validatePluginCompatibility(manifest)

    // 检查依赖
    await this.checkDependencies(manifest)

    // 创建插件实例
    const instanceId = `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const context = this.createPluginContext(instanceId, manifest, config)

    const instance: PluginInstance = {
      id: instanceId,
      manifest,
      context,
      state: 'installed',
      installedAt: new Date(),
      usageCount: 0,
    }

    // 存储插件模块
    this.pluginModules.set(instanceId, pluginModule)

    // 调用安装生命周期钩子
    if (manifest.lifecycleHooks.onInstall) {
      await manifest.lifecycleHooks.onInstall(context)
    }

    this.plugins.set(instanceId, instance)

    // 更新依赖图
    this.updateDependencyGraph(instanceId, manifest.compatibility.requiredPlugins)

    this.emit('pluginInstalled', instance)
    return instanceId
  }

  /**
   * 启用插件
   */
  async enablePlugin(instanceId: string): Promise<void> {
    const instance = this.plugins.get(instanceId)
    if (!instance) {
      throw new Error(`Plugin ${instanceId} not found`)
    }

    if (instance.state === 'enabled') {
      return
    }

    // 启用依赖的插件
    await this.enableDependencies(instance.manifest.compatibility.requiredPlugins)

    // 调用启用生命周期钩子
    if (instance.manifest.lifecycleHooks.onEnable) {
      await instance.manifest.lifecycleHooks.onEnable(instance.context)
    }

    instance.state = 'enabled'
    this.enabledPlugins.add(instanceId)

    this.emit('pluginEnabled', instance)
  }

  /**
   * 禁用插件
   */
  async disablePlugin(instanceId: string): Promise<void> {
    const instance = this.plugins.get(instanceId)
    if (!instance) {
      throw new Error(`Plugin ${instanceId} not found`)
    }

    if (instance.state !== 'enabled') {
      return
    }

    // 调用禁用生命周期钩子
    if (instance.manifest.lifecycleHooks.onDisable) {
      await instance.manifest.lifecycleHooks.onDisable(instance.context)
    }

    instance.state = 'disabled'
    this.enabledPlugins.delete(instanceId)

    this.emit('pluginDisabled', instance)
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(instanceId: string): Promise<void> {
    const instance = this.plugins.get(instanceId)
    if (!instance) {
      return
    }

    // 禁用插件
    if (instance.state === 'enabled') {
      await this.disablePlugin(instanceId)
    }

    // 调用卸载生命周期钩子
    if (instance.manifest.lifecycleHooks.onUninstall) {
      await instance.manifest.lifecycleHooks.onUninstall(instance.context)
    }

    // 清理资源
    this.pluginModules.delete(instanceId)
    this.plugins.delete(instanceId)

    // 更新依赖图
    this.removeFromDependencyGraph(instanceId)

    this.emit('pluginUninstalled', instance)
  }

  /**
   * 获取插件实例
   */
  getPlugin(instanceId: string): PluginInstance | undefined {
    return this.plugins.get(instanceId)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取启用的插件
   */
  getEnabledPlugins(): PluginInstance[] {
    return Array.from(this.enabledPlugins)
      .map((id) => this.plugins.get(id))
      .filter(Boolean) as PluginInstance[]
  }

  /**
   * 调用插件方法
   */
  async callPluginMethod(instanceId: string, methodName: string, ...args: any[]): Promise<any> {
    const instance = this.plugins.get(instanceId)
    if (!instance) {
      throw new Error(`Plugin ${instanceId} not found`)
    }

    if (instance.state !== 'enabled') {
      throw new Error(`Plugin ${instanceId} is not enabled`)
    }

    const pluginModule = this.pluginModules.get(instanceId)
    if (!pluginModule || typeof pluginModule[methodName] !== 'function') {
      throw new Error(`Method ${methodName} not found in plugin ${instanceId}`)
    }

    instance.usageCount++
    instance.lastUsed = new Date()

    try {
      const result = await pluginModule[methodName](instance.context, ...args)
      this.emit('pluginMethodCalled', { instanceId, methodName, args, result })
      return result
    } catch (error) {
      this.emit('pluginMethodError', { instanceId, methodName, args, error })
      throw error
    }
  }

  // ==================== 依赖管理 ====================

  /**
   * 验证插件兼容性
   */
  private async validatePluginCompatibility(manifest: PluginManifest): Promise<void> {
    // 检查版本兼容性
    const currentVersion = '1.0.0' // 应该从系统配置获取

    if (
      manifest.compatibility.minVersion &&
      this.compareVersions(currentVersion, manifest.compatibility.minVersion) < 0
    ) {
      throw new Error(`Plugin requires minimum version ${manifest.compatibility.minVersion}`)
    }

    if (
      manifest.compatibility.maxVersion &&
      this.compareVersions(currentVersion, manifest.compatibility.maxVersion) > 0
    ) {
      throw new Error(`Plugin is not compatible with version ${currentVersion}`)
    }

    // 检查平台兼容性
    const currentPlatform = 'web' // 应该从运行时检测
    if (!manifest.compatibility.platforms.includes(currentPlatform as any)) {
      throw new Error(`Plugin is not compatible with platform ${currentPlatform}`)
    }
  }

  /**
   * 检查依赖
   */
  private async checkDependencies(manifest: PluginManifest): Promise<void> {
    for (const depId of manifest.compatibility.requiredPlugins) {
      const depPlugin = Array.from(this.plugins.values()).find((p) => p.manifest.id === depId)

      if (!depPlugin) {
        throw new Error(`Required plugin ${depId} is not installed`)
      }

      if (depPlugin.state !== 'enabled') {
        throw new Error(`Required plugin ${depId} is not enabled`)
      }
    }
  }

  /**
   * 启用依赖插件
   */
  private async enableDependencies(requiredPlugins: string[]): Promise<void> {
    for (const depId of requiredPlugins) {
      const depPlugin = Array.from(this.plugins.values()).find((p) => p.manifest.id === depId)

      if (depPlugin && depPlugin.state !== 'enabled') {
        await this.enablePlugin(depPlugin.id)
      }
    }
  }

  /**
   * 更新依赖图
   */
  private updateDependencyGraph(pluginId: string, dependencies: string[]): void {
    // 清除旧依赖
    for (const [dep, dependents] of this.dependencyGraph) {
      dependents.delete(pluginId)
    }

    // 添加新依赖
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set())
      }
      this.dependencyGraph.get(dep)!.add(pluginId)
    }
  }

  /**
   * 从依赖图中移除
   */
  private removeFromDependencyGraph(pluginId: string): void {
    this.dependencyGraph.delete(pluginId)

    // 从其他插件的依赖中移除
    for (const dependents of this.dependencyGraph.values()) {
      dependents.delete(pluginId)
    }
  }

  // ==================== 上下文创建 ====================

  /**
   * 创建插件上下文
   */
  private createPluginContext(
    instanceId: string,
    manifest: PluginManifest,
    config: any
  ): PluginContext {
    return {
      id: instanceId,
      config,
      api: this.createPluginAPI(instanceId),
      events: this.createPluginEvents(instanceId),
      storage: this.createPluginStorage(instanceId),
      logger: this.createPluginLogger(instanceId),
      vcp: this.createVCPProtocolAPI(instanceId),
    }
  }

  /**
   * 创建插件API
   */
  private createPluginAPI(instanceId: string): PluginAPI {
    // 简化的API实现，实际应该连接到真实的服务
    return {
      stories: {
        create: async (data) => ({ id: 'story-1', ...data }),
        update: async (id, data) => ({ id, ...data }),
        delete: async (id) => true,
        get: async (id) => ({ id, title: 'Sample Story' }),
        list: async (filters) => [{ id: 'story-1', title: 'Sample Story' }],
      },
      characters: {
        create: async (data) => ({ id: 'char-1', ...data }),
        update: async (id, data) => ({ id, ...data }),
        delete: async (id) => true,
        get: async (id) => ({ id, name: 'Sample Character' }),
        list: async (filters) => [{ id: 'char-1', name: 'Sample Character' }],
      },
      worlds: {
        create: async (data) => ({ id: 'world-1', ...data }),
        update: async (id, data) => ({ id, ...data }),
        delete: async (id) => true,
        get: async (id) => ({ id, name: 'Sample World' }),
        list: async (filters) => [{ id: 'world-1', name: 'Sample World' }],
      },
      ai: {
        generate: async (prompt, options) => ({ result: `Generated: ${prompt}` }),
        analyze: async (content, type) => ({ analysis: `Analyzed ${type}` }),
        translate: async (text, targetLang) => `${text} (${targetLang})`,
      },
      utils: {
        validate: (data, schema) => true,
        format: (data, format) => JSON.stringify(data),
        parse: (data, format) => JSON.parse(data),
      },
    }
  }

  /**
   * 创建插件事件系统
   */
  private createPluginEvents(instanceId: string): PluginEvents {
    const eventEmitter = new EventEmitter()

    return {
      emit: (event: string, payload: any) => {
        this.emit(`plugin:${instanceId}:${event}`, payload)
        eventEmitter.emit(event, payload)
      },
      on: (event: string, handler: (payload: any) => void) => {
        eventEmitter.on(event, handler)
        return () => eventEmitter.off(event, handler)
      },
      once: (event: string, handler: (payload: any) => void) => {
        eventEmitter.once(event, handler)
      },
      off: (event: string, handler?: (payload: any) => void) => {
        if (handler) {
          eventEmitter.off(event, handler)
        } else {
          eventEmitter.removeAllListeners(event)
        }
      },
    }
  }

  /**
   * 创建插件存储
   */
  private createPluginStorage(instanceId: string): PluginStorage {
    const storage = new Map<string, any>()

    return {
      get: async (key: string) => storage.get(`${instanceId}:${key}`),
      set: async (key: string, value: any) => {
        storage.set(`${instanceId}:${key}`, value)
      },
      delete: async (key: string) => {
        storage.delete(`${instanceId}:${key}`)
      },
      list: async (prefix?: string) => {
        const keys = Array.from(storage.keys())
          .filter((key) => key.startsWith(`${instanceId}:`))
          .map((key) => key.replace(`${instanceId}:`, ''))

        return prefix ? keys.filter((key) => key.startsWith(prefix)) : keys
      },
      clear: async () => {
        for (const key of storage.keys()) {
          if (key.startsWith(`${instanceId}:`)) {
            storage.delete(key)
          }
        }
      },
    }
  }

  /**
   * 创建插件日志器
   */
  private createPluginLogger(instanceId: string): PluginLogger {
    const prefix = `[Plugin:${instanceId}]`

    return {
      debug: (message: string, ...args: any[]) => console.debug(prefix, message, ...args),
      info: (message: string, ...args: any[]) => console.info(prefix, message, ...args),
      warn: (message: string, ...args: any[]) => console.warn(prefix, message, ...args),
      error: (message: string, ...args: any[]) => console.error(prefix, message, ...args),
    }
  }

  /**
   * 创建VCP协议API
   */
  private createVCPProtocolAPI(instanceId: string): VCPProtocolAPI {
    // 简化的VCP协议实现
    return {
      callTool: async (request) => ({ result: 'Tool called', request }),
      replaceVariables: async (template, context) => template,
      memory: {
        read: async (key) => ({ key, value: 'mock_value' }),
        write: async (key, value) => true,
        search: async (query) => [{ key: 'mock', value: 'data' }],
      },
      files: {
        upload: async (file) => ({ fileId: 'file-1', ...file }),
        download: async (fileId) => ({ fileId, data: 'mock_data' }),
        get: async (fileId) => ({ fileId, metadata: {} }),
        list: async (query) => [{ fileId: 'file-1' }],
      },
      push: (event, data) => {
        this.emit(`vcp:${event}`, data)
      },
      asyncTasks: {
        create: async (task) => `task-${Date.now()}`,
        get: async (taskId) => ({ taskId, status: 'running' }),
        cancel: async (taskId) => true,
      },
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 版本比较
   */
  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(Number)
    const v2 = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0
      const num2 = v2[i] || 0

      if (num1 > num2) return 1
      if (num1 < num2) return -1
    }

    return 0
  }

  // ==================== 公共接口 ====================

  /**
   * 获取框架统计
   */
  getFrameworkStats(): {
    totalPlugins: number
    enabledPlugins: number
    disabledPlugins: number
    pluginTypes: Record<string, number>
  } {
    const plugins = Array.from(this.plugins.values())
    const pluginTypes: Record<string, number> = {}

    for (const plugin of plugins) {
      pluginTypes[plugin.manifest.type] = (pluginTypes[plugin.manifest.type] || 0) + 1
    }

    return {
      totalPlugins: plugins.length,
      enabledPlugins: this.enabledPlugins.size,
      disabledPlugins: plugins.filter((p) => p.state === 'disabled').length,
      pluginTypes,
    }
  }
}

// 创建全局实例
export const pluginFrameworkCore = new PluginFrameworkCore()

// 能力接口定义
export interface StoryGenerationCapabilities {
  supportedFormats: string[]
  maxLength: number
  supportedLanguages: string[]
  generationSpeed: 'fast' | 'normal' | 'slow'
}

export interface CharacterCreationCapabilities {
  supportedTraits: string[]
  complexityLevels: ('simple' | 'medium' | 'complex')[]
  customizationOptions: string[]
}

export interface WorldBuildingCapabilities {
  supportedGenres: string[]
  scaleOptions: ('small' | 'medium' | 'large')[]
  detailLevels: ('minimal' | 'moderate' | 'extensive')[]
}

export interface NarrativeLogicCapabilities {
  supportedLogicTypes: string[]
  branchingComplexity: number
  validationRules: string[]
}

export interface DialogueSystemCapabilities {
  supportedStyles: string[]
  emotionalRange: string[]
  contextualAwareness: boolean
}

export interface PlotEngineCapabilities {
  supportedStructures: string[]
  tensionManagement: boolean
  pacingControl: boolean
}

export interface StyleTemplateCapabilities {
  supportedGenres: string[]
  customizationLevel: 'basic' | 'advanced' | 'expert'
}

export interface ExportFormatCapabilities {
  supportedFormats: string[]
  qualityOptions: string[]
  compressionSupport: boolean
}

export interface UIThemeCapabilities {
  supportedModes: ('light' | 'dark' | 'auto')[]
  customizationOptions: string[]
}

export interface LocalizationCapabilities {
  supportedLanguages: string[]
  translationQuality: 'machine' | 'professional'
}

export interface AnalyticsCapabilities {
  metrics: string[]
  reportingFormats: string[]
  realTimeSupport: boolean
}

export interface IntegrationCapabilities {
  supportedServices: string[]
  apiCompatibility: string[]
  webhookSupport: boolean
}
