import { Injectable, Logger } from '@nestjs/common'
import { PluginManifest, PluginContributions } from '../plugin.types'
import {
  PluginLifecycleManager,
  PluginState,
  PluginLifecycleEvent,
  PluginLifecycleEventData
} from './plugin-lifecycle.interface'
import {
  PluginValidator,
  PluginValidationResult,
  ValidationLevel,
  PluginSandbox
} from './plugin-validation.interface'
import {
  PluginCommunication,
  PluginRPC,
  PluginEventSystem,
  PluginDataSharing,
  PluginStorage,
  PluginAPI
} from './plugin-communication.interface'
import {
  PluginMetadataManager,
  MetadataSchema,
  PLUGIN_METADATA_SCHEMAS
} from './plugin-metadata.interface'
import {
  PluginDependencyManager,
  DependencyType,
  VersionConstraintType
} from './plugin-dependencies.interface'

/**
 * 插件协议配置
 */
export interface PluginProtocolConfig {
  /** 生命周期管理 */
  lifecycleManager: PluginLifecycleManager
  /** 验证器 */
  validator: PluginValidator
  /** 沙箱环境 */
  sandbox?: PluginSandbox
  /** 通信系统 */
  communication: PluginCommunication
  /** RPC系统 */
  rpc: PluginRPC
  /** 事件系统 */
  events: PluginEventSystem
  /** 数据共享 */
  dataSharing: PluginDataSharing
  /** 存储系统 */
  storage: PluginStorage
  /** 元数据管理器 */
  metadataManager: PluginMetadataManager
  /** 依赖管理器 */
  dependencyManager: PluginDependencyManager
}

/**
 * 插件标准协议管理器
 */
@Injectable()
export class PluginProtocolManager {
  private readonly logger = new Logger(PluginProtocolManager.name)
  private readonly config: PluginProtocolConfig
  private readonly registeredSchemas = new Map<string, boolean>()

  constructor(config: PluginProtocolConfig) {
    this.config = config
    this.initializeStandardSchemas()
  }

  /**
   * 初始化标准元数据Schema
   */
  private async initializeStandardSchemas(): Promise<void> {
    try {
      for (const schema of Object.values(PLUGIN_METADATA_SCHEMAS)) {
        if (!this.registeredSchemas.has(schema.id)) {
          await this.config.metadataManager.registerSchema(schema)
          this.registeredSchemas.set(schema.id, true)
          this.logger.log(`Registered standard metadata schema: ${schema.id}`)
        }
      }
    } catch (error) {
      this.logger.error('Failed to initialize standard schemas:', error)
    }
  }

  /**
   * 验证插件清单
   */
  async validatePluginManifest(manifest: any, level: ValidationLevel = ValidationLevel.STANDARD): Promise<PluginValidationResult> {
    return this.config.validator.validateManifest(manifest, level)
  }

  /**
   * 验证插件代码
   */
  async validatePluginCode(code: string, manifest: PluginManifest, level: ValidationLevel = ValidationLevel.STANDARD): Promise<PluginValidationResult> {
    return this.config.validator.validateCode(code, manifest, level)
  }

