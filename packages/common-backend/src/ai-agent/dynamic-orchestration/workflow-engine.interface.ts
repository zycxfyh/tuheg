import { Observable } from 'rxjs'
import {
  TaskSpecification,
  CompositeTask,
  TaskExecutionContext,
  TaskExecutionRecord,
  TaskAnalysisResult
} from './task-analysis.interface'
import { AIAgent, AgentExecutionResult } from '../standard-protocol/agent.interface'

/**
 * 工作流状态枚举
 */
export enum WorkflowState {
  /** 创建中 */
  CREATED = 'created',
  /** 分析中 */
  ANALYZING = 'analyzing',
  /** 规划中 */
  PLANNING = 'planning',
  /** 执行中 */
  EXECUTING = 'executing',
  /** 暂停中 */
  PAUSED = 'paused',
  /** 完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
  /** 取消 */
  CANCELLED = 'cancelled'
}

/**
 * 工作流执行模式
 */
export enum WorkflowExecutionMode {
  /** 串行执行 */
  SEQUENTIAL = 'sequential',
  /** 并行执行 */
  PARALLEL = 'parallel',
  /** 条件执行 */
  CONDITIONAL = 'conditional',
  /** 自适应执行 */
  ADAPTIVE = 'adaptive'
}

/**
 * Agent分配策略
 */
export enum AgentAllocationStrategy {
  /** 最佳匹配 */
  BEST_MATCH = 'best_match',
  /** 负载均衡 */
  LOAD_BALANCE = 'load_balance',
  /** 成本优化 */
  COST_OPTIMIZATION = 'cost_optimization',
  /** 性能优先 */
  PERFORMANCE_FIRST = 'performance_first',
  /** 可靠性优先 */
  RELIABILITY_FIRST = 'reliability_first'
}

/**
 * 工作流步骤
 */
export interface WorkflowStep {
  /** 步骤ID */
  id: string
  /** 步骤名称 */
  name: string
  /** 步骤描述 */
  description: string
  /** 任务规范 */
  taskSpec: TaskSpecification
  /** 分配的Agent */
  assignedAgent?: AIAgent
  /** 执行状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  /** 执行结果 */
  result?: TaskExecutionRecord
  /** 依赖步骤 */
  dependencies: string[]
  /** 执行条件 */
  condition?: string
  /** 重试配置 */
  retryConfig?: {
    maxAttempts: number
    backoffStrategy: 'fixed' | 'exponential' | 'linear'
    backoffDelay: number
  }
  /** 超时配置 */
  timeoutConfig?: {
    duration: number
    action: 'fail' | 'retry' | 'skip'
  }
  /** 替代步骤 */
  fallbackSteps?: WorkflowStep[]
}

/**
 * Agent组合
 */
export interface AgentComposition {
  /** 组合ID */
  id: string
  /** 组合名称 */
  name: string
  /** 组合描述 */
  description: string
  /** 主要Agent */
  primaryAgent: AIAgent
  /** 支持Agent列表 */
  supportAgents: AIAgent[]
  /** 组合策略 */
  strategy: 'master-slave' | 'peer-to-peer' | 'hierarchical' | 'collaborative'
  /** 通信协议 */
  communicationProtocol: 'direct' | 'event-driven' | 'message-queue'
  /** 资源分配 */
  resourceAllocation: {
    primaryAgentResources: number
    supportAgentResources: number
    sharedResources: number
  }
  /** 协作规则 */
  collaborationRules: Array<{
    trigger: string
    action: string
    priority: number
  }>
}

/**
 * 工作流实例
 */
