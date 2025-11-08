// VCPToolBox SDK - 插件管理器
// 为开发者提供插件开发、测试和调试的完整工具链

import type {
  PluginContext,
  PluginMetadata,
  PluginType,
  ValidationError,
  ValidationResult,
  VCPPlugin,
} from '../types'
import { TestFramework } from './TestFramework'
import { VCPProtocol } from './VCPProtocol'

export class SDKPluginManager {
  private plugins: Map<string, VCPPlugin> = new Map()
  private metadata: Map<string, PluginMetadata> = new Map()
  private vcpProtocol: VCPProtocol
  private testFramework: TestFramework

  constructor() {
    this.vcpProtocol = new VCPProtocol()
    this.testFramework = new TestFramework()
  }

  // 注册插件
  register(plugin: VCPPlugin, metadata: PluginMetadata): void {
    this.plugins.set(plugin.id, plugin)
    this.metadata.set(plugin.id, metadata)
  }

  // 注销插件
  unregister(pluginId: string): void {
    this.plugins.delete(pluginId)
    this.metadata.delete(pluginId)
  }

  // 获取插件
  get(pluginId: string): VCPPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  // 获取所有插件
  getAll(): VCPPlugin[] {
    return Array.from(this.plugins.values())
  }

  // 获取插件元数据
  getMetadata(pluginId: string): PluginMetadata | undefined {
    return this.metadata.get(pluginId)
  }

