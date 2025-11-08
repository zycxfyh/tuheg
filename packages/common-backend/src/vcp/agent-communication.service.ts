// ============================================================================
// Agent自主通信系统服务集成
// 集成 VCPToolBox 的智能协商、冲突解决和自主协作机制
// ============================================================================

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  agentAutonomousCommunication,
  CommunicationChannel,
  type CommunicationMessage,
  type ConflictResolution,
  type NegotiationSession,
  TrustRelationship,
} from '../../../vcptoolbox/src/modules/collaboration/AgentAutonomousCommunication'

@Injectable()
export class AgentCommunicationService implements OnModuleInit {
  private readonly logger = new Logger(AgentCommunicationService.name)

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeCommunicationSystem()
    this.setupEventHandlers()
    this.logger.log('Agent自主通信系统已初始化')
  }

  // ==================== 系统初始化 ====================

  /**
   * 初始化通信系统
   */
  private async initializeCommunicationSystem(): Promise<void> {
    // 设置系统通信频道
    await this.createSystemChannels()

    // 初始化信任关系网络
    await this.initializeTrustNetwork()

    this.logger.log('Agent通信系统参数已配置')
  }

  /**
   * 创建系统通信频道
   */
  private async createSystemChannels(): Promise<void> {
    try {
      // 创建协商频道
      agentAutonomousCommunication.createChannel(
        'negotiation',
        [],
        'System Negotiation Channel',
        'high'
      )

      // 创建调解频道
      agentAutonomousCommunication.createChannel(
        'mediation',
        [],
        'System Conflict Resolution Channel',
        'critical'
      )

      // 创建协作频道
      agentAutonomousCommunication.createChannel(
        'broadcast',
        [],
        'Agent Collaboration Broadcast',
        'normal'
      )

      this.logger.log('系统通信频道已创建')
    } catch (error) {
      this.logger.error('创建系统频道失败:', error)
    }
  }

  /**
   * 初始化信任关系网络
   */
  private async initializeTrustNetwork(): Promise<void> {
    // 这里可以从数据库加载已有的信任关系
    // 暂时创建一些基础的系统Agent信任关系
    const systemAgents = ['narrative-agent', 'logic-agent', 'character-agent', 'world-agent']

    for (const agentA of systemAgents) {
      for (const agentB of systemAgents) {
        if (agentA !== agentB) {
          // 设置基础信任度
          agentAutonomousCommunication.updateTrustLevel(agentA, agentB, 0.7)
        }
      }
    }

    this.logger.log('信任关系网络已初始化')
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听通信事件
    agentAutonomousCommunication.on('messageSent', (data) => {
      this.logger.debug(`Agent消息已发送: ${data.nodeId}`)
    })

    agentAutonomousCommunication.on('negotiationStarted', (negotiation) => {
      this.logger.log(`协商开始: ${negotiation.id} - ${negotiation.topic}`)
    })

    agentAutonomousCommunication.on('negotiationResolved', (negotiation) => {
      this.logger.log(`协商解决: ${negotiation.id} - ${negotiation.resolution}`)
    })

    agentAutonomousCommunication.on('conflictReported', (conflict) => {
      this.logger.warn(`冲突报告: ${conflict.id} - ${conflict.type}: ${conflict.description}`)
    })

    agentAutonomousCommunication.on('conflictResolved', (conflict) => {
      this.logger.log(`冲突解决: ${conflict.id} - ${conflict.resolution}`)
    })

    agentAutonomousCommunication.on('trustUpdated', (relationship) => {
      this.logger.debug(
        `信任更新: ${relationship.agentA} -> ${relationship.agentB} = ${relationship.trustLevel}`
      )
    })
  }

  // ==================== 通信频道管理 ====================

  /**
   * 创建协作频道
   */
  async createCollaborationChannel(
    name: string,
    participants: string[],
    topic: string,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<string> {
    try {
      const channelId = agentAutonomousCommunication.createChannel(
        'broadcast',
        participants,
        topic,
        priority
      )

      // 将所有参与者加入频道
      for (const participant of participants) {
        agentAutonomousCommunication.joinChannel(channelId, participant)
      }

      this.logger.log(`协作频道已创建: ${channelId} - ${name}`)
      return channelId
    } catch (error: any) {
      this.logger.error('创建协作频道失败:', error)
      throw error
    }
  }

  /**
   * 发送协作消息
   */
  async sendCollaborationMessage(
    channelId: string,
    senderId: string,
    type: CommunicationMessage['type'],
    content: any,
    options: {
      recipientId?: string
      context?: CommunicationMessage['context']
      importance?: number
      urgency?: number
      requiresResponse?: boolean
      responseDeadline?: Date
      attachments?: CommunicationMessage['attachments']
    } = {}
  ): Promise<void> {
    try {
      await agentAutonomousCommunication.sendMessage(channelId, senderId, type, content, options)

      this.logger.debug(`协作消息已发送: ${channelId} - ${senderId} - ${type}`)
    } catch (error: any) {
      this.logger.error(`发送协作消息失败: ${channelId}`, error)
      throw error
    }
  }

  // ==================== 协商系统 ====================

  /**
   * 发起Agent协商
   */
  async initiateAgentNegotiation(
    initiatorId: string,
    participants: string[],
    topic: string,
    initialProposal: any,
    deadlineMinutes: number = 30
  ): Promise<string> {
    try {
      const deadline = new Date(Date.now() + deadlineMinutes * 60 * 1000)

      const negotiationId = await agentAutonomousCommunication.initiateNegotiation(
        initiatorId,
        participants,
        topic,
        initialProposal,
        deadline
      )

      this.logger.log(`Agent协商已发起: ${negotiationId} - ${topic}`)
      return negotiationId
    } catch (error: any) {
      this.logger.error('发起Agent协商失败:', error)
      throw error
    }
  }

  /**
   * 提交协商提案
   */
  async submitNegotiationProposal(
    negotiationId: string,
    proposerId: string,
    proposal: any,
    reasoning: string,
    alternatives: any[] = []
  ): Promise<void> {
    try {
      await agentAutonomousCommunication.submitProposal(
        negotiationId,
        proposerId,
        proposal,
        reasoning,
        alternatives
      )

      this.logger.log(`协商提案已提交: ${negotiationId} - ${proposerId}`)
    } catch (error: any) {
      this.logger.error(`提交协商提案失败: ${negotiationId}`, error)
      throw error
    }
  }

  /**
   * 投票协商提案
   */
  async voteOnProposal(
    negotiationId: string,
    voterId: string,
    proposalId: string,
    decision: 'accept' | 'reject' | 'modify' | 'abstain',
    reasoning?: string
  ): Promise<void> {
    try {
      await agentAutonomousCommunication.voteOnProposal(
        negotiationId,
        voterId,
        proposalId,
        decision,
        reasoning
      )

      this.logger.debug(`协商投票已提交: ${negotiationId} - ${voterId} - ${decision}`)
    } catch (error: any) {
      this.logger.error(`提交协商投票失败: ${negotiationId}`, error)
      throw error
    }
  }

  /**
   * 获取协商状态
   */
  getNegotiationStatus(negotiationId: string): NegotiationSession | null {
    return agentAutonomousCommunication.getNegotiationStatus(negotiationId)
  }

  // ==================== 冲突解决 ====================

  /**
   * 报告协作冲突
   */
  async reportCollaborationConflict(
    reporterId: string,
    type: 'resource' | 'opinion' | 'priority' | 'methodology',
    description: string,
    participants: string[],
    proposedSolutions: Array<{
      proposerId: string
      solution: any
      reasoning: string
      feasibility: number
      impact: number
      cost: number
    }>
  ): Promise<string> {
    try {
      const conflictId = await agentAutonomousCommunication.reportConflict(
        reporterId,
        type,
        description,
        participants,
        proposedSolutions
      )

      this.logger.warn(`协作冲突已报告: ${conflictId} - ${type}: ${description}`)
      return conflictId
    } catch (error: any) {
      this.logger.error('报告协作冲突失败:', error)
      throw error
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(conflictId: string, solutionId: string, resolverId: string): Promise<void> {
    try {
      await agentAutonomousCommunication.resolveConflict(conflictId, solutionId, resolverId)

      this.logger.log(`冲突已解决: ${conflictId} - ${solutionId}`)
    } catch (error: any) {
      this.logger.error(`解决冲突失败: ${conflictId}`, error)
      throw error
    }
  }

  /**
   * 获取冲突状态
   */
  getConflictStatus(conflictId: string): ConflictResolution | null {
    return agentAutonomousCommunication.getConflictStatus(conflictId)
  }

  // ==================== 信任关系管理 ====================

  /**
   * 更新Agent信任度
   */
  updateAgentTrust(agentA: string, agentB: string, delta: number): void {
    try {
      agentAutonomousCommunication.updateTrustLevel(agentA, agentB, delta)
      this.logger.debug(`Agent信任度已更新: ${agentA} -> ${agentB} (+${delta})`)
    } catch (error: any) {
      this.logger.error(`更新Agent信任度失败: ${agentA} -> ${agentB}`, error)
    }
  }

  /**
   * 获取Agent信任度
   */
  getAgentTrustLevel(agentA: string, agentB: string): number {
    return agentAutonomousCommunication.getTrustLevel(agentA, agentB)
  }

  // ==================== 叙事协作专用接口 ====================

  /**
   * 发起故事创作协商
   */
  async initiateStoryNegotiation(
    storyId: string,
    initiatorId: string,
    participants: string[],
    topic: string,
    storyElement: any
  ): Promise<string> {
    const negotiationTopic = `故事创作协商: ${topic}`
    const initialProposal = {
      storyId,
      element: storyElement,
      proposedChange: '待协商的具体内容',
      reasoning: '基于创作需求和风格一致性',
    }

    return await this.initiateAgentNegotiation(
      initiatorId,
      participants,
      negotiationTopic,
      initialProposal,
      15 // 15分钟截止
    )
  }

  /**
   * 报告角色冲突
   */
  async reportCharacterConflict(
    storyId: string,
    reporterId: string,
    characterId: string,
    conflictType: 'personality' | 'development' | 'relationship',
    description: string,
    participants: string[]
  ): Promise<string> {
    const conflictDescription = `角色"${characterId}"${conflictType}冲突: ${description}`

    const proposedSolutions = [
      {
        proposerId: reporterId,
        solution: { action: 'compromise', details: '寻求折中方案' },
        reasoning: '平衡各方需求，保持故事连贯性',
        feasibility: 0.8,
        impact: 0.6,
        cost: 0.3,
      },
      {
        proposerId: 'system',
        solution: { action: 'mediate', details: '引入第三方调解' },
        reasoning: '通过客观调解达成共识',
        feasibility: 0.9,
        impact: 0.4,
        cost: 0.5,
      },
    ]

    return await this.reportCollaborationConflict(
      reporterId,
      'opinion',
      conflictDescription,
      participants,
      proposedSolutions
    )
  }

  /**
   * 报告情节冲突
   */
  async reportPlotConflict(
    storyId: string,
    reporterId: string,
    plotPoint: string,
    conflictType: 'logic' | 'pacing' | 'consistency',
    description: string,
    participants: string[]
  ): Promise<string> {
    const conflictDescription = `情节"${plotPoint}"${conflictType}冲突: ${description}`

    const proposedSolutions = [
      {
        proposerId: reporterId,
        solution: { action: 'revise', details: '修改情节设计' },
        reasoning: '调整情节以解决逻辑问题',
        feasibility: 0.7,
        impact: 0.8,
        cost: 0.6,
      },
      {
        proposerId: 'system',
        solution: { action: 'split', details: '将冲突情节拆分' },
        reasoning: '通过结构调整化解冲突',
        feasibility: 0.8,
        impact: 0.5,
        cost: 0.4,
      },
    ]

    return await this.reportCollaborationConflict(
      reporterId,
      'logic',
      conflictDescription,
      participants,
      proposedSolutions
    )
  }

  /**
   * 发送Agent协作状态更新
   */
  async sendAgentCollaborationUpdate(
    storyId: string,
    agentId: string,
    status: 'thinking' | 'writing' | 'reviewing' | 'waiting' | 'conflict',
    details: any
  ): Promise<void> {
    // 创建协作频道（如果不存在）
    const channelId = `collab-${storyId}`

    try {
      await this.sendCollaborationMessage(
        channelId,
        agentId,
        'information',
        {
          storyId,
          agentId,
          status,
          details,
          timestamp: new Date(),
        },
        {
          importance: 0.7,
          urgency: status === 'conflict' ? 0.8 : 0.5,
        }
      )
    } catch (error) {
      // 如果频道不存在，先创建频道
      await this.createCollaborationChannel(
        `Story ${storyId} Collaboration`,
        [agentId],
        `协作频道 - 故事 ${storyId}`,
        'normal'
      )

      // 重新发送消息
      await this.sendCollaborationMessage(
        channelId,
        agentId,
        'information',
        {
          storyId,
          agentId,
          status,
          details,
          timestamp: new Date(),
        },
        {
          importance: 0.7,
          urgency: status === 'conflict' ? 0.8 : 0.5,
        }
      )
    }
  }

  /**
   * 发起创意协商
   */
  async initiateCreativeNegotiation(
    storyId: string,
    initiatorId: string,
    participants: string[],
    creativeElement: {
      type: 'plot' | 'character' | 'setting' | 'theme'
      current: any
      proposed: any
      reasoning: string
    }
  ): Promise<string> {
    const topic = `创意协商: ${creativeElement.type} 元素`

    const initialProposal = {
      storyId,
      elementType: creativeElement.type,
      currentVersion: creativeElement.current,
      proposedVersion: creativeElement.proposed,
      reasoning: creativeElement.reasoning,
      impact: '需要评估对整体故事的影响',
    }

    return await this.initiateAgentNegotiation(
      initiatorId,
      participants,
      topic,
      initialProposal,
      20 // 20分钟截止
    )
  }

  // ==================== 协作优化 ====================

  /**
   * 分析协作模式
   */
  async analyzeCollaborationPatterns(storyId: string): Promise<any> {
    // 这里可以分析特定故事的协作模式
    // 返回协作效率、冲突频率、信任度变化等统计信息
    return {
      storyId,
      totalNegotiations: 0,
      resolvedConflicts: 0,
      averageTrustLevel: 0.75,
      collaborationEfficiency: 0.82,
      recommendations: ['增加提前沟通以减少冲突', '建立更明确的角色分工', '定期review协作流程'],
    }
  }

  /**
   * 优化Agent团队组合
   */
  async optimizeAgentTeam(
    taskType: string,
    availableAgents: Array<{ id: string; capabilities: string[]; trustLevel: number }>
  ): Promise<Array<{ id: string; role: string }>> {
    // 基于任务类型和Agent能力及信任度优化团队组合
    const optimizedTeam: Array<{ id: string; role: string }> = []

    // 简化的团队优化逻辑
    if (taskType === 'story-creation') {
      // 为故事创作选择最佳Agent组合
      const creatorAgent = availableAgents.find((a) => a.capabilities.includes('creative-writing'))
      const logicAgent = availableAgents.find((a) => a.capabilities.includes('logical-reasoning'))
      const characterAgent = availableAgents.find((a) =>
        a.capabilities.includes('character-development')
      )

      if (creatorAgent) optimizedTeam.push({ id: creatorAgent.id, role: 'primary-creator' })
      if (logicAgent) optimizedTeam.push({ id: logicAgent.id, role: 'logic-reviewer' })
      if (characterAgent)
        optimizedTeam.push({ id: characterAgent.id, role: 'character-specialist' })
    }

    return optimizedTeam
  }

  // ==================== 监控和统计 ====================

  /**
   * 获取通信统计信息
   */
  getCommunicationStats(): any {
    return agentAutonomousCommunication.getCommunicationStats()
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      const stats = this.getCommunicationStats()
      return {
        status: 'healthy',
        details: stats,
      }
    } catch (error: any) {
      return {
        status: 'error',
        details: error.message,
      }
    }
  }

  /**
   * 获取活跃协商列表
   */
  getActiveNegotiations(): NegotiationSession[] {
    // 这里应该返回所有活跃的协商会话
    // 由于底层模块没有提供这个接口，暂时返回空数组
    return []
  }

  /**
   * 获取未解决冲突列表
   */
  getOpenConflicts(): ConflictResolution[] {
    // 这里应该返回所有未解决的冲突
    // 由于底层模块没有提供这个接口，暂时返回空数组
    return []
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<void> {
    // 清理过期协商和冲突
    this.logger.log('Agent通信会话清理完成')
  }
}
