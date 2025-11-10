import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import {
  type AgentCollaboration,
  type AgentConversation,
  CollaborationStatus,
  CollaborationType,
  MessageType,
  type TaskCollaboration,
} from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'
import type { AgentService } from './agent.service'
import type { TaskService } from './task.service'

export interface CollaborationConfig {
  goal: string
  strategy?: string
  maxParticipants?: number
  autoTaskAssignment?: boolean
  communicationProtocol?: 'broadcast' | 'round-robin' | 'leader-only'
}

export interface CollaborationResult {
  collaborationId: string
  status: CollaborationStatus
  totalTasks: number
  completedTasks: number
  participants: string[]
  duration: number
  outcome: any
}

@Injectable()
export class CollaborationService {
  constructor(
    private prisma: PrismaService,
    private agentService: AgentService,
    private taskService: TaskService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 协作管理 ====================

  /**
   * 创建新的协作
   */
  async createCollaboration(
    leaderId: string,
    participantIds: string[],
    config: CollaborationConfig
  ): Promise<AgentCollaboration> {
    // 验证所有参与者存在
    const [leader, participants] = await Promise.all([
      this.agentService.getAgent(leaderId),
      Promise.all(participantIds.map((id) => this.agentService.getAgent(id))),
    ])

    if (participants.length === 0) {
      throw new BadRequestException('At least one participant is required')
    }

    // 检查领导者是否在线
    if (leader.status !== 'ONLINE') {
      throw new BadRequestException('Collaboration leader must be online')
    }

    // 创建协作
    const collaboration = await this.prisma.agentCollaboration.create({
      data: {
        name: `Collaboration-${Date.now()}`,
        description: `Collaboration led by ${leader.displayName}`,
        type: CollaborationType.TASK_BASED,
        goal: config.goal,
        strategy: config.strategy,
        config: {
          maxParticipants: config.maxParticipants || 10,
          autoTaskAssignment: config.autoTaskAssignment ?? true,
          communicationProtocol: config.communicationProtocol || 'broadcast',
          ...config,
        },
        leaderId,
        participants: {
          connect: participantIds.map((id) => ({ id })),
        },
      },
      include: {
        leader: true,
        participants: true,
      },
    })

    this.eventEmitter.emit('collaboration.created', collaboration)

    // 发送初始协作消息
    await this.sendCollaborationMessage(
      collaboration.id,
      leaderId,
      `Collaboration "${config.goal}" has been initiated`,
      MessageType.STATUS
    )

    return collaboration
  }

  /**
   * 获取协作详情
   */
  async getCollaboration(id: string): Promise<AgentCollaboration> {
    const collaboration = await this.prisma.agentCollaboration.findUnique({
      where: { id },
      include: {
        leader: true,
        participants: true,
        tasks: {
          include: {
            task: true,
            assignedAgent: true,
          },
        },
        conversations: {
          include: {
            sender: true,
            receiver: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!collaboration) {
      throw new NotFoundException('Collaboration not found')
    }

    return collaboration
  }

  /**
   * 更新协作状态
   */
  async updateCollaborationStatus(
    id: string,
    status: CollaborationStatus,
    outcome?: any
  ): Promise<AgentCollaboration> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === CollaborationStatus.COMPLETED) {
      updateData.completedAt = new Date()
      if (outcome) {
        updateData.config = {
          outcome,
        }
      }
    }

    const collaboration = await this.prisma.agentCollaboration.update({
      where: { id },
      data: updateData,
      include: {
        leader: true,
        participants: true,
      },
    })

    this.eventEmitter.emit('collaboration.statusChanged', {
      collaboration,
      status,
      outcome,
    })

    return collaboration
  }

  /**
   * 添加协作参与者
   */
  async addParticipant(collaborationId: string, agentId: string): Promise<void> {
    const collaboration = await this.getCollaboration(collaborationId)

    if (collaboration.status !== CollaborationStatus.ACTIVE) {
      throw new BadRequestException('Cannot add participants to inactive collaboration')
    }

    // 检查是否已经是参与者
    const isParticipant = collaboration.participants.some((p) => p.id === agentId)
    if (isParticipant) {
      throw new BadRequestException('Agent is already a participant')
    }

    // 检查最大参与者数量
    const maxParticipants = collaboration.config?.maxParticipants || 10
    if (collaboration.participants.length >= maxParticipants) {
      throw new BadRequestException('Maximum participants limit reached')
    }

    await this.prisma.agentCollaboration.update({
      where: { id: collaborationId },
      data: {
        participants: {
          connect: { id: agentId },
        },
      },
    })

    this.eventEmitter.emit('collaboration.participantAdded', {
      collaborationId,
      agentId,
    })
  }

  /**
   * 移除协作参与者
   */
  async removeParticipant(collaborationId: string, agentId: string): Promise<void> {
    const collaboration = await this.getCollaboration(collaborationId)

    if (collaboration.leaderId === agentId) {
      throw new BadRequestException('Cannot remove collaboration leader')
    }

    // 检查参与者是否有未完成的任务
    const activeTasks = await this.prisma.taskCollaboration.count({
      where: {
        collaborationId,
        assignedAgentId: agentId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    })

    if (activeTasks > 0) {
      throw new BadRequestException('Cannot remove participant with active tasks')
    }

    await this.prisma.agentCollaboration.update({
      where: { id: collaborationId },
      data: {
        participants: {
          disconnect: { id: agentId },
        },
      },
    })

    this.eventEmitter.emit('collaboration.participantRemoved', {
      collaborationId,
      agentId,
    })
  }

  // ==================== 任务协作 ====================

  /**
   * 为协作分配任务
   */
  async assignCollaborationTask(
    collaborationId: string,
    taskId: string,
    agentId: string,
    contribution?: string
  ): Promise<TaskCollaboration> {
    const collaboration = await this.getCollaboration(collaborationId)

    // 验证Agent是否是协作参与者
    const isParticipant = collaboration.participants.some((p) => p.id === agentId)
    if (!isParticipant && collaboration.leaderId !== agentId) {
      throw new BadRequestException('Agent is not a collaboration participant')
    }

    // 检查是否已分配此任务
    const existingAssignment = await this.prisma.taskCollaboration.findUnique({
      where: {
        collaborationId_taskId: {
          collaborationId,
          taskId,
        },
      },
    })

    if (existingAssignment) {
      throw new BadRequestException('Task is already assigned in this collaboration')
    }

    const taskAssignment = await this.prisma.taskCollaboration.create({
      data: {
        collaborationId,
        taskId,
        assignedAgentId: agentId,
        contribution,
      },
      include: {
        task: true,
        assignedAgent: true,
      },
    })

    this.eventEmitter.emit('collaboration.taskAssigned', {
      collaborationId,
      taskId,
      agentId,
      contribution,
    })

    return taskAssignment
  }

  /**
   * 更新任务协作进度
   */
  async updateTaskCollaborationProgress(
    collaborationId: string,
    taskId: string,
    agentId: string,
    status: string,
    contribution?: string,
    completedAt?: Date
  ): Promise<void> {
    const updateData: any = { status }

    if (contribution) {
      updateData.contribution = contribution
    }

    if (completedAt) {
      updateData.completedAt = completedAt
    }

    await this.prisma.taskCollaboration.update({
      where: {
        collaborationId_taskId: {
          collaborationId,
          taskId,
        },
      },
      data: updateData,
    })

    this.eventEmitter.emit('collaboration.taskProgress', {
      collaborationId,
      taskId,
      agentId,
      status,
      contribution,
    })
  }

  // ==================== 协作通信 ====================

  /**
   * 发送协作消息
   */
  async sendCollaborationMessage(
    collaborationId: string,
    senderId: string,
    message: string,
    messageType: MessageType = MessageType.TEXT,
    receiverId?: string,
    metadata?: any
  ): Promise<AgentConversation> {
    const collaboration = await this.getCollaboration(collaborationId)

    // 验证发送者是否是协作参与者
    const isParticipant = collaboration.participants.some((p) => p.id === senderId)
    if (!isParticipant && collaboration.leaderId !== senderId) {
      throw new BadRequestException('Sender is not a collaboration participant')
    }

    // 如果指定了接收者，验证接收者是否是参与者
    if (receiverId) {
      const isReceiverParticipant = collaboration.participants.some((p) => p.id === receiverId)
      if (!isReceiverParticipant && collaboration.leaderId !== receiverId) {
        throw new BadRequestException('Receiver is not a collaboration participant')
      }
    }

    const conversation = await this.prisma.agentConversation.create({
      data: {
        collaborationId,
        senderId,
        receiverId,
        message,
        messageType,
        metadata: metadata || {},
      },
      include: {
        sender: true,
        receiver: true,
      },
    })

    this.eventEmitter.emit('collaboration.message', {
      collaborationId,
      conversation,
    })

    return conversation
  }

  /**
   * 获取协作通信历史
   */
  async getCollaborationMessages(
    collaborationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AgentConversation[]> {
    return this.prisma.agentConversation.findMany({
      where: { collaborationId },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  // ==================== 协作分析和报告 ====================

  /**
   * 获取协作结果
   */
  async getCollaborationResult(collaborationId: string): Promise<CollaborationResult> {
    const collaboration = await this.getCollaboration(collaborationId)

    const [taskStats, _messageCount] = await Promise.all([
      this.prisma.taskCollaboration.groupBy({
        by: ['status'],
        where: { collaborationId },
        _count: { status: true },
      }),
      this.prisma.agentConversation.count({
        where: { collaborationId },
      }),
    ])

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.status, 0)
    const completedTasks = taskStats.find((s) => s.status === 'COMPLETED')?._count.status || 0

    const duration =
      collaboration.completedAt && collaboration.createdAt
        ? collaboration.completedAt.getTime() - collaboration.createdAt.getTime()
        : Date.now() - collaboration.createdAt.getTime()

    return {
      collaborationId,
      status: collaboration.status,
      totalTasks,
      completedTasks,
      participants: [collaboration.leaderId, ...collaboration.participants.map((p) => p.id)],
      duration: Math.round(duration / (1000 * 60)), // 分钟
      outcome: collaboration.config?.outcome,
    }
  }

  /**
   * 获取协作统计
   */
  async getCollaborationStats(collaborationId: string): Promise<any> {
    const collaboration = await this.getCollaboration(collaborationId)

    const [participantStats, taskStats, messageStats] = await Promise.all([
      // 参与者贡献统计
      this.prisma.taskCollaboration.groupBy({
        by: ['assignedAgentId'],
        where: { collaborationId },
        _count: { taskId: true },
        _sum: {
          contribution: true, // 这里需要数据库支持字符串长度统计
        },
      }),

      // 任务状态统计
      this.prisma.taskCollaboration.groupBy({
        by: ['status'],
        where: { collaborationId },
        _count: { status: true },
      }),

      // 消息统计
      this.prisma.agentConversation.groupBy({
        by: ['senderId', 'messageType'],
        where: { collaborationId },
        _count: { id: true },
      }),
    ])

    return {
      collaborationId,
      duration: collaboration.completedAt
        ? collaboration.completedAt.getTime() - collaboration.createdAt.getTime()
        : Date.now() - collaboration.createdAt.getTime(),
      participants: participantStats.map((p) => ({
        agentId: p.assignedAgentId,
        taskCount: p._count.taskId,
      })),
      tasks: Object.fromEntries(taskStats.map((s) => [s.status, s._count.status])),
      messages: messageStats.reduce((acc, stat) => {
        const key = `${stat.senderId}_${stat.messageType}`
        acc[key] = stat._count.id
        return acc
      }, {}),
    }
  }

  /**
   * 获取活跃协作列表
   */
  async getActiveCollaborations(): Promise<AgentCollaboration[]> {
    return this.prisma.agentCollaboration.findMany({
      where: {
        status: CollaborationStatus.ACTIVE,
      },
      include: {
        leader: {
          select: { id: true, displayName: true },
        },
        participants: {
          select: { id: true, displayName: true },
        },
        _count: {
          select: {
            tasks: true,
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 获取Agent的协作历史
   */
  async getAgentCollaborations(agentId: string, limit: number = 20): Promise<AgentCollaboration[]> {
    return this.prisma.agentCollaboration.findMany({
      where: {
        OR: [{ leaderId: agentId }, { participants: { some: { id: agentId } } }],
      },
      include: {
        leader: {
          select: { id: true, displayName: true },
        },
        participants: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  // ==================== 协作策略 ====================

  /**
   * 执行协作策略
   */
  async executeCollaborationStrategy(collaborationId: string): Promise<void> {
    const collaboration = await this.getCollaboration(collaborationId)

    if (collaboration.status !== CollaborationStatus.ACTIVE) {
      return
    }

    const strategy = collaboration.strategy || 'round-robin'
    const _config = collaboration.config as any

    switch (strategy) {
      case 'leader-driven':
        await this.executeLeaderDrivenStrategy(collaboration)
        break
      case 'democratic':
        await this.executeDemocraticStrategy(collaboration)
        break
      case 'expert-weighted':
        await this.executeExpertWeightedStrategy(collaboration)
        break
      default:
        await this.executeRoundRobinStrategy(collaboration)
    }
  }

  /**
   * 领导驱动策略
   */
  private async executeLeaderDrivenStrategy(collaboration: AgentCollaboration): Promise<void> {
    // 领导者做主要决策，其他Agent提供支持
    const leaderTasks = collaboration.tasks.filter(
      (t) => t.assignedAgentId === collaboration.leaderId
    )

    for (const task of leaderTasks) {
      if (task.status === 'PENDING') {
        // 通知其他参与者提供输入
        await this.sendCollaborationMessage(
          collaboration.id,
          collaboration.leaderId,
          `需要大家对任务 "${task.task.title}" 提供建议`,
          MessageType.COMMAND
        )
      }
    }
  }

  /**
   * 民主策略
   */
  private async executeDemocraticStrategy(collaboration: AgentCollaboration): Promise<void> {
    // 所有参与者平等投票决策
    const pendingTasks = collaboration.tasks.filter((t) => t.status === 'PENDING')

    if (pendingTasks.length > 0) {
      const message = `协作任务待分配：${pendingTasks.map((t) => t.task.title).join(', ')}`
      await this.sendCollaborationMessage(
        collaboration.id,
        collaboration.leaderId,
        message,
        MessageType.STATUS
      )
    }
  }

  /**
   * 专家加权策略
   */
  private async executeExpertWeightedStrategy(collaboration: AgentCollaboration): Promise<void> {
    // 根据Agent的专业能力和历史表现加权决策
    for (const task of collaboration.tasks) {
      if (task.status === 'PENDING') {
        // 为任务找到最合适的Agent
        const suitableAgent = await this.findBestAgentForTask(task.taskId, collaboration)
        if (suitableAgent) {
          await this.assignCollaborationTask(
            collaboration.id,
            task.taskId,
            suitableAgent.id,
            `专家推荐：${suitableAgent.displayName} 最适合处理此任务`
          )
        }
      }
    }
  }

  /**
   * 轮询策略
   */
  private async executeRoundRobinStrategy(collaboration: AgentCollaboration): Promise<void> {
    // 轮流分配任务
    const participants = [collaboration.leader, ...collaboration.participants]
    let agentIndex = 0

    for (const task of collaboration.tasks) {
      if (task.status === 'PENDING') {
        const assignedAgent = participants[agentIndex % participants.length]
        await this.assignCollaborationTask(
          collaboration.id,
          task.taskId,
          assignedAgent.id,
          '轮询分配'
        )
        agentIndex++
      }
    }
  }

  /**
   * 为任务找到最佳Agent
   */
  private async findBestAgentForTask(
    taskId: string,
    collaboration: AgentCollaboration
  ): Promise<any> {
    const task = await this.taskService.getTask(taskId)
    const participants = [collaboration.leader, ...collaboration.participants]

    // 简化的Agent评分逻辑
    const agentScores = await Promise.all(
      participants.map(async (agent) => {
        let score = agent.priority

        // 检查Agent是否有相关能力
        const hasCapabilities =
          agent.capabilities?.some((cap: any) => task.type.toLowerCase().includes(cap.id)) || false

        if (hasCapabilities) score += 10

        // 检查历史表现
        const metrics = await this.agentService.getAgentMetrics(agent.id, 'month')
        score += metrics.successRate * 0.1

        return { agent, score }
      })
    )

    agentScores.sort((a, b) => b.score - a.score)
    return agentScores[0].agent
  }

  /**
   * 协作冲突解决
   */
  async resolveCollaborationConflict(
    collaborationId: string,
    conflict: {
      type: 'task_assignment' | 'decision_making' | 'resource_conflict'
      description: string
      involvedAgents: string[]
      options?: string[]
    }
  ): Promise<string> {
    const collaboration = await this.getCollaboration(collaborationId)

    // 发送冲突通知
    await this.sendCollaborationMessage(
      collaborationId,
      collaboration.leaderId,
      `协作冲突：${conflict.description}`,
      MessageType.ERROR,
      undefined,
      { conflict }
    )

    // 根据冲突类型应用不同的解决策略
    switch (conflict.type) {
      case 'task_assignment':
        return this.resolveTaskAssignmentConflict(collaboration, conflict)
      case 'decision_making':
        return this.resolveDecisionMakingConflict(collaboration, conflict)
      case 'resource_conflict':
        return this.resolveResourceConflict(collaboration, conflict)
      default:
        return 'conflict_escalated_to_leader'
    }
  }

  private async resolveTaskAssignmentConflict(
    _collaboration: AgentCollaboration,
    _conflict: any
  ): Promise<string> {
    // 重新分配任务给其他Agent
    return 'task_reassigned'
  }

  private async resolveDecisionMakingConflict(
    _collaboration: AgentCollaboration,
    _conflict: any
  ): Promise<string> {
    // 领导者做出最终决定
    return 'leader_decision'
  }

  private async resolveResourceConflict(
    _collaboration: AgentCollaboration,
    _conflict: any
  ): Promise<string> {
    // 协商资源分配
    return 'resource_renegotiated'
  }
}