  // 激活插件
  async activate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    const context = this.createPluginContext(plugin)
    await plugin.activate(context)
  }

  // 停用插件
  async deactivate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (typeof plugin.deactivate === 'function') {
      await plugin.deactivate()
    }
  }

  // 验证插件
  async validate(pluginId: string): Promise<ValidationResult> {
    const plugin = this.plugins.get(pluginId)
    const metadata = this.metadata.get(pluginId)

    if (!plugin) {
      return {
        valid: false,
        errors: [
          {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${pluginId} not found`,
            severity: 'error',
          },
        ],
        warnings: [],
      }
    }

    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // 基础验证
    if (!plugin.id || typeof plugin.id !== 'string') {
      errors.push({
        code: 'INVALID_ID',
        message: 'Plugin ID must be a non-empty string',
        severity: 'error',
      })
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      errors.push({
        code: 'INVALID_NAME',
        message: 'Plugin name must be a non-empty string',
        severity: 'error',
      })
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      errors.push({
        code: 'INVALID_VERSION',
        message: 'Plugin version must be a non-empty string',
        severity: 'error',
      })
    }

    // 类型验证
    const validTypes: PluginType[] = [
      'static',
      'messagePreprocessor',
      'synchronous',
      'asynchronous',
      'service',
      'dynamic',
    ]

    if (!validTypes.includes(plugin.type)) {
      errors.push({
        code: 'INVALID_TYPE',
        message: `Plugin type must be one of: ${validTypes.join(', ')}`,
        severity: 'error',
      })
    }

    // 兼容性验证
    if (metadata && metadata.compatibility) {
      const compat = metadata.compatibility

      if (!compat.vcpProtocolVersion) {
        warnings.push({
          code: 'MISSING_VCP_VERSION',
          message: 'VCP protocol version not specified',
          severity: 'warning',
        })
      }

      if (!compat.platforms || compat.platforms.length === 0) {
        warnings.push({
          code: 'MISSING_PLATFORMS',
          message: 'Supported platforms not specified',
          severity: 'warning',
        })
      }
    }

    // 功能验证
    if (metadata && metadata.capabilities) {
      const capabilities = metadata.capabilities

      // 检查必需的方法
      if (typeof plugin.activate !== 'function') {
        errors.push({
          code: 'MISSING_ACTIVATE',
          message: 'Plugin must implement activate method',
          severity: 'error',
        })
      }
    }

    // 依赖验证
    if (metadata && metadata.dependencies) {
      for (const dep of metadata.dependencies) {
        if (!this.plugins.has(dep.name) && dep.required) {
          errors.push({
            code: 'MISSING_DEPENDENCY',
            message: `Required dependency ${dep.name} not found`,
            severity: 'error',
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // 运行插件测试
  async test(pluginId: string, options: any = {}): Promise<any> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    return await this.testFramework.runTests(plugin, options)
  }

  // 分析插件性能
  async analyze(pluginId: string): Promise<any> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    return await this.testFramework.analyzePerformance(plugin)
  }

  // 创建插件上下文
  private createPluginContext(plugin: VCPPlugin): PluginContext {
    return {
      api: this.createPluginAPI(plugin),
      config: this.createPluginConfig(plugin),
      events: this.createPluginEvents(plugin),
      storage: this.createPluginStorage(plugin),
      ui: this.createPluginUI(plugin),
      logger: this.createPluginLogger(plugin),
      vcp: this.vcpProtocol.createAPI(plugin),
    }
  }

  // 创建插件API
  private createPluginAPI(plugin: VCPPlugin): any {
    return {
      stories: {
        create: async (data: any) => `story-${Date.now()}`,
        update: async (id: string, data: any) => {},
        get: async (id: string) => ({}),
        list: async (filters: any) => [],
        delete: async (id: string) => {},
      },
      characters: {
        create: async (data: any) => `character-${Date.now()}`,
        update: async (id: string, data: any) => {},
        get: async (id: string) => ({}),
        list: async (filters: any) => [],
        delete: async (id: string) => {},
      },
      worlds: {
        create: async (data: any) => `world-${Date.now()}`,
        update: async (id: string, data: any) => {},
        get: async (id: string) => ({}),
        list: async (filters: any) => [],
        delete: async (id: string) => {},
      },
      ai: {
        generateStory: async (prompt: string, options: any) => `Generated story for: ${prompt}`,
        generateCharacter: async (traits: any, options: any) => ({}),
        generateWorld: async (theme: string, options: any) => ({}),
        analyzeText: async (text: string, type: string) => ({}),
      },
      utils: {
        validateJSON: (data: any) => true,
        sanitizeHTML: (html: string) => html,
        generateUUID: () => `uuid-${Date.now()}`,
        formatDate: (date: Date, format: string) => date.toISOString(),
      },
    }
  }

  // 创建插件配置
  private createPluginConfig(plugin: VCPPlugin): any {
    return {
      get: (key: string, defaultValue: any) => defaultValue,
      set: (key: string, value: any) => {},
      update: (updates: any) => {},
      reset: () => {},
      export: () => ({}),
      import: (config: any) => {},
    }
  }

  // 创建插件事件
  private createPluginEvents(plugin: VCPPlugin): any {
    return {
      emit: (event: string, data: any) => {},
      on: (event: string, handler: Function) => {},
      off: (event: string, handler: Function) => {},
      once: (event: string, handler: Function) => {},
    }
  }

  // 创建插件存储
  private createPluginStorage(plugin: VCPPlugin): any {
    return {
      get: (key: string, defaultValue: any) => defaultValue,
      set: (key: string, value: any) => {},
      delete: (key: string) => {},
      clear: () => {},
      keys: () => [],
      export: () => ({}),
      import: (data: any) => {},
    }
  }

  // 创建插件UI
  private createPluginUI(plugin: VCPPlugin): any {
    return {
      registerComponent: (name: string, component: any) => {},
      unregisterComponent: (name: string) => {},
      addMenuItem: (menuId: string, item: any) => {},
      removeMenuItem: (menuId: string, itemId: string) => {},
      addToolbarButton: (button: any) => {},
      removeToolbarButton: (buttonId: string) => {},
      showModal: (modal: any) => {},
      showNotification: (notification: any) => {},
    }
  }

  // 创建插件日志
  private createPluginLogger(plugin: VCPPlugin): any {
    return {
      debug: (message: string, meta?: any) => console.debug(`[${plugin.id}] ${message}`, meta),
      info: (message: string, meta?: any) => console.info(`[${plugin.id}] ${message}`, meta),
      warn: (message: string, meta?: any) => console.warn(`[${plugin.id}] ${message}`, meta),
      error: (message: string, meta?: any) => console.error(`[${plugin.id}] ${message}`, meta),
    }
  }
}
