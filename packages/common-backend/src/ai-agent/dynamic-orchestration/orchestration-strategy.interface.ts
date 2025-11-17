import { z } from 'zod'
import {
  TaskSpecification,
  TaskComplexity,
  TaskPriority,
  TaskExecutionContext
} from './task-analysis.interface'
import { AIAgent, AgentType, AgentCapabilityLevel } from '../standard-protocol/agent.interface'

/**
 * 编排策略类型
 */
export enum OrchestrationStrategyType {
  /** 简单策略 */
  SIMPLE = 'simple',
  /** 负载均衡策略 */
  LOAD_BALANCE = 'load_balance',
  /** 成本优化策略 */
  COST_OPTIMIZATION = 'cost_optimization',
  /** 性能优先策略 */
  PERFORMANCE_FIRST = 'performance_first',
  /** 质量保证策略 */
  QUALITY_ASSURANCE = 'quality_assurance',
  /** 自适应策略 */
  ADAPTIVE = 'adaptive',
  /** 学习优化策略 */
  LEARNING_OPTIMIZATION = 'learning_optimization'
}

/**
 * 调度算法类型
 */
export enum SchedulingAlgorithm {
  /** 先到先服务 */
  FIFO = 'fifo',
  /** 最短作业优先 */
  SJF = 'sjf',
  /** 优先级调度 */
  PRIORITY = 'priority',
  /** 轮转调度 */
  ROUND_ROBIN = 'round_robin',
  /** 多级队列 */
  MULTILEVEL_QUEUE = 'multilevel_queue',
  /** 最短剩余时间 */
  SRT = 'srt',
  /** 公平分享 */
  FAIR_SHARE = 'fair_share'
}

/**
 * 资源分配策略
 */
export enum ResourceAllocationStrategy {
  /** 静态分配 */
  STATIC = 'static',
  /** 动态分配 */
  DYNAMIC = 'dynamic',
  /** 预测分配 */
  PREDICTIVE = 'predictive',
  /** 按需分配 */
  ON_DEMAND = 'on_demand',
  /** 共享分配 */
  SHARED = 'shared'
}

/**
 * 编排策略配置
 */
export interface OrchestrationStrategyConfig {
  /** 策略类型 */
  type: OrchestrationStrategyType
  /** 调度算法 */
  schedulingAlgorithm: SchedulingAlgorithm
  /** 资源分配策略 */
  resourceAllocationStrategy: ResourceAllocationStrategy
  /** 并发限制 */
  concurrencyLimits: {
    maxConcurrentTasks: number
    maxConcurrentAgents: number
    maxTasksPerAgent: number
  }
  /** 优先级配置 */
  priorityConfig: {
    enablePriorityBoost: boolean
    priorityDecayRate: number
    urgentTaskTimeout: number
  }
  /** 质量控制 */
  qualityControl: {
    enableQualityGates: boolean
    qualityThreshold: number
    reviewRequiredFor: TaskComplexity[]
  }
  /** 容错配置 */
  faultTolerance: {
    enableCircuitBreaker: boolean
    circuitBreakerThreshold: number
    retryPolicy: {
      maxRetries: number
      backoffStrategy: 'fixed' | 'exponential' | 'linear'
      baseDelay: number
    }
    fallbackStrategy: 'degrade' | 'alternative' | 'fail'
  }
  /** 监控配置 */
  monitoring: {
    enableMetrics: boolean
    metricsInterval: number
    alertingThresholds: {
      taskFailureRate: number
      averageResponseTime: number
      resourceUtilization: number
    }
  }
}

/**
 * 策略评估结果
 */
export interface StrategyEvaluationResult {
  /** 策略ID */
  strategyId: string
  /** 评估分数 */
  score: number
  /** 性能指标 */
  metrics: {
    executionTime: number
    successRate: number
    resourceEfficiency: number
    costEfficiency: number
    qualityScore: number
  }
  /** 优势 */
  advantages: string[]
  /** 劣势 */
  disadvantages: string[]
  /** 适用场景 */
  suitableScenarios: string[]
  /** 改进建议 */
  recommendations: string[]
}

/**
 * Agent选择标准
 */
export interface AgentSelectionCriteria {
  /** 必需的能力 */
  requiredCapabilities: string[]
  /** 偏好的能力 */
  preferredCapabilities: string[]
  /** 最小能力级别 */
  minCapabilityLevel: AgentCapabilityLevel
  /** 偏好的Agent类型 */
  preferredTypes: AgentType[]
  /** 排除的Agent */
  excludedAgents: string[]
  /** 资源限制 */
  resourceConstraints: {
    maxCpuUsage: number
    maxMemoryUsage: number
    maxResponseTime: number
  }
  /** 成本限制 */
  costConstraints: {
    maxCostPerTask: number
    maxCostPerHour: number
  }
  /** 质量要求 */
  qualityRequirements: {
    minSuccessRate: number
    minAccuracy: number
  }
}

