import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import {
  type Agent,
  type Prisma,
  type Task,
  TaskComplexity,
  TaskStatus,
  TaskType,
} from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'
import type { AgentService } from './agent.service'

export interface TaskAssignment {
  taskId: string
  agentId: string
  priority?: number
  reason?: string
}

export interface TaskSchedulingOptions {
  maxConcurrency?: number
  preferredAgentTypes?: string[]
  deadline?: Date
  priority?: number
}

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private agentService: AgentService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 任务管理 ====================

  /**
   * 创建新任务
   */
  async createTask(data: {
    title: string
    description?: string
    type: TaskType
    priority?: number
    complexity?: TaskComplexity
    input?: any
    requirements?: any
    gameId?: string
    parentTaskId?: string
    deadline?: Date
    estimatedDuration?: number
  }): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority || 1,
        complexity: data.complexity || TaskComplexity.MEDIUM,
        input: data.input || {},
        requirements: data.requirements || {},
        gameId: data.gameId,
        parentTaskId: data.parentTaskId,
        deadline: data.deadline,
        estimatedDuration: data.estimatedDuration,
      },
    })

    this.eventEmitter.emit('task.created', task)

    // 自动尝试分配任务
    if (!data.parentTaskId) {
      // 只为根任务自动分配
      setImmediate(() => this.autoAssignTask(task.id))
    }

    return task
  }

  /**
   * 获取任务详情
   */
  async getTask(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
        agents: {
          include: {
            agent: true,
          },
        },
        parentTask: true,
        game: true,
      },
    })

    if (!task) {
      throw new NotFoundException('Task not found')
    }

    return task
  }

  /**
   * 更新任务
   */
  async updateTask(
    id: string,
    data: Partial<{
      title: string
      description: string
      status: TaskStatus
      priority: number
      complexity: TaskComplexity
      input: any
      output: any
      requirements: any
      deadline: Date
      estimatedDuration: number
      actualDuration: number
    }>
  ): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    this.eventEmitter.emit('task.updated', task)
    return task
  }

  /**
   * 删除任务
   */
  async deleteTask(id: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { status: true, agents: { select: { id: true } } },
    })

    if (!task) {
      throw new NotFoundException('Task not found')
    }

    // 检查是否有正在进行的分配
    if (task.agents.length > 0) {
      throw new BadRequestException('Cannot delete task with active assignments')
    }

    await this.prisma.task.delete({
      where: { id },
    })

    this.eventEmitter.emit('task.deleted', { id })
  }

  /**
   * 手动分配任务给Agent
   */
  async assignTask(assignment: TaskAssignment): Promise<void> {
    const { taskId, agentId, priority = 1, reason } = assignment

    // 验证任务和Agent存在
    const [task, agent] = await Promise.all([
      this.getTask(taskId),
      this.agentService.getAgent(agentId),
    ])

    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('Task is not in pending status')
    }

    // 检查Agent是否已分配此任务
    const existingAssignment = await this.prisma.agentTask.findUnique({
      where: {
        agentId_taskId: {
          agentId,
          taskId,
        },
      },
    })

    if (existingAssignment) {
      throw new BadRequestException('Agent is already assigned to this task')
    }

    // 检查Agent工作负载
    const workload = await this.agentService.getAgentWorkload(agentId)
    if (workload.activeTasks >= agent.maxConcurrency) {
      throw new BadRequestException('Agent is at maximum concurrency limit')
    }

    // 创建任务分配
    await this.prisma.agentTask.create({
      data: {
        agentId,
        taskId,
        priority,
        status: TaskStatus.ASSIGNED,
      },
    })

    // 更新任务状态
    await this.updateTask(taskId, { status: TaskStatus.ASSIGNED })

    this.eventEmitter.emit('task.assigned', {
      taskId,
      agentId,
      priority,
      reason,
      assignment: await this.getTaskAssignment(taskId, agentId),
    })
  }

  /**
   * 取消任务分配
   */
  async unassignTask(taskId: string, agentId: string): Promise<void> {
    const assignment = await this.prisma.agentTask.findUnique({
      where: {
        agentId_taskId: {
          agentId,
          taskId,
        },
      },
    })

    if (!assignment) {
      throw new NotFoundException('Task assignment not found')
    }

    if (assignment.status === TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot unassign task that is in progress')
    }

    await this.prisma.agentTask.delete({
      where: {
        agentId_taskId: {
          agentId,
          taskId,
        },
      },
    })

    this.eventEmitter.emit('task.unassigned', { taskId, agentId })
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(
    taskId: string,
    agentId: string,
    progress: number,
    status?: TaskStatus,
    result?: any,
    error?: string
  ): Promise<void> {
    const assignment = await this.prisma.agentTask.findUnique({
      where: {
        agentId_taskId: {
          agentId,
          taskId,
        },
      },
    })

    if (!assignment) {
      throw new NotFoundException('Task assignment not found')
    }

    const updateData: any = {
      progress: Math.max(0, Math.min(1, progress)),
    }

    if (status) {
      updateData.status = status

      if (status === TaskStatus.IN_PROGRESS && !assignment.startedAt) {
        updateData.startedAt = new Date()
      } else if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
        updateData.completedAt = new Date()

        if (assignment.startedAt) {
          const duration = (new Date().getTime() - assignment.startedAt.getTime()) / (1000 * 60)
          await this.updateTask(taskId, { actualDuration: Math.round(duration) })
        }
      }
    }

    if (result !== undefined) {
      updateData.result = result
    }

    if (error !== undefined) {
      updateData.error = error
    }

    await this.prisma.agentTask.update({
      where: {
        agentId_taskId: {
          agentId,
          taskId,
        },
      },
      data: updateData,
    })

    // 如果任务完成，检查是否需要更新父任务状态
    if (status === TaskStatus.COMPLETED) {
      await this.checkParentTaskCompletion(taskId)
    }

    this.eventEmitter.emit('task.progress', {
      taskId,
      agentId,
      progress,
      status,
      result,
      error,
    })
  }

  /**
   * 自动分配任务
   */
  async autoAssignTask(
    taskId: string,
    options: TaskSchedulingOptions = {}
  ): Promise<TaskAssignment[]> {
    const task = await this.getTask(taskId)

    if (task.status !== TaskStatus.PENDING) {
      return []
    }

    // 分析任务需求
    const requirements = this.analyzeTaskRequirements(task)

    // 查找合适的Agent
    const suitableAgents = await this.findSuitableAgents(requirements, options)

    if (suitableAgents.length === 0) {
      this.eventEmitter.emit('task.assignmentFailed', {
        taskId,
        reason: 'No suitable agents found',
      })
      return []
    }

    // 选择最佳Agent
    const bestAgent = await this.selectBestAgent(suitableAgents, task, options)

    // 分配任务
    const assignment: TaskAssignment = {
      taskId,
      agentId: bestAgent.id,
      priority: task.priority,
      reason: `Auto-assigned based on ${requirements.capabilities.join(', ')} capabilities`,
    }

    await this.assignTask(assignment)

    return [assignment]
  }

  /**
   * 批量分配任务
   */
  async batchAssignTasks(assignments: TaskAssignment[]): Promise<TaskAssignment[]> {
    const successfulAssignments: TaskAssignment[] = []

    for (const assignment of assignments) {
      try {
        await this.assignTask(assignment)
        successfulAssignments.push(assignment)
      } catch (error) {
        console.error(`Failed to assign task ${assignment.taskId}:`, error instanceof Error ? error.message : String(error))
      }
    }

    return successfulAssignments
  }

  /**
   * 获取任务队列
   */
  async getTaskQueue(filters?: {
    status?: TaskStatus[]
    type?: TaskType[]
    priority?: number
    limit?: number
    offset?: number
  }): Promise<{ tasks: Task[]; total: number }> {
    const where: Prisma.TaskWhereInput = {}

    if (filters?.status) {
      where.status = { in: filters.status }
    }

    if (filters?.type) {
      where.type = { in: filters.type }
    }

    if (filters?.priority) {
      where.priority = { gte: filters.priority }
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          agents: {
            include: { agent: true },
          },
          subtasks: true,
          game: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip: filters?.offset || 0,
        take: filters?.limit || 50,
      }),
      this.prisma.task.count({ where }),
    ])

    return { tasks, total }
  }

  /**
   * 获取Agent的任务列表
   */
  async getAgentTasks(
    agentId: string,
    filters?: {
      status?: TaskStatus[]
      limit?: number
      offset?: number
    }
  ): Promise<{ tasks: Task[]; total: number }> {
    const where: Prisma.AgentTaskWhereInput = { agentId }

    if (filters?.status) {
      where.status = { in: filters.status }
    }

    const [agentTasks, total] = await Promise.all([
      this.prisma.agentTask.findMany({
        where,
        include: {
          task: {
            include: {
              game: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { assignedAt: 'desc' }],
        skip: filters?.offset || 0,
        take: filters?.limit || 50,
      }),
      this.prisma.agentTask.count({ where }),
    ])

    const tasks = agentTasks.map((at) => at.task)
    return { tasks, total }
  }

  // ==================== 私有方法 ====================

  /**
   * 分析任务需求
   */
  private analyzeTaskRequirements(task: Task): {
    capabilities: string[]
    agentTypes: string[]
    complexity: TaskComplexity
    estimatedDuration: number
  } {
    const requirements = task.requirements || {}
    const input = task.input || {}

    // 基于任务类型和内容分析所需能力
    const capabilities: string[] = []
    const agentTypes: string[] = []

    switch (task.type) {
      case TaskType.CREATION:
        capabilities.push('content-creation', 'creativity')
        agentTypes.push('CREATION', 'GENERIC')
        break
      case TaskType.ANALYSIS:
        capabilities.push('analysis', 'logic')
        agentTypes.push('LOGIC', 'SPECIALIST')
        break
      case TaskType.REVIEW:
        capabilities.push('critique', 'evaluation')
        agentTypes.push('CRITIC', 'LOGIC')
        break
      case TaskType.OPTIMIZATION:
        capabilities.push('optimization', 'logic')
        agentTypes.push('LOGIC', 'SPECIALIST')
        break
      default:
        capabilities.push('general')
        agentTypes.push('GENERIC')
    }

    // 基于复杂度调整
    if (task.complexity === TaskComplexity.HIGH || task.complexity === TaskComplexity.CRITICAL) {
      agentTypes.unshift('SPECIALIST') // 优先使用专家Agent
    }

    return {
      capabilities,
      agentTypes,
      complexity: task.complexity,
      estimatedDuration: task.estimatedDuration || 30,
    }
  }

  /**
   * 查找合适的Agent
   */
  private async findSuitableAgents(
    requirements: ReturnType<typeof this.analyzeTaskRequirements>,
    options: TaskSchedulingOptions
  ): Promise<Agent[]> {
    const { capabilities, agentTypes } = requirements
    const { preferredAgentTypes, maxConcurrency = 10 } = options

    // 构建查询条件
    const where: Prisma.AgentWhereInput = {
      status: 'ONLINE',
    }

    // Agent类型过滤
    const targetTypes = preferredAgentTypes || agentTypes
    if (targetTypes.length > 0) {
      where.type = { in: targetTypes }
    }

    // 能力过滤
    if (capabilities.length > 0) {
      where.OR = capabilities.map((capability) => ({
        capabilities: {
          path: '$[*].id',
          array_contains: [capability],
        },
      }))
    }

    // 获取候选Agent
    const candidates = await this.prisma.agent.findMany({
      where,
      orderBy: { priority: 'desc' },
      take: maxConcurrency,
    })

    // 过滤掉工作负载过高的Agent
    const availableAgents: Agent[] = []

    for (const agent of candidates) {
      const workload = await this.agentService.getAgentWorkload(agent.id)
      if (workload.activeTasks < agent.maxConcurrency) {
        availableAgents.push(agent)
      }
    }

    return availableAgents
  }

  /**
   * 选择最佳Agent
   */
  private async selectBestAgent(
    agents: Agent[],
    task: Task,
    options: TaskSchedulingOptions
  ): Promise<Agent> {
    if (agents.length === 0) {
      throw new Error('No agents available')
    }

    if (agents.length === 1) {
      return agents[0]
    }

    // 计算每个Agent的评分
    const agentScores = await Promise.all(
      agents.map(async (agent) => {
        let score = agent.priority * 10 // 基础优先级分数

        // 工作负载因子（负载越低分数越高）
        const workload = await this.agentService.getAgentWorkload(agent.id)
        const loadFactor = 1 - workload.activeTasks / agent.maxConcurrency
        score += loadFactor * 20

        // 性能因子（成功率越高分数越高）
        const metrics = await this.agentService.getAgentMetrics(agent.id, 'week')
        score += (metrics.successRate / 100) * 15

        // 专业度因子（Agent类型匹配度）
        const typeMatch = agent.type === task.type.toLowerCase().replace('_', '') ? 1 : 0.5
        score *= typeMatch

        return { agent, score }
      })
    )

    // 选择分数最高的Agent
    agentScores.sort((a, b) => b.score - a.score)
    return agentScores[0].agent
  }

  /**
   * 获取任务分配详情
   */
  private async getTaskAssignment(taskId: string, agentId: string) {
    return this.prisma.agentTask.findUnique({
      where: {
        agentId_taskId: {
          agentId,
          taskId,
        },
      },
      include: {
        agent: true,
        task: true,
      },
    })
  }

  /**
   * 检查父任务是否可以完成
   */
  private async checkParentTaskCompletion(taskId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        parentTaskId: true,
        status: true,
      },
    })

    if (!task?.parentTaskId) return

    // 检查父任务的所有子任务是否都已完成
    const parentTask = await this.prisma.task.findUnique({
      where: { id: task.parentTaskId },
      include: {
        subtasks: {
          select: { status: true },
        },
      },
    })

    if (!parentTask) return

    const allCompleted = parentTask.subtasks.every(
      (subtask) => subtask.status === TaskStatus.COMPLETED
    )

    if (allCompleted && parentTask.status !== TaskStatus.COMPLETED) {
      await this.updateTask(parentTask.id, { status: TaskStatus.COMPLETED })
    }
  }

  /**
   * 创建子任务
   */
  async createSubtask(parentTaskId: string, subtaskData: Partial<Task>): Promise<Task> {
    return this.createTask({
      ...subtaskData,
      parentTaskId,
    } as any)
  }

  /**
   * 获取任务层次结构
   */
  async getTaskHierarchy(taskId: string): Promise<Task[]> {
    const task = await this.getTask(taskId)

    const hierarchy: Task[] = [task]

    // 获取所有子任务（递归）
    const getAllSubtasks = async (parentId: string): Promise<Task[]> => {
      const subtasks = await this.prisma.task.findMany({
        where: { parentTaskId: parentId },
        include: {
          subtasks: true,
          agents: { include: { agent: true } },
        },
      })

      const allSubtasks: Task[] = [...subtasks]

      for (const subtask of subtasks) {
        const deeperSubtasks = await getAllSubtasks(subtask.id)
        allSubtasks.push(...deeperSubtasks)
      }

      return allSubtasks
    }

    if (task.subtasks && task.subtasks.length > 0) {
      const allSubtasks = await getAllSubtasks(taskId)
      hierarchy.push(...allSubtasks)
    }

    return hierarchy
  }
}
