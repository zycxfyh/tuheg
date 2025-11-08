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
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var VcpPluginSystemService_1
var _a
Object.defineProperty(exports, '__esModule', { value: true })
exports.VcpPluginSystemService = exports.PluginStatus = exports.VcpPluginType = void 0
const common_1 = require('@nestjs/common')
const event_emitter_1 = require('@nestjs/event-emitter')
var VcpPluginType
;(function (VcpPluginType) {
  VcpPluginType['STATIC'] = 'static'
  VcpPluginType['MESSAGE_PREPROCESSOR'] = 'message_preprocessor'
  VcpPluginType['SYNCHRONOUS'] = 'synchronous'
  VcpPluginType['ASYNCHRONOUS'] = 'asynchronous'
  VcpPluginType['SERVICE'] = 'service'
  VcpPluginType['HYBRID_SERVICE'] = 'hybrid_service'
})(VcpPluginType || (exports.VcpPluginType = VcpPluginType = {}))
var PluginStatus
;(function (PluginStatus) {
  PluginStatus['DISABLED'] = 'disabled'
  PluginStatus['LOADING'] = 'loading'
  PluginStatus['ACTIVE'] = 'active'
  PluginStatus['ERROR'] = 'error'
  PluginStatus['UNLOADING'] = 'unloading'
})(PluginStatus || (exports.PluginStatus = PluginStatus = {}))
let VcpPluginSystemService = (VcpPluginSystemService_1 = class VcpPluginSystemService {
  eventEmitter
  logger = new common_1.Logger(VcpPluginSystemService_1.name)
  plugins = new Map()
  pluginStatuses = new Map()
  asyncTasks = new Map()
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter
  }
  async register(plugin) {
    const pluginId = plugin.config.id
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`)
    }
    if (plugin.config.dependencies) {
      for (const depId of plugin.config.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Plugin ${pluginId} depends on ${depId} which is not registered`)
        }
      }
    }
    try {
      this.pluginStatuses.set(pluginId, PluginStatus.LOADING)
      if (plugin.init) {
        await plugin.init()
      }
      this.plugins.set(pluginId, plugin)
      this.pluginStatuses.set(pluginId, PluginStatus.ACTIVE)
      if (
        plugin.config.type === VcpPluginType.SERVICE ||
        plugin.config.type === VcpPluginType.HYBRID_SERVICE
      ) {
        const servicePlugin = plugin
        if (servicePlugin.startService) {
          await servicePlugin.startService()
        }
      }
      this.logger.log(`Plugin ${pluginId} registered successfully`)
      this.eventEmitter.emit('plugin.registered', {
        pluginId,
        type: plugin.config.type,
        timestamp: new Date(),
      })
    } catch (error) {
      this.pluginStatuses.set(pluginId, PluginStatus.ERROR)
      this.logger.error(`Failed to register plugin ${pluginId}:`, error)
      throw error
    }
  }
  async unregister(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }
    try {
      this.pluginStatuses.set(pluginId, PluginStatus.UNLOADING)
      if (
        plugin.config.type === VcpPluginType.SERVICE ||
        plugin.config.type === VcpPluginType.HYBRID_SERVICE
      ) {
        const servicePlugin = plugin
        if (servicePlugin.stopService) {
          await servicePlugin.stopService()
        }
      }
      if (plugin.destroy) {
        await plugin.destroy()
      }
      this.plugins.delete(pluginId)
      this.pluginStatuses.delete(pluginId)
      for (const [taskId, task] of this.asyncTasks.entries()) {
        if (task.pluginId === pluginId) {
          this.asyncTasks.delete(taskId)
        }
      }
      this.logger.log(`Plugin ${pluginId} unregistered successfully`)
      this.eventEmitter.emit('plugin.unregistered', {
        pluginId,
        timestamp: new Date(),
      })
    } catch (error) {
      this.logger.error(`Failed to unregister plugin ${pluginId}:`, error)
      throw error
    }
  }
  getPlugin(pluginId) {
    return this.plugins.get(pluginId)
  }
  getAllPlugins() {
    return Array.from(this.plugins.values())
  }
  getPluginsByType(type) {
    return this.getAllPlugins()
      .filter((plugin) => plugin.config.type === type)
      .sort((a, b) => b.config.priority - a.config.priority)
  }
  async executePluginChain(context, targetTypes) {
    const startTime = Date.now()
    const chainContext = new Map()
    try {
      context.chainContext = chainContext
      context.metadata = context.metadata || {}
      if (!targetTypes || targetTypes.includes(VcpPluginType.MESSAGE_PREPROCESSOR)) {
        await this.executeMessagePreprocessors(context)
      }
      if (!targetTypes || targetTypes.includes(VcpPluginType.SYNCHRONOUS)) {
        await this.executeSynchronousPlugins(context)
      }
      if (!targetTypes || targetTypes.includes(VcpPluginType.ASYNCHRONOUS)) {
        const asyncTasks = await this.executeAsynchronousPlugins(context)
        if (asyncTasks.length > 0) {
          return {
            success: true,
            executionTime: Date.now() - startTime,
            output: { asyncTasks, context },
            metadata: { asyncExecution: true },
          }
        }
      }
      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: context.output,
        metadata: context.metadata,
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  async executeMessagePreprocessors(context) {
    const preprocessors = this.getPluginsByType(VcpPluginType.MESSAGE_PREPROCESSOR)
    for (const plugin of preprocessors) {
      if (this.pluginStatuses.get(plugin.config.id) !== PluginStatus.ACTIVE) {
        continue
      }
      try {
        const preprocessor = plugin
        const result = await preprocessor.preprocessMessage(context)
        if (result.success && result.output !== undefined) {
          context.input = result.output
        }
        this.logger.debug(`Message preprocessor ${plugin.config.id} executed: ${result.success}`)
      } catch (error) {
        this.logger.warn(`Message preprocessor ${plugin.config.id} failed:`, error)
      }
    }
  }
  async executeSynchronousPlugins(context) {
    const syncPlugins = this.getPluginsByType(VcpPluginType.SYNCHRONOUS)
    for (const plugin of syncPlugins) {
      if (this.pluginStatuses.get(plugin.config.id) !== PluginStatus.ACTIVE) {
        continue
      }
      try {
        const syncPlugin = plugin
        const result = await syncPlugin.execute(context)
        if (result.success) {
          context.output = result.output
          context.metadata[plugin.config.id] = result.metadata
        }
        this.logger.debug(`Synchronous plugin ${plugin.config.id} executed: ${result.success}`)
      } catch (error) {
        this.logger.warn(`Synchronous plugin ${plugin.config.id} failed:`, error)
      }
    }
  }
  async executeAsynchronousPlugins(context) {
    const asyncPlugins = this.getPluginsByType(VcpPluginType.ASYNCHRONOUS)
    const asyncTasks = []
    for (const plugin of asyncPlugins) {
      if (this.pluginStatuses.get(plugin.config.id) !== PluginStatus.ACTIVE) {
        continue
      }
      try {
        const asyncPlugin = plugin
        const taskId = await asyncPlugin.executeAsync(context)
        this.asyncTasks.set(taskId, {
          pluginId: plugin.config.id,
          context: { ...context },
          startTime: Date.now(),
          promise: asyncPlugin.getAsyncResult(taskId),
        })
        asyncTasks.push(taskId)
        this.logger.debug(`Asynchronous plugin ${plugin.config.id} started task: ${taskId}`)
      } catch (error) {
        this.logger.warn(`Asynchronous plugin ${plugin.config.id} failed:`, error)
      }
    }
    return asyncTasks
  }
  async getAsyncTaskResult(taskId) {
    const task = this.asyncTasks.get(taskId)
    if (!task) {
      return null
    }
    try {
      const result = await task.promise
      this.asyncTasks.delete(taskId)
      return result
    } catch (error) {
      this.asyncTasks.delete(taskId)
      return {
        success: false,
        executionTime: Date.now() - task.startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
  async cancelAsyncTask(taskId) {
    const task = this.asyncTasks.get(taskId)
    if (!task) {
      return false
    }
    try {
      const plugin = this.plugins.get(task.pluginId)
      if (plugin.cancelAsyncTask) {
        const cancelled = await plugin.cancelAsyncTask(taskId)
        if (cancelled) {
          this.asyncTasks.delete(taskId)
        }
        return cancelled
      }
    } catch (error) {
      this.logger.warn(`Failed to cancel async task ${taskId}:`, error)
    }
    return false
  }
  getPluginStats() {
    const byType = {
      [VcpPluginType.STATIC]: 0,
      [VcpPluginType.MESSAGE_PREPROCESSOR]: 0,
      [VcpPluginType.SYNCHRONOUS]: 0,
      [VcpPluginType.ASYNCHRONOUS]: 0,
      [VcpPluginType.SERVICE]: 0,
      [VcpPluginType.HYBRID_SERVICE]: 0,
    }
    const byStatus = {
      [PluginStatus.DISABLED]: 0,
      [PluginStatus.LOADING]: 0,
      [PluginStatus.ACTIVE]: 0,
      [PluginStatus.ERROR]: 0,
      [PluginStatus.UNLOADING]: 0,
    }
    for (const plugin of this.plugins.values()) {
      byType[plugin.config.type]++
    }
    for (const status of this.pluginStatuses.values()) {
      byStatus[status]++
    }
    return {
      total: this.plugins.size,
      byType,
      byStatus,
      asyncTasks: this.asyncTasks.size,
    }
  }
  async healthCheck() {
    const servicePlugins = this.getAllPlugins().filter(
      (plugin) =>
        plugin.config.type === VcpPluginType.SERVICE ||
        plugin.config.type === VcpPluginType.HYBRID_SERVICE
    )
    const results = await Promise.allSettled(
      servicePlugins.map(async (plugin) => {
        const servicePlugin = plugin
        try {
          const health = await servicePlugin.healthCheck()
          return {
            pluginId: plugin.config.id,
            healthy: health.healthy,
            message: health.message,
          }
        } catch (error) {
          return {
            pluginId: plugin.config.id,
            healthy: false,
            message: error instanceof Error ? error.message : String(error),
          }
        }
      })
    )
    return results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            pluginId: 'unknown',
            healthy: false,
            message: 'Health check failed',
          }
    )
  }
  async reloadPluginConfig(pluginId, newConfig) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }
    Object.assign(plugin.config, newConfig)
    this.logger.log(`Plugin ${pluginId} configuration reloaded`)
    this.eventEmitter.emit('plugin.config.reloaded', {
      pluginId,
      newConfig,
      timestamp: new Date(),
    })
  }
})
exports.VcpPluginSystemService = VcpPluginSystemService
exports.VcpPluginSystemService =
  VcpPluginSystemService =
  VcpPluginSystemService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [
          typeof (_a =
            typeof event_emitter_1.EventEmitter2 !== 'undefined' &&
            event_emitter_1.EventEmitter2) === 'function'
            ? _a
            : Object,
        ]),
      ],
      VcpPluginSystemService
    )
//# sourceMappingURL=vcp-plugin-system.service.js.map
