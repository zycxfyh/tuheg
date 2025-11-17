import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { Observable, Subject, from, mergeMap, catchError, of } from 'rxjs'
import {
  AIAgent,
  AgentConfig,
  AgentContext,
  AgentExecutionResult,
  AgentState,
  AgentType,
  AgentFactory,
  AgentStats,
  AgentConfigExport
} from '../standard-protocol/agent.interface'
import {
  AgentRegistry,
  AgentDiscoveryService,
  AgentLoadBalancer,
  AgentDiscoveryQuery,
  AgentDiscoveryResult
} from '../standard-protocol/agent-registry.interface'
import {
  ToolRegistry,
  ToolExecutor,
  ToolPermissionManager,
  ToolCache,
  ToolOrchestrator
} from '../standard-protocol/tool-system.interface'

/**
 * Agent管理器配置
 */
export interface AgentManagerConfig {
  /** 默认超时时间 */
  defaultTimeout: number
  /** 最大并发Agent数 */
  maxConcurrentAgents: number
  /** 资源监控间隔 */
  resourceMonitoringInterval: number
  /** 健康检查间隔 */
  healthCheckInterval: number
  /** 自动清理间隔 */
  cleanupInterval: number
}

/**
 * Agent管理器
 */
@Injectable()
export class AgentManagerService {
  private readonly logger = new Logger(AgentManagerService.name)
  private readonly config: AgentManagerConfig
  private readonly agentFactories = new Map<AgentType, AgentFactory>()
  private readonly activeAgents = new Map<string, AIAgent>()
  private readonly agentContexts = new Map<string, AgentContext>()

  // 事件流
  private readonly agentCreated = new Subject<AIAgent>()
  private readonly agentDestroyed = new Subject<string>()
  private readonly agentStateChanged = new Subject<{ agentId: string; state: AgentState }>()
  private readonly agentExecuted = new Subject<{ agentId: string; result: AgentExecutionResult }>()

  constructor(
    private readonly agentRegistry: AgentRegistry,
    private readonly discoveryService: AgentDiscoveryService,
    private readonly loadBalancer: AgentLoadBalancer,
    private readonly toolRegistry: ToolRegistry,
    private readonly toolExecutor: ToolExecutor,
    private readonly permissionManager: ToolPermissionManager,
    private readonly toolCache: ToolCache,
    private readonly toolOrchestrator: ToolOrchestrator,
    config?: Partial<AgentManagerConfig>
  ) {
    this.config = {
      defaultTimeout: 30000,
      maxConcurrentAgents: 100,
      resourceMonitoringInterval: 5000,
      healthCheckInterval: 30000,
      cleanupInterval: 60000,
      ...config
    }

    this.initializeMonitoring()
  }

  /**
   * 注册Agent工厂
   */
  registerAgentFactory(type: AgentType, factory: AgentFactory): void {
    this.agentFactories.set(type, factory)
    this.logger.log(`Registered agent factory for type: ${type}`)
  }

  /**
   * 注销Agent工厂
   */
  unregisterAgentFactory(type: AgentType): void {
    this.agentFactories.delete(type)
    this.logger.log(`Unregistered agent factory for type: ${type}`)
  }

  /**
   * 创建Agent
   */
  async createAgent(
    id: string,
    config: AgentConfig,
    context?: Partial<AgentContext>
  ): Promise<AIAgent> {
    // 检查并发限制
    if (this.activeAgents.size >= this.config.maxConcurrentAgents) {
      throw new BadRequestException('Maximum concurrent agents limit reached')
    }

    // 检查Agent工厂
    const factory = this.agentFactories.get(config.type)
    if (!factory) {
      throw new BadRequestException(`No factory registered for agent type: ${config.type}`)
    }

    // 验证配置
    const isValid = await factory.validateConfig(config)
    if (!isValid) {
      throw new BadRequestException('Invalid agent configuration')
    }

    // 创建Agent实例
    const agent = factory.createAgent(id, config)

    // 创建Agent上下文
    const agentContext: AgentContext = {
      agentId: id,
      sessionId: context?.sessionId,
      userId: context?.userId,
      tenantId: context?.tenantId,
      environment: context?.environment || {},
      sharedData: context?.sharedData || new Map(),
      parentAgentId: context?.parentAgentId,
      childAgentIds: context?.childAgentIds || [],
      ...context
    }

    // 初始化Agent
    await agent.initialize(agentContext)

    // 注册到注册表
    await this.agentRegistry.registerAgent(agent, {
      autoStart: true,
      priority: 1,
      tags: [config.type, config.capabilityLevel]
    })

    // 保存状态
    this.activeAgents.set(id, agent)
    this.agentContexts.set(id, agentContext)

    // 监听状态变化
    agent.getStateStream().subscribe(state => {
      this.agentStateChanged.next({ agentId: id, state })
    })

    // 触发创建事件
    this.agentCreated.next(agent)

    this.logger.log(`Created agent: ${id} (${config.type})`)
    return agent
  }

