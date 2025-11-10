// ============================================================================
// 插件系统接口 (Plugin System Interfaces)
// ============================================================================

/**
 * 插件元信息
 */
export interface PluginMetadata {
  /** 插件ID */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description: string
  /** 插件作者 */
  author: string
  /** 插件许可证 */
  license?: string
  /** 插件主页 */
  homepage?: string
  /** 插件仓库 */
  repository?: string
  /** 插件标签 */
  tags: string[]
  /** 插件图标 */
  icon?: string
  /** 插件截图 */
  screenshots?: string[]
  /** 最低系统版本要求 */
  minSystemVersion?: string
  /** 插件依赖 */
  dependencies?: Record<string, string>
  /** 插件权限 */
  permissions?: PluginPermission[]
}

/**
 * 插件权限
 */
export interface PluginPermission {
  /** 权限类型 */
  type: 'api' | 'file_system' | 'network' | 'database' | 'cache' | 'event_bus'
  /** 权限级别 */
  level: 'read' | 'write' | 'admin'
  /** 权限范围 */
  scope?: string
  /** 权限描述 */
  description: string
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 是否启用 */
  enabled: boolean
  /** 配置参数 */
  settings: Record<string, any>
  /** 环境变量 */
  environment?: Record<string, string>
  /** 资源限制 */
  resourceLimits?: {
    memory?: number // MB
    cpu?: number // CPU cores
    timeout?: number // seconds
  }
}

/**
 * 插件执行上下文
 */
export interface PluginExecutionContext {
  /** 插件ID */
  pluginId: string
  /** 执行ID */
  executionId: string
  /** 输入参数 */
  input: any
  /** 配置参数 */
  config: PluginConfig
  /** 依赖服务 */
  services: {
    cache?: any
    database?: any
    eventBus?: any
    fileStorage?: any
    monitoring?: any
  }
  /** 执行超时时间 */
  timeout?: number
}

/**
 * 插件执行结果
 */
export interface PluginExecutionResult {
  /** 执行成功 */
  success: boolean
  /** 输出结果 */
  output?: any
  /** 错误信息 */
  error?: string
  /** 执行耗时 */
  executionTime: number
  /** 执行日志 */
  logs: string[]
  /** 资源使用情况 */
  resourceUsage?: {
    memoryPeak: number
    cpuTime: number
  }
}

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycleHooks {
  /** 插件安装时调用 */
  onInstall?: (context: PluginExecutionContext) => Promise<void>
  /** 插件启用时调用 */
  onEnable?: (context: PluginExecutionContext) => Promise<void>
  /** 插件禁用时调用 */
  onDisable?: (context: PluginExecutionContext) => Promise<void>
  /** 插件卸载时调用 */
  onUninstall?: (context: PluginExecutionContext) => Promise<void>
  /** 插件升级时调用 */
  onUpgrade?: (
    fromVersion: string,
    toVersion: string,
    context: PluginExecutionContext
  ) => Promise<void>
}

/**
 * 插件接口定义
 */
export interface IPlugin {
  /** 插件元信息 */
  readonly metadata: PluginMetadata

  /** 插件配置 */
  config: PluginConfig

  /** 生命周期钩子 */
  readonly lifecycleHooks?: PluginLifecycleHooks

  /**
   * 执行插件
   * @param context 执行上下文
   */
  execute(context: PluginExecutionContext): Promise<PluginExecutionResult>

  /**
   * 验证插件配置
   * @param config 插件配置
   */
  validateConfig(config: PluginConfig): Promise<{
    valid: boolean
    errors?: string[]
  }>

  /**
   * 获取插件健康状态
   */
  getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'unknown'
    message?: string
  }>
}

/**
 * 插件注册表接口
 */
export interface IPluginRegistry {
  /**
   * 注册插件
   * @param plugin 插件实例
   */
  register(plugin: IPlugin): Promise<void>

  /**
   * 注销插件
   * @param pluginId 插件ID
   */
  unregister(pluginId: string): Promise<void>

  /**
   * 获取插件实例
   * @param pluginId 插件ID
   */
  getPlugin(pluginId: string): IPlugin | null

  /**
   * 获取所有已注册插件
   */
  getAllPlugins(): IPlugin[]

  /**
   * 根据标签查找插件
   * @param tags 标签列表
   */
  findPluginsByTags(tags: string[]): IPlugin[]

