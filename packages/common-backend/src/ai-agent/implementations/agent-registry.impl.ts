import { Injectable } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'
import { AIAgent, AgentRegistrationOptions, AgentDiscoveryQuery, AgentDiscoveryResult, AgentHealthStatus, AgentHealthInfo, AgentRegistry, AgentRegistryStats } from '../standard-protocol/agent-registry.interface'

@Injectable()
export class AgentRegistryImpl implements AgentRegistry {
  private readonly registrations = new Map<string, { agent: AIAgent; options: AgentRegistrationOptions; registeredAt: Date; lastActiveAt: Date }>()
  private readonly agentRegistered = new Subject<{ agent: AIAgent; options: AgentRegistrationOptions }>()
  private readonly agentUnregistered = new Subject<string>()
  private readonly agentHealthChanged = new Subject<AgentHealthInfo>()

  async registerAgent(agent: AIAgent, options?: AgentRegistrationOptions): Promise<void> {
    this.registrations.set(agent.id, {
      agent,
      options: options || {},
      registeredAt: new Date(),
      lastActiveAt: new Date()
    })
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.registrations.delete(agentId)
    this.agentUnregistered.next(agentId)
  }

  async getAgent(agentId: string): Promise<AIAgent | null> {
    const registration = this.registrations.get(agentId)
    return registration?.agent || null
  }

  async getAllAgents(): Promise<AIAgent[]> {
    return Array.from(this.registrations.values()).map(r => r.agent)
  }

  async discoverAgents(query?: AgentDiscoveryQuery): Promise<AgentDiscoveryResult> {
    const agents = Array.from(this.registrations.values())
    return {
      agents: agents.map(r => ({
        id: r.agent.id,
        config: r.agent.config,
        metadata: r.agent.metadata,
        stats: r.agent.getStats(),
        registration: {
          registeredAt: r.registeredAt,
          lastActiveAt: r.lastActiveAt,
          priority: r.options.priority || 1,
          tags: r.options.tags || []
        }
      })),
      total: agents.length,
      pagination: {
        page: 1,
        limit: agents.length,
        totalPages: 1
      }
    }
  }

  async hasAgent(agentId: string): Promise<boolean> {
    return this.registrations.has(agentId)
  }

  async getAgentHealth(agentId: string): Promise<AgentHealthInfo> {
    return {
      agentId,
      status: AgentHealthStatus.HEALTHY,
      score: 100,
      checkedAt: new Date(),
      details: {
        responseTime: 100,
        errorRate: 0,
        resourceUsage: { cpu: 10, memory: 50, disk: 20 },
        lastExecutionTime: new Date(),
        consecutiveFailures: 0
      }
    }
  }

  async getAllAgentHealth(): Promise<AgentHealthInfo[]> {
    const agents = await this.getAllAgents()
    return Promise.all(agents.map(agent => this.getAgentHealth(agent.id)))
  }

  onAgentRegistered(): Observable<any> {
    return this.agentRegistered.asObservable()
  }

  onAgentUnregistered(): Observable<string> {
    return this.agentUnregistered.asObservable()
  }

  onAgentHealthChanged(): Observable<AgentHealthInfo> {
    return this.agentHealthChanged.asObservable()
  }

  getRegistryStats(): AgentRegistryStats {
    return {
      totalAgents: this.registrations.size,
      typeDistribution: {} as any,
      stateDistribution: {},
      healthDistribution: {} as any,
      averageHealthScore: 100,
      uptime: process.uptime(),
      lastUpdated: new Date()
    }
  }

  async cleanupUnhealthyAgents(): Promise<void> {
    // 实现清理逻辑
  }
}
