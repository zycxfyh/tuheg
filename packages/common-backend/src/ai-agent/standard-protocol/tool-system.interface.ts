import { z } from 'zod'
import { AgentContext, AgentTool } from './agent.interface'

/**
 * 工具类别枚举
 */
export enum ToolCategory {
  /** 数据处理工具 */
  DATA_PROCESSING = 'data_processing',
  /** API调用工具 */
  API_CALLS = 'api_calls',
  /** 文件操作工具 */
  FILE_OPERATIONS = 'file_operations',
  /** 数学计算工具 */
  MATHEMATICAL = 'mathematical',
  /** 文本处理工具 */
  TEXT_PROCESSING = 'text_processing',
  /** 搜索工具 */
  SEARCH = 'search',
  /** 代码执行工具 */
  CODE_EXECUTION = 'code_execution',
  /** 图像处理工具 */
  IMAGE_PROCESSING = 'image_processing',
  /** 音频处理工具 */
  AUDIO_PROCESSING = 'audio_processing',
  /** 系统工具 */
  SYSTEM = 'system',
  /** 自定义工具 */
  CUSTOM = 'custom'
}

/**
 * 工具权限枚举
 */
export enum ToolPermission {
  /** 读取权限 */
  READ = 'read',
  /** 写入权限 */
  WRITE = 'write',
  /** 执行权限 */
  EXECUTE = 'execute',
  /** 网络访问权限 */
  NETWORK = 'network',
  /** 文件系统权限 */
  FILESYSTEM = 'filesystem',
  /** 系统权限 */
  SYSTEM = 'system'
}

/**
 * 工具执行上下文
 */
export interface ToolExecutionContext extends AgentContext {
  /** 工具ID */
  toolId: string
  /** 执行ID */
  executionId: string
  /** 超时时间 */
  timeout: number
  /** 权限列表 */
  permissions: ToolPermission[]
  /** 资源限制 */
  resourceLimits: {
    maxMemory: number
    maxCpuTime: number
    maxExecutionTime: number
  }
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 输出数据 */
  output: any
  /** 执行时间（毫秒） */
  executionTime: number
  /** 资源使用情况 */
  resourceUsage: {
    memoryUsed: number
    cpuTimeUsed: number
    networkRequests?: number
  }
  /** 错误信息 */
  error?: string
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 工具插件接口
 */
export interface ToolPlugin {
  /** 工具ID */
  id: string
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 工具版本 */
  version: string
  /** 工具类别 */
  category: ToolCategory
  /** 作者 */
  author: string
  /** 权限要求 */
  permissions: ToolPermission[]
  /** 依赖项 */
  dependencies?: string[]

  /** 初始化工具 */
  initialize?(context: ToolExecutionContext): Promise<void>

  /** 清理资源 */
  cleanup?(): Promise<void>

  /** 获取工具Schema */
  getToolSchema(): ToolSchema

  /** 执行工具 */
  execute(input: any, context: ToolExecutionContext): Promise<ToolExecutionResult>
}

/**
 * 工具Schema定义
 */
export interface ToolSchema {
  /** 输入Schema */
  input: z.ZodType<any>
  /** 输出Schema */
  output: z.ZodType<any>
  /** 参数描述 */
  parameters: Array<{
    name: string
    type: string
    description: string
    required: boolean
    defaultValue?: any
  }>
  /** 示例 */
  examples?: Array<{
    input: any
    output: any
    description: string
  }>
}

/**
 * 工具注册表接口
 */
export interface ToolRegistry {
  /** 注册工具 */
  registerTool(tool: ToolPlugin): Promise<void>

  /** 注销工具 */
  unregisterTool(toolId: string): Promise<void>

  /** 获取工具 */
  getTool(toolId: string): Promise<ToolPlugin | null>

  /** 获取所有工具 */
  getAllTools(): Promise<ToolPlugin[]>

  /** 根据类别获取工具 */
  getToolsByCategory(category: ToolCategory): Promise<ToolPlugin[]>

  /** 根据权限获取工具 */
  getToolsByPermissions(permissions: ToolPermission[]): Promise<ToolPlugin[]>

  /** 搜索工具 */
  searchTools(query: ToolSearchQuery): Promise<ToolPlugin[]>

  /** 检查工具是否存在 */
  hasTool(toolId: string): Promise<boolean>

