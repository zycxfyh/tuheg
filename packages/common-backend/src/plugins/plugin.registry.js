'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
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
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var PluginRegistry_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.PluginRegistry = void 0
const common_1 = require('@nestjs/common')
let PluginRegistry = (PluginRegistry_1 = class PluginRegistry {
  logger = new common_1.Logger(PluginRegistry_1.name)
  plugins = new Map()
  contexts = new Map()
  async onModuleInit() {
    this.logger.log('Plugin registry initialized')
  }
  register(plugin) {
    const { id } = plugin.manifest
    if (this.plugins.has(id)) {
      this.logger.warn(`Plugin "${id}" is already registered, overwriting...`)
    }
    this.plugins.set(id, plugin)
    this.logger.log(`Plugin "${id}" (${plugin.manifest.version}) registered`)
    const context = {
      pluginId: id,
      config: {},
      logger: {
        info: (message, ...args) => {
          this.logger.log(`[${id}] ${message}`, ...args)
        },
        warn: (message, ...args) => {
          this.logger.warn(`[${id}] ${message}`, ...args)
        },
        error: (message, ...args) => {
          this.logger.error(`[${id}] ${message}`, ...args)
        },
        debug: (message, ...args) => {
          this.logger.debug(`[${id}] ${message}`, ...args)
        },
      },
    }
    this.contexts.set(id, context)
  }
  async unregister(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      this.logger.warn(`Plugin "${pluginId}" not found, skipping unregister`)
      return
    }
    if (plugin.deactivate) {
      try {
        await plugin.deactivate()
      } catch (error) {
        this.logger.error(
          `Error deactivating plugin "${pluginId}":`,
          error instanceof Error ? error.message : String(error)
        )
      }
    }
    this.plugins.delete(pluginId)
    this.contexts.delete(pluginId)
    this.logger.log(`Plugin "${pluginId}" unregistered`)
  }
  getPlugin(pluginId) {
    return this.plugins.get(pluginId)
  }
  getPlugins() {
    return Array.from(this.plugins.values())
  }
  getPluginContext(pluginId) {
    return this.contexts.get(pluginId)
  }
  async activatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`)
    }
    const context = this.contexts.get(pluginId)
    if (!context) {
      throw new Error(`Plugin context for "${pluginId}" not found`)
    }
    try {
      this.logger.log(`Activating plugin "${pluginId}"...`)
      await plugin.activate(context)
      this.logger.log(`Plugin "${pluginId}" activated successfully`)
    } catch (error) {
      this.logger.error(
        `Failed to activate plugin "${pluginId}":`,
        error instanceof Error ? error.message : String(error)
      )
      throw error
    }
  }
  getPluginsByContribution(contributionType) {
    const results = []
    for (const plugin of this.plugins.values()) {
      const contributions = plugin.manifest.contributes
      if (!contributions) {
        continue
      }
      const contribution = contributions[contributionType]
      if (contribution) {
        results.push({ plugin, contribution })
      }
    }
    return results
  }
  getAiProviderContributions() {
    return this.getPluginsByContribution('aiProviders')
  }
  getAiToolContributions() {
    return this.getPluginsByContribution('aiTools')
  }
})
exports.PluginRegistry = PluginRegistry
exports.PluginRegistry =
  PluginRegistry =
  PluginRegistry_1 =
    __decorate([(0, common_1.Injectable)()], PluginRegistry)
//# sourceMappingURL=plugin.registry.js.map
