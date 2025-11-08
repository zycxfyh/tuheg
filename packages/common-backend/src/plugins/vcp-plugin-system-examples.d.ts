import { VcpPluginSystemService, VcpPluginType } from './vcp-plugin-system.service'
export declare class VcpPluginSystemExamples {
  private readonly pluginSystem
  constructor(pluginSystem: VcpPluginSystemService)
  examplePluginRegistration(): Promise<{
    registrationResults: (
      | {
          pluginId: string
          success: boolean
          type: VcpPluginType
          error?: undefined
        }
      | {
          pluginId: string
          success: boolean
          error: string
          type?: undefined
        }
    )[]
    stats: {
      total: number
      byType: Record<VcpPluginType, number>
      byStatus: Record<import('./vcp-plugin-system.service').PluginStatus, number>
      asyncTasks: number
    }
  }>
  examplePluginChainExecution(): Promise<
    import('./vcp-plugin-system.service').PluginExecutionResult
  >
  exampleAsyncPluginHandling(): Promise<import('./vcp-plugin-system.service').PluginExecutionResult>
  exampleServicePluginManagement(): Promise<
    {
      pluginId: string
      healthy: boolean
      message?: string
    }[]
  >
  exampleDynamicConfiguration(): Promise<import('./vcp-plugin-system.service').VcpBasePlugin[]>
  exampleTypeSpecificExecution(): Promise<Record<string, any>>
  examplePluginLifecycle(): Promise<{
    success: boolean
  } | null>
  examplePerformanceMonitoring(): Promise<{
    performanceResults: {
      name: string
      executionTime: number
      success: boolean
      metadata?: any
    }[]
    systemStats: {
      total: number
      byType: Record<VcpPluginType, number>
      byStatus: Record<import('./vcp-plugin-system.service').PluginStatus, number>
      asyncTasks: number
    }
    summary: {
      successRate: number
      avgExecutionTime: number
      totalPlugins: number
      activeAsyncTasks: number
    }
  }>
  exampleCompleteWorkflow(): Promise<Record<string, any>>
}
//# sourceMappingURL=vcp-plugin-system-examples.d.ts.map
