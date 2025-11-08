import type { PluginFactory, PluginManifest } from './plugin.types'
import { PluginRegistry } from './plugin.registry'
export declare class PluginLoader {
  private readonly registry
  private readonly logger
  constructor(registry: PluginRegistry)
  loadFromManifest(manifest: PluginManifest, factory: PluginFactory): Promise<void>
  loadFromConfig(config: { manifest: PluginManifest; factory: PluginFactory }): Promise<void>
  private validateManifest
  unloadPlugin(pluginId: string): Promise<void>
}
//# sourceMappingURL=plugin.loader.d.ts.map
