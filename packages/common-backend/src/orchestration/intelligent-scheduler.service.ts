import { Injectable, Logger } from '@nestjs/common'
import { AgentRegistryService, AgentInfo, AgentCapability } from './agent-registry.service'

export interface TaskRequirements {
  capability: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  maxLatency?: number // 最大允许延迟(ms)
  minReliability?: number // 最小可靠性要求
  costBudget?: number // 成本预算
  preferredTags?: string[] // 偏好的Agent标签
  excludedAgentIds?: string[] // 排除的Agent ID列表
}

export interface SchedulingResult {
  agent: AgentInfo
  capability: AgentCapability
  score: number // 调度评分 (0-100)
  estimatedCost: number
  estimatedLatency: number
  reasoning: string[] // 调度决策的理由
}

export interface SchedulingContext {
  taskId: string
  requirements: TaskRequirements
  historicalPerformance?: {
    agentId: string
    successRate: number
    averageLatency: number
    averageCost: number
  }[]
  loadBalancing?: boolean
  failoverEnabled?: boolean
}

@Injectable()
export class IntelligentSchedulerService {
  private readonly logger = new Logger(IntelligentSchedulerService.name)

  constructor(private agentRegistry: AgentRegistryService) {}

  /**
   * 智能调度：选择最合适的Agent执行任务
   */
  async scheduleTask(context: SchedulingContext): Promise<SchedulingResult | null> {
    const { requirements, historicalPerformance, loadBalancing = true } = context

    this.logger.debug(`Scheduling task ${context.taskId} with requirements:`, requirements)

    // 1. 初步筛选：基于能力匹配
    let candidates = this.agentRegistry.findAgentsByCapability(
      requirements.capability,
      requirements.minReliability || 0.8
    )

    if (candidates.length === 0) {
      this.logger.warn(`No agents found for capability: ${requirements.capability}`)
      return null
    }

    // 2. 应用排除规则
    if (requirements.excludedAgentIds?.length) {
      candidates = candidates.filter(agent =>
        !requirements.excludedAgentIds!.includes(agent.id)
      )
    }

    // 3. 应用偏好标签过滤
    if (requirements.preferredTags?.length) {
      const taggedCandidates = candidates.filter(agent =>
        requirements.preferredTags!.some(tag => agent.tags.includes(tag))
      )
      // 如果有标签匹配的Agent，优先使用
      if (taggedCandidates.length > 0) {
        candidates = taggedCandidates
      }
    }

    // 4. 计算每个候选者的调度评分
    const scoredCandidates = await Promise.all(
      candidates.map(async (agent) => {
        const capability = agent.capabilities.find(cap => cap.name === requirements.capability)!
        const score = await this.calculateSchedulingScore(agent, capability, context)
        return { agent, capability, score }
      })
    )

    // 5. 按评分排序，选择最佳候选者
    scoredCandidates.sort((a, b) => b.score - a.score)
    const bestCandidate = scoredCandidates[0]

    if (!bestCandidate) {
      return null
    }

    const result: SchedulingResult = {
      agent: bestCandidate.agent,
      capability: bestCandidate.capability,
      score: bestCandidate.score,
      estimatedCost: bestCandidate.capability.cost,
      estimatedLatency: bestCandidate.capability.latency,
      reasoning: await this.generateSchedulingReasoning(bestCandidate.agent, bestCandidate.capability, context)
    }

    this.logger.log(`Task ${context.taskId} scheduled to agent ${result.agent.id} with score ${result.score}`)
    return result
  }

  /**
   * 计算调度评分
   */
  private async calculateSchedulingScore(
    agent: AgentInfo,
    capability: AgentCapability,
    context: SchedulingContext
  ): Promise<number> {
    const { requirements, historicalPerformance, loadBalancing } = context
    let score = 0
    const weights = {
      health: 0.25,
      reliability: 0.25,
      latency: 0.20,
      cost: 0.15,
      historical: 0.10,
      loadBalance: 0.05
    }

    // 1. 健康评分 (0-25分)
    score += (agent.healthScore / 100) * weights.health * 100

    // 2. 可靠性评分 (0-25分)
    score += capability.reliability * weights.reliability * 100

    // 3. 延迟评分 (0-20分)
    const latencyScore = requirements.maxLatency
      ? Math.max(0, 1 - (capability.latency / requirements.maxLatency))
      : 1
    score += latencyScore * weights.latency * 100

    // 4. 成本评分 (0-15分)
    const costScore = requirements.costBudget
      ? Math.max(0, 1 - (capability.cost / requirements.costBudget))
      : 0.8 // 默认中等成本偏好
    score += costScore * weights.cost * 100

    // 5. 历史性能评分 (0-10分)
    const historicalScore = this.calculateHistoricalScore(agent.id, historicalPerformance)
    score += historicalScore * weights.historical * 100

    // 6. 负载均衡评分 (0-5分)
    const loadBalanceScore = loadBalancing ? this.calculateLoadBalanceScore(agent) : 1
    score += loadBalanceScore * weights.loadBalance * 100

    return Math.min(100, Math.max(0, score))
  }

