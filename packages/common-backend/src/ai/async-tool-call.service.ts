// 文件路径: packages/common-backend/src/ai/async-tool-call.service.ts
// 职责: VCPToolBox 异步工具调用服务
// 借鉴思想: 非阻塞工具调用 + 上下文感知异步结果处理

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

/**
 * 异步工具调用任务状态
 */
export enum AsyncToolCallStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

/**
 * 异步工具调用任务
 */
export interface AsyncToolCallTask {
  id: string;
  toolName: string;
  input: unknown;
  context: Record<string, unknown>;
  status: AsyncToolCallStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
  timeoutMs?: number;
  correlationId: string; // 用于跟踪相关操作
}

/**
 * 异步工具调用配置
 */
export interface AsyncToolCallConfig {
  timeoutMs?: number;
  enableWebSocket?: boolean;
  enableFilePersistence?: boolean;
  retryAttempts?: number;
}

/**
 * VCPToolBox 异步工具调用服务
 * 实现非阻塞工具调用和上下文感知的结果处理
 */
@Injectable()
export class AsyncToolCallService {
  private readonly logger = new Logger(AsyncToolCallService.name);
  private readonly activeTasks = new Map<string, AsyncToolCallTask>();
  private readonly completedTasks = new Map<string, AsyncToolCallTask>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * 异步执行工具调用
   * VCPToolBox核心: AI调用后立即返回，工具后台执行
   *
   * @param toolName 工具名称
   * @param input 工具输入参数
   * @param context 上下文信息，用于结果关联
   * @param config 异步调用配置
   * @returns 任务ID，立即返回不等待结果
   */
  async callToolAsync(
    toolName: string,
    input: unknown,
    context: Record<string, unknown> = {},
    config: AsyncToolCallConfig = {},
  ): Promise<string> {
    const taskId = uuidv4();
    const correlationId = (context.correlationId as string) || uuidv4();

    const task: AsyncToolCallTask = {
      id: taskId,
      toolName,
      input,
      context: { ...context, correlationId },
      status: AsyncToolCallStatus.PENDING,
      createdAt: new Date(),
      timeoutMs: config.timeoutMs || 30000, // 默认30秒超时
      correlationId,
    };

    this.activeTasks.set(taskId, task);

    // 立即返回任务ID，不阻塞调用者
    this.executeToolAsync(task, config).catch((error) => {
      this.logger.error(`Async tool execution failed for task ${taskId}:`, error);
      this.updateTaskStatus(taskId, AsyncToolCallStatus.FAILED, undefined, error.message);
    });

    this.logger.debug(`Async tool call initiated: ${toolName} (task: ${taskId})`);

    // 触发WebSocket推送（如果启用）
    if (config.enableWebSocket !== false) {
      this.eventEmitter.emit('async-tool-call.started', {
        taskId,
        toolName,
        correlationId,
      });
    }

    return taskId;
  }

