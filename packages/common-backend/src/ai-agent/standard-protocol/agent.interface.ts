import { Observable } from 'rxjs'
import { z } from 'zod'

/**
 * Agent状态枚举
 */
export enum AgentState {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 空闲 */
  IDLE = 'idle',
  /** 工作中 */
  WORKING = 'working',
  /** 暂停 */
  PAUSED = 'paused',
  /** 出错 */
  ERROR = 'error',
  /** 已停止 */
  STOPPED = 'stopped'
}

/**
 * Agent类型枚举
 */
export enum AgentType {
  /** 基础对话Agent */
  CONVERSATIONAL = 'conversational',
  /** 工具使用Agent */
  TOOL_USE = 'tool_use',
  /** 规划Agent */
  PLANNER = 'planner',
  /** 执行Agent */
  EXECUTOR = 'executor',
  /** 反思Agent */
  REFLECTOR = 'reflector',
  /** 协调Agent */
  COORDINATOR = 'coordinator',
  /** 学习Agent */
  LEARNER = 'learner',
  /** 自定义Agent */
  CUSTOM = 'custom'
}

/**
 * Agent能力级别
 */
export enum AgentCapabilityLevel {
  /** 基础能力 */
  BASIC = 'basic',
  /** 中级能力 */
  INTERMEDIATE = 'intermediate',
  /** 高级能力 */
  ADVANCED = 'advanced',
  /** 专家能力 */
  EXPERT = 'expert'
}

/**
 * Agent上下文
 */
export interface AgentContext {
  /** Agent ID */
  agentId: string
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
  /** 父Agent ID（用于层级结构） */
  parentAgentId?: string
  /** 子Agent IDs */
  childAgentIds: string[]
}

/**
 * Agent配置
 */
export interface AgentConfig {
  /** Agent名称 */
  name: string
  /** Agent描述 */
  description: string
  /** Agent类型 */
  type: AgentType
  /** 能力级别 */
  capabilityLevel: AgentCapabilityLevel
  /** 最大并发任务数 */
  maxConcurrentTasks: number
  /** 超时时间（毫秒） */
  timeout: number
  /** 重试次数 */
  maxRetries: number
  /** 支持的输入格式 */
  supportedInputs: string[]
  /** 支持的输出格式 */
  supportedOutputs: string[]
  /** 自定义配置 */
  customConfig?: Record<string, any>
}

/**
 * Agent元数据
 */
export interface AgentMetadata {
  /** 版本 */
  version: string
  /** 作者 */
  author: string
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 标签 */
  tags: string[]
  /** 依赖的Agent */
  dependencies: string[]
  /** 提供的工具 */
  providedTools: string[]
  /** 消耗的资源 */
  resourceConsumption: {
    cpu: number
    memory: number
    network: number
  }
}

/**
 * Agent执行结果
 */
export interface AgentExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 输出数据 */
  output: any
  /** 执行时间（毫秒） */
  executionTime: number
  /** Token使用量 */
  tokenUsage?: {
    input: number
    output: number
    total: number
  }
  /** 错误信息 */
  error?: string
  /** 元数据 */
  metadata: {
    /** 执行的步骤数 */
    steps: number
    /** 使用的工具 */
    toolsUsed: string[]
    /** 性能指标 */
    performance: Record<string, any>
  }
}

/**
 * Agent工具定义
 */
export interface AgentTool {
  /** 工具ID */
  id: string
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 输入Schema */
  inputSchema: z.ZodType<any>
  /** 输出Schema */
  outputSchema: z.ZodType<any>
  /** 执行函数 */
  execute: (input: any, context: AgentContext) => Promise<any>
  /** 权限要求 */
  permissions?: string[]
  /** 资源消耗 */
  resourceCost?: {
    cpu: number
    memory: number
    time: number
  }
}

/**
 * Agent能力定义
 */
export interface AgentCapability {
  /** 能力ID */
  id: string
  /** 能力名称 */
  name: string
  /** 能力描述 */
  description: string
  /** 输入类型 */
  inputType: string
  /** 输出类型 */
  outputType: string
  /** 执行函数 */
  execute: (input: any, context: AgentContext) => Promise<AgentExecutionResult>
  /** 能力参数 */
  parameters?: z.ZodType<any>
  /** 能力级别 */
  level: AgentCapabilityLevel
  /** 依赖的能力 */
  dependencies?: string[]
}