  /**
   * 检查插件是否已注册
   * @param pluginId 插件ID
   */
  isRegistered(pluginId: string): boolean
}

/**
 * 插件沙箱接口
 * 提供安全的插件执行环境
 */
export interface IPluginSandbox {
  /**
   * 在沙箱中执行插件
   * @param plugin 插件实例
   * @param context 执行上下文
   */
  executeInSandbox(plugin: IPlugin, context: PluginExecutionContext): Promise<PluginExecutionResult>

  /**
   * 创建沙箱环境
   * @param pluginId 插件ID
   */
  createSandbox(pluginId: string): Promise<PluginSandboxEnvironment>

  /**
   * 销毁沙箱环境
   * @param pluginId 插件ID
   */
  destroySandbox(pluginId: string): Promise<void>

  /**
   * 获取沙箱统计信息
   */
  getSandboxStats(): Promise<
    Record<
      string,
      {
        activeSandboxes: number
        totalExecutions: number
        failedExecutions: number
        averageExecutionTime: number
      }
    >
  >
}

/**
 * 插件沙箱环境
 */
export interface PluginSandboxEnvironment {
  /** 沙箱ID */
  sandboxId: string
  /** 插件ID */
  pluginId: string
  /** 创建时间 */
  createdAt: Date
  /** 最后活动时间 */
  lastActivity: Date
  /** 资源使用情况 */
  resourceUsage: {
    memory: number
    cpu: number
    network: number
  }
  /** 安全状态 */
  securityStatus: 'safe' | 'warning' | 'dangerous'
}

/**
 * 插件市场接口
 */
export interface IPluginMarketplace {
  /**
   * 发布插件
   * @param plugin 插件实例
   * @param packageData 插件包数据
   */
  publishPlugin(plugin: IPlugin, packageData: Buffer): Promise<string> // 返回插件包ID

  /**
   * 下载插件包
   * @param pluginId 插件ID
   * @param version 插件版本
   */
  downloadPlugin(
    pluginId: string,
    version?: string
  ): Promise<{
    metadata: PluginMetadata
    packageData: Buffer
  }>

  /**
   * 搜索插件
   * @param query 搜索查询
   * @param filters 过滤条件
   */
  searchPlugins(
    query: string,
    filters?: {
      tags?: string[]
      author?: string
      minRating?: number
    }
  ): Promise<PluginMetadata[]>

  /**
   * 获取插件详情
   * @param pluginId 插件ID
   */
  getPluginDetails(pluginId: string): Promise<{
    metadata: PluginMetadata
    rating: number
    downloadCount: number
    reviews: PluginReview[]
    versions: string[]
  }>

  /**
   * 提交插件评价
   * @param pluginId 插件ID
   * @param review 评价内容
   */
  submitReview(pluginId: string, review: PluginReview): Promise<void>
}

/**
 * 插件评价
 */
export interface PluginReview {
  /** 评价ID */
  id: string
  /** 用户ID */
  userId: string
  /** 用户名 */
  username: string
  /** 评分 (1-5) */
  rating: number
  /** 评价内容 */
  comment: string
  /** 评价时间 */
  createdAt: Date
  /** 评价有用数 */
  helpful: number
}

/**
 * 插件管理服务接口
 */
export interface IPluginManagementService {
  /**
   * 安装插件
   * @param pluginPackage 插件包数据
   */
  installPlugin(pluginPackage: Buffer): Promise<string> // 返回插件ID

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  uninstallPlugin(pluginId: string): Promise<void>

  /**
   * 启用插件
   * @param pluginId 插件ID
   */
  enablePlugin(pluginId: string): Promise<void>

  /**
   * 禁用插件
   * @param pluginId 插件ID
   */
  disablePlugin(pluginId: string): Promise<void>

  /**
   * 更新插件
   * @param pluginId 插件ID
   * @param newPackage 新插件包数据
   */
  updatePlugin(pluginId: string, newPackage: Buffer): Promise<void>

  /**
   * 配置插件
   * @param pluginId 插件ID
   * @param config 新配置
   */
  configurePlugin(pluginId: string, config: PluginConfig): Promise<void>

  /**
   * 获取插件状态
   */
  getPluginStatus(): Promise<
    Record<
      string,
      {
        status: 'installed' | 'enabled' | 'disabled' | 'error'
        version: string
        config: PluginConfig
        lastExecution?: Date
        errorMessage?: string
      }
    >
  >
}
