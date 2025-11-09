import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { type Agent, AgentStatus, type AgentType, type Prisma } from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'

export interface AgentCapability {
  id: string
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface AgentConfig {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  tools?: string[]
  memorySize?: number
}

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== Agent 管理 ====================

  /**
   * 创建新Agent
   */
  async createAgent(data: {
    name: string
    displayName: string
    description?: string
    type: AgentType
    capabilities?: AgentCapability[]
    config?: AgentConfig
    maxConcurrency?: number
    priority?: number
  }): Promise<Agent> {
    // 检查Agent名称是否已存在
    const existingAgent = await this.prisma.agent.findUnique({
      where: { name: data.name },
    })

    if (existingAgent) {
      throw new BadRequestException('Agent name already exists')
    }

    const agent = await this.prisma.agent.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        type: data.type,
        capabilities: data.capabilities || [],
        config: data.config || {},
        maxConcurrency: data.maxConcurrency || 5,
        priority: data.priority || 1,
        status: AgentStatus.ONLINE,
      },
    })

    this.eventEmitter.emit('agent.created', agent)
    return agent
  }

  /**
   * 获取Agent详情
   */
  async getAgent(id: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        tasks: {
          include: { task: true },
          orderBy: { assignedAt: 'desc' },
          take: 10,
        },
        collaborations: {
          include: {
            participants: true,
            tasks: { include: { task: true, assignedAgent: true } },
          },
        },
      },
    })

    if (!agent) {
      throw new NotFoundException('Agent not found')
    }

    return agent
  }

  /**
   * 更新Agent
   */
  async updateAgent(
    id: string,
    data: Partial<{
      displayName: string
      description: string
      type: AgentType
      capabilities: AgentCapability[]
      config: AgentConfig
      maxConcurrency: number
      priority: number
      status: AgentStatus
    }>
  ): Promise<Agent> {
    const agent = await this.prisma.agent.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    this.eventEmitter.emit('agent.updated', agent)
    return agent
  }

  /**
   * 删除Agent
   */
  async deleteAgent(id: string): Promise<void> {
    // 检查Agent是否有正在进行的任务
    const activeTasks = await this.prisma.agentTask.count({
      where: {
        agentId: id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    })

    if (activeTasks > 0) {
      throw new BadRequestException('Cannot delete agent with active tasks')
    }

    await this.prisma.agent.delete({
      where: { id },
    })

    this.eventEmitter.emit('agent.deleted', { id })
  }

  /**
   * 获取所有Agent
   */
  async getAgents(filters?: {
    type?: AgentType
    status?: AgentStatus
    capabilities?: string[]
  }): Promise<Agent[]> {
    const where: Prisma.AgentWhereInput = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.capabilities && filters.capabilities.length > 0) {
      where.capabilities = {
        path: '$[*].id',
        array_contains: filters.capabilities,
      }
    }

    return this.prisma.agent.findMany({
      where,
      orderBy: { priority: 'desc' },
    })
  }

  /**
   * 根据能力查找合适的Agent
   */
  async findAgentsByCapability(capabilityId: string, limit = 5): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: {
        status: AgentStatus.ONLINE,
        capabilities: {
          path: '$[*].id',
          array_contains: [capabilityId],
        },
      },
      orderBy: { priority: 'desc' },
      take: limit,
    })
  }

  /**
   * 获取Agent工作负载
   */
  async getAgentWorkload(agentId: string): Promise<{
    activeTasks: number
    totalTasks: number
    completedTasks: number
    failedTasks: number
    averageCompletionTime: number
  }> {
    const [taskStats, completionTimes] = await Promise.all([
      this.prisma.agentTask.groupBy({
        by: ['status'],
        where: { agentId },
        _count: { status: true },
      }),
      this.prisma.agentTask.findMany({
        where: {
          agentId,
          status: 'COMPLETED',
          startedAt: { not: null },
          completedAt: { not: null },
        },
        select: {
          startedAt: true,
          completedAt: true,
        },
      }),
    ])

    const stats = {
      PENDING: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      FAILED: 0,
      CANCELLED: 0,
    }

    taskStats.forEach((stat) => {
      stats[stat.status] = stat._count.status
    })

    // 计算平均完成时间（分钟）
    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, task) => {
            const duration = task.completedAt!.getTime() - task.startedAt!.getTime()
            return sum + duration / (1000 * 60) // 转换为分钟
          }, 0) / completionTimes.length
        : 0

    return {
      activeTasks: stats.ASSIGNED + stats.IN_PROGRESS,
      totalTasks: Object.values(stats).reduce((sum, count) => sum + count, 0),
      completedTasks: stats.COMPLETED,
      failedTasks: stats.FAILED,
      averageCompletionTime: Math.round(avgCompletionTime * 100) / 100,
    }
  }

  /**
   * 更新Agent状态
   */
  async updateAgentStatus(id: string, status: AgentStatus): Promise<Agent> {
    const agent = await this.prisma.agent.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })

    this.eventEmitter.emit('agent.statusChanged', { agent, status })
    return agent
  }

  /**
   * 获取Agent性能指标
   */
  async getAgentMetrics(agentId: string, period: 'day' | 'week' | 'month' = 'week') {
    const now = new Date()
    const periodStart = new Date()

    switch (period) {
      case 'day':
        periodStart.setDate(now.getDate() - 1)
        break
      case 'week':
        periodStart.setDate(now.getDate() - 7)
        break
      case 'month':
        periodStart.setMonth(now.getMonth() - 1)
        break
    }

    const [taskMetrics, collaborationMetrics] = await Promise.all([
      this.prisma.agentTask.findMany({
        where: {
          agentId,
          assignedAt: { gte: periodStart },
        },
        select: {
          status: true,
          startedAt: true,
          completedAt: true,
          priority: true,
        },
      }),
      this.prisma.taskCollaboration.count({
        where: {
          assignedAgentId: agentId,
          assignedAt: { gte: periodStart },
        },
      }),
    ])

    const completedTasks = taskMetrics.filter((t) => t.status === 'COMPLETED')
    const failedTasks = taskMetrics.filter((t) => t.status === 'FAILED')

    const successRate =
      taskMetrics.length > 0 ? (completedTasks.length / taskMetrics.length) * 100 : 0

    const avgCompletionTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            if (task.startedAt && task.completedAt) {
              return sum + (task.completedAt.getTime() - task.startedAt.getTime())
            }
            return sum
          }, 0) /
          completedTasks.length /
          (1000 * 60) // 转换为分钟
        : 0

    return {
      period,
      totalTasks: taskMetrics.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      successRate: Math.round(successRate * 100) / 100,
      averageCompletionTime: Math.round(avgCompletionTime * 100) / 100,
      collaborationTasks: collaborationMetrics,
      priorityDistribution: {
        high: taskMetrics.filter((t) => t.priority >= 8).length,
        medium: taskMetrics.filter((t) => t.priority >= 4 && t.priority < 8).length,
        low: taskMetrics.filter((t) => t.priority < 4).length,
      },
    }
  }

  /**
   * Agent健康检查
   */
  async healthCheck(agentId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    message: string
    metrics: any
  }> {
    try {
      const agent = await this.getAgent(agentId)
      const workload = await this.getAgentWorkload(agentId)
      const metrics = await this.getAgentMetrics(agentId, 'day')

      // 健康检查逻辑
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      let message = 'Agent is operating normally'

      if (agent.status !== AgentStatus.ONLINE) {
        status = 'unhealthy'
        message = `Agent is ${agent.status.toLowerCase()}`
      } else if (workload.activeTasks > agent.maxConcurrency) {
        status = 'degraded'
        message = 'Agent is overloaded with tasks'
      } else if (metrics.successRate < 80) {
        status = 'degraded'
        message = 'Agent success rate is below acceptable threshold'
      }

      return {
        status,
        message,
        metrics: {
          workload,
          performance: metrics,
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        metrics: null,
      }
    }
  }

  /**
   * 批量更新Agent状态
   */
  async bulkUpdateStatus(agentIds: string[], status: AgentStatus): Promise<number> {
    const result = await this.prisma.agent.updateMany({
      where: { id: { in: agentIds } },
      data: { status, updatedAt: new Date() },
    })

    this.eventEmitter.emit('agents.bulkStatusUpdate', { agentIds, status, count: result.count })
    return result.count
  }

  /**
   * 获取Agent类型统计
   */
  async getAgentTypeStats(): Promise<Record<AgentType, number>> {
    const stats = await this.prisma.agent.groupBy({
      by: ['type'],
      _count: { type: true },
    })

    const result: Record<AgentType, number> = {
      GENERIC: 0,
      CREATION: 0,
      LOGIC: 0,
      NARRATIVE: 0,
      CRITIC: 0,
      SPECIALIST: 0,
    }

    stats.forEach((stat) => {
      result[stat.type] = stat._count.type
    })

    return result
  }
}
