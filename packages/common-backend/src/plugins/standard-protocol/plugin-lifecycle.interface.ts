import { Observable } from 'rxjs'

/**
 * 插件状态枚举
 */
export enum PluginState {
  /** 未安装 */
  NOT_INSTALLED = 'not_installed',
  /** 已安装但未激活 */
  INSTALLED = 'installed',
  /** 正在激活 */
  ACTIVATING = 'activating',
  /** 已激活 */
  ACTIVE = 'active',
  /** 正在停用 */
  DEACTIVATING = 'deactivating',
  /** 已停用 */
  DEACTIVATED = 'deactivated',
  /** 出错 */
  ERROR = 'error',
  /** 禁用 */
  DISABLED = 'disabled'
}

/**
 * 插件生命周期事件
 */
export enum PluginLifecycleEvent {
  /** 插件安装前 */
  BEFORE_INSTALL = 'before_install',
  /** 插件安装后 */
  AFTER_INSTALL = 'after_install',
  /** 插件卸载前 */
  BEFORE_UNINSTALL = 'before_uninstall',
  /** 插件卸载后 */
  AFTER_UNINSTALL = 'after_uninstall',
  /** 插件激活前 */
  BEFORE_ACTIVATE = 'before_activate',
  /** 插件激活后 */
  AFTER_ACTIVATE = 'after_activate',
  /** 插件停用前 */
  BEFORE_DEACTIVATE = 'before_deactivate',
  /** 插件停用后 */
  AFTER_DEACTIVATE = 'after_deactivate',
  /** 插件更新前 */
  BEFORE_UPDATE = 'before_update',
  /** 插件更新后 */
  AFTER_UPDATE = 'after_update',
  /** 插件出错 */
  ON_ERROR = 'on_error'
}

/**
 * 插件生命周期事件数据
 */
export interface PluginLifecycleEventData {
  /** 插件ID */
  pluginId: string
  /** 事件类型 */
  event: PluginLifecycleEvent
  /** 时间戳 */
  timestamp: Date
  /** 事件相关数据 */
  data?: any
  /** 错误信息（如果有） */
  error?: Error
}

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycleHooks {
  /** 安装前钩子 */
  beforeInstall?: (pluginId: string) => Promise<void> | void
  /** 安装后钩子 */
  afterInstall?: (pluginId: string) => Promise<void> | void
  /** 卸载前钩子 */
  beforeUninstall?: (pluginId: string) => Promise<void> | void
  /** 卸载后钩子 */
  afterUninstall?: (pluginId: string) => Promise<void> | void
  /** 激活前钩子 */
  beforeActivate?: (pluginId: string, context: any) => Promise<void> | void
  /** 激活后钩子 */
  afterActivate?: (pluginId: string, context: any) => Promise<void> | void
  /** 停用前钩子 */
  beforeDeactivate?: (pluginId: string) => Promise<void> | void
  /** 停用后钩子 */
  afterDeactivate?: (pluginId: string) => Promise<void> | void
  /** 更新前钩子 */
  beforeUpdate?: (pluginId: string, newVersion: string) => Promise<void> | void
  /** 更新后钩子 */
  afterUpdate?: (pluginId: string, oldVersion: string, newVersion: string) => Promise<void> | void
  /** 错误处理钩子 */
  onError?: (pluginId: string, error: Error) => Promise<void> | void
}

/**
 * 插件生命周期管理器接口
 */
export interface PluginLifecycleManager {
  /** 获取插件状态 */
  getPluginState(pluginId: string): PluginState

  /** 设置插件状态 */
  setPluginState(pluginId: string, state: PluginState, error?: Error): Promise<void>

  /** 注册生命周期钩子 */
  registerHooks(pluginId: string, hooks: PluginLifecycleHooks): void

  /** 注销生命周期钩子 */
  unregisterHooks(pluginId: string): void

  /** 触发生命周期事件 */
  emitLifecycleEvent(event: PluginLifecycleEventData): Promise<void>

  /** 订阅生命周期事件 */
  subscribeToLifecycleEvents(): Observable<PluginLifecycleEventData>

  /** 执行插件安装 */
  installPlugin(pluginId: string, options?: InstallOptions): Promise<void>

  /** 执行插件卸载 */
  uninstallPlugin(pluginId: string, options?: UninstallOptions): Promise<void>

  /** 执行插件激活 */
  activatePlugin(pluginId: string, context?: any): Promise<void>

  /** 执行插件停用 */
  deactivatePlugin(pluginId: string): Promise<void>

  /** 执行插件更新 */
  updatePlugin(pluginId: string, newVersion: string): Promise<void>

  /** 检查插件依赖 */
  checkDependencies(pluginId: string): Promise<DependencyCheckResult>

  /** 解决依赖冲突 */
  resolveDependencyConflicts(pluginId: string): Promise<DependencyResolutionResult>
}

/**
 * 安装选项
 */
export interface InstallOptions {
  /** 是否强制安装（忽略依赖检查） */
  force?: boolean
  /** 是否跳过激活 */
  skipActivation?: boolean
  /** 自定义配置 */
  config?: Record<string, any>
  /** 超时时间（毫秒） */
  timeout?: number
}

/**
 * 卸载选项
 */
export interface UninstallOptions {
  /** 是否强制卸载（忽略依赖关系） */
  force?: boolean
  /** 是否保留配置 */
  keepConfig?: boolean
  /** 超时时间（毫秒） */
  timeout?: number
}

/**
 * 依赖检查结果
 */
export interface DependencyCheckResult {
  /** 是否满足依赖 */
  satisfied: boolean
  /** 缺失的依赖 */
  missing: string[]
  /** 冲突的依赖 */
  conflicts: Array<{
    dependency: string
    currentVersion: string
    requiredVersion: string
  }>
  /** 警告信息 */
  warnings: string[]
}

/**
 * 依赖解决结果
 */
export interface DependencyResolutionResult {
  /** 是否成功解决 */
  resolved: boolean
  /** 需要安装的依赖 */
  toInstall: string[]
  /** 需要更新的依赖 */
  toUpdate: Array<{
    dependency: string
    fromVersion: string
    toVersion: string
  }>
  /** 无法解决的冲突 */
  unresolvedConflicts: Array<{
    dependency: string
    versions: string[]
  }>
}
