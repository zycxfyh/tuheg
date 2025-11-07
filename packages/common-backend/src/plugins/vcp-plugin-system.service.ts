// 文件路径: packages/common-backend/src/plugins/vcp-plugin-system.service.ts
// 职责: VCPToolBox 插件协议系统 - 6大类型插件架构
// 借鉴思想: 静态/消息预处理器/同步/异步/服务/混合服务插件

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * 插件类型枚举 - VCPToolBox 6大插件类型
 */
export enum VcpPluginType {
  /** 静态插件 - 系统启动时加载，生命周期与应用相同 */
  STATIC = 'static',
  /** 消息预处理器插件 - 处理输入消息，修改或过滤消息内容 */
  MESSAGE_PREPROCESSOR = 'message_preprocessor',
  /** 同步插件 - 同步执行，立即返回结果 */
  SYNCHRONOUS = 'synchronous',
  /** 异步插件 - 异步执行，可能需要较长时间 */
  ASYNCHRONOUS = 'asynchronous',
  /** 服务插件 - 提供持续运行的服务，如定时任务、后台处理 */
  SERVICE = 'service',
  /** 混合服务插件 - 结合同步和异步功能的服务 */
  HYBRID_SERVICE = 'hybrid_service',
}

/**
 * 插件状态枚举
 */
export enum PluginStatus {
  DISABLED = 'disabled',
  LOADING = 'loading',
  ACTIVE = 'active',
  ERROR = 'error',
  UNLOADING = 'unloading',
}

/**
 * 插件配置
 */
export interface VcpPluginConfig {
  /** 插件ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件类型 */
  type: VcpPluginType;
  /** 插件描述 */
  description?: string;
  /** 作者信息 */
  author?: string;
  /** 依赖的插件ID列表 */
  dependencies?: string[];
  /** 配置参数 */
  config?: Record<string, unknown>;
  /** 启用状态 */
  enabled: boolean;
  /** 优先级 (越高越先执行) */
  priority: number;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 请求ID */
  requestId: string;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 输入数据 */
  input: unknown;
  /** 输出数据 */
  output?: unknown;
  /** 元数据 */
  metadata?: Record<string, unknown>;
  /** 插件链上下文 */
  chainContext?: Map<string, unknown>;
}

/**
 * 插件执行结果
 */
export interface PluginExecutionResult {
  /** 是否成功 */
  success: boolean;
  /** 执行时间 (ms) */
  executionTime: number;
  /** 输出数据 */
  output?: unknown;
  /** 错误信息 */
  error?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 基础插件接口
 */
export interface VcpBasePlugin {
  /** 插件配置 */
  config: VcpPluginConfig;

  /** 初始化插件 */
  init?(): Promise<void>;

  /** 销毁插件 */
  destroy?(): Promise<void>;

  /** 获取插件信息 */
  getInfo(): VcpPluginConfig;
}

/**
 * 静态插件接口
 */
export interface VcpStaticPlugin extends VcpBasePlugin {
  /** 处理静态资源 */
  handleStaticResource?(resource: string, context: PluginContext): Promise<PluginExecutionResult>;
}

/**
 * 消息预处理器插件接口
 */
export interface VcpMessagePreprocessorPlugin extends VcpBasePlugin {
  /** 预处理消息 */
  preprocessMessage(context: PluginContext): Promise<PluginExecutionResult>;
}

/**
 * 同步插件接口
 */
export interface VcpSynchronousPlugin extends VcpBasePlugin {
  /** 同步执行 */
  execute(context: PluginContext): Promise<PluginExecutionResult>;
}

/**
 * 异步插件接口
 */
export interface VcpAsynchronousPlugin extends VcpBasePlugin {
  /** 异步执行 */
  executeAsync(context: PluginContext): Promise<string>; // 返回任务ID

  /** 获取异步执行结果 */
  getAsyncResult(taskId: string): Promise<PluginExecutionResult>;

  /** 取消异步任务 */
  cancelAsyncTask(taskId: string): Promise<boolean>;
}

/**
 * 服务插件接口
 */
export interface VcpServicePlugin extends VcpBasePlugin {
  /** 启动服务 */
  startService(): Promise<void>;

