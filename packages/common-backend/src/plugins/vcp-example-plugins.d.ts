import {
  VcpBasePlugin,
  VcpStaticPlugin,
  VcpMessagePreprocessorPlugin,
  VcpSynchronousPlugin,
  VcpAsynchronousPlugin,
  VcpServicePlugin,
  VcpHybridServicePlugin,
  VcpPluginType,
  VcpPluginConfig,
  PluginContext,
  PluginExecutionResult,
} from './vcp-plugin-system.service'
export declare class ContentFilterStaticPlugin implements VcpStaticPlugin {
  config: VcpPluginConfig
  private readonly logger
  private readonly sensitiveWords
  init(): Promise<void>
  destroy(): Promise<void>
  getInfo(): VcpPluginConfig
  handleStaticResource(resource: string, context: PluginContext): Promise<PluginExecutionResult>
}
export declare class SentimentAnalyzerPreprocessorPlugin implements VcpMessagePreprocessorPlugin {
  config: VcpPluginConfig
  private readonly logger
  init(): Promise<void>
  getInfo(): VcpPluginConfig
  preprocessMessage(context: PluginContext): Promise<PluginExecutionResult>
  private analyzeSentiment
}
export declare class KeywordExtractorSyncPlugin implements VcpSynchronousPlugin {
  config: VcpPluginConfig
  private readonly logger
  init(): Promise<void>
  getInfo(): VcpPluginConfig
  execute(context: PluginContext): Promise<PluginExecutionResult>
  private extractKeywords
}
export declare class DeepContentAnalyzerAsyncPlugin implements VcpAsynchronousPlugin {
  config: VcpPluginConfig
  private readonly logger
  private readonly activeTasks
  init(): Promise<void>
  getInfo(): VcpPluginConfig
  executeAsync(context: PluginContext): Promise<string>
  getAsyncResult(taskId: string): Promise<PluginExecutionResult>
  cancelAsyncTask(taskId: string): Promise<boolean>
  private performDeepAnalysis
  private analyzeThemes
  private analyzeEmotions
  private assessQuality
}
export declare class CleanupServicePlugin implements VcpServicePlugin {
  config: VcpPluginConfig
  private readonly logger
  private cleanupInterval?
  private isRunning
  init(): Promise<void>
  destroy(): Promise<void>
  getInfo(): VcpPluginConfig
  startService(): Promise<void>
  stopService(): Promise<void>
  healthCheck(): Promise<{
    healthy: boolean
    message?: string
  }>
  private performCleanup
}
export declare class SmartCacheHybridServicePlugin implements VcpHybridServicePlugin {
  config: VcpPluginConfig
  private readonly logger
  private readonly cache
  private preheatInterval?
  private isRunning
  init(): Promise<void>
  destroy(): Promise<void>
  getInfo(): VcpPluginConfig
  execute(context: PluginContext): Promise<PluginExecutionResult>
  executeAsync(context: PluginContext): Promise<string>
  getAsyncResult(taskId: string): Promise<PluginExecutionResult>
  cancelAsyncTask(taskId: string): Promise<boolean>
  startService(): Promise<void>
  stopService(): Promise<void>
  healthCheck(): Promise<{
    healthy: boolean
    message?: string
  }>
  executeHybrid(
    context: PluginContext,
    mode: 'sync' | 'async'
  ): Promise<PluginExecutionResult | string>
  private getFromCache
  private setInCache
  private deleteFromCache
  private hasInCache
  private performCachePrewarm
  private performPeriodicPrewarm
}
export declare class VcpExamplePluginFactory {
  static createAllExamplePlugins(): VcpBasePlugin[]
  static createPluginByType(type: VcpPluginType): VcpBasePlugin | null
}
//# sourceMappingURL=vcp-example-plugins.d.ts.map
