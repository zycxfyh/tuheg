// VCPToolBox SDK - 创世星环开发者工具包
// 主入口文件

export * from './cli/commands'
export * from './core/PluginManager'
export * from './core/TestFramework'
export * from './core/VCPProtocol'
export * from './types'
export * from './utils'

// SDK版本信息
export const SDK_VERSION = '1.0.0'
export const COMPATIBLE_PLATFORM_VERSIONS = ['1.0.0', '1.1.0', '2.0.0']

// SDK配置
export interface SDKConfig {
  registry: string
  apiEndpoint: string
  timeout: number
  debug: boolean
}

export const defaultConfig: SDKConfig = {
  registry: 'https://registry.creation-ring.com',
  apiEndpoint: 'https://api.creation-ring.com/v1',
  timeout: 30000,
  debug: false,
}

// SDK初始化
export class VCPToolBoxSDK {
  private config: SDKConfig

  constructor(config: Partial<SDKConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // 获取配置
  getConfig(): SDKConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(updates: Partial<SDKConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  // 验证平台兼容性
  isCompatible(platformVersion: string): boolean {
    return COMPATIBLE_PLATFORM_VERSIONS.includes(platformVersion)
  }

  // 获取插件模板
  getPluginTemplates(): string[] {
    return ['static', 'messagePreprocessor', 'synchronous', 'asynchronous', 'service', 'dynamic']
  }

  // 创建插件项目
  async createPlugin(name: string, type: string, options: any = {}): Promise<void> {
    // 插件创建逻辑
    console.log(`Creating ${type} plugin: ${name}`)
    // 这里会调用CLI命令
  }

  // 验证插件
  async validatePlugin(pluginPath: string): Promise<{ valid: boolean; errors: string[] }> {
    // 插件验证逻辑
    return { valid: true, errors: [] }
  }

  // 发布插件
  async publishPlugin(pluginPath: string, options: any = {}): Promise<void> {
    // 插件发布逻辑
    console.log(`Publishing plugin from: ${pluginPath}`)
  }
}

// 默认导出
export default VCPToolBoxSDK
