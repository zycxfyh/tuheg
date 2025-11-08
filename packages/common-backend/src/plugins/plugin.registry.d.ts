import { OnModuleInit } from '@nestjs/common'
import type { Plugin, PluginContext } from './plugin.types'
export declare class PluginRegistry implements OnModuleInit {
  private readonly logger
  private readonly plugins
  private readonly contexts
  onModuleInit(): Promise<void>
  register(plugin: Plugin): void
  unregister(pluginId: string): Promise<void>
  getPlugin(pluginId: string): Plugin | undefined
  getPlugins(): Plugin[]
  getPluginContext(pluginId: string): PluginContext | undefined
  activatePlugin(pluginId: string): Promise<void>
  getPluginsByContribution(contributionType: string): Array<{
    plugin: Plugin
    contribution: unknown
  }>
  getAiProviderContributions(): {
    plugin: Plugin
    contribution: unknown
  }[]
  getAiToolContributions(): {
    plugin: Plugin
    contribution: unknown
  }[]
}
//# sourceMappingURL=plugin.registry.d.ts.map
