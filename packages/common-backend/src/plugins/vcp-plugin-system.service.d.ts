import { EventEmitter2 } from '@nestjs/event-emitter'
export declare enum VcpPluginType {
  STATIC = 'static',
  MESSAGE_PREPROCESSOR = 'message_preprocessor',
  SYNCHRONOUS = 'synchronous',
  ASYNCHRONOUS = 'asynchronous',
  SERVICE = 'service',
  HYBRID_SERVICE = 'hybrid_service',
}
export declare enum PluginStatus {
  DISABLED = 'disabled',
  LOADING = 'loading',
  ACTIVE = 'active',
  ERROR = 'error',
  UNLOADING = 'unloading',
}
export interface VcpPluginConfig {
  id: string
  name: string
  version: string
  type: VcpPluginType
  description?: string
  author?: string
  dependencies?: string[]
  config?: Record<string, unknown>
  enabled: boolean
  priority: number
}
export interface PluginContext {
  requestId: string
  userId?: string
  sessionId?: string
  input: unknown
  output?: unknown
  metadata?: Record<string, unknown>
  chainContext?: Map<string, unknown>
}
export interface PluginExecutionResult {
  success: boolean
  executionTime: number
  output?: unknown
  error?: string
  metadata?: Record<string, unknown>
}
export interface VcpBasePlugin {
  config: VcpPluginConfig
  init?(): Promise<void>
  destroy?(): Promise<void>
  getInfo(): VcpPluginConfig
}
export interface VcpStaticPlugin extends VcpBasePlugin {
  handleStaticResource?(resource: string, context: PluginContext): Promise<PluginExecutionResult>
}
export interface VcpMessagePreprocessorPlugin extends VcpBasePlugin {
  preprocessMessage(context: PluginContext): Promise<PluginExecutionResult>
}
export interface VcpSynchronousPlugin extends VcpBasePlugin {
  execute(context: PluginContext): Promise<PluginExecutionResult>
}
export interface VcpAsynchronousPlugin extends VcpBasePlugin {
  executeAsync(context: PluginContext): Promise<string>
  getAsyncResult(taskId: string): Promise<PluginExecutionResult>
  cancelAsyncTask(taskId: string): Promise<boolean>
}
export interface VcpServicePlugin extends VcpBasePlugin {
  startService(): Promise<void>
  stopService(): Promise<void>
  healthCheck(): Promise<{
    healthy: boolean
    message?: string
  }>
}
export interface VcpHybridServicePlugin
  extends VcpSynchronousPlugin,
    VcpAsynchronousPlugin,
    VcpServicePlugin {
  executeHybrid(
    context: PluginContext,
    mode: 'sync' | 'async'
  ): Promise<PluginExecutionResult | string>
}
export interface VcpPluginRegistry {
  register(plugin: VcpBasePlugin): Promise<void>
  unregister(pluginId: string): Promise<void>
  getPlugin(pluginId: string): VcpBasePlugin | undefined
  getAllPlugins(): VcpBasePlugin[]
  getPluginsByType(type: VcpPluginType): VcpBasePlugin[]
}
export declare class VcpPluginSystemService implements VcpPluginRegistry {
  private readonly eventEmitter
  private readonly logger
  private readonly plugins
  private readonly pluginStatuses
  private readonly asyncTasks
  constructor(eventEmitter: EventEmitter2)
  register(plugin: VcpBasePlugin): Promise<void>
  unregister(pluginId: string): Promise<void>
  getPlugin(pluginId: string): VcpBasePlugin | undefined
  getAllPlugins(): VcpBasePlugin[]
  getPluginsByType(type: VcpPluginType): VcpBasePlugin[]
  executePluginChain(
    context: PluginContext,
    targetTypes?: VcpPluginType[]
  ): Promise<PluginExecutionResult>
  private executeMessagePreprocessors
  private executeSynchronousPlugins
  private executeAsynchronousPlugins
  getAsyncTaskResult(taskId: string): Promise<PluginExecutionResult | null>
  cancelAsyncTask(taskId: string): Promise<boolean>
  getPluginStats(): {
    total: number
    byType: Record<VcpPluginType, number>
    byStatus: Record<PluginStatus, number>
    asyncTasks: number
  }
  healthCheck(): Promise<
    Array<{
      pluginId: string
      healthy: boolean
      message?: string
    }>
  >
  reloadPluginConfig(pluginId: string, newConfig: Partial<VcpPluginConfig>): Promise<void>
}
//# sourceMappingURL=vcp-plugin-system.service.d.ts.map