/**
 * Agent生命周期钩子
 */
export interface AgentLifecycleHooks {
  /** 初始化前钩子 */
  beforeInitialize?: (config: AgentConfig, context: AgentContext) => Promise<void> | void
  /** 初始化后钩子 */
  afterInitialize?: (config: AgentConfig, context: AgentContext) => Promise<void> | void
  /** 执行前钩子 */
  beforeExecute?: (input: any, context: AgentContext) => Promise<void> | void
  /** 执行后钩子 */
  afterExecute?: (result: AgentExecutionResult, context: AgentContext) => Promise<void> | void
  /** 错误处理钩子 */
  onError?: (error: Error, context: AgentContext) => Promise<void> | void
  /** 清理钩子 */
  beforeCleanup?: (context: AgentContext) => Promise<void> | void
}

/**
 * AI Agent标准接口
 */
export interface AIAgent {
  /** Agent唯一标识符 */
  readonly id: string

  /** Agent配置 */
  readonly config: AgentConfig

  /** Agent元数据 */
  readonly metadata: AgentMetadata

  /** 当前状态 */
  readonly state: AgentState

  /** 获取状态变更流 */
  getStateStream(): Observable<AgentState>

  /** 初始化Agent */
  initialize(context: AgentContext): Promise<void>

  /** 执行任务 */
  execute(input: any, context?: Partial<AgentContext>): Promise<AgentExecutionResult>

  /** 暂停执行 */
  pause(): Promise<void>

  /** 恢复执行 */
  resume(): Promise<void>

  /** 停止Agent */
  stop(): Promise<void>

  /** 清理资源 */
  cleanup(): Promise<void>

  /** 注册工具 */
  registerTool(tool: AgentTool): void

  /** 注销工具 */
  unregisterTool(toolId: string): void

  /** 获取可用工具 */
  getAvailableTools(): AgentTool[]

  /** 注册能力 */
  registerCapability(capability: AgentCapability): void

  /** 注销能力 */
  unregisterCapability(capabilityId: string): void

  /** 获取可用能力 */
  getAvailableCapabilities(): AgentCapability[]

  /** 获取Agent统计信息 */
  getStats(): AgentStats

  /** 导出Agent配置 */
  exportConfig(): AgentConfigExport

  /** 导入Agent配置 */
  importConfig(config: AgentConfigExport): Promise<void>
}

/**
 * Agent统计信息
 */
export interface AgentStats {
  /** 总执行次数 */
  totalExecutions: number
  /** 成功执行次数 */
  successfulExecutions: number
  /** 失败执行次数 */
  failedExecutions: number
  /** 平均执行时间 */
  averageExecutionTime: number
  /** 总Token使用量 */
  totalTokenUsage: number
  /** 活跃时间 */
  uptime: number
  /** 最后执行时间 */
  lastExecutionTime?: Date
  /** 性能指标 */
  performance: {
    cpuUsage: number
    memoryUsage: number
    throughput: number
  }
}

/**
 * Agent配置导出格式
 */
export interface AgentConfigExport {
  /** 版本 */
  version: string
  /** 导出时间 */
  exportedAt: Date
  /** Agent配置 */
  config: AgentConfig
  /** 工具配置 */
  tools: AgentTool[]
  /** 能力配置 */
  capabilities: AgentCapability[]
  /** 生命周期钩子（序列化） */
  hooks?: string[]
  /** 元数据 */
  metadata: AgentMetadata
}

/**
 * Agent工厂接口
 */
export interface AgentFactory {
  /** 创建Agent实例 */
  createAgent(id: string, config: AgentConfig): AIAgent

  /** 获取支持的Agent类型 */
  getSupportedTypes(): AgentType[]

  /** 获取类型描述 */
  getTypeDescription(type: AgentType): string

  /** 验证配置 */
  validateConfig(config: AgentConfig): Promise<boolean>
}