export interface WorkflowInstance {
  /** 工作流ID */
  id: string
  /** 工作流名称 */
  name: string
  /** 工作流描述 */
  description: string
  /** 工作流状态 */
  state: WorkflowState
  /** 执行模式 */
  executionMode: WorkflowExecutionMode
  /** Agent分配策略 */
  agentAllocationStrategy: AgentAllocationStrategy
  /** 原始任务分析结果 */
  taskAnalysis: TaskAnalysisResult
  /** 工作流步骤 */
  steps: WorkflowStep[]
  /** Agent组合 */
  agentComposition: AgentComposition
  /** 执行上下文 */
  executionContext: TaskExecutionContext
  /** 执行历史 */
  executionHistory: TaskExecutionRecord[]
  /** 创建时间 */
  createdAt: Date
  /** 开始时间 */
  startedAt?: Date
  /** 完成时间 */
  completedAt?: Date
  /** 进度信息 */
  progress: {
    completedSteps: number
    totalSteps: number
    currentStep?: string
    estimatedTimeRemaining?: number
  }
  /** 性能指标 */
  metrics: {
    totalExecutionTime: number
    averageStepTime: number
    successRate: number
    resourceUtilization: number
  }
}

/**
 * 工作流执行选项
 */
export interface WorkflowExecutionOptions {
  /** 执行模式 */
  mode?: WorkflowExecutionMode
  /** Agent分配策略 */
  agentAllocationStrategy?: AgentAllocationStrategy
  /** 最大并发步骤数 */
  maxConcurrentSteps?: number
  /** 全局超时时间 */
  globalTimeout?: number
  /** 失败处理策略 */
  failureStrategy?: 'stop' | 'continue' | 'rollback'
  /** 资源限制 */
  resourceLimits?: {
    maxCpu: number
    maxMemory: number
    maxConcurrentAgents: number
  }
  /** 监控选项 */
  monitoring?: {
    enableMetrics: boolean
    enableTracing: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
}

/**
 * 工作流执行结果
 */
export interface WorkflowExecutionResult {
  /** 工作流实例ID */
  workflowId: string
  /** 是否成功 */
  success: boolean
  /** 最终输出 */
  output: any
  /** 错误信息 */
  error?: string
  /** 执行统计 */
  statistics: {
    totalSteps: number
    completedSteps: number
    failedSteps: number
    skippedSteps: number
    totalExecutionTime: number
    averageStepTime: number
  }
  /** 步骤结果 */
  stepResults: TaskExecutionRecord[]
  /** 资源使用情况 */
  resourceUsage: {
    totalCpuTime: number
    peakMemoryUsage: number
    totalNetworkUsage: number
  }
  /** Agent使用统计 */
  agentUsage: Array<{
    agentId: string
    tasksExecuted: number
    totalTime: number
    successRate: number
  }>
}

/**
 * 工作流引擎接口
 */
export interface WorkflowEngine {
  /** 创建工作流实例 */
  createWorkflow(
    name: string,
    description: string,
    taskAnalysis: TaskAnalysisResult,
    options?: WorkflowExecutionOptions
  ): Promise<WorkflowInstance>

  /** 执行工作流 */
  executeWorkflow(
    workflowId: string,
    input: any,
    context?: Partial<TaskExecutionContext>
  ): Promise<WorkflowExecutionResult>

  /** 暂停工作流 */
  pauseWorkflow(workflowId: string): Promise<void>

  /** 恢复工作流 */
  resumeWorkflow(workflowId: string): Promise<void>

  /** 取消工作流 */
  cancelWorkflow(workflowId: string): Promise<void>

  /** 获取工作流状态 */
  getWorkflowState(workflowId: string): Promise<WorkflowState>

  /** 获取工作流进度 */
  getWorkflowProgress(workflowId: string): Promise<WorkflowInstance['progress']>

  /** 获取工作流实例 */
  getWorkflowInstance(workflowId: string): Promise<WorkflowInstance | null>

  /** 列出工作流实例 */
  listWorkflowInstances(
    filter?: {
      state?: WorkflowState
      createdAfter?: Date
      createdBefore?: Date
    },
    pagination?: {
      page: number
      limit: number
    }
  ): Promise<{
    workflows: WorkflowInstance[]
    total: number
    page: number
    limit: number
  }>

  /** 删除工作流实例 */
  deleteWorkflowInstance(workflowId: string): Promise<void>

