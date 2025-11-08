import { PluginRegistry } from './plugin.registry'
export interface SandboxOptions {
  timeout?: number
  memoryLimit?: number
  allowedModules?: string[]
  isolatedContext?: boolean
}
export interface SandboxResult {
  success: boolean
  result?: any
  error?: string
  executionTime: number
  memoryUsage?: number
}
export declare class PluginSandboxService {
  private readonly pluginRegistry
  private readonly logger
  private readonly sandboxes
  constructor(pluginRegistry: PluginRegistry)
  testPluginActivation(pluginPath: string, options?: SandboxOptions): Promise<SandboxResult>
  testPluginTool(
    pluginPath: string,
    toolId: string,
    input: any,
    options?: SandboxOptions
  ): Promise<SandboxResult>
  private createSandboxContext
  private createSafeRequire
  private validatePluginStructure
  private generateSandboxId
  private cleanupSandbox
  getSandboxStats(): {
    activeSandboxes: number
  }
}
//# sourceMappingURL=plugin-sandbox.service.d.ts.map
