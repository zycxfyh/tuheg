var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (o, m, k, k2) => {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: () => m[k],
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : (o, m, k, k2) => {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (o, v) => {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : (o, v) => {
        o['default'] = v
      })
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
var __importStar =
  (this && this.__importStar) ||
  (() => {
    var ownKeys = (o) => {
      ownKeys =
        Object.getOwnPropertyNames ||
        ((o) => {
          var ar = []
          for (var k in o) if (Object.hasOwn(o, k)) ar[ar.length] = k
          return ar
        })
      return ownKeys(o)
    }
    return (mod) => {
      if (mod && mod.__esModule) return mod
      var result = {}
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i])
      __setModuleDefault(result, mod)
      return result
    }
  })()
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var PluginSandboxService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.PluginSandboxService = void 0
const common_1 = require('@nestjs/common')
const plugin_registry_1 = require('./plugin.registry')
const vm = __importStar(require('vm'))
const fs = __importStar(require('fs'))
const path = __importStar(require('path'))
let PluginSandboxService = (PluginSandboxService_1 = class PluginSandboxService {
  pluginRegistry
  logger = new common_1.Logger(PluginSandboxService_1.name)
  sandboxes = new Map()
  constructor(pluginRegistry) {
    this.pluginRegistry = pluginRegistry
  }
  async testPluginActivation(pluginPath, options = {}) {
    const startTime = Date.now()
    try {
      const sandboxId = this.generateSandboxId()
      const context = this.createSandboxContext(sandboxId, options)
      const pluginCode = await fs.promises.readFile(pluginPath, 'utf-8')
      const script = new vm.Script(pluginCode, {
        filename: path.basename(pluginPath),
        timeout: options.timeout || 5000,
      })
      const pluginModule = { exports: {} }
      context.module = pluginModule
      context.exports = pluginModule.exports
      context.require = this.createSafeRequire(options.allowedModules || [])
      script.runInContext(context)
      const PluginClass = pluginModule.exports.default || pluginModule.exports
      if (!PluginClass) {
        throw new Error('Plugin must export a default class or function')
      }
      const mockContext = {
        pluginId: sandboxId,
        config: {},
        logger: {
          info: (message) => this.logger.log(`[Sandbox:${sandboxId}] ${message}`),
          warn: (message) => this.logger.warn(`[Sandbox:${sandboxId}] ${message}`),
          error: (message) => this.logger.error(`[Sandbox:${sandboxId}] ${message}`),
          debug: (message) => this.logger.debug(`[Sandbox:${sandboxId}] ${message}`),
        },
      }
      const plugin =
        typeof PluginClass === 'function' ? new PluginClass(mockContext) : PluginClass(mockContext)
      if (plugin.activate && typeof plugin.activate === 'function') {
        await plugin.activate(mockContext)
      }
      this.validatePluginStructure(plugin)
      const executionTime = Date.now() - startTime
      this.cleanupSandbox(sandboxId)
      return {
        success: true,
        result: {
          manifest: plugin.manifest,
          activated: true,
        },
        executionTime,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger.error(`Plugin activation test failed: ${error.message}`)
      return {
        success: false,
        error: error.message,
        executionTime,
      }
    }
  }
  async testPluginTool(pluginPath, toolId, input, options = {}) {
    const startTime = Date.now()
    try {
      const sandboxId = this.generateSandboxId()
      const context = this.createSandboxContext(sandboxId, options)
      const pluginCode = await fs.promises.readFile(pluginPath, 'utf-8')
      const script = new vm.Script(pluginCode, {
        filename: path.basename(pluginPath),
        timeout: options.timeout || 10000,
      })
      const pluginModule = { exports: {} }
      context.module = pluginModule
      context.exports = pluginModule.exports
      context.require = this.createSafeRequire(options.allowedModules || [])
      script.runInContext(context)
      const PluginClass = pluginModule.exports.default || pluginModule.exports
      const mockContext = {
        pluginId: sandboxId,
        config: {},
        logger: {
          info: (message) => this.logger.log(`[Sandbox:${sandboxId}] ${message}`),
          warn: (message) => this.logger.warn(`[Sandbox:${sandboxId}] ${message}`),
          error: (message) => this.logger.error(`[Sandbox:${sandboxId}] ${message}`),
          debug: (message) => this.logger.debug(`[Sandbox:${sandboxId}] ${message}`),
        },
      }
      const plugin =
        typeof PluginClass === 'function' ? new PluginClass(mockContext) : PluginClass(mockContext)
      if (plugin.activate) {
        await plugin.activate(mockContext)
      }
      const tool = plugin.manifest.contributes?.aiTools?.find((t) => t.id === toolId)
      if (!tool) {
        throw new Error(`Tool ${toolId} not found in plugin`)
      }
      const result = await tool.execute(input)
      const executionTime = Date.now() - startTime
      this.cleanupSandbox(sandboxId)
      return {
        success: true,
        result,
        executionTime,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger.error(`Plugin tool test failed: ${error.message}`)
      return {
        success: false,
        error: error.message,
        executionTime,
      }
    }
  }
  createSandboxContext(sandboxId, options) {
    const context = vm.createContext({
      console: {
        log: (...args) => this.logger.log(`[Sandbox:${sandboxId}]`, ...args),
        warn: (...args) => this.logger.warn(`[Sandbox:${sandboxId}]`, ...args),
        error: (...args) => this.logger.error(`[Sandbox:${sandboxId}]`, ...args),
      },
      setTimeout: (callback, delay) => {
        if (delay > (options.timeout || 5000)) {
          throw new Error('Timeout exceeded')
        }
        return setTimeout(callback, delay)
      },
      clearTimeout,
      Buffer,
      global: undefined,
      process: undefined,
      __dirname: undefined,
      __filename: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
    })
    this.sandboxes.set(sandboxId, context)
    return context
  }
  createSafeRequire(allowedModules) {
    const safeModules = new Set(['path', 'url', 'util', 'crypto', ...allowedModules])
    return (moduleId) => {
      if (!safeModules.has(moduleId)) {
        throw new Error(`Module '${moduleId}' is not allowed in sandbox`)
      }
      try {
        return require(moduleId)
      } catch (error) {
        throw new Error(`Failed to load module '${moduleId}': ${error.message}`)
      }
    }
  }
  validatePluginStructure(plugin) {
    if (!plugin.manifest) {
      throw new Error('Plugin must have a manifest')
    }
    const manifest = plugin.manifest
    if (!manifest.id || typeof manifest.id !== 'string') {
      throw new Error('Plugin manifest must have a valid id')
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Plugin manifest must have a valid name')
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Plugin manifest must have a valid version')
    }
    if (manifest.contributes) {
      if (manifest.contributes.aiTools) {
        for (const tool of manifest.contributes.aiTools) {
          if (!tool.id || !tool.name || !tool.execute) {
            throw new Error('AI tool must have id, name, and execute function')
          }
        }
      }
    }
  }
  generateSandboxId() {
    return `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  cleanupSandbox(sandboxId) {
    this.sandboxes.delete(sandboxId)
  }
  getSandboxStats() {
    return {
      activeSandboxes: this.sandboxes.size,
    }
  }
})
exports.PluginSandboxService = PluginSandboxService
exports.PluginSandboxService =
  PluginSandboxService =
  PluginSandboxService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [plugin_registry_1.PluginRegistry]),
      ],
      PluginSandboxService
    )
//# sourceMappingURL=plugin-sandbox.service.js.map
