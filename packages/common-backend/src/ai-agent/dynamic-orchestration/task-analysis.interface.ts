import { z } from 'zod'
import { AgentType, AgentCapabilityLevel } from '../standard-protocol/agent.interface'

/**
 * 任务类型枚举
 */
export enum TaskType {
  /** 分析任务 */
  ANALYSIS = 'analysis',
  /** 生成任务 */
  GENERATION = 'generation',
  /** 转换任务 */
  TRANSFORMATION = 'transformation',
  /** 决策任务 */
  DECISION = 'decision',
  /** 执行任务 */
  EXECUTION = 'execution',
  /** 验证任务 */
  VALIDATION = 'validation',
  /** 优化任务 */
  OPTIMIZATION = 'optimization',
  /** 学习任务 */
  LEARNING = 'learning'
}

/**
 * 任务复杂度枚举
 */
export enum TaskComplexity {
  /** 简单任务 */
  SIMPLE = 'simple',
  /** 中等任务 */
  MEDIUM = 'medium',
  /** 复杂任务 */
  COMPLEX = 'complex',
  /** 复合任务 */
  COMPOSITE = 'composite'
}

/**
 * 任务优先级枚举
 */
export enum TaskPriority {
  /** 低优先级 */
  LOW = 1,
  /** 普通优先级 */
  NORMAL = 2,
  /** 高优先级 */
  HIGH = 3,
  /** 紧急优先级 */
  URGENT = 4,
  /** 关键优先级 */
  CRITICAL = 5
}

/**
 * 任务依赖关系
 */
export interface TaskDependency {
  /** 依赖的任务ID */
  taskId: string
  /** 依赖类型 */
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
  /** 延迟时间（毫秒） */
  lag?: number
  /** 条件表达式 */
  condition?: string
}

/**
 * 任务约束
 */
export interface TaskConstraint {
  /** 约束类型 */
  type: 'deadline' | 'duration' | 'resource' | 'precedence'
  /** 约束值 */
  value: any
  /** 约束描述 */
  description?: string
}

/**
 * 任务资源需求
 */
export interface TaskResourceRequirement {
  /** CPU需求 */
  cpu: number
  /** 内存需求（MB） */
  memory: number
  /** 网络需求 */
  network: 'low' | 'medium' | 'high'
  /** 存储需求（MB） */
  storage?: number
  /** 特殊硬件需求 */
  hardware?: string[]
  /** 时间限制（毫秒） */
  timeLimit?: number
}

/**
 * 任务执行上下文
 */
export interface TaskExecutionContext {
  /** 任务ID */
  taskId: string
  /** 父任务ID */
  parentTaskId?: string
  /** 会话ID */
  sessionId?: string
  /** 用户ID */
  userId?: string
  /** 租户ID */
  tenantId?: string
  /** 环境变量 */
  environment: Record<string, any>
  /** 共享数据 */
  sharedData: Map<string, any>
  /** 执行历史 */
  executionHistory: TaskExecutionRecord[]
  /** 当前执行深度 */
  depth: number
  /** 最大执行深度 */
  maxDepth: number
}

/**
 * 任务执行记录
 */
