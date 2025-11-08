import { Injectable, Logger } from '@nestjs/common'
import { Plugin, PluginContext, PluginManifest } from './plugin.types'
import { PluginRegistry } from './plugin.registry'
import * as vm from 'vm'
import * as fs from 'fs'
import * as path from 'path'

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

/**
 * Plugin Sandbox Service
 * 提供安全的插件测试环境
 */
@Injectable()
export class PluginSandboxService {
  private readonly logger = new Logger(PluginSandboxService.name)
  private readonly sandboxes = new Map<string, vm.Context>()

  constructor(private readonly pluginRegistry: PluginRegistry) {}

  /**
   * 在沙盒中测试插件激活
   */
  async testPluginActivation(
    pluginPath: string,
    options: SandboxOptions = {}
  ): Promise<SandboxResult> {
    const startTime = Date.now()

    try {
      const sandboxId = this.generateSandboxId()
      const context = this.createSandboxContext(sandboxId, options)

      // 读取插件代码
      const pluginCode = await fs.promises.readFile(pluginPath, 'utf-8')

      // 在沙盒中执行插件代码
      const script = new vm.Script(pluginCode, {
        filename: path.basename(pluginPath),
        timeout: options.timeout || 5000,
      })

      const pluginModule = { exports: {} }
      context.module = pluginModule
      context.exports = pluginModule.exports
      context.require = this.createSafeRequire(options.allowedModules || [])

      script.runInContext(context)

      // 获取插件类
      const PluginClass = pluginModule.exports.default || pluginModule.exports
      if (!PluginClass) {
        throw new Error('Plugin must export a default class or function')
      }

      // 创建插件实例
      const mockContext: PluginContext = {
        pluginId: sandboxId,
        config: {},
        logger: {
          info: (message: string) => this.logger.log(`[Sandbox:${sandboxId}] ${message}`),
          warn: (message: string) => this.logger.warn(`[Sandbox:${sandboxId}] ${message}`),
          error: (message: string) => this.logger.error(`[Sandbox:${sandboxId}] ${message}`),
          debug: (message: string) => this.logger.debug(`[Sandbox:${sandboxId}] ${message}`),
        },
      }

      const plugin =
        typeof PluginClass === 'function' ? new PluginClass(mockContext) : PluginClass(mockContext)

      // 测试激活
      if (plugin.activate && typeof plugin.activate === 'function') {
        await plugin.activate(mockContext)
      }

      // 验证插件结构
      this.validatePluginStructure(plugin)

      const executionTime = Date.now() - startTime

      // 清理沙盒
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

  /**
   * 在沙盒中测试插件工具执行
   */
  async testPluginTool(
    pluginPath: string,
    toolId: string,
    input: any,
    options: SandboxOptions = {}
  ): Promise<SandboxResult> {
    const startTime = Date.now()

    try {
      const sandboxId = this.generateSandboxId()
      const context = this.createSandboxContext(sandboxId, options)

      // 读取并执行插件代码
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

      // 创建插件实例
      const PluginClass = pluginModule.exports.default || pluginModule.exports
      const mockContext: PluginContext = {
        pluginId: sandboxId,
        config: {},
        logger: {
          info: (message: string) => this.logger.log(`[Sandbox:${sandboxId}] ${message}`),
          warn: (message: string) => this.logger.warn(`[Sandbox:${sandboxId}] ${message}`),
          error: (message: string) => this.logger.error(`[Sandbox:${sandboxId}] ${message}`),
          debug: (message: string) => this.logger.debug(`[Sandbox:${sandboxId}] ${message}`),
        },
      }

      const plugin =
        typeof PluginClass === 'function' ? new PluginClass(mockContext) : PluginClass(mockContext)

      // 激活插件
      if (plugin.activate) {
        await plugin.activate(mockContext)
      }

      // 查找并执行工具
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

  /**
   * 创建沙盒上下文
   */
  private createSandboxContext(sandboxId: string, options: SandboxOptions): vm.Context {
    const context = vm.createContext({
      console: {
        log: (...args: any[]) => this.logger.log(`[Sandbox:${sandboxId}]`, ...args),
        warn: (...args: any[]) => this.logger.warn(`[Sandbox:${sandboxId}]`, ...args),
        error: (...args: any[]) => this.logger.error(`[Sandbox:${sandboxId}]`, ...args),
      },
      setTimeout: (callback: Function, delay: number) => {
        if (delay > (options.timeout || 5000)) {
          throw new Error('Timeout exceeded')
        }
        return setTimeout(callback, delay)
      },
      clearTimeout,
      Buffer,
      // 限制访问全局对象
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

  /**
   * 创建安全的require函数
   */
  private createSafeRequire(allowedModules: string[]): Function {
    const safeModules = new Set(['path', 'url', 'util', 'crypto', ...allowedModules])

    return (moduleId: string) => {
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

  /**
   * 验证插件结构
   */
  private validatePluginStructure(plugin: any): void {
    if (!plugin.manifest) {
      throw new Error('Plugin must have a manifest')
    }

    const manifest: PluginManifest = plugin.manifest

    if (!manifest.id || typeof manifest.id !== 'string') {
      throw new Error('Plugin manifest must have a valid id')
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Plugin manifest must have a valid name')
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Plugin manifest must have a valid version')
    }

    // 验证贡献点
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

  /**
   * 生成沙盒ID
   */
  private generateSandboxId(): string {
    return `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理沙盒
   */
  private cleanupSandbox(sandboxId: string): void {
    this.sandboxes.delete(sandboxId)
  }

  /**
   * 获取沙盒统计信息
   */
  getSandboxStats(): { activeSandboxes: number } {
    return {
      activeSandboxes: this.sandboxes.size,
    }
  }
}