  /** 停止服务 */
  stopService(): Promise<void>;

  /** 服务健康检查 */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}

/**
 * 混合服务插件接口
 */
export interface VcpHybridServicePlugin
  extends VcpSynchronousPlugin,
    VcpAsynchronousPlugin,
    VcpServicePlugin {
  /** 混合执行模式 */
  executeHybrid(
    context: PluginContext,
    mode: 'sync' | 'async',
  ): Promise<PluginExecutionResult | string>;
}

/**
 * 插件注册器接口
 */
export interface VcpPluginRegistry {
  /** 注册插件 */
  register(plugin: VcpBasePlugin): Promise<void>;

  /** 注销插件 */
  unregister(pluginId: string): Promise<void>;

  /** 获取插件 */
  getPlugin(pluginId: string): VcpBasePlugin | undefined;

  /** 获取所有插件 */
  getAllPlugins(): VcpBasePlugin[];

  /** 获取特定类型的插件 */
  getPluginsByType(type: VcpPluginType): VcpBasePlugin[];
}

/**
 * VCPToolBox 插件协议系统服务
 * 实现6大类型插件架构，支持插件生命周期管理和执行链
 */
@Injectable()
export class VcpPluginSystemService implements VcpPluginRegistry {
  private readonly logger = new Logger(VcpPluginSystemService.name);

  // 插件存储
  private readonly plugins = new Map<string, VcpBasePlugin>();
  private readonly pluginStatuses = new Map<string, PluginStatus>();