  /**
   * 计算历史性能评分
   */
  private calculateHistoricalScore(
    agentId: string,
    historicalPerformance?: SchedulingContext['historicalPerformance']
  ): number {
    if (!historicalPerformance) return 0.5 // 中等默认评分

    const history = historicalPerformance.find(h => h.agentId === agentId)
    if (!history) return 0.5

    // 综合成功率、延迟和成本
    const successWeight = 0.5
    const latencyWeight = 0.3
    const costWeight = 0.2

    return (
      history.successRate * successWeight +
      (history.averageLatency < 5000 ? 1 : 0.5) * latencyWeight + // 5秒以内为好
      (history.averageCost < 0.01 ? 1 : 0.7) * costWeight // 1分以内为好
    )
  }

  /**
   * 计算负载均衡评分
   */
  private calculateLoadBalanceScore(agent: AgentInfo): number {
    // 简化的负载均衡：基于Agent的标签和当前状态
    // 在实际实现中，这里应该考虑当前队列长度、CPU使用率等
    const baseLoad = agent.healthScore > 80 ? 0.9 : 0.6
    const tagBonus = agent.tags.includes('high-performance') ? 0.1 : 0

    return Math.min(1, baseLoad + tagBonus)
  }

  /**
   * 生成调度决策的理由
   */
  private async generateSchedulingReasoning(
    agent: AgentInfo,
    capability: AgentCapability,
    context: SchedulingContext
  ): Promise<string[]> {
    const reasons: string[] = []

    reasons.push(`Agent ${agent.name} (${agent.type}) 具有所需能力: ${capability.name}`)

    if (agent.healthScore > 90) {
      reasons.push(`Agent 健康状态优秀 (${agent.healthScore}/100)`)
    } else if (agent.healthScore > 70) {
      reasons.push(`Agent 健康状态良好 (${agent.healthScore}/100)`)
    }

    if (capability.reliability > 0.95) {
      reasons.push(`能力可靠性极高 (${Math.round(capability.reliability * 100)}%)`)
    } else if (capability.reliability > 0.85) {
      reasons.push(`能力可靠性良好 (${Math.round(capability.reliability * 100)}%)`)
    }

    if (context.requirements.maxLatency && capability.latency <= context.requirements.maxLatency) {
      reasons.push(`满足延迟要求: ${capability.latency}ms ≤ ${context.requirements.maxLatency}ms`)
    }

    if (context.requirements.preferredTags?.some(tag => agent.tags.includes(tag))) {
      const matchedTags = context.requirements.preferredTags!.filter(tag => agent.tags.includes(tag))
      reasons.push(`匹配偏好标签: ${matchedTags.join(', ')}`)
    }

    return reasons
  }

  /**
   * 批量调度多个任务
   */
  async scheduleMultipleTasks(
    tasks: Array<{ taskId: string; requirements: TaskRequirements }>
  ): Promise<Map<string, SchedulingResult | null>> {
    const results = new Map<string, SchedulingResult | null>()

    // 并发调度所有任务，但限制并发数量以避免过载
    const concurrencyLimit = 5
    for (let i = 0; i < tasks.length; i += concurrencyLimit) {
      const batch = tasks.slice(i, i + concurrencyLimit)
      const batchPromises = batch.map(async (task) => {
        const result = await this.scheduleTask({
          taskId: task.taskId,
          requirements: task.requirements,
          loadBalancing: true,
          failoverEnabled: true
        })
        return { taskId: task.taskId, result }
      })

      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(({ taskId, result }) => {
        results.set(taskId, result)
      })
    }

    return results
  }

  /**
   * 获取调度统计信息
   */
  getSchedulingStats() {
    return {
      totalAgents: this.agentRegistry.getAllAgents().length,
      onlineAgents: this.agentRegistry.getOnlineAgents().length,
      capabilities: this.getAvailableCapabilities(),
      averageHealthScore: this.agentRegistry.getRegistryStats().averageHealthScore
    }
  }

  /**
   * 获取可用能力列表
   */
  private getAvailableCapabilities(): string[] {
    const capabilities = new Set<string>()
    this.agentRegistry.getAllAgents().forEach(agent => {
      agent.capabilities.forEach(cap => capabilities.add(cap.name))
    })
    return Array.from(capabilities)
  }
}
