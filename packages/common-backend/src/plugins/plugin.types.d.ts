export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  repository?: string
  contributes?: PluginContributions
  activationEvents?: string[]
  main?: string
  dependencies?: Record<string, string>
  metadata?: Record<string, unknown>
}
export interface PluginContributions {
  aiProviders?: AiProviderContribution[]
  aiTools?: AiToolContribution[]
  [key: string]: unknown
}
export interface AiProviderContribution {
  type: string
  name: string
  description: string
  factory: (config: unknown) => unknown
  defaultConfig?: Record<string, unknown>
  configSchema?: unknown
}
export interface AiToolContribution {
  id: string
  name: string
  description: string
  execute: (input: unknown) => Promise<unknown> | unknown
  inputSchema?: unknown
}
export interface PluginContext {
  pluginId: string
  config: Record<string, unknown>
  logger: {
    info: (message: string, ...args: unknown[]) => void
    warn: (message: string, ...args: unknown[]) => void
    error: (message: string, ...args: unknown[]) => void
    debug: (message: string, ...args: unknown[]) => void
  }
  [key: string]: unknown
}
export interface Plugin {
  manifest: PluginManifest
  activate(context: PluginContext): Promise<void> | void
  deactivate?(): Promise<void> | void
}
export type PluginFactory = (context: PluginContext) => Plugin
//# sourceMappingURL=plugin.types.d.ts.map
