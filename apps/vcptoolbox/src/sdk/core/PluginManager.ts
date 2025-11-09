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
    if (metadata?.compatibility) {
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
    if (metadata?.capabilities) {
      const _capabilities = metadata.capabilities

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
    if (metadata?.dependencies) {
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
  private createPluginAPI(_plugin: VCPPlugin): any {
    return {
      stories: {
        create: async (_data: any) => `story-${Date.now()}`,
        update: async (_id: string, _data: any) => {},
        get: async (_id: string) => ({}),
        list: async (_filters: any) => [],
        delete: async (_id: string) => {},
      },
      characters: {
        create: async (_data: any) => `character-${Date.now()}`,
        update: async (_id: string, _data: any) => {},
        get: async (_id: string) => ({}),
        list: async (_filters: any) => [],
        delete: async (_id: string) => {},
      },
      worlds: {
        create: async (_data: any) => `world-${Date.now()}`,
        update: async (_id: string, _data: any) => {},
        get: async (_id: string) => ({}),
        list: async (_filters: any) => [],
        delete: async (_id: string) => {},
      },
      ai: {
        generateStory: async (prompt: string, _options: any) => `Generated story for: ${prompt}`,
        generateCharacter: async (_traits: any, _options: any) => ({}),
        generateWorld: async (_theme: string, _options: any) => ({}),
        analyzeText: async (_text: string, _type: string) => ({}),
      },
      utils: {
        validateJSON: (_data: any) => true,
        sanitizeHTML: (html: string) => html,
        generateUUID: () => `uuid-${Date.now()}`,
        formatDate: (date: Date, _format: string) => date.toISOString(),
      },
    }
  }

  // 创建插件配置
  private createPluginConfig(_plugin: VCPPlugin): any {
    return {
      get: (_key: string, defaultValue: any) => defaultValue,
      set: (_key: string, _value: any) => {},
      update: (_updates: any) => {},
      reset: () => {},
      export: () => ({}),
      import: (_config: any) => {},
    }
  }

  // 创建插件事件
  private createPluginEvents(_plugin: VCPPlugin): any {
    return {
      emit: (_event: string, _data: any) => {},
      on: (_event: string, _handler: Function) => {},
      off: (_event: string, _handler: Function) => {},
      once: (_event: string, _handler: Function) => {},
    }
  }

  // 创建插件存储
  private createPluginStorage(_plugin: VCPPlugin): any {
    return {
      get: (_key: string, defaultValue: any) => defaultValue,
      set: (_key: string, _value: any) => {},
      delete: (_key: string) => {},
      clear: () => {},
      keys: () => [],
      export: () => ({}),
      import: (_data: any) => {},
    }
  }

  // 创建插件UI
  private createPluginUI(_plugin: VCPPlugin): any {
    return {
      registerComponent: (_name: string, _component: any) => {},
      unregisterComponent: (_name: string) => {},
      addMenuItem: (_menuId: string, _item: any) => {},
      removeMenuItem: (_menuId: string, _itemId: string) => {},
      addToolbarButton: (_button: any) => {},
      removeToolbarButton: (_buttonId: string) => {},
      showModal: (_modal: any) => {},
      showNotification: (_notification: any) => {},
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
