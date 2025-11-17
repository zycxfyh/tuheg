import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

export interface AgentCapability {
  name: string
  description: string
  inputSchema: any
  outputSchema: any
  cost: number // 每次调用成本
  latency: number // 预期延迟(ms)
  reliability: number // 可靠性评分 (0-1)
}

export interface AgentInfo {
  id: string
  name: string
  type: 'creation' | 'logic' | 'narrative' | 'custom'
  version: string
  endpoint: string
  capabilities: AgentCapability[]
  status: 'online' | 'offline' | 'maintenance'
  healthScore: number // 健康评分 (0-100)
  lastHeartbeat: Date
  tags: string[]
  metadata: Record<string, any>
}

export interface AgentRegistrationRequest {
  name: string
  type: AgentInfo['type']
  version: string
  endpoint: string
  capabilities: AgentCapability[]
  tags?: string[]
  metadata?: Record<string, any>
}

@Injectable()
export class AgentRegistryService {
  private readonly logger = new Logger(AgentRegistryService.name)
  private agents = new Map<string, AgentInfo>()
  private readonly heartbeatInterval = 30000 // 30秒心跳间隔

  constructor(private eventEmitter: EventEmitter2) {
    // 启动健康检查定时器
    setInterval(() => this.performHealthChecks(), this.heartbeatInterval)
  }

  /**
   * 注册新的Agent
   */
  async registerAgent(request: AgentRegistrationRequest): Promise<AgentInfo> {
    const agentId = `${request.type}-${request.name}-${Date.now()}`

    const agentInfo: AgentInfo = {
      id: agentId,
      name: request.name,
      type: request.type,
      version: request.version,
      endpoint: request.endpoint,
      capabilities: request.capabilities,
      status: 'online',
      healthScore: 100,
      lastHeartbeat: new Date(),
      tags: request.tags || [],
      metadata: request.metadata || {}
    }

    this.agents.set(agentId, agentInfo)
    this.logger.log(`Agent registered: ${agentId} (${request.name})`)

    // 发出注册事件
    this.eventEmitter.emit('agent.registered', agentInfo)

    return agentInfo
  }

  /**
   * 注销Agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.status = 'offline'
      this.logger.log(`Agent unregistered: ${agentId} (${agent.name})`)

      // 发出注销事件
      this.eventEmitter.emit('agent.unregistered', agent)
    }
  }

  /**
   * 更新Agent状态
   */
  async updateAgentStatus(agentId: string, status: AgentInfo['status'], healthScore?: number): Promise<void> {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.status = status
      if (healthScore !== undefined) {
        agent.healthScore = healthScore
      }
      agent.lastHeartbeat = new Date()

      this.logger.debug(`Agent status updated: ${agentId} -> ${status}`)

      // 发出状态更新事件
      this.eventEmitter.emit('agent.status.updated', agent)
    }
  }

  /**
   * 根据能力查找合适的Agent
   */
  findAgentsByCapability(capabilityName: string, minReliability = 0.8): AgentInfo[] {
    const candidates = Array.from(this.agents.values()).filter(agent =>
      agent.status === 'online' &&
      agent.healthScore > 70 &&
      agent.capabilities.some(cap => cap.name === capabilityName && cap.reliability >= minReliability)
    )

    // 按健康评分和可靠性排序
    return candidates.sort((a, b) => {
      const capA = a.capabilities.find(c => c.name === capabilityName)!
      const capB = b.capabilities.find(c => c.name === capabilityName)!

      const scoreA = a.healthScore * capA.reliability
      const scoreB = b.healthScore * capB.reliability

      return scoreB - scoreA
    })
  }

  /**
   * 根据类型查找Agent
   */
  findAgentsByType(type: AgentInfo['type']): AgentInfo[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.type === type && agent.status === 'online'
    )
  }

  /**
   * 获取Agent详情
   */
  getAgent(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId)
  }

  /**
   * 获取所有Agent
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values())
  }

  /**
   * 获取在线Agent
   */
  getOnlineAgents(): AgentInfo[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === 'online')
  }

  /**
   * 执行健康检查
   */
  private async performHealthChecks(): Promise<void> {
    const now = Date.now()
    const timeoutThreshold = this.heartbeatInterval * 2 // 60秒超时

    for (const [agentId, agent] of this.agents) {
      const timeSinceLastHeartbeat = now - agent.lastHeartbeat.getTime()

      if (timeSinceLastHeartbeat > timeoutThreshold) {
        // Agent可能离线
        if (agent.status === 'online') {
          await this.updateAgentStatus(agentId, 'offline', Math.max(0, agent.healthScore - 20))
          this.logger.warn(`Agent marked as offline due to heartbeat timeout: ${agentId}`)
        }
      } else {
        // 健康检查：降低健康评分如果心跳不规律
        const healthDecrease = Math.floor(timeSinceLastHeartbeat / this.heartbeatInterval) * 5
        const newHealthScore = Math.max(0, agent.healthScore - healthDecrease)

        if (newHealthScore !== agent.healthScore) {
          agent.healthScore = newHealthScore
        }
      }
    }
  }

  /**
   * 获取注册表统计信息
   */
  getRegistryStats() {
    const all = this.agents.size
    const online = Array.from(this.agents.values()).filter(a => a.status === 'online').length
    const offline = Array.from(this.agents.values()).filter(a => a.status === 'offline').length
    const maintenance = Array.from(this.agents.values()).filter(a => a.status === 'maintenance').length

    const avgHealthScore = all > 0
      ? Array.from(this.agents.values()).reduce((sum, agent) => sum + agent.healthScore, 0) / all
      : 0

    return {
      total: all,
      online,
      offline,
      maintenance,
      averageHealthScore: Math.round(avgHealthScore * 100) / 100,
      types: {
        creation: this.findAgentsByType('creation').length,
        logic: this.findAgentsByType('logic').length,
        narrative: this.findAgentsByType('narrative').length,
        custom: this.findAgentsByType('custom').length
      }
    }
  }
}