/**
 * 任务调度决策
 */
export interface SchedulingDecision {
  /** 任务ID */
  taskId: string
  /** 选择的Agent */
  selectedAgent: AIAgent
  /** 决策理由 */
  reasoning: string
  /** 置信度 */
  confidence: number
  /** 预期性能 */
  expectedPerformance: {
    executionTime: number
    successProbability: number
    resourceUsage: {
      cpu: number
      memory: number
    }
  }
  /** 替代方案 */
  alternatives: Array<{
    agent: AIAgent
    score: number
    tradeoffs: string[]
  }>
  /** 调度时间戳 */
  scheduledAt: Date
  /** 优先级调整 */
  priorityAdjustment?: number
}

/**
 * 编排策略接口
 */
export interface OrchestrationStrategy {
  /** 策略ID */
  id: string
  /** 策略名称 */
  name: string
  /** 策略描述 */
  description: string
  /** 策略类型 */
  type: OrchestrationStrategyType
  /** 配置 */
  config: OrchestrationStrategyConfig

  /** 评估策略适用性 */
  evaluateSuitability(
    tasks: TaskSpecification[],
    agents: AIAgent[],
    context: TaskExecutionContext
  ): Promise<number>

  /** 生成编排计划 */
  generateOrchestrationPlan(
    tasks: TaskSpecification[],
    agents: AIAgent[],
    context: TaskExecutionContext
  ): Promise<{
    plan: any
    estimatedExecutionTime: number
    estimatedCost: number
    successProbability: number
  }>

  /** 执行策略 */
  executeStrategy(
    plan: any,
    context: TaskExecutionContext
  ): Promise<any>

  /** 适应性调整 */
  adaptStrategy(
    feedback: any,
    context: TaskExecutionContext
  ): Promise<OrchestrationStrategyConfig>
}

/**
 * 调度器接口
 */
export interface TaskScheduler {
  /** 调度任务 */
  scheduleTask(
    task: TaskSpecification,
    availableAgents: AIAgent[],
    context: TaskExecutionContext,
    criteria?: Partial<AgentSelectionCriteria>
  ): Promise<SchedulingDecision>

  /** 批量调度任务 */
  scheduleTasks(
    tasks: TaskSpecification[],
    availableAgents: AIAgent[],
    context: TaskExecutionContext,
    strategy?: SchedulingAlgorithm
  ): Promise<SchedulingDecision[]>

  /** 重新调度任务 */
  rescheduleTask(
    taskId: string,
    reason: string,
    newCriteria?: Partial<AgentSelectionCriteria>
  ): Promise<SchedulingDecision>

  /** 取消任务调度 */
  cancelTaskScheduling(taskId: string): Promise<void>

  /** 获取调度队列 */
  getSchedulingQueue(): Promise<Array<{
    taskId: string
    priority: number
    queuedAt: Date
    estimatedStartTime?: Date
  }>>

  /** 获取调度统计 */
  getSchedulingStatistics(): Promise<{
    totalScheduled: number
    averageSchedulingTime: number
    successRate: number
    queueLength: number
    algorithmPerformance: Record<SchedulingAlgorithm, number>
  }>
}

/**
 * 资源分配器接口
 */
export interface ResourceAllocator {
  /** 分配资源 */
  allocateResources(
    task: TaskSpecification,
    agent: AIAgent,
    context: TaskExecutionContext
  ): Promise<{
    allocated: boolean
    resources: {
      cpu: number
      memory: number
      network: string
      storage?: number
    }
    reservationId: string
    expiresAt: Date
  }>

  /** 释放资源 */
  releaseResources(reservationId: string): Promise<void>

  /** 检查资源可用性 */
  checkResourceAvailability(
    requirements: any,
    context: TaskExecutionContext
  ): Promise<{
    available: boolean
    availableResources: any
    waitTime?: number
    alternatives?: any[]
  }>

  /** 优化资源分配 */
  optimizeResourceAllocation(
    tasks: TaskSpecification[],
    agents: AIAgent[],
    context: TaskExecutionContext
  ): Promise<{
    allocation: Record<string, any>
    efficiency: number
    bottlenecks: string[]
  }>

  /** 获取资源使用统计 */
  getResourceStatistics(): Promise<{
    totalAllocations: number
    currentUtilization: {
      cpu: number
      memory: number
      network: number
      storage: number
    }
    peakUtilization: {
      cpu: number
      memory: number
      network: number
      storage: number
    }
    allocationEfficiency: number
  }>
}

/**
 * 策略选择器接口
 */