  // 异步任务存储
  private readonly asyncTasks = new Map<
    string,
    {
      pluginId: string;
      context: PluginContext;
      startTime: number;
      promise: Promise<PluginExecutionResult>;
    }
  >();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * 注册插件
   */
  async register(plugin: VcpBasePlugin): Promise<void> {
    const pluginId = plugin.config.id;

    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`);
    }

    // 检查依赖
    if (plugin.config.dependencies) {
      for (const depId of plugin.config.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Plugin ${pluginId} depends on ${depId} which is not registered`);
        }
      }
    }

    try {
      this.pluginStatuses.set(pluginId, PluginStatus.LOADING);

      // 初始化插件
      if (plugin.init) {
        await plugin.init();
      }

      this.plugins.set(pluginId, plugin);
      this.pluginStatuses.set(pluginId, PluginStatus.ACTIVE);

      // 启动服务插件
      if (
        plugin.config.type === VcpPluginType.SERVICE ||
        plugin.config.type === VcpPluginType.HYBRID_SERVICE
      ) {
        const servicePlugin = plugin as VcpServicePlugin;
        if (servicePlugin.startService) {
          await servicePlugin.startService();
        }
      }

      this.logger.log(`Plugin ${pluginId} registered successfully`);

      // 触发插件注册事件
      this.eventEmitter.emit('plugin.registered', {
        pluginId,
        type: plugin.config.type,
        timestamp: new Date(),
      });
    } catch (error) {
      this.pluginStatuses.set(pluginId, PluginStatus.ERROR);
      this.logger.error(`Failed to register plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * 注销插件
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`);
    }

    try {
      this.pluginStatuses.set(pluginId, PluginStatus.UNLOADING);

      // 停止服务插件
      if (
        plugin.config.type === VcpPluginType.SERVICE ||
        plugin.config.type === VcpPluginType.HYBRID_SERVICE
      ) {
        const servicePlugin = plugin as VcpServicePlugin;
        if (servicePlugin.stopService) {
          await servicePlugin.stopService();
        }
      }

      // 销毁插件
      if (plugin.destroy) {
        await plugin.destroy();
      }

      this.plugins.delete(pluginId);
      this.pluginStatuses.delete(pluginId);

      // 清理异步任务
      for (const [taskId, task] of this.asyncTasks.entries()) {
        if (task.pluginId === pluginId) {
          this.asyncTasks.delete(taskId);
        }
      }

      this.logger.log(`Plugin ${pluginId} unregistered successfully`);

      // 触发插件注销事件
      this.eventEmitter.emit('plugin.unregistered', {
        pluginId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to unregister plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): VcpBasePlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): VcpBasePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取特定类型的插件
   */
  getPluginsByType(type: VcpPluginType): VcpBasePlugin[] {
    return this.getAllPlugins()
      .filter((plugin) => plugin.config.type === type)
      .sort((a, b) => b.config.priority - a.config.priority); // 按优先级排序
  }

  /**
   * 执行插件链
   * 根据插件类型和优先级执行完整的插件链
   */
  async executePluginChain(
    context: PluginContext,
    targetTypes?: VcpPluginType[],
  ): Promise<PluginExecutionResult> {
    const startTime = Date.now();
    const chainContext = new Map<string, unknown>();

    try {
      // 更新上下文
      context.chainContext = chainContext;
      context.metadata = context.metadata || {};

      // 1. 执行消息预处理器插件
      if (!targetTypes || targetTypes.includes(VcpPluginType.MESSAGE_PREPROCESSOR)) {
        await this.executeMessagePreprocessors(context);
      }

      // 2. 执行同步插件
      if (!targetTypes || targetTypes.includes(VcpPluginType.SYNCHRONOUS)) {
        await this.executeSynchronousPlugins(context);
      }

      // 3. 处理异步插件（如果需要）
      if (!targetTypes || targetTypes.includes(VcpPluginType.ASYNCHRONOUS)) {
        const asyncTasks = await this.executeAsynchronousPlugins(context);
        if (asyncTasks.length > 0) {
          // 返回异步任务信息
          return {
            success: true,
            executionTime: Date.now() - startTime,
            output: { asyncTasks, context },
            metadata: { asyncExecution: true },
          };
        }
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: context.output,
        metadata: context.metadata,
      };
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行消息预处理器插件
   */
  private async executeMessagePreprocessors(context: PluginContext): Promise<void> {
    const preprocessors = this.getPluginsByType(VcpPluginType.MESSAGE_PREPROCESSOR);

    for (const plugin of preprocessors) {
      if (this.pluginStatuses.get(plugin.config.id) !== PluginStatus.ACTIVE) {
        continue;
      }

      try {
        const preprocessor = plugin as VcpMessagePreprocessorPlugin;
        const result = await preprocessor.preprocessMessage(context);

        if (result.success && result.output !== undefined) {
          context.input = result.output; // 修改输入
        }

        this.logger.debug(`Message preprocessor ${plugin.config.id} executed: ${result.success}`);
      } catch (error) {
        this.logger.warn(`Message preprocessor ${plugin.config.id} failed:`, error);
      }
    }
  }

  /**
   * 执行同步插件
   */
  private async executeSynchronousPlugins(context: PluginContext): Promise<void> {
    const syncPlugins = this.getPluginsByType(VcpPluginType.SYNCHRONOUS);

    for (const plugin of syncPlugins) {
      if (this.pluginStatuses.get(plugin.config.id) !== PluginStatus.ACTIVE) {
        continue;
      }

      try {
        const syncPlugin = plugin as VcpSynchronousPlugin;
        const result = await syncPlugin.execute(context);

        if (result.success) {
          context.output = result.output;
          context.metadata![plugin.config.id] = result.metadata;
        }

        this.logger.debug(`Synchronous plugin ${plugin.config.id} executed: ${result.success}`);
      } catch (error) {
        this.logger.warn(`Synchronous plugin ${plugin.config.id} failed:`, error);
      }
    }
  }

  /**
   * 执行异步插件
   */
  private async executeAsynchronousPlugins(context: PluginContext): Promise<string[]> {
    const asyncPlugins = this.getPluginsByType(VcpPluginType.ASYNCHRONOUS);
    const asyncTasks: string[] = [];

    for (const plugin of asyncPlugins) {
      if (this.pluginStatuses.get(plugin.config.id) !== PluginStatus.ACTIVE) {
        continue;
      }

      try {
        const asyncPlugin = plugin as VcpAsynchronousPlugin;
        const taskId = await asyncPlugin.executeAsync(context);

        this.asyncTasks.set(taskId, {
          pluginId: plugin.config.id,
          context: { ...context },
          startTime: Date.now(),
          promise: asyncPlugin.getAsyncResult(taskId),
        });

        asyncTasks.push(taskId);

        this.logger.debug(`Asynchronous plugin ${plugin.config.id} started task: ${taskId}`);
      } catch (error) {
        this.logger.warn(`Asynchronous plugin ${plugin.config.id} failed:`, error);
      }
    }

    return asyncTasks;
  }

  /**
   * 获取异步任务结果
   */
  async getAsyncTaskResult(taskId: string): Promise<PluginExecutionResult | null> {
    const task = this.asyncTasks.get(taskId);
    if (!task) {
      return null;
    }

    try {
      const result = await task.promise;
      this.asyncTasks.delete(taskId); // 清理已完成的任务
      return result;
    } catch (error) {
      this.asyncTasks.delete(taskId);
      return {
        success: false,
        executionTime: Date.now() - task.startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 取消异步任务
   */
  async cancelAsyncTask(taskId: string): Promise<boolean> {
    const task = this.asyncTasks.get(taskId);
    if (!task) {
      return false;
    }

    try {
      const plugin = this.plugins.get(task.pluginId) as VcpAsynchronousPlugin;
      if (plugin.cancelAsyncTask) {
        const cancelled = await plugin.cancelAsyncTask(taskId);
        if (cancelled) {
          this.asyncTasks.delete(taskId);
        }
        return cancelled;
      }
    } catch (error) {
      this.logger.warn(`Failed to cancel async task ${taskId}:`, error);
    }

    return false;
  }

  /**
   * 获取插件统计信息
   */
  getPluginStats(): {
    total: number;
    byType: Record<VcpPluginType, number>;
    byStatus: Record<PluginStatus, number>;
    asyncTasks: number;
  } {
    const byType: Record<VcpPluginType, number> = {
      [VcpPluginType.STATIC]: 0,
      [VcpPluginType.MESSAGE_PREPROCESSOR]: 0,
      [VcpPluginType.SYNCHRONOUS]: 0,
      [VcpPluginType.ASYNCHRONOUS]: 0,
      [VcpPluginType.SERVICE]: 0,
      [VcpPluginType.HYBRID_SERVICE]: 0,
    };

    const byStatus: Record<PluginStatus, number> = {
      [PluginStatus.DISABLED]: 0,
      [PluginStatus.LOADING]: 0,
      [PluginStatus.ACTIVE]: 0,
      [PluginStatus.ERROR]: 0,
      [PluginStatus.UNLOADING]: 0,
    };

    for (const plugin of this.plugins.values()) {
      byType[plugin.config.type]++;
    }

    for (const status of this.pluginStatuses.values()) {
      byStatus[status]++;
    }

    return {
      total: this.plugins.size,
      byType,
      byStatus,
      asyncTasks: this.asyncTasks.size,
    };
  }

  /**
   * 健康检查所有服务插件
   */
  async healthCheck(): Promise<Array<{ pluginId: string; healthy: boolean; message?: string }>> {
    const servicePlugins = this.getAllPlugins().filter(
      (plugin) =>
        plugin.config.type === VcpPluginType.SERVICE ||
        plugin.config.type === VcpPluginType.HYBRID_SERVICE,
    );

    const results = await Promise.allSettled(
      servicePlugins.map(async (plugin) => {
        const servicePlugin = plugin as VcpServicePlugin;
        try {
          const health = await servicePlugin.healthCheck();
          return {
            pluginId: plugin.config.id,
            healthy: health.healthy,
            message: health.message,
          };
        } catch (error) {
          return {
            pluginId: plugin.config.id,
            healthy: false,
            message: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    return results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            pluginId: 'unknown',
            healthy: false,
            message: 'Health check failed',
          },
    );
  }

  /**
   * 重新加载插件配置
   */
  async reloadPluginConfig(pluginId: string, newConfig: Partial<VcpPluginConfig>): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // 更新配置
    Object.assign(plugin.config, newConfig);

    this.logger.log(`Plugin ${pluginId} configuration reloaded`);

    // 触发配置重载事件
    this.eventEmitter.emit('plugin.config.reloaded', {
      pluginId,
      newConfig,
      timestamp: new Date(),
    });
  }
}