  /**
   * 获取Agent
   */
  async getAgent(agentId: string): Promise<AIAgent | null> {
    // 先检查本地缓存
    let agent = this.activeAgents.get(agentId)
    if (agent) {
      return agent
    }

    // 从注册表获取
    agent = await this.agentRegistry.getAgent(agentId)
    if (agent) {
      this.activeAgents.set(agentId, agent)
      return agent
    }

    return null
  }

  /**
   * 执行Agent任务
   */
  async executeAgent(
    agentId: string,
    input: any,
    context?: Partial<AgentContext>
  ): Promise<AgentExecutionResult> {
    const agent = await this.getAgent(agentId)
    if (!agent) {
      throw new NotFoundException(`Agent not found: ${agentId}`)
    }

    // 检查Agent状态
    if (agent.state !== AgentState.IDLE) {
      throw new BadRequestException(`Agent ${agentId} is not in idle state: ${agent.state}`)
    }

    // 合并上下文
    const executionContext = {
      ...this.agentContexts.get(agentId),
      ...context
    }

    try {
      // 执行任务
      const result = await agent.execute(input, executionContext)

      // 触发执行事件
      this.agentExecuted.next({ agentId, result })

      this.logger.log(`Agent ${agentId} executed successfully in ${result.executionTime}ms`)
      return result

    } catch (error) {
      this.logger.error(`Agent ${agentId} execution failed:`, error)

      // 触发错误事件
      this.agentExecuted.next({
        agentId,
        result: {
          success: false,
          output: null,
          executionTime: 0,
          error: error.message,
          metadata: {
            steps: 0,
            toolsUsed: [],
            performance: {}
          }
        }
      })

      throw error
    }
  }

  /**
   * 销毁Agent
   */
  async destroyAgent(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId)
    if (!agent) {
      throw new NotFoundException(`Agent not found: ${agentId}`)
    }

    // 清理Agent
    await agent.cleanup()

    // 从注册表注销
    await this.agentRegistry.unregisterAgent(agentId)

    // 清理本地状态
    this.activeAgents.delete(agentId)
    this.agentContexts.delete(agentId)

    // 触发销毁事件
    this.agentDestroyed.next(agentId)

