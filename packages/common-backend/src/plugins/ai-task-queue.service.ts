import { Injectable } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import type { AiTaskQueue, QueueStatus, TaskType } from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'

export interface QueueTask {
  modelId: string
  taskType: TaskType
  priority: number
  payload: any
  maxAttempts?: number
  scheduledAt?: Date
  timeout?: number
}

export interface QueueResult {
  taskId: string
  status: QueueStatus
  result?: any
  error?: string
  attempts: number
  processingTime?: number
}

@Injectable()
export class AiTaskQueueService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 任务队列管理 ====================

  /**
   * 添加任务到队列
   */
  async addToQueue(task: QueueTask): Promise<AiTaskQueue> {
    const queuedTask = await this.prisma.aiTaskQueue.create({
      data: {
        modelId: task.modelId,
        taskType: task.taskType,
        priority: task.priority,
        payload: task.payload,
        maxAttempts: task.maxAttempts || 3,
        scheduledAt: task.scheduledAt,
        status: task.scheduledAt ? 'PENDING' : 'PENDING',
      },
    })

    this.eventEmitter.emit('ai.queue.taskAdded', {
      task: queuedTask,
      config: task,
    })

    // 如果没有调度时间，立即尝试处理
    if (!task.scheduledAt) {
      setImmediate(() => this.processTask(queuedTask.id))
    }

    return queuedTask
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(filters?: {
    status?: QueueStatus[]
    modelId?: string
    taskType?: TaskType
    limit?: number
    offset?: number
  }): Promise<{
    tasks: AiTaskQueue[]
    total: number
    stats: {
      pending: number
      processing: number
      completed: number
      failed: number
    }
  }> {
    const where: any = {}

    if (filters?.status) {
      where.status = { in: filters.status }
    }

    if (filters?.modelId) {
      where.modelId = filters.modelId
    }

    if (filters?.taskType) {
      where.taskType = filters.taskType
    }

    const [tasks, total, stats] = await Promise.all([
      this.prisma.aiTaskQueue.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.aiTaskQueue.count({ where }),
      this.getQueueStats(),
    ])

    return { tasks, total, stats }
  }

  /**
   * 获取任务详情
   */
  async getQueuedTask(id: string): Promise<AiTaskQueue> {
    const task = await this.prisma.aiTaskQueue.findUnique({
      where: { id },
    })

    if (!task) {
      throw new Error('Queued task not found')
    }

    return task
  }

  /**
   * 取消队列任务
   */
  async cancelQueuedTask(id: string): Promise<void> {
    const task = await this.getQueuedTask(id)

    if (task.status === 'PROCESSING') {
      throw new Error('Cannot cancel task that is currently processing')
    }

    await this.prisma.aiTaskQueue.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    })

    this.eventEmitter.emit('ai.queue.taskCancelled', { taskId: id })
  }

  /**
   * 重试失败的任务
   */
  async retryQueuedTask(id: string): Promise<AiTaskQueue> {
    const task = await this.getQueuedTask(id)

    if (task.status !== 'FAILED') {
      throw new Error('Only failed tasks can be retried')
    }

    if (task.attempts >= task.maxAttempts) {
      throw new Error('Task has exceeded maximum retry attempts')
    }

    const updatedTask = await this.prisma.aiTaskQueue.update({
      where: { id },
      data: {
        status: 'PENDING',
        attempts: { increment: 1 },
      },
    })

    // 重新处理任务
    setImmediate(() => this.processTask(id))

    this.eventEmitter.emit('ai.queue.taskRetried', { taskId: id })

    return updatedTask
  }

  // ==================== 任务处理 ====================

  /**
   * 处理单个任务
   */
  private async processTask(taskId: string): Promise<void> {
    try {
      const task = await this.getQueuedTask(taskId)

      if (task.status !== 'PENDING') {
        return
      }

      // 更新任务状态为处理中
      await this.prisma.aiTaskQueue.update({
        where: { id: taskId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          attempts: { increment: 1 },
        },
      })

      this.eventEmitter.emit('ai.queue.taskStarted', { taskId })

      // 执行任务
      const result = await this.executeTask(task)

      // 更新任务结果
      const completedAt = new Date()
      const processingTime = task.startedAt ? completedAt.getTime() - task.startedAt.getTime() : 0

      await this.prisma.aiTaskQueue.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          result,
          completedAt,
        },
      })

      this.eventEmitter.emit('ai.queue.taskCompleted', {
        taskId,
        result,
        processingTime,
      })
    } catch (error) {
      console.error(`Task ${taskId} failed:`, error)

      // 更新任务失败状态
      await this.prisma.aiTaskQueue.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      })

      this.eventEmitter.emit('ai.queue.taskFailed', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      })

      // 检查是否需要重试
      const updatedTask = await this.getQueuedTask(taskId)
      if (updatedTask.attempts < updatedTask.maxAttempts) {
        // 延迟重试
        setTimeout(() => this.retryQueuedTask(taskId), 5000 * updatedTask.attempts)
      }
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: AiTaskQueue): Promise<any> {
    // 根据任务类型执行不同的逻辑
    switch (task.taskType) {
      case 'CREATION':
        return this.executeCreationTask(task.payload)

      case 'ANALYSIS':
        return this.executeAnalysisTask(task.payload)

      case 'OPTIMIZATION':
        return this.executeOptimizationTask(task.payload)

      case 'REVIEW':
        return this.executeReviewTask(task.payload)

      default:
        throw new Error(`Unknown task type: ${task.taskType}`)
    }
  }

  /**
   * 执行创作任务
   */
  private async executeCreationTask(payload: any): Promise<any> {
    // 这里实现具体的AI创作逻辑
    // 暂时返回模拟结果
    await new Promise((resolve) => setTimeout(resolve, 2000)) // 模拟处理时间

    return {
      type: 'creation',
      content: `Generated content based on: ${JSON.stringify(payload)}`,
      metadata: {
        model: 'gpt-4',
        tokens: 150,
        processingTime: 2000,
      },
    }
  }

  /**
   * 执行分析任务
   */
  private async executeAnalysisTask(_payload: any): Promise<any> {
    // 这里实现具体的AI分析逻辑
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      type: 'analysis',
      insights: ['发现关键模式', '识别潜在问题', '提出改进建议'],
      confidence: 0.85,
      metadata: {
        model: 'claude-3',
        tokens: 200,
        processingTime: 1500,
      },
    }
  }

  /**
   * 执行优化任务
   */
  private async executeOptimizationTask(_payload: any): Promise<any> {
    // 这里实现具体的AI优化逻辑
    await new Promise((resolve) => setTimeout(resolve, 3000))

    return {
      type: 'optimization',
      optimizations: ['减少响应时间20%', '降低成本15%', '提升准确性10%'],
      expectedImprovement: 0.25,
      metadata: {
        model: 'gpt-4-turbo',
        tokens: 300,
        processingTime: 3000,
      },
    }
  }

  /**
   * 执行审查任务
   */
  private async executeReviewTask(_payload: any): Promise<any> {
    // 这里实现具体的AI审查逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      type: 'review',
      score: 8.5,
      feedback: '内容质量良好，建议进一步优化结构',
      issues: [],
      suggestions: ['增强可读性', '添加更多示例'],
      metadata: {
        model: 'claude-3',
        tokens: 100,
        processingTime: 1000,
      },
    }
  }

  // ==================== 队列管理 ====================

  /**
   * 批量处理队列任务
   */
  async processQueueBatch(batchSize: number = 5): Promise<number> {
    const pendingTasks = await this.prisma.aiTaskQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: batchSize,
    })

    let processedCount = 0

    for (const task of pendingTasks) {
      try {
        await this.processTask(task.id)
        processedCount++
      } catch (error) {
        console.error(`Failed to process task ${task.id}:`, error)
      }
    }

    return processedCount
  }

  /**
   * 清理过期任务
   */
  async cleanupExpiredTasks(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const result = await this.prisma.aiTaskQueue.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
        completedAt: { lt: thirtyDaysAgo },
      },
    })

    return result.count
  }

  /**
   * 获取队列统计信息
   */
  private async getQueueStats(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
  }> {
    const stats = await this.prisma.aiTaskQueue.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    return {
      pending: stats.find((s) => s.status === 'PENDING')?._count.status || 0,
      processing: stats.find((s) => s.status === 'PROCESSING')?._count.status || 0,
      completed: stats.find((s) => s.status === 'COMPLETED')?._count.status || 0,
      failed: stats.find((s) => s.status === 'FAILED')?._count.status || 0,
    }
  }

  // ==================== 调度任务 ====================

  /**
   * 启动队列处理器
   */
  startQueueProcessor(intervalMs: number = 5000): void {
    setInterval(async () => {
      try {
        const processed = await this.processQueueBatch(3)
        if (processed > 0) {
          console.log(`Processed ${processed} tasks from queue`)
        }
      } catch (error) {
        console.error('Queue processor error:', error)
      }
    }, intervalMs)
  }

  /**
   * 启动清理任务
   */
  startCleanupTask(): void {
    // 每天清理一次过期任务
    setInterval(
      async () => {
        try {
          const cleaned = await this.cleanupExpiredTasks()
          if (cleaned > 0) {
            console.log(`Cleaned ${cleaned} expired tasks`)
          }
        } catch (error) {
          console.error('Cleanup task error:', error)
        }
      },
      24 * 60 * 60 * 1000
    )
  }

  /**
   * 获取队列性能指标
   */
  async getQueuePerformance(): Promise<{
    throughput: number
    avgProcessingTime: number
    successRate: number
    queueDepth: number
    errorRate: number
  }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const [recentTasks, queueStats] = await Promise.all([
      this.prisma.aiTaskQueue.findMany({
        where: {
          completedAt: { gte: oneHourAgo },
        },
        select: {
          status: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      this.getQueueStats(),
    ])

    const completedTasks = recentTasks.filter((t) => t.status === 'COMPLETED')
    const failedTasks = recentTasks.filter((t) => t.status === 'FAILED')

    const totalProcessed = completedTasks.length + failedTasks.length
    const successRate = totalProcessed > 0 ? completedTasks.length / totalProcessed : 0

    const avgProcessingTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            const processingTime = task.completedAt?.getTime() - task.startedAt?.getTime()
            return sum + processingTime
          }, 0) / completedTasks.length
        : 0

    const throughput = totalProcessed // 每小时处理的任务数
    const queueDepth = queueStats.pending + queueStats.processing
    const errorRate = totalProcessed > 0 ? failedTasks.length / totalProcessed : 0

    return {
      throughput,
      avgProcessingTime: Math.round(avgProcessingTime),
      successRate: Math.round(successRate * 100) / 100,
      queueDepth,
      errorRate: Math.round(errorRate * 100) / 100,
    }
  }
}