export interface StrategySelector {
  /** 选择最佳策略 */
  selectBestStrategy(
    availableStrategies: OrchestrationStrategy[],
    tasks: TaskSpecification[],
    agents: AIAgent[],
    context: TaskExecutionContext
  ): Promise<{
    selectedStrategy: OrchestrationStrategy
    confidence: number
    reasoning: string
    alternatives: Array<{
      strategy: OrchestrationStrategy
      score: number
    }>
  }>

  /** 评估策略性能 */
  evaluateStrategyPerformance(
    strategy: OrchestrationStrategy,
    tasks: TaskSpecification[],
    agents: AIAgent[],
    context: TaskExecutionContext
  ): Promise<StrategyEvaluationResult>

  /** 学习策略选择模式 */
  learnFromExecutions(
    executions: Array<{
      strategy: OrchestrationStrategy
      tasks: TaskSpecification[]
      result: any
      context: TaskExecutionContext
    }>
  ): Promise<void>

  /** 获取策略推荐 */
  getStrategyRecommendations(
    scenario: string,
    constraints: any
  ): Promise<OrchestrationStrategy[]>
}

/**
 * 自适应编排器接口
 */
export interface AdaptiveOrchestrator {
  /** 分析执行模式 */
  analyzeExecutionPatterns(
    executions: any[],
    context: TaskExecutionContext
  ): Promise<{
    patterns: any[]
    insights: string[]
    recommendations: any[]
  }>

  /** 预测最佳策略 */
  predictOptimalStrategy(
    tasks: TaskSpecification[],
    agents: AIAgent[],
    context: TaskExecutionContext
  ): Promise<{
    predictedStrategy: OrchestrationStrategy
    confidence: number
    factors: string[]
  }>

  /** 实时调整编排 */
  adjustOrchestrationRealtime(
    workflowId: string,
    currentMetrics: any,
    context: TaskExecutionContext
  ): Promise<{
    adjustments: any[]
    expectedImprovement: number
    riskAssessment: string
  }>

  /** 生成编排报告 */
  generateOrchestrationReport(
    workflowId: string,
    includeRecommendations?: boolean
  ): Promise<{
    summary: any
    performance: any
    issues: string[]
    recommendations: string[]
    nextSteps: string[]
  }>
}

/**
 * 编排策略Schema定义
 */
export const OrchestrationStrategyConfigSchema = z.object({
  type: z.nativeEnum(OrchestrationStrategyType),
  schedulingAlgorithm: z.nativeEnum(SchedulingAlgorithm),
  resourceAllocationStrategy: z.nativeEnum(ResourceAllocationStrategy),
  concurrencyLimits: z.object({
    maxConcurrentTasks: z.number().min(1),
    maxConcurrentAgents: z.number().min(1),
    maxTasksPerAgent: z.number().min(1)
  }),
  priorityConfig: z.object({
    enablePriorityBoost: z.boolean(),
    priorityDecayRate: z.number().min(0).max(1),
    urgentTaskTimeout: z.number().min(0)
  }),
  qualityControl: z.object({
    enableQualityGates: z.boolean(),
    qualityThreshold: z.number().min(0).max(1),
    reviewRequiredFor: z.array(z.nativeEnum(TaskComplexity))
  }),
  faultTolerance: z.object({
    enableCircuitBreaker: z.boolean(),
    circuitBreakerThreshold: z.number().min(0).max(1),
    retryPolicy: z.object({
      maxRetries: z.number().min(0),
      backoffStrategy: z.enum(['fixed', 'exponential', 'linear']),
      baseDelay: z.number().min(0)
    }),
    fallbackStrategy: z.enum(['degrade', 'alternative', 'fail'])
  }),
  monitoring: z.object({
    enableMetrics: z.boolean(),
    metricsInterval: z.number().min(1000),
    alertingThresholds: z.object({
      taskFailureRate: z.number().min(0).max(1),
      averageResponseTime: z.number().min(0),
      resourceUtilization: z.number().min(0).max(1)
    })
  })
})

/**
 * Agent选择标准Schema
 */
export const AgentSelectionCriteriaSchema = z.object({
  requiredCapabilities: z.array(z.string()),
  preferredCapabilities: z.array(z.string()).optional(),
  minCapabilityLevel: z.nativeEnum(AgentCapabilityLevel),
  preferredTypes: z.array(z.nativeEnum(AgentType)).optional(),
  excludedAgents: z.array(z.string()).optional(),
  resourceConstraints: z.object({
    maxCpuUsage: z.number().min(0).max(100),
    maxMemoryUsage: z.number().min(0),
    maxResponseTime: z.number().min(0)
  }).optional(),
  costConstraints: z.object({
    maxCostPerTask: z.number().min(0),
    maxCostPerHour: z.number().min(0)
  }).optional(),
  qualityRequirements: z.object({
    minSuccessRate: z.number().min(0).max(1),
    minAccuracy: z.number().min(0).max(1)
  }).optional()
})