  /**
   * 后台执行工具任务
   */
  private async executeToolAsync(
    task: AsyncToolCallTask,
    config: AsyncToolCallConfig,
  ): Promise<void> {
    const { id: taskId, toolName, input, timeoutMs } = task;

    try {
      // 更新状态为运行中
      this.updateTaskStatus(taskId, AsyncToolCallStatus.RUNNING);
      task.startedAt = new Date();

      // 创建带超时的Promise
      const toolPromise = this.executeToolByName(toolName, input);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)),
          timeoutMs,
        );
      });

      // 竞态执行：工具调用 vs 超时
      const result = await Promise.race([toolPromise, timeoutPromise]);

      // 执行成功
      this.updateTaskStatus(taskId, AsyncToolCallStatus.COMPLETED, result);

      // 触发完成事件
      this.eventEmitter.emit('async-tool-call.completed', {
        taskId,
        toolName,
        result,
        correlationId: task.correlationId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const status = errorMessage.includes('timeout')
        ? AsyncToolCallStatus.TIMEOUT
        : AsyncToolCallStatus.FAILED;

      this.updateTaskStatus(taskId, status, undefined, errorMessage);

      // 触发失败事件
      this.eventEmitter.emit('async-tool-call.failed', {
        taskId,
        toolName,
        error: errorMessage,
        correlationId: task.correlationId,
      });
    }
  }

  /**
   * 根据工具名称执行工具
   * 这里需要根据实际的工具注册机制来实现
   */
  private async executeToolByName(toolName: string, input: unknown): Promise<unknown> {
    // 这里应该有一个工具注册表，映射工具名称到实际的工具实现
    // 暂时实现一个简单的示例

    switch (toolName) {
      case 'web_search':
        return this.mockWebSearch(input);
      case 'file_operation':
        return this.mockFileOperation(input);
      case 'data_analysis':
        return this.mockDataAnalysis(input);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): AsyncToolCallTask | null {
    return this.activeTasks.get(taskId) || this.completedTasks.get(taskId) || null;
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): AsyncToolCallTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 获取指定相关ID的所有任务
   */
  getTasksByCorrelationId(correlationId: string): AsyncToolCallTask[] {
    const allTasks = [
      ...Array.from(this.activeTasks.values()),
      ...Array.from(this.completedTasks.values()),
    ];

    return allTasks.filter((task) => task.correlationId === correlationId);
  }

  /**
   * 等待任务完成（可选的同步等待方法）
   */
  async waitForTaskCompletion(
    taskId: string,
    timeoutMs: number = 30000,
  ): Promise<AsyncToolCallTask> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const task = this.getTaskStatus(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status === AsyncToolCallStatus.COMPLETED) {
        return task;
      }

      if (
        task.status === AsyncToolCallStatus.FAILED ||
        task.status === AsyncToolCallStatus.TIMEOUT
      ) {
        throw new Error(`Task ${taskId} failed: ${task.error}`);
      }

      // 等待100ms后重试
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Task ${taskId} did not complete within ${timeoutMs}ms`);
  }

  /**
   * 清理完成的任务（内存管理）
   */
  cleanupCompletedTasks(maxAgeMs: number = 3600000): number {
    // 默认1小时
    const now = Date.now();
    let cleaned = 0;

    for (const [taskId, task] of this.completedTasks.entries()) {
      if (task.completedAt && now - task.completedAt.getTime() > maxAgeMs) {
        this.completedTasks.delete(taskId);
        cleaned++;
      }
    }

    this.logger.debug(`Cleaned up ${cleaned} completed async tool tasks`);
    return cleaned;
  }

  /**
   * 更新任务状态
   */
  private updateTaskStatus(
    taskId: string,
    status: AsyncToolCallStatus,
    result?: unknown,
    error?: string,
  ): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = status;
    task.result = result;
    task.error = error;

    if (status === AsyncToolCallStatus.RUNNING) {
      task.startedAt = new Date();
    } else if (
      status === AsyncToolCallStatus.COMPLETED ||
      status === AsyncToolCallStatus.FAILED ||
      status === AsyncToolCallStatus.TIMEOUT
    ) {
      task.completedAt = new Date();

      // 将完成的任务移到completedTasks中
      this.activeTasks.delete(taskId);
      this.completedTasks.set(taskId, task);
    }

    this.logger.debug(`Task ${taskId} status updated to ${status}`);
  }

  // ===== 模拟工具实现 =====

  private async mockWebSearch(input: unknown): Promise<unknown> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      query: input,
      results: [
        { title: '示例搜索结果1', url: 'https://example.com/1', snippet: '这是搜索结果的摘要...' },
        { title: '示例搜索结果2', url: 'https://example.com/2', snippet: '另一个搜索结果...' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  private async mockFileOperation(input: unknown): Promise<unknown> {
    // 模拟文件操作延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      operation: 'read',
      file: input,
      content: '文件内容示例...',
      size: 1024,
      timestamp: new Date().toISOString(),
    };
  }

  private async mockDataAnalysis(input: unknown): Promise<unknown> {
    // 模拟数据分析延迟
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      data: input,
      analysis: {
        summary: '数据分析完成',
        insights: ['发现趋势A', '发现模式B', '建议行动C'],
        confidence: 0.85,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
