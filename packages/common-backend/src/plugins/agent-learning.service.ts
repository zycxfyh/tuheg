import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AgentLearning, Prisma } from '@prisma/client'
import { EventEmitter2 } from '@nestjs/event-emitter'

export interface LearningPattern {
  id: string
  name: string
  description: string
  category: 'performance' | 'behavior' | 'capability' | 'collaboration'
  triggers: string[]
  actions: string[]
  successRate: number
  applicationCount: number
}

export interface LearningData {
  context: string
  action: string
  result: 'success' | 'failure' | 'partial'
  metrics: Record<string, number>
  feedback?: string
  timestamp: Date
}

export interface AgentPerformanceMetrics {
  taskCompletionRate: number
  averageResponseTime: number
  errorRate: number
  collaborationScore: number
  learningAdaptability: number
  overallScore: number
}

@Injectable()
export class AgentLearningService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 学习模式管理 ====================

  /**
   * 记录Agent学习数据
   */
  async recordLearning(
    agentId: string,
    pattern: string,
    data: LearningData,
    performance: number = 0
  ): Promise<AgentLearning> {
    const learning = await this.prisma.agentLearning.create({
      data: {
        agentId,
        pattern,
        data,
        performance,
      },
    })

    this.eventEmitter.emit('agent.learningRecorded', {
      agentId,
      pattern,
      data,
      performance,
    })

    // 检查是否需要更新Agent配置
    await this.checkForAdaptation(agentId, pattern, data)

    return learning
  }

  /**
   * 获取Agent的学习历史
   */
  async getAgentLearningHistory(
    agentId: string,
    pattern?: string,
    limit: number = 50
  ): Promise<AgentLearning[]> {
    const where: Prisma.AgentLearningWhereInput = { agentId }

    if (pattern) {
      where.pattern = pattern
    }

    return this.prisma.agentLearning.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: limit,
    })
  }

  /**
   * 分析学习模式
   */
  async analyzeLearningPatterns(agentId: string): Promise<LearningPattern[]> {
    const learningData = await this.prisma.agentLearning.findMany({
      where: { agentId },
      orderBy: { appliedAt: 'desc' },
      take: 1000, // 分析最近1000条学习记录
    })

    // 基于学习数据提取模式
    const patterns = this.extractPatternsFromData(learningData)

    // 计算模式成功率
    for (const pattern of patterns) {
      const patternData = learningData.filter((l) => l.pattern === pattern.id)
      const successCount = patternData.filter((l) => l.performance > 0.7).length
      pattern.successRate = patternData.length > 0 ? successCount / patternData.length : 0
      pattern.applicationCount = patternData.length
    }

    return patterns
  }

  /**
   * 应用学习到的模式
   */
  async applyLearnedPattern(
    agentId: string,
    patternId: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const patterns = await this.analyzeLearningPatterns(agentId)
    const pattern = patterns.find((p) => p.id === patternId)

    if (!pattern || pattern.successRate < 0.6) {
      return false
    }

    // 检查上下文是否匹配模式触发条件
    const contextMatch = this.matchPatternContext(pattern, context)
    if (!contextMatch) {
      return false
    }

    // 执行学习到的动作
    const success = await this.executePatternActions(agentId, pattern, context)

    // 记录应用结果
    await this.recordLearning(
      agentId,
      `applied_${patternId}`,
      {
        context: JSON.stringify(context),
        action: `Applied pattern: ${pattern.name}`,
        result: success ? 'success' : 'failure',
        metrics: { patternSuccessRate: pattern.successRate },
        timestamp: new Date(),
      },
      success ? 1 : 0
    )

    return success
  }

  // ==================== 性能分析 ====================

  /**
   * 计算Agent性能指标
   */
  async calculateAgentPerformance(
    agentId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<AgentPerformanceMetrics> {
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

    // 获取任务完成数据
    const taskData = await this.prisma.agentTask.findMany({
      where: {
        agentId,
        assignedAt: { gte: periodStart },
      },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
      },
    })

    // 获取协作数据
    const collaborationData = await this.prisma.taskCollaboration.findMany({
      where: {
        assignedAgentId: agentId,
        assignedAt: { gte: periodStart },
      },
      select: {
        status: true,
        contribution: true,
      },
    })

    // 计算指标
    const totalTasks = taskData.length
    const completedTasks = taskData.filter((t) => t.status === 'COMPLETED').length
    const failedTasks = taskData.filter((t) => t.status === 'FAILED').length

    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0
    const errorRate = totalTasks > 0 ? failedTasks / totalTasks : 0

    // 计算平均响应时间
    const completedTasksWithTiming = taskData.filter(
      (t) => t.status === 'COMPLETED' && t.startedAt && t.completedAt
    )
    const averageResponseTime =
      completedTasksWithTiming.length > 0
        ? completedTasksWithTiming.reduce((sum, task) => {
            return sum + (task.completedAt!.getTime() - task.startedAt!.getTime())
          }, 0) /
          completedTasksWithTiming.length /
          (1000 * 60) // 转换为分钟
        : 0

    // 计算协作分数
    const totalCollaborations = collaborationData.length
    const successfulCollaborations = collaborationData.filter(
      (c) => c.status === 'COMPLETED' && c.contribution
    ).length
    const collaborationScore =
      totalCollaborations > 0 ? successfulCollaborations / totalCollaborations : 0

    // 计算学习适应性
    const learningData = await this.getAgentLearningHistory(agentId, undefined, 100)
    const recentLearning = learningData.filter((l) => l.appliedAt >= periodStart)
    const learningAdaptability =
      recentLearning.length > 0
        ? recentLearning.reduce((sum, l) => sum + l.performance, 0) / recentLearning.length
        : 0.5 // 默认中等适应性

    // 计算综合得分
    const overallScore =
      taskCompletionRate * 0.3 +
      (1 - errorRate) * 0.2 +
      collaborationScore * 0.2 +
      learningAdaptability * 0.15 +
      (averageResponseTime > 0 ? Math.min(1, 60 / averageResponseTime) : 0.5) * 0.15

    return {
      taskCompletionRate,
      averageResponseTime,
      errorRate,
      collaborationScore,
      learningAdaptability,
      overallScore,
    }
  }

  /**
   * 生成性能报告
   */
  async generatePerformanceReport(agentId: string): Promise<any> {
    const [currentMetrics, learningPatterns, recentTasks, collaborations] = await Promise.all([
      this.calculateAgentPerformance(agentId, 'month'),
      this.analyzeLearningPatterns(agentId),
      this.prisma.agentTask.findMany({
        where: { agentId },
        include: { task: true },
        orderBy: { assignedAt: 'desc' },
        take: 20,
      }),
      this.prisma.taskCollaboration.findMany({
        where: { assignedAgentId: agentId },
        include: {
          collaboration: true,
          task: true,
        },
        orderBy: { assignedAt: 'desc' },
        take: 10,
      }),
    ])

    // 分析优势和劣势
    const strengths = []
    const weaknesses = []

    if (currentMetrics.taskCompletionRate > 0.8) {
      strengths.push('高任务完成率')
    } else if (currentMetrics.taskCompletionRate < 0.6) {
      weaknesses.push('任务完成率需要提升')
    }

    if (currentMetrics.errorRate < 0.1) {
      strengths.push('低错误率')
    } else if (currentMetrics.errorRate > 0.2) {
      weaknesses.push('错误率较高')
    }

    if (currentMetrics.collaborationScore > 0.7) {
      strengths.push('优秀的协作能力')
    } else {
      weaknesses.push('协作能力有待提升')
    }

    if (currentMetrics.learningAdaptability > 0.7) {
      strengths.push('良好的学习适应性')
    }

    // 生成改进建议
    const recommendations = this.generateImprovementRecommendations(
      currentMetrics,
      learningPatterns
    )

    return {
      agentId,
      period: 'month',
      metrics: currentMetrics,
      learningPatterns: learningPatterns.slice(0, 5),
      recentTasks: recentTasks.map((t) => ({
        id: t.id,
        taskTitle: t.task.title,
        status: t.status,
        assignedAt: t.assignedAt,
        completedAt: t.completedAt,
      })),
      recentCollaborations: collaborations.map((c) => ({
        id: c.id,
        collaborationName: c.collaboration.name,
        taskTitle: c.task.title,
        status: c.status,
        contribution: c.contribution,
      })),
      analysis: {
        strengths,
        weaknesses,
        recommendations,
      },
      generatedAt: new Date(),
    }
  }

  // ==================== Agent优化 ====================

  /**
   * 自动优化Agent配置
   */
  async optimizeAgent(agentId: string): Promise<{
    optimizations: string[]
    expectedImprovements: Record<string, number>
  }> {
    const [performance, learningPatterns, currentConfig] = await Promise.all([
      this.calculateAgentPerformance(agentId, 'week'),
      this.analyzeLearningPatterns(agentId),
      this.prisma.agent.findUnique({
        where: { id: agentId },
        select: { config: true, capabilities: true },
      }),
    ])

    const optimizations: string[] = []
    const expectedImprovements: Record<string, number> = {}

    // 基于性能分析提出优化建议
    if (performance.errorRate > 0.15) {
      optimizations.push('增加错误处理和重试机制')
      expectedImprovements.errorReduction = 0.2
    }

    if (performance.averageResponseTime > 30) {
      optimizations.push('优化响应时间，考虑缓存策略')
      expectedImprovements.responseTimeReduction = 0.3
    }

    if (performance.collaborationScore < 0.6) {
      optimizations.push('提升协作沟通能力')
      expectedImprovements.collaborationImprovement = 0.25
    }

    // 基于学习模式提出优化
    const successfulPatterns = learningPatterns.filter((p) => p.successRate > 0.8)
    if (successfulPatterns.length > 0) {
      optimizations.push(`加强应用成功的学习模式：${successfulPatterns[0].name}`)
      expectedImprovements.patternApplication = 0.15
    }

    // 能力扩展建议
    const currentCapabilities = currentConfig?.capabilities || []
    if (currentCapabilities.length < 3) {
      optimizations.push('扩展Agent能力范围')
      expectedImprovements.capabilityExpansion = 0.1
    }

    return {
      optimizations,
      expectedImprovements,
    }
  }

  /**
   * 应用优化建议
   */
  async applyOptimization(agentId: string, optimizationType: string): Promise<boolean> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { config: true, capabilities: true },
    })

    if (!agent) {
      return false
    }

    let updatedConfig = { ...agent.config }
    const updatedCapabilities = [...agent.capabilities]

    switch (optimizationType) {
      case 'error_handling':
        updatedConfig = {
          ...updatedConfig,
          errorHandling: {
            maxRetries: 3,
            backoffMultiplier: 1.5,
            timeout: 30000,
          },
        }
        break

      case 'response_optimization':
        updatedConfig = {
          ...updatedConfig,
          caching: {
            enabled: true,
            ttl: 3600000, // 1小时
          },
          batching: {
            enabled: true,
            maxBatchSize: 10,
          },
        }
        break

      case 'collaboration_improvement':
        updatedCapabilities.push({
          id: 'collaboration',
          name: '协作能力',
          description: '增强的协作和沟通能力',
        })
        break

      default:
        return false
    }

    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        config: updatedConfig,
        capabilities: updatedCapabilities,
        updatedAt: new Date(),
      },
    })

    // 记录优化应用
    await this.recordLearning(
      agentId,
      `optimization_applied_${optimizationType}`,
      {
        context: 'Agent optimization',
        action: `Applied optimization: ${optimizationType}`,
        result: 'success',
        metrics: {},
        timestamp: new Date(),
      },
      1
    )

    this.eventEmitter.emit('agent.optimized', {
      agentId,
      optimizationType,
      updatedConfig,
      updatedCapabilities,
    })

    return true
  }

  // ==================== 私有方法 ====================

  /**
   * 检查是否需要适应性调整
   */
  private async checkForAdaptation(
    agentId: string,
    pattern: string,
    data: LearningData
  ): Promise<void> {
    // 如果性能持续下降，触发适应性调整
    if (data.result === 'failure' && data.metrics.errorRate > 0.3) {
      const adaptations = await this.optimizeAgent(agentId)

      if (adaptations.optimizations.length > 0) {
        this.eventEmitter.emit('agent.adaptationNeeded', {
          agentId,
          pattern,
          adaptations,
          trigger: 'performance_degradation',
        })
      }
    }

    // 如果发现高效模式，自动应用
    if (data.result === 'success' && data.metrics.efficiency > 0.9) {
      await this.applyLearnedPattern(agentId, pattern, { efficiency: data.metrics.efficiency })
    }
  }

  /**
   * 从学习数据中提取模式
   */
  private extractPatternsFromData(learningData: AgentLearning[]): LearningPattern[] {
    const patternMap = new Map<string, LearningPattern>()

    for (const data of learningData) {
      const learning = data.data as LearningData
      const patternKey = `${data.pattern}_${learning.context}`

      if (!patternMap.has(patternKey)) {
        patternMap.set(patternKey, {
          id: patternKey,
          name: data.pattern,
          description: `Pattern derived from ${learning.context}`,
          category: this.categorizePattern(data.pattern),
          triggers: [learning.context],
          actions: [learning.action],
          successRate: 0,
          applicationCount: 0,
        })
      }

      const pattern = patternMap.get(patternKey)!

      // 更新触发条件和动作
      if (!pattern.triggers.includes(learning.context)) {
        pattern.triggers.push(learning.context)
      }

      if (!pattern.actions.includes(learning.action)) {
        pattern.actions.push(learning.action)
      }

      // 限制数组大小
      if (pattern.triggers.length > 5) pattern.triggers = pattern.triggers.slice(-5)
      if (pattern.actions.length > 5) pattern.actions = pattern.actions.slice(-5)
    }

    return Array.from(patternMap.values())
  }

  /**
   * 对模式进行分类
   */
  private categorizePattern(patternName: string): LearningPattern['category'] {
    if (patternName.includes('performance') || patternName.includes('speed')) {
      return 'performance'
    } else if (patternName.includes('collaborat') || patternName.includes('communicat')) {
      return 'collaboration'
    } else if (patternName.includes('capability') || patternName.includes('skill')) {
      return 'capability'
    } else {
      return 'behavior'
    }
  }

  /**
   * 检查上下文是否匹配模式
   */
  private matchPatternContext(pattern: LearningPattern, context: Record<string, any>): boolean {
    // 简化的上下文匹配逻辑
    const contextKeys = Object.keys(context)
    const triggerMatches = pattern.triggers.some((trigger) =>
      contextKeys.some((key) => trigger.toLowerCase().includes(key.toLowerCase()))
    )

    return triggerMatches
  }

  /**
   * 执行模式动作
   */
  private async executePatternActions(
    agentId: string,
    pattern: LearningPattern,
    context: Record<string, any>
  ): Promise<boolean> {
    try {
      // 这里应该实现具体的模式执行逻辑
      // 目前只是记录执行成功
      console.log(`Executing pattern ${pattern.name} for agent ${agentId}`)

      // 模拟模式执行
      await new Promise((resolve) => setTimeout(resolve, 100))

      return true
    } catch (error) {
      console.error(`Failed to execute pattern ${pattern.name}:`, error)
      return false
    }
  }

  /**
   * 生成改进建议
   */
  private generateImprovementRecommendations(
    metrics: AgentPerformanceMetrics,
    patterns: LearningPattern[]
  ): string[] {
    const recommendations: string[] = []

    if (metrics.taskCompletionRate < 0.7) {
      recommendations.push('关注任务完成质量，避免频繁失败')
    }

    if (metrics.averageResponseTime > 20) {
      recommendations.push('优化处理速度，考虑任务并行化')
    }

    if (metrics.errorRate > 0.15) {
      recommendations.push('加强错误处理和异常恢复机制')
    }

    if (metrics.collaborationScore < 0.6) {
      recommendations.push('提升协作沟通技巧，多参与团队任务')
    }

    if (metrics.learningAdaptability < 0.6) {
      recommendations.push('增加学习频率，主动适应新模式')
    }

    // 基于学习模式推荐
    const successfulPatterns = patterns.filter((p) => p.successRate > 0.8)
    if (successfulPatterns.length > 0) {
      recommendations.push(`多应用成功模式：${successfulPatterns[0].name}`)
    }

    return recommendations
  }
}
