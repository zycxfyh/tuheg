import { Observable } from 'rxjs'
import { AIAgent, AgentConfig, AgentType, AgentCapabilityLevel, AgentMetadata, AgentStats } from './agent.interface'

/**
 * Agent注册信息
 */
export interface AgentRegistration {
  /** Agent ID */
  id: string
  /** Agent实例 */
  instance: AIAgent
  /** 注册时间 */
  registeredAt: Date
  /** 最后活动时间 */
  lastActiveAt: Date
  /** 注册选项 */
  options: AgentRegistrationOptions
}

/**
 * Agent注册选项
 */
export interface AgentRegistrationOptions {
  /** 是否自动启动 */
  autoStart?: boolean
  /** 优先级 */
  priority?: number
  /** 标签 */
  tags?: string[]
  /** 元数据 */
  metadata?: Record<string, any>
  /** 资源限制 */
  resourceLimits?: {
    maxMemory: number
    maxCpu: number
    maxConcurrency: number
  }
}

/**
 * Agent发现查询
 */
export interface AgentDiscoveryQuery {
  /** Agent类型 */
  type?: AgentType
  /** 能力级别 */
  capabilityLevel?: AgentCapabilityLevel
  /** 支持的输入格式 */
  supportedInputs?: string[]
  /** 支持的输出格式 */
  supportedOutputs?: string[]
  /** 标签 */
  tags?: string[]
  /** 名称关键词 */
  nameKeyword?: string
  /** 状态 */
  state?: string
  /** 分页 */
  pagination?: {
    page: number
    limit: number
  }
  /** 排序 */
  sort?: {
    field: 'name' | 'createdAt' | 'lastActiveAt' | 'priority'
    order: 'asc' | 'desc'
  }
}

/**
 * Agent发现结果
 */
export interface AgentDiscoveryResult {
  /** Agent列表 */
  agents: Array<{
    id: string
    config: AgentConfig
    metadata: AgentMetadata
    stats: AgentStats
    registration: {
      registeredAt: Date
      lastActiveAt: Date
      priority: number
      tags: string[]
    }
  }>
  /** 总数 */
  total: number
  /** 分页信息 */
  pagination: {
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Agent健康状态
 */
export enum AgentHealthStatus {
  /** 健康 */
  HEALTHY = 'healthy',
  /** 降级 */
  DEGRADED = 'degraded',
  /** 不健康 */
  UNHEALTHY = 'unhealthy',
  /** 未知 */
  UNKNOWN = 'unknown'
}

/**
 * Agent健康信息
 */
export interface AgentHealthInfo {
  /** Agent ID */
  agentId: string
  /** 健康状态 */
  status: AgentHealthStatus
  /** 健康评分 (0-100) */
  score: number
  /** 检查时间 */
  checkedAt: Date
  /** 详细信息 */
  details: {
    /** 响应时间 */
    responseTime: number
    /** 错误率 */
    errorRate: number
    /** 资源使用率 */
    resourceUsage: {
      cpu: number
      memory: number
      disk: number
    }
    /** 最后执行时间 */
    lastExecutionTime?: Date
    /** 连续失败次数 */
    consecutiveFailures: number
  }
  /** 建议操作 */
  recommendations?: string[]
}

/**
 * Agent注册表接口
 */
export interface AgentRegistry {
  /** 注册Agent */
  registerAgent(agent: AIAgent, options?: AgentRegistrationOptions): Promise<void>

  /** 注销Agent */
  unregisterAgent(agentId: string): Promise<void>

  /** 获取Agent */
  getAgent(agentId: string): Promise<AIAgent | null>

  /** 获取所有已注册的Agent */
  getAllAgents(): Promise<AIAgent[]>

  /** 发现Agent */
  discoverAgents(query?: AgentDiscoveryQuery): Promise<AgentDiscoveryResult>

  /** 检查Agent是否存在 */
  hasAgent(agentId: string): Promise<boolean>

  /** 获取Agent健康状态 */
  getAgentHealth(agentId: string): Promise<AgentHealthInfo>

  /** 获取所有Agent健康状态 */
  getAllAgentHealth(): Promise<AgentHealthInfo[]>

  /** 监听Agent注册事件 */
  onAgentRegistered(): Observable<AgentRegistration>

  /** 监听Agent注销事件 */
  onAgentUnregistered(): Observable<{ agentId: string; unregisteredAt: Date }>

  /** 监听Agent健康变化 */
  onAgentHealthChanged(): Observable<AgentHealthInfo>

  /** 获取注册表统计 */
  getRegistryStats(): AgentRegistryStats

  /** 清理不健康的Agent */
  cleanupUnhealthyAgents(): Promise<void>
}

/**
 * Agent注册表统计
 */
export interface AgentRegistryStats {
  /** 总注册Agent数 */
  totalAgents: number
  /** 按类型分布 */
  typeDistribution: Record<AgentType, number>
  /** 按状态分布 */
  stateDistribution: Record<string, number>
  /** 按健康状态分布 */
  healthDistribution: Record<AgentHealthStatus, number>
  /** 平均健康评分 */
  averageHealthScore: number
  /** 注册表运行时间 */
  uptime: number
  /** 最后更新时间 */
  lastUpdated: Date
}

/**
 * Agent发现服务接口
 */
export interface AgentDiscoveryService {
  /** 注册Agent能力 */
  registerCapabilities(agentId: string, capabilities: string[]): Promise<void>

  /** 注销Agent能力 */
  unregisterCapabilities(agentId: string, capabilities: string[]): Promise<void>

  /** 根据能力发现Agent */
  discoverByCapabilities(requiredCapabilities: string[], options?: {
    minCapabilityLevel?: AgentCapabilityLevel
    maxResults?: number
    sortBy?: 'score' | 'performance' | 'availability'
  }): Promise<Array<{
    agentId: string
    capabilities: string[]
    score: number
    metadata: AgentMetadata
  }>>

  /** 根据任务发现Agent */
  discoverByTask(taskDescription: string, context?: any): Promise<Array<{
    agentId: string
    relevanceScore: number
    confidence: number
    reasoning: string
  }>>

  /** 获取能力统计 */
  getCapabilityStats(): Record<string, {
    totalAgents: number
    averageScore: number
    topPerformers: string[]
  }>
}

/**
 * Agent负载均衡器接口
 */
export interface AgentLoadBalancer {
  /** 选择最佳Agent */
  selectBestAgent(requirements: {
    capabilities?: string[]
    type?: AgentType
    maxLoad?: number
    region?: string
    excludeAgents?: string[]
  }): Promise<AIAgent | null>

  /** 获取Agent负载 */
  getAgentLoad(agentId: string): Promise<{
    currentLoad: number
    maxLoad: number
    utilization: number
    activeTasks: number
  }>

  /** 更新Agent负载 */
  updateAgentLoad(agentId: string, loadDelta: number): Promise<void>

  /** 重新平衡负载 */
  rebalanceLoad(): Promise<void>

  /** 获取负载统计 */
  getLoadStats(): {
    totalAgents: number
    averageLoad: number
    overloadedAgents: string[]
    underutilizedAgents: string[]
  }
}