  /** 监听工作流事件 */
  onWorkflowEvent(workflowId?: string): Observable<{
    workflowId: string
    event: string
    data: any
    timestamp: Date
  }>

  /** 获取工作流统计 */
  getWorkflowStatistics(): Promise<{
    totalWorkflows: number
    activeWorkflows: number
    completedWorkflows: number
    failedWorkflows: number
    averageExecutionTime: number
    successRate: number
    resourceUtilization: number
  }>
}

/**
 * Agent组合引擎接口
 */
export interface AgentCompositionEngine {
  /** 创建Agent组合 */
  createComposition(
    primaryAgent: AIAgent,
    supportAgents: AIAgent[],
    strategy: AgentComposition['strategy']
  ): Promise<AgentComposition>

  /** 执行Agent组合任务 */
  executeWithComposition(
    compositionId: string,
    task: TaskSpecification,
    input: any,
    context: TaskExecutionContext
  ): Promise<AgentExecutionResult>

  /** 优化Agent组合 */
  optimizeComposition(
    composition: AgentComposition,
    performanceMetrics: any
  ): Promise<AgentComposition>

  /** 获取组合建议 */
  suggestComposition(
    task: TaskSpecification,
    availableAgents: AIAgent[]
  ): Promise<AgentComposition[]>

  /** 评估组合性能 */
  evaluateComposition(
    composition: AgentComposition,
    testTasks: TaskSpecification[]
  ): Promise<{
    compositionId: string
    score: number
    metrics: {
      executionTime: number
      successRate: number
      resourceEfficiency: number
      collaborationEfficiency: number
    }
    recommendations: string[]
  }>
}

/**
 * 动态路由器接口
 */
export interface DynamicRouter {
  /** 路由任务到Agent */
  routeTask(
    task: TaskSpecification,
    availableAgents: AIAgent[],
    context: TaskExecutionContext,
    strategy?: AgentAllocationStrategy
  ): Promise<{
    selectedAgent: AIAgent
    confidence: number
    reasoning: string
    alternatives: Array<{
      agent: AIAgent
      score: number
    }>
  }>

  /** 路由复合任务 */
  routeCompositeTask(
    compositeTask: CompositeTask,
    availableAgents: AIAgent[],
    context: TaskExecutionContext
  ): Promise<{
    primaryAgent: AIAgent
    supportAgents: AIAgent[]
    executionPlan: any
  }>

  /** 更新路由策略 */
  updateRoutingStrategy(
    taskType: string,
    strategy: AgentAllocationStrategy,
    parameters?: Record<string, any>
  ): Promise<void>

  /** 获取路由统计 */
  getRoutingStatistics(): Promise<{
    totalRoutes: number
    averageConfidence: number
    routingStrategies: Record<AgentAllocationStrategy, number>
    commonRoutes: Array<{
      taskType: string
      agentType: string
      frequency: number
    }>
  }>
}

/**
 * 编排优化器接口
 */
export interface OrchestrationOptimizer {
  /** 优化工作流执行计划 */
  optimizeWorkflowPlan(
    workflow: WorkflowInstance,
    constraints: any
  ): Promise<WorkflowInstance>

  /** 优化Agent分配 */
  optimizeAgentAllocation(
    tasks: TaskSpecification[],
    agents: AIAgent[],
    constraints: any
  ): Promise<Array<{
    taskId: string
    agentId: string
    priority: number
    estimatedTime: number
  }>>

  /** 预测执行性能 */
  predictExecutionPerformance(
    workflow: WorkflowInstance
  ): Promise<{
    estimatedTotalTime: number
    estimatedCost: number
    successProbability: number
    bottleneckAnalysis: string[]
    optimizationSuggestions: string[]
  }>

  /** 实时优化执行 */
  optimizeExecutionRealtime(
    workflowId: string,
    currentMetrics: any
  ): Promise<{
    action: 'continue' | 'reallocate' | 'scale_up' | 'scale_down'
    changes: any
    reasoning: string
  }>
}