    this.logger.log(`Destroyed agent: ${agentId}`)
  }

  /**
   * 发现Agent
   */
  async discoverAgents(query?: AgentDiscoveryQuery): Promise<AgentDiscoveryResult> {
    return this.discoveryService.discoverAgents(query)
  }

  /**
   * 智能选择Agent
   */
  async selectAgentForTask(
    taskDescription: string,
    requirements?: {
      type?: AgentType
      capabilities?: string[]
      maxLoad?: number
    }
  ): Promise<AIAgent | null> {
    // 使用发现服务找到合适的Agent
    const candidates = await this.discoveryService.discoverByTask(taskDescription)

    if (candidates.length === 0) {
      return null
    }

    // 使用负载均衡器选择最佳Agent
    const bestCandidate = candidates[0] // 简化版本，选择相关性最高的

    return this.loadBalancer.selectBestAgent({
      ...requirements,
      excludeAgents: [] // 可以根据需要排除某些Agent
    })
  }

  /**
   * 批量执行任务
   */
  async executeBatch(
    executions: Array<{
      agentId: string
      input: any
      context?: Partial<AgentContext>
    }>
  ): Promise<AgentExecutionResult[]> {
    const observables = executions.map(({ agentId, input, context }) =>
      from(this.executeAgent(agentId, input, context)).pipe(
        catchError(error => {
          this.logger.error(`Batch execution failed for agent ${agentId}:`, error)
          return of({
            success: false,
            output: null,
            executionTime: 0,
            error: error.message,
            metadata: {
              steps: 0,
              toolsUsed: [],
              performance: {}
            }
          })
        })
      )
    )

    return new Promise((resolve) => {
      const results: AgentExecutionResult[] = []

      // 并发执行，但限制并发数量
      from(observables).pipe(
        mergeMap((observable, index) => observable, 5) // 最大并发数为5
      ).subscribe({
        next: (result) => results.push(result),
        complete: () => resolve(results)
      })
    })
  }

  /**
   * 获取Agent统计信息
   */
  async getAgentStats(agentId: string): Promise<AgentStats | null> {
    const agent = await this.getAgent(agentId)
    return agent?.getStats() || null
  }

  /**
   * 获取所有Agent统计信息
   */
  async getAllAgentStats(): Promise<Record<string, AgentStats>> {
    const stats: Record<string, AgentStats> = {}

    for (const [agentId, agent] of this.activeAgents) {
      stats[agentId] = agent.getStats()
    }

    return stats
  }

  /**
   * 导出Agent配置
   */
  async exportAgentConfig(agentId: string): Promise<AgentConfigExport | null> {
    const agent = await this.getAgent(agentId)
    return agent?.exportConfig() || null
  }

  /**
   * 导入Agent配置
   */
  async importAgentConfig(config: AgentConfigExport): Promise<AIAgent> {
    return this.createAgent(config.config.name, config.config)
  }

  /**
   * 获取管理器统计信息
   */
  getManagerStats(): {
    activeAgents: number
    registeredFactories: number
    totalExecutions: number
    uptime: number
  } {
    return {
      activeAgents: this.activeAgents.size,
      registeredFactories: this.agentFactories.size,
      totalExecutions: 0, // TODO: 实现执行计数
      uptime: process.uptime()
    }
  }

  /**
   * 监听Agent创建事件
   */
  onAgentCreated(): Observable<AIAgent> {
    return this.agentCreated.asObservable()
  }

  /**
   * 监听Agent销毁事件
   */
  onAgentDestroyed(): Observable<string> {
    return this.agentDestroyed.asObservable()
  }

  /**
   * 监听Agent状态变化
   */
  onAgentStateChanged(): Observable<{ agentId: string; state: AgentState }> {
    return this.agentStateChanged.asObservable()
  }

  /**
   * 监听Agent执行事件
   */
  onAgentExecuted(): Observable<{ agentId: string; result: AgentExecutionResult }> {
    return this.agentExecuted.asObservable()
  }

  /**
   * 初始化监控
   */
  private initializeMonitoring(): void {
    // 定期健康检查
    setInterval(() => {
      this.performHealthChecks()
    }, this.config.healthCheckInterval)

    // 定期清理
    setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)

    // 资源监控
    setInterval(() => {
      this.monitorResources()
    }, this.config.resourceMonitoringInterval)
  }

  /**
   * 执行健康检查
   */
  private async performHealthChecks(): Promise<void> {
    try {
      const healthInfos = await this.agentRegistry.getAllAgentHealth()

      for (const health of healthInfos) {
        if (health.status === 'unhealthy') {
          this.logger.warn(`Agent ${health.agentId} is unhealthy: ${health.details.errorRate}% error rate`)
        }
      }
    } catch (error) {
      this.logger.error('Health check failed:', error)
    }
  }

  /**
   * 执行清理
   */
  private async performCleanup(): Promise<void> {
    try {
      await this.agentRegistry.cleanupUnhealthyAgents()
      this.logger.debug('Cleanup completed')
    } catch (error) {
      this.logger.error('Cleanup failed:', error)
    }
  }

  /**
   * 监控资源使用
   */
  private monitorResources(): void {
    const stats = this.getManagerStats()
    this.logger.debug(`Resource monitor: ${stats.activeAgents} active agents`)
  }
}