export interface TaskExecutionRecord {
  /** 记录ID */
  id: string
  /** 任务ID */
  taskId: string
  /** Agent ID */
  agentId?: string
  /** 执行开始时间 */
  startTime: Date
  /** 执行结束时间 */
  endTime?: Date
  /** 执行状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  /** 输入数据 */
  input: any
  /** 输出数据 */
  output?: any
  /** 执行时间（毫秒） */
  duration?: number
  /** 错误信息 */
  error?: string
  /** 资源使用情况 */
  resourceUsage?: {
    cpu: number
    memory: number
    network: number
  }
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 任务规范
 */
export interface TaskSpecification {
  /** 任务ID */
  id: string
  /** 任务名称 */
  name: string
  /** 任务描述 */
  description: string
  /** 任务类型 */
  type: TaskType
  /** 任务复杂度 */
  complexity: TaskComplexity
  /** 任务优先级 */
  priority: TaskPriority
  /** 输入Schema */
  inputSchema: z.ZodType<any>
  /** 输出Schema */
  outputSchema: z.ZodType<any>
  /** 资源需求 */
  resourceRequirements: TaskResourceRequirement
  /** 依赖关系 */
  dependencies: TaskDependency[]
  /** 约束条件 */
  constraints: TaskConstraint[]
  /** 所需Agent能力 */
  requiredCapabilities: string[]
  /** 偏好的Agent类型 */
  preferredAgentTypes: AgentType[]
  /** 最小Agent能力级别 */
  minCapabilityLevel: AgentCapabilityLevel
  /** 估算执行时间（毫秒） */
  estimatedDuration: number
  /** 成功率估算 */
  estimatedSuccessRate: number
  /** 标签 */
  tags: string[]
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 子任务
 */
export interface SubTask {
  /** 子任务ID */
  id: string
  /** 父任务ID */
  parentTaskId: string
  /** 子任务规范 */
  specification: TaskSpecification
  /** 执行顺序 */
  order: number
  /** 是否必需 */
  required: boolean
  /** 执行条件 */
  condition?: string
  /** 失败处理策略 */
  failureStrategy: 'ignore' | 'retry' | 'fail_parent' | 'alternative'
  /** 替代任务 */
  alternativeTasks?: SubTask[]
}

/**
 * 复合任务
 */
export interface CompositeTask {
  /** 任务ID */
  id: string
  /** 任务名称 */
  name: string
  /** 任务描述 */
  description: string
  /** 主任务规范 */
  mainTask: TaskSpecification
  /** 子任务列表 */
  subTasks: SubTask[]
  /** 执行策略 */
  executionStrategy: 'sequential' | 'parallel' | 'conditional' | 'adaptive'
  /** 聚合策略 */
  aggregationStrategy: 'merge' | 'vote' | 'pipeline' | 'custom'
  /** 质量控制 */
  qualityControl: {
    /** 最小成功子任务数 */
    minSuccessfulTasks: number
    /** 质量阈值 */
    qualityThreshold: number
    /** 验证任务 */
    validationTask?: SubTask
  }
  /** 回退策略 */
  fallbackStrategy?: {
    /** 回退条件 */
    condition: string
    /** 回退任务 */
    fallbackTask: TaskSpecification
  }
}

/**
 * 任务分析结果
 */
export interface TaskAnalysisResult {
  /** 原始任务 */
  originalTask: {
    description: string
    input: any
    context: any
  }
  /** 是否为复合任务 */
  isComposite: boolean
  /** 任务规范（简单任务）或复合任务（复杂任务） */
  specification: TaskSpecification | CompositeTask
  /** 分析元数据 */
  metadata: {
    /** 分析时间 */
    analysisTime: number
    /** 复杂度评分 */
    complexityScore: number
    /** 所需Agent数量估算 */
    estimatedAgentCount: number
    /** 总估算时间 */
    estimatedTotalTime: number
    /** 成功率估算 */
    estimatedSuccessRate: number
    /** 风险评估 */
    riskAssessment: {
      level: 'low' | 'medium' | 'high'
      factors: string[]
    }
  }
  /** 建议的执行策略 */
  recommendations: {
    /** 建议的Agent类型 */
    suggestedAgentTypes: AgentType[]
    /** 建议的执行顺序 */
    suggestedExecutionOrder: string[]
    /** 优化建议 */
    optimizationSuggestions: string[]
  }
}

/**
 * 任务分析器接口
 */
export interface TaskAnalyzer {
  /** 分析任务 */
  analyzeTask(
    taskDescription: string,
    input: any,
    context?: Partial<TaskExecutionContext>
  ): Promise<TaskAnalysisResult>

  /** 分析复合任务 */
  analyzeCompositeTask(
    taskDescription: string,
    subTasks: string[],
    context?: Partial<TaskExecutionContext>
  ): Promise<TaskAnalysisResult>

  /** 验证任务规范 */
  validateTaskSpecification(spec: TaskSpecification): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>

  /** 获取任务模板 */
  getTaskTemplates(): Promise<TaskSpecification[]>

  /** 创建任务模板 */
  createTaskTemplate(template: Omit<TaskSpecification, 'id'>): Promise<string>

  /** 获取任务统计 */
  getTaskStatistics(): Promise<{
    totalTasks: number
    taskTypeDistribution: Record<TaskType, number>
    complexityDistribution: Record<TaskComplexity, number>
    averageAnalysisTime: number
    successRate: number
  }>
}

/**
 * 任务分解器接口
 */
export interface TaskDecomposer {
  /** 分解任务 */
  decomposeTask(
    task: TaskSpecification,
    maxDepth?: number,
    context?: TaskExecutionContext
  ): Promise<SubTask[]>

  /** 合并子任务结果 */
  aggregateSubTaskResults(
    subTasks: SubTask[],
    results: TaskExecutionRecord[],
    strategy: 'merge' | 'vote' | 'pipeline' | 'custom'
  ): Promise<any>

  /** 优化任务分解 */
  optimizeDecomposition(
    subTasks: SubTask[],
    constraints: TaskConstraint[]
  ): Promise<SubTask[]>

  /** 验证任务分解 */
  validateDecomposition(
    originalTask: TaskSpecification,
    subTasks: SubTask[]
  ): Promise<{
    valid: boolean
    coverage: number
    redundancy: number
    issues: string[]
  }>
}