  /** 获取工具统计 */
  getToolStats(): ToolRegistryStats
}

/**
 * 工具搜索查询
 */
export interface ToolSearchQuery {
  /** 关键词 */
  keyword?: string
  /** 类别 */
  category?: ToolCategory
  /** 作者 */
  author?: string
  /** 权限 */
  permissions?: ToolPermission[]
  /** 标签 */
  tags?: string[]
  /** 是否已启用 */
  enabled?: boolean
}

/**
 * 工具注册表统计
 */
export interface ToolRegistryStats {
  /** 总工具数 */
  totalTools: number
  /** 按类别分布 */
  categoryDistribution: Record<ToolCategory, number>
  /** 按权限分布 */
  permissionDistribution: Record<ToolPermission, number>
  /** 启用工具数 */
  enabledTools: number
  /** 禁用工具数 */
  disabledTools: number
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * 工具执行器接口
 */
export interface ToolExecutor {
  /** 执行工具 */
  executeTool(
    toolId: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult>

  /** 批量执行工具 */
  executeTools(
    executions: Array<{
      toolId: string
      input: any
      context: ToolExecutionContext
    }>
  ): Promise<ToolExecutionResult[]>

  /** 验证工具输入 */
  validateToolInput(toolId: string, input: any): Promise<boolean>

  /** 获取执行历史 */
  getExecutionHistory(toolId?: string, limit?: number): Promise<ToolExecutionHistory[]>

  /** 获取执行统计 */
  getExecutionStats(): ToolExecutionStats
}

/**
 * 工具执行历史
 */
export interface ToolExecutionHistory {
  /** 执行ID */
  executionId: string
  /** 工具ID */
  toolId: string
  /** Agent ID */
  agentId: string
  /** 输入数据 */
  input: any
  /** 结果 */
  result: ToolExecutionResult
  /** 执行时间 */
  executedAt: Date
  /** 执行上下文 */
  context: Partial<ToolExecutionContext>
}

/**
 * 工具执行统计
 */
export interface ToolExecutionStats {
  /** 总执行次数 */
  totalExecutions: number
  /** 成功执行次数 */
  successfulExecutions: number
  /** 失败执行次数 */
  failedExecutions: number
  /** 平均执行时间 */
  averageExecutionTime: number
  /** 最常用的工具 */
  topTools: Array<{
    toolId: string
    executions: number
    averageTime: number
  }>
  /** 资源使用统计 */
  resourceStats: {
    totalMemoryUsed: number
    totalCpuTimeUsed: number
    averageMemoryPerExecution: number
    averageCpuTimePerExecution: number
  }
}

/**
 * 工具权限管理器接口
 */
export interface ToolPermissionManager {
  /** 检查权限 */
  checkPermission(
    agentId: string,
    toolId: string,
    requiredPermissions: ToolPermission[]
  ): Promise<boolean>

  /** 授予权限 */
  grantPermission(
    agentId: string,
    toolId: string,
    permissions: ToolPermission[]
  ): Promise<void>

  /** 撤销权限 */
  revokePermission(
    agentId: string,
    toolId: string,
    permissions: ToolPermission[]
  ): Promise<void>

  /** 获取Agent权限 */
  getAgentPermissions(agentId: string): Promise<Record<string, ToolPermission[]>>

  /** 获取工具权限要求 */
  getToolPermissions(toolId: string): Promise<ToolPermission[]>
}

/**
 * 工具缓存接口
 */
export interface ToolCache {
  /** 获取缓存结果 */
  get(cacheKey: string): Promise<ToolExecutionResult | null>

  /** 设置缓存结果 */
  set(cacheKey: string, result: ToolExecutionResult, ttl?: number): Promise<void>

  /** 删除缓存 */
  delete(cacheKey: string): Promise<void>

  /** 清空缓存 */
  clear(): Promise<void>

  /** 获取缓存统计 */
  getStats(): ToolCacheStats
}

/**
 * 工具缓存统计
 */
export interface ToolCacheStats {
  /** 总缓存条目数 */
  totalEntries: number
  /** 缓存命中次数 */
  hits: number
  /** 缓存未命中次数 */
  misses: number
  /** 命中率 */
  hitRate: number
  /** 总大小（字节） */
  totalSize: number
  /** 平均条目大小 */
  averageEntrySize: number
}

/**
 * 工具链接口（组合多个工具）
 */
export interface ToolChain {
  /** 链ID */
  id: string
  /** 链名称 */
  name: string
  /** 链描述 */
  description: string
  /** 工具步骤 */
  steps: ToolChainStep[]
  /** 执行条件 */
  conditions?: ToolChainCondition[]
}

/**
 * 工具链步骤
 */
export interface ToolChainStep {
  /** 步骤ID */
  id: string
  /** 工具ID */
  toolId: string
  /** 输入映射 */
  inputMapping: Record<string, any>
  /** 输出映射 */
  outputMapping?: Record<string, string>
  /** 是否必需 */
  required: boolean
  /** 超时时间 */
  timeout?: number
  /** 重试次数 */
  retries?: number
}

/**
 * 工具链条件
 */
export interface ToolChainCondition {
  /** 条件ID */
  id: string
  /** 条件表达式 */
  expression: string
  /** 条件参数 */
  parameters: Record<string, any>
  /** 满足条件时执行的步骤 */
  targetSteps: string[]
}

/**
 * 工具编排器接口
 */
export interface ToolOrchestrator {
  /** 执行工具链 */
  executeChain(
    chainId: string,
    initialInput: any,
    context: ToolExecutionContext
  ): Promise<ToolChainExecutionResult>

  /** 创建工具链 */
  createChain(chain: Omit<ToolChain, 'id'>): Promise<string>

  /** 更新工具链 */
  updateChain(chainId: string, updates: Partial<ToolChain>): Promise<void>

  /** 删除工具链 */
  deleteChain(chainId: string): Promise<void>

  /** 获取工具链 */
  getChain(chainId: string): Promise<ToolChain | null>

  /** 获取所有工具链 */
  getAllChains(): Promise<ToolChain[]>
}

/**
 * 工具链执行结果
 */
export interface ToolChainExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 最终输出 */
  output: any
  /** 执行步骤结果 */
  stepResults: Array<{
    stepId: string
    toolId: string
    result: ToolExecutionResult
    executedAt: Date
  }>
  /** 执行时间 */
  totalExecutionTime: number
  /** 错误信息 */
  error?: string
}