  /**
   * 验证插件贡献点
   */
  async validatePluginContributions(contributions: PluginContributions): Promise<PluginValidationResult> {
    // 这里可以添加对贡献点的特定验证逻辑
    return {
      valid: true,
      level: ValidationLevel.BASIC,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        duration: 0,
        validatorVersion: '1.0.0'
      }
    }
  }

  /**
   * 创建插件API实例
   */
  createPluginAPI(pluginId: string): PluginAPI {
    return {
      communication: this.createPluginCommunication(pluginId),
      rpc: this.createPluginRPC(pluginId),
      events: this.createPluginEvents(pluginId),
      dataSharing: this.createPluginDataSharing(pluginId),
      storage: this.createPluginStorage(pluginId),
      getInfo: () => ({
        version: '1.0.0',
        supportedFeatures: [
          'communication',
          'rpc',
          'events',
          'data-sharing',
          'storage'
        ],
        limits: {
          maxMessageSize: 1024 * 1024, // 1MB
          maxStorageSize: 10 * 1024 * 1024, // 10MB
          maxConcurrentCalls: 10
        }
      })
    }
  }

  /**
   * 创建插件通信接口
   */
  private createPluginCommunication(pluginId: string): PluginCommunication {
    return {
      send: async (message) => {
        await this.config.communication.send({
          ...message,
          from: pluginId
        })
      },
      request: async (message, timeout) => {
        return this.config.communication.request({
          ...message,
          from: pluginId
        }, timeout)
      },
      broadcast: async (topic, payload, priority) => {
        await this.config.communication.broadcast(topic, payload, priority)
      },
      subscribe: (topic, handler) => {
        return this.config.communication.subscribe(topic, handler)
      },
      subscribeFrom: (from, topic, handler) => {
        return this.config.communication.subscribeFrom(from, topic, handler)
      },
      unsubscribe: (subscription) => {
        this.config.communication.unsubscribe(subscription)
      },
      getStats: () => {
        return this.config.communication.getStats()
      }
    }
  }

  /**
   * 创建插件RPC接口
   */
  private createPluginRPC(pluginId: string): PluginRPC {
    return {
      registerMethod: (name, handler) => {
        this.config.rpc.registerMethod(`${pluginId}.${name}`, handler)
      },
      unregisterMethod: (name) => {
        this.config.rpc.unregisterMethod(`${pluginId}.${name}`)
      },
      call: async (method, params, target, timeout) => {
        return this.config.rpc.call(method, params, target, timeout)
      },
      getRegisteredMethods: () => {
        const allMethods = this.config.rpc.getRegisteredMethods()
        return allMethods.filter(method => method.startsWith(`${pluginId}.`))
      },
      getStats: () => {
        return this.config.rpc.getStats()
      }
    }
  }

  /**
   * 创建插件事件接口
   */
  private createPluginEvents(pluginId: string): PluginEventSystem {
    return {
      emit: async (event, data, target) => {
        await this.config.events.emit(`${pluginId}.${event}`, data, target)
      },
      on: (event, handler) => {
        return this.config.events.on(`${pluginId}.${event}`, handler)
      },
      once: (event, handler) => {
        return this.config.events.once(`${pluginId}.${event}`, handler)
      },
      off: (subscription) => {
        this.config.events.off(subscription)
      },
      getStats: () => {
        return this.config.events.getStats()
      }
    }
  }

  /**
   * 创建插件数据共享接口
   */
  private createPluginDataSharing(pluginId: string): PluginDataSharing {
    return {
      setSharedData: async (key, value, scope) => {
        await this.config.dataSharing.setSharedData(`${pluginId}.${key}`, value, scope)
      },
      getSharedData: async (key, scope) => {
        return this.config.dataSharing.getSharedData(`${pluginId}.${key}`, scope)
      },
      removeSharedData: async (key, scope) => {
        await this.config.dataSharing.removeSharedData(`${pluginId}.${key}`, scope)
      },
      subscribeToData: (key, handler, scope) => {
        return this.config.dataSharing.subscribeToData(`${pluginId}.${key}`, handler, scope)
      },
      getStats: () => {
        return this.config.dataSharing.getStats()
      }
    }
  }

  /**
   * 创建插件存储接口
   */
  private createPluginStorage(pluginId: string): PluginStorage {
    return {
      set: async (key, value) => {
        await this.config.storage.set(`${pluginId}.${key}`, value)
      },
      get: async (key) => {
        return this.config.storage.get(`${pluginId}.${key}`)
      },
      remove: async (key) => {
        await this.config.storage.remove(`${pluginId}.${key}`)
      },
      has: async (key) => {
        return this.config.storage.has(`${pluginId}.${key}`)
      },
      keys: async () => {
        const allKeys = await this.config.storage.keys()
        return allKeys
          .filter(key => key.startsWith(`${pluginId}.`))
          .map(key => key.substring(pluginId.length + 1))
      },
      clear: async () => {
        const keys = await this.createPluginStorage(pluginId).keys()
        await Promise.all(keys.map(key => this.config.storage.remove(`${pluginId}.${key}`)))
      },
      getStats: async () => {
        return this.config.storage.getStats()
      }
    }
  }

  /**
   * 安装插件
   */
  async installPlugin(pluginId: string, manifest: PluginManifest, options?: any): Promise<void> {
    this.logger.log(`Installing plugin: ${pluginId}`)

    // 验证插件
    const validationResult = await this.validatePluginManifest(manifest)
    if (!validationResult.valid) {
      throw new Error(`Plugin validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`)
    }

    // 检查依赖
    if (manifest.dependencies) {
      const dependencyCheck = await this.config.dependencyManager.getPluginDependencies(pluginId)
      // 这里可以添加依赖检查逻辑
    }

    // 安装插件
    await this.config.lifecycleManager.installPlugin(pluginId, options)

    // 设置元数据
    if (manifest.metadata) {
      await this.config.metadataManager.setPluginMetadata(
        pluginId,
        'basic-info',
        manifest.metadata
      )
    }

    this.logger.log(`Plugin installed successfully: ${pluginId}`)
  }

  /**
   * 激活插件
   */
  async activatePlugin(pluginId: string, context?: any): Promise<void> {
    this.logger.log(`Activating plugin: ${pluginId}`)

    // 创建插件API
    const api = this.createPluginAPI(pluginId)

    // 激活插件
    await this.config.lifecycleManager.activatePlugin(pluginId, { ...context, api })

    this.logger.log(`Plugin activated successfully: ${pluginId}`)
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    this.logger.log(`Deactivating plugin: ${pluginId}`)

    await this.config.lifecycleManager.deactivatePlugin(pluginId)

    this.logger.log(`Plugin deactivated successfully: ${pluginId}`)
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string, options?: any): Promise<void> {
    this.logger.log(`Uninstalling plugin: ${pluginId}`)

    await this.config.lifecycleManager.uninstallPlugin(pluginId, options)

    // 清理元数据
    await this.config.metadataManager.removePluginMetadata(pluginId, 'basic-info')
    await this.config.metadataManager.removePluginMetadata(pluginId, 'ai-capabilities')
    await this.config.metadataManager.removePluginMetadata(pluginId, 'compatibility')
    await this.config.metadataManager.removePluginMetadata(pluginId, 'performance')
    await this.config.metadataManager.removePluginMetadata(pluginId, 'security')

    this.logger.log(`Plugin uninstalled successfully: ${pluginId}`)
  }

  /**
   * 获取插件状态
   */
  getPluginState(pluginId: string): PluginState {
    return this.config.lifecycleManager.getPluginState(pluginId)
  }

  /**
   * 获取插件统计信息
   */
  async getPluginStats(pluginId: string): Promise<any> {
    const state = this.getPluginState(pluginId)
    const metadata = await this.config.metadataManager.getPluginMetadata(pluginId, 'basic-info')
    const dependencies = await this.config.dependencyManager.getPluginDependencies(pluginId)

    return {
      pluginId,
      state,
      metadata,
      dependencies,
      communicationStats: this.config.communication.getStats(),
      rpcStats: this.config.rpc.getStats(),
      eventStats: this.config.events.getStats(),
      dataSharingStats: this.config.dataSharing.getStats(),
      storageStats: await this.config.storage.getStats()
    }
  }

  /**
   * 获取协议统计信息
   */
  getProtocolStats(): any {
    return {
      lifecycleStats: {
        // 这里可以添加生命周期统计
      },
      metadataStats: this.config.metadataManager.getStats(),
      dependencyStats: this.config.dependencyManager.getDependencyStats(),
      communicationStats: this.config.communication.getStats(),
      rpcStats: this.config.rpc.getStats(),
      eventStats: this.config.events.getStats(),
      dataSharingStats: this.config.dataSharing.getStats()
    }
  }
}
