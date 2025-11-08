var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var PluginLoader_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.PluginLoader = void 0
const common_1 = require('@nestjs/common')
const plugin_registry_1 = require('./plugin.registry')
let PluginLoader = (PluginLoader_1 = class PluginLoader {
  registry
  logger = new common_1.Logger(PluginLoader_1.name)
  constructor(registry) {
    this.registry = registry
  }
  async loadFromManifest(manifest, factory) {
    try {
      this.logger.debug(`Loading plugin "${manifest.id}" from manifest...`)
      this.validateManifest(manifest)
      const context = this.registry.getPluginContext(manifest.id)
      if (!context) {
        throw new Error(`Plugin context for "${manifest.id}" not found`)
      }
      const plugin = factory(context)
      plugin.manifest = manifest
      this.registry.register(plugin)
      const activationEvents = manifest.activationEvents ?? []
      if (activationEvents.includes('*') || activationEvents.length === 0) {
        await this.registry.activatePlugin(manifest.id)
      } else {
        this.logger.debug(
          `Plugin "${manifest.id}" will be activated on events: ${activationEvents.join(', ')}`
        )
      }
    } catch (error) {
      this.logger.error(
        `Failed to load plugin "${manifest.id}":`,
        error instanceof Error ? error.message : String(error)
      )
      throw error
    }
  }
  async loadFromConfig(config) {
    await this.loadFromManifest(config.manifest, config.factory)
  }
  validateManifest(manifest) {
    if (!manifest.id) {
      throw new Error("Plugin manifest must have an 'id' field")
    }
    if (!manifest.name) {
      throw new Error("Plugin manifest must have a 'name' field")
    }
    if (!manifest.version) {
      throw new Error("Plugin manifest must have a 'version' field")
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(manifest.id)) {
      throw new Error(
        `Plugin ID "${manifest.id}" is invalid. Must be a valid identifier (lowercase, alphanumeric, hyphens only).`
      )
    }
  }
  async unloadPlugin(pluginId) {
    await this.registry.unregister(pluginId)
  }
})
exports.PluginLoader = PluginLoader
exports.PluginLoader =
  PluginLoader =
  PluginLoader_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [plugin_registry_1.PluginRegistry]),
      ],
      PluginLoader
    )
//# sourceMappingURL=plugin.loader.js.map
