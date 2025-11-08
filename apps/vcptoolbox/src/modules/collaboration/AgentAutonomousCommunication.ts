// ============================================================================
// Agent自主通信系统 - VCPToolBox 协作模块
// 实现Agent间的智能协商、冲突解决和自主协作机制
// ============================================================================

import { EventEmitter } from 'events'
import { tarVariableManager } from '../core/TarVariableSystem'
import { crossMemoryNetwork } from '../storage/CrossMemoryNetwork'

export interface CommunicationChannel {
  id: string
  type: 'direct' | 'broadcast' | 'negotiation' | 'mediation'
  participants: string[]
  topic: string
  status: 'active' | 'closed' | 'suspended'
  priority: 'low' | 'normal' | 'high' | 'critical'
  createdAt: Date
  lastActivity: Date
}

export interface CommunicationMessage {
  id: string
  channelId: string
  senderId: string
  recipientId?: string // 为空表示广播
  type:
    | 'information'
    | 'request'
    | 'proposal'
    | 'agreement'
    | 'disagreement'
    | 'negotiation'
    | 'resolution'
  content: any
  context: {
    taskId?: string
    sessionId?: string
    negotiationId?: string
    conflictId?: string
  }
  metadata: {
    timestamp: Date
    importance: number // 0-1
    urgency: number // 0-1
    confidence: number // 0-1
    requiresResponse: boolean
    responseDeadline?: Date
  }
  attachments?: {
    type: 'memory' | 'file' | 'data'
    reference: string
    description: string
  }[]
}

export interface NegotiationSession {
  id: string
  topic: string
  initiatorId: string
  participants: string[]
  status: 'active' | 'completed' | 'failed' | 'cancelled'
  proposals: NegotiationProposal[]
  votes: Map<string, Vote>
  deadline: Date
  resolution?: any
  createdAt: Date
  completedAt?: Date
}

export interface NegotiationProposal {
  id: string
  proposerId: string
  content: any
  reasoning: string
  alternatives: any[]
  constraints: any[]
  timestamp: Date
  version: number
}

export interface Vote {
  participantId: string
  proposalId: string
  decision: 'accept' | 'reject' | 'modify' | 'abstain'
  reasoning?: string
  timestamp: Date
  weight: number // 投票权重
}

export interface ConflictResolution {
  id: string
  type: 'resource' | 'opinion' | 'priority' | 'methodology' | 'goal'
  description: string
  participants: string[]
  proposedSolutions: ConflictSolution[]
  selectedSolution?: string
  status: 'open' | 'resolved' | 'escalated'
  mediatorId?: string
  resolution?: any
  createdAt: Date
  resolvedAt?: Date
}

export interface ConflictSolution {
  id: string
  proposerId: string
  solution: any
  reasoning: string
  feasibility: number // 0-1
  impact: number // 0-1, 对其他参与者的影响
  cost: number // 实施成本
  timestamp: Date
}

export interface TrustRelationship {
  agentA: string
  agentB: string
  trustLevel: number // 0-1
  interactionCount: number
  positiveInteractions: number
  lastInteraction: Date
  reputation: number // 基于历史的声誉评分
  reliability: number // 可靠性评分
  expertise: Map<string, number> // 在不同领域的专业程度
}

export class AgentAutonomousCommunication extends EventEmitter {
  private channels: Map<string, CommunicationChannel> = new Map()
  private negotiations: Map<string, NegotiationSession> = new Map()
  private conflicts: Map<string, ConflictResolution> = new Map()
  private trustRelationships: Map<string, TrustRelationship> = new Map()
  private messageHistory: CommunicationMessage[] = []
  private maxHistorySize = 10000

  constructor() {
    super()
    this.initializeSystemChannels()
    this.startMaintenanceTasks()
  }

  // ==================== 通信频道管理 ====================

  /**
   * 创建通信频道
   */
  createChannel(
    type: CommunicationChannel['type'],
    participants: string[],
    topic: string,
    priority: CommunicationChannel['priority'] = 'normal'
  ): string {
    const channelId = `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const channel: CommunicationChannel = {
      id: channelId,
      type,
      participants: [...participants],
      topic,
      status: 'active',
      priority,
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    this.channels.set(channelId, channel)
    this.emit('channelCreated', channel)

    return channelId
  }

  /**
   * 发送消息
   */
  async sendMessage(
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
    const channel = this.channels.get(channelId)
    if (!channel || channel.status !== 'active') {
      throw new Error(`Channel ${channelId} not found or not active`)
    }

    if (!channel.participants.includes(senderId)) {
      throw new Error(`Agent ${senderId} is not a participant in channel ${channelId}`)
    }

    const message: CommunicationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId,
      senderId,
      recipientId: options.recipientId,
      type,
      content,
      context: options.context || {},
      metadata: {
        timestamp: new Date(),
        importance: options.importance || 0.5,
        urgency: options.urgency || 0.5,
        confidence: 0.8, // 可以通过AI评估
        requiresResponse: options.requiresResponse || false,
        responseDeadline: options.responseDeadline,
      },
      attachments: options.attachments,
    }

    // 验证消息
    if (!(await this.validateMessage(message))) {
      throw new Error('Invalid message')
    }

    // 添加到历史
    this.addToHistory(message)

    // 更新频道活动时间
    channel.lastActivity = new Date()

    // 路由消息
    await this.routeMessage(message)

    // 如果需要响应，设置超时处理
    if (message.metadata.requiresResponse && message.metadata.responseDeadline) {
      this.scheduleResponseTimeout(message)
    }

    this.emit('messageSent', message)
  }

  /**
   * 加入频道
   */
  joinChannel(channelId: string, agentId: string): boolean {
    const channel = this.channels.get(channelId)
    if (!channel || channel.status !== 'active') {
      return false
    }

    if (!channel.participants.includes(agentId)) {
      channel.participants.push(agentId)
      this.emit('agentJoinedChannel', { channelId, agentId })
    }

    return true
  }

  /**
   * 离开频道
   */
  leaveChannel(channelId: string, agentId: string): boolean {
    const channel = this.channels.get(channelId)
    if (!channel) {
      return false
    }

    const index = channel.participants.indexOf(agentId)
    if (index > -1) {
      channel.participants.splice(index, 1)
      this.emit('agentLeftChannel', { channelId, agentId })

      // 如果没有参与者，关闭频道
      if (channel.participants.length === 0) {
        channel.status = 'closed'
        this.emit('channelClosed', channelId)
      }
    }

    return true
  }

  // ==================== 协商系统 ====================

  /**
   * 发起协商
   */
  async initiateNegotiation(
    initiatorId: string,
    participants: string[],
    topic: string,
    initialProposal: any,
    deadline: Date
  ): Promise<string> {
    const negotiationId = `neg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const proposal: NegotiationProposal = {
      id: `prop-${Date.now()}`,
      proposerId: initiatorId,
      content: initialProposal,
      reasoning: 'Initial proposal',
      alternatives: [],
      constraints: [],
      timestamp: new Date(),
      version: 1,
    }

    const negotiation: NegotiationSession = {
      id: negotiationId,
      topic,
      initiatorId,
      participants: [initiatorId, ...participants],
      status: 'active',
      proposals: [proposal],
      votes: new Map(),
      deadline,
      createdAt: new Date(),
    }

    this.negotiations.set(negotiationId, negotiation)

    // 创建协商频道
    const channelId = this.createChannel('negotiation', negotiation.participants, topic, 'high')

    // 发送初始提案
    await this.sendMessage(channelId, initiatorId, 'proposal', initialProposal, {
      context: { negotiationId },
      importance: 0.8,
      requiresResponse: true,
      responseDeadline: deadline,
    })

    // 设置协商超时
    this.scheduleNegotiationTimeout(negotiationId)

    this.emit('negotiationStarted', negotiation)
    return negotiationId
  }

  /**
   * 提交提案
   */
  async submitProposal(
    negotiationId: string,
    proposerId: string,
    proposal: any,
    reasoning: string,
    alternatives: any[] = []
  ): Promise<void> {
    const negotiation = this.negotiations.get(negotiationId)
    if (!negotiation || negotiation.status !== 'active') {
      throw new Error(`Negotiation ${negotiationId} not found or not active`)
    }

    if (!negotiation.participants.includes(proposerId)) {
      throw new Error(`Agent ${proposerId} is not a participant in negotiation ${negotiationId}`)
    }

    const proposalObj: NegotiationProposal = {
      id: `prop-${Date.now()}`,
      proposerId,
      content: proposal,
      reasoning,
      alternatives,
      constraints: [],
      timestamp: new Date(),
      version: negotiation.proposals.length + 1,
    }

    negotiation.proposals.push(proposalObj)

    // 广播提案到协商频道
    const channelId = Array.from(this.channels.values()).find(
      (ch) => ch.topic === negotiation.topic && ch.type === 'negotiation'
    )?.id

    if (channelId) {
      await this.sendMessage(channelId, proposerId, 'proposal', proposal, {
        context: { negotiationId },
        importance: 0.7,
        requiresResponse: true,
      })
    }

    this.emit('proposalSubmitted', { negotiationId, proposal: proposalObj })
  }

  /**
   * 投票提案
   */
  async voteOnProposal(
    negotiationId: string,
    voterId: string,
    proposalId: string,
    decision: Vote['decision'],
    reasoning?: string
  ): Promise<void> {
    const negotiation = this.negotiations.get(negotiationId)
    if (!negotiation || negotiation.status !== 'active') {
      throw new Error(`Negotiation ${negotiationId} not found or not active`)
    }

    const vote: Vote = {
      participantId: voterId,
      proposalId,
      decision,
      reasoning,
      timestamp: new Date(),
      weight: this.calculateVotingWeight(voterId, negotiation.topic),
    }

    negotiation.votes.set(`${voterId}-${proposalId}`, vote)

    // 检查是否可以达成共识
    await this.checkNegotiationConsensus(negotiation)

    this.emit('voteCast', { negotiationId, vote })
  }

  /**
   * 解决协商
   */
  resolveNegotiation(negotiationId: string, resolution: any): void {
    const negotiation = this.negotiations.get(negotiationId)
    if (!negotiation) return

    negotiation.status = 'completed'
    negotiation.resolution = resolution
    negotiation.completedAt = new Date()

    // 更新信任关系
    this.updateTrustAfterNegotiation(negotiation)

    this.emit('negotiationResolved', negotiation)
  }

  // ==================== 冲突解决 ====================

  /**
   * 报告冲突
   */
  async reportConflict(
    reporterId: string,
    type: ConflictResolution['type'],
    description: string,
    participants: string[],
    proposedSolutions: Omit<ConflictSolution, 'id' | 'timestamp'>[]
  ): Promise<string> {
    const conflictId = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const solutions: ConflictSolution[] = proposedSolutions.map((sol) => ({
      ...sol,
      id: `sol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }))

    const conflict: ConflictResolution = {
      id: conflictId,
      type,
      description,
      participants: [...new Set([reporterId, ...participants])],
      proposedSolutions: solutions,
      status: 'open',
      createdAt: new Date(),
    }

    this.conflicts.set(conflictId, conflict)

    // 创建调解频道
    const channelId = this.createChannel(
      'mediation',
      conflict.participants,
      `Conflict: ${description}`,
      'high'
    )

    // 通知参与者
    await this.sendMessage(
      channelId,
      reporterId,
      'information',
      {
        conflictId,
        type,
        description,
        solutions: solutions.map((s) => ({
          id: s.id,
          solution: s.solution,
          proposerId: s.proposerId,
        })),
      },
      {
        importance: 0.9,
        urgency: 0.8,
        requiresResponse: true,
      }
    )

    // 如果需要，分配调解者
    if (conflict.participants.length > 2) {
      await this.assignMediator(conflict)
    }

    this.emit('conflictReported', conflict)
    return conflictId
  }

  /**
   * 解决冲突
   */
  async resolveConflict(conflictId: string, solutionId: string, resolverId: string): Promise<void> {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict || conflict.status !== 'open') {
      throw new Error(`Conflict ${conflictId} not found or not open`)
    }

    const solution = conflict.proposedSolutions.find((s) => s.id === solutionId)
    if (!solution) {
      throw new Error(`Solution ${solutionId} not found`)
    }

    conflict.status = 'resolved'
    conflict.selectedSolution = solutionId
    conflict.resolution = solution.solution
    conflict.resolvedAt = new Date()

    // 更新信任关系
    this.updateTrustAfterConflict(conflict)

    this.emit('conflictResolved', conflict)
  }

  // ==================== 信任关系管理 ====================

  /**
   * 更新信任关系
   */
  updateTrustLevel(agentA: string, agentB: string, delta: number): void {
    const key = [agentA, agentB].sort().join('-')
    let relationship = this.trustRelationships.get(key)

    if (!relationship) {
      relationship = {
        agentA: agentA < agentB ? agentA : agentB,
        agentB: agentA < agentB ? agentB : agentA,
        trustLevel: 0.5,
        interactionCount: 0,
        positiveInteractions: 0,
        lastInteraction: new Date(),
        reputation: 0.5,
        reliability: 0.5,
        expertise: new Map(),
      }
      this.trustRelationships.set(key, relationship)
    }

    relationship.trustLevel = Math.max(0, Math.min(1, relationship.trustLevel + delta))
    relationship.interactionCount++
    relationship.lastInteraction = new Date()

    if (delta > 0) {
      relationship.positiveInteractions++
    }

    // 更新可靠性
    relationship.reliability = relationship.positiveInteractions / relationship.interactionCount

    this.emit('trustUpdated', relationship)
  }

  /**
   * 获取信任级别
   */
  getTrustLevel(agentA: string, agentB: string): number {
    const key = [agentA, agentB].sort().join('-')
    const relationship = this.trustRelationships.get(key)
    return relationship?.trustLevel || 0.5
  }

  // ==================== 智能路由 ====================

  /**
   * 路由消息
   */
  private async routeMessage(message: CommunicationMessage): Promise<void> {
    const channel = this.channels.get(message.channelId)
    if (!channel) return

    // 根据频道类型路由
    switch (channel.type) {
      case 'direct':
        await this.routeDirectMessage(message)
        break
      case 'broadcast':
        await this.routeBroadcastMessage(message, channel)
        break
      case 'negotiation':
        await this.routeNegotiationMessage(message)
        break
      case 'mediation':
        await this.routeMediationMessage(message)
        break
    }

    // 存储到记忆系统
    await this.storeMessageToMemory(message)

    // 触发事件
    this.emit('messageRouted', message)
  }

  /**
   * 路由直接消息
   */
  private async routeDirectMessage(message: CommunicationMessage): Promise<void> {
    if (message.recipientId) {
      // 发送给特定接收者
      this.emit('messageReceived', {
        recipientId: message.recipientId,
        message,
      })
    }
  }

  /**
   * 路由广播消息
   */
  private async routeBroadcastMessage(
    message: CommunicationMessage,
    channel: CommunicationChannel
  ): Promise<void> {
    for (const participantId of channel.participants) {
      if (participantId !== message.senderId) {
        this.emit('messageReceived', {
          recipientId: participantId,
          message,
        })
      }
    }
  }

  /**
   * 路由协商消息
   */
  private async routeNegotiationMessage(message: CommunicationMessage): Promise<void> {
    // 处理协商逻辑
    if (message.type === 'proposal') {
      await this.handleIncomingProposal(message)
    } else if (message.type === 'agreement' || message.type === 'disagreement') {
      await this.handleIncomingVote(message)
    }
  }

  /**
   * 路由调解消息
   */
  private async routeMediationMessage(message: CommunicationMessage): Promise<void> {
    // 处理冲突解决逻辑
    const conflict = Array.from(this.conflicts.values()).find(
      (c) => c.participants.includes(message.senderId) && c.status === 'open'
    )

    if (conflict) {
      await this.processMediationMessage(message, conflict)
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 验证消息
   */
  private async validateMessage(message: CommunicationMessage): Promise<boolean> {
    return !!(
      message.id &&
      message.channelId &&
      message.senderId &&
      message.type &&
      message.metadata &&
      message.metadata.timestamp
    )
  }

  /**
   * 添加到历史
   */
  private addToHistory(message: CommunicationMessage): void {
    this.messageHistory.push(message)

    // 限制历史大小
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * 存储消息到记忆
   */
  private async storeMessageToMemory(message: CommunicationMessage): Promise<void> {
    try {
      await crossMemoryNetwork.addMemory({
        agentId: message.senderId,
        type: 'communication',
        content: message,
        tags: ['communication', message.type, message.channelId],
        importance: message.metadata.importance,
        connections: [],
        metadata: {
          confidence: message.metadata.confidence,
          source: 'communication-system',
          context: message.context,
        },
      })
    } catch (error) {
      console.warn('Failed to store message to memory:', error)
    }
  }

  /**
   * 计算投票权重
   */
  private calculateVotingWeight(voterId: string, topic: string): number {
    // 基于信任、专长和历史表现计算权重
    let weight = 1.0

    // 信任权重
    const avgTrust =
      Array.from(this.trustRelationships.values())
        .filter((rel) => rel.agentA === voterId || rel.agentB === voterId)
        .reduce((sum, rel) => sum + rel.trustLevel, 0) / 2

    if (avgTrust > 0) {
      weight *= avgTrust
    }

    // 专长权重（如果有相关专长）
    const expertise = this.getAgentExpertise(voterId, topic)
    weight *= 0.5 + expertise * 0.5

    return weight
  }

  /**
   * 获取Agent专长
   */
  private getAgentExpertise(agentId: string, topic: string): number {
    // 简化的专长计算，实际应该从Agent配置或历史表现中获取
    const relationships = Array.from(this.trustRelationships.values()).filter(
      (rel) => rel.agentA === agentId || rel.agentB === agentId
    )

    const totalExpertise = relationships.reduce((sum, rel) => {
      return sum + (rel.expertise.get(topic) || 0)
    }, 0)

    return totalExpertise / Math.max(relationships.length, 1)
  }

  /**
   * 检查协商共识
   */
  private async checkNegotiationConsensus(negotiation: NegotiationSession): Promise<void> {
    const proposals = negotiation.proposals
    const votes = Array.from(negotiation.votes.values())

    // 计算每个提案的加权支持率
    const proposalScores = new Map<string, number>()

    for (const proposal of proposals) {
      let totalWeight = 0
      let positiveWeight = 0

      for (const vote of votes) {
        if (vote.proposalId === proposal.id) {
          totalWeight += vote.weight
          if (vote.decision === 'accept') {
            positiveWeight += vote.weight
          }
        }
      }

      if (totalWeight > 0) {
        proposalScores.set(proposal.id, positiveWeight / totalWeight)
      }
    }

    // 查找是否有足够共识的提案
    const consensusThreshold = 0.7 // 70%同意
    for (const [proposalId, score] of proposalScores) {
      if (score >= consensusThreshold) {
        const proposal = proposals.find((p) => p.id === proposalId)
        if (proposal) {
          this.resolveNegotiation(negotiation.id, proposal.content)
          break
        }
      }
    }
  }

  /**
   * 处理传入提案
   */
  private async handleIncomingProposal(message: CommunicationMessage): Promise<void> {
    // AI逻辑：评估提案并决定投票
    const evaluation = await this.evaluateProposal(message)

    // 自动投票（简化实现）
    if (message.context.negotiationId) {
      const decision: Vote['decision'] =
        evaluation.score > 0.7 ? 'accept' : evaluation.score < 0.3 ? 'reject' : 'modify'

      await this.voteOnProposal(
        message.context.negotiationId,
        'system-agent', // 应该使用实际的Agent ID
        message.id,
        decision,
        evaluation.reasoning
      )
    }
  }

  /**
   * 评估提案
   */
  private async evaluateProposal(
    message: CommunicationMessage
  ): Promise<{ score: number; reasoning: string }> {
    // 简化的提案评估逻辑
    // 实际应该使用AI模型进行更复杂的评估

    const content = JSON.stringify(message.content).toLowerCase()
    let score = 0.5
    let reasoning = 'Basic evaluation'

    // 检查是否包含关键术语
    if (content.includes('optimal') || content.includes('efficient')) {
      score += 0.2
      reasoning = 'Contains efficiency indicators'
    }

    // 检查是否与历史成功案例相似
    const similarMemories = await crossMemoryNetwork.queryMemories({
      tags: ['successful', 'proposal'],
      limit: 5,
    })

    if (similarMemories.some((mem) => mem.score > 0.8)) {
      score += 0.1
      reasoning += '; Similar to successful proposals'
    }

    return { score: Math.min(1, score), reasoning }
  }

  /**
   * 处理传入投票
   */
  private async handleIncomingVote(message: CommunicationMessage): Promise<void> {
    // 处理投票逻辑
    if (message.context.negotiationId) {
      const negotiation = this.negotiations.get(message.context.negotiationId)
      if (negotiation) {
        await this.checkNegotiationConsensus(negotiation)
      }
    }
  }

  /**
   * 分配调解者
   */
  private async assignMediator(conflict: ConflictResolution): Promise<void> {
    // 选择信任度最高的中立参与者作为调解者
    const neutralAgents = conflict.participants.filter(
      (id) => !this.hasDirectConflictHistory(id, conflict)
    )

    if (neutralAgents.length > 0) {
      // 选择信任度最高的
      let bestMediator = neutralAgents[0]
      let bestTrust = 0

      for (const agentId of neutralAgents) {
        const avgTrust =
          conflict.participants
            .filter((id) => id !== agentId)
            .reduce((sum, id) => sum + this.getTrustLevel(agentId, id), 0) /
          (conflict.participants.length - 1)

        if (avgTrust > bestTrust) {
          bestTrust = avgTrust
          bestMediator = agentId
        }
      }

      conflict.mediatorId = bestMediator
      this.emit('mediatorAssigned', { conflictId: conflict.id, mediatorId: bestMediator })
    }
  }

  /**
   * 检查是否有直接冲突历史
   */
  private hasDirectConflictHistory(agentId: string, conflict: ConflictResolution): boolean {
    // 检查Agent是否参与过类似冲突
    const relevantConflicts = Array.from(this.conflicts.values()).filter(
      (c) => c.participants.includes(agentId) && c.type === conflict.type
    )

    return relevantConflicts.length > 0
  }

  /**
   * 更新协商后的信任
   */
  private updateTrustAfterNegotiation(negotiation: NegotiationSession): void {
    const participants = negotiation.participants

    for (const agentA of participants) {
      for (const agentB of participants) {
        if (agentA !== agentB) {
          // 基于协商结果调整信任
          const delta = negotiation.status === 'completed' ? 0.05 : -0.02
          this.updateTrustLevel(agentA, agentB, delta)
        }
      }
    }
  }

  /**
   * 更新冲突解决后的信任
   */
  private updateTrustAfterConflict(conflict: ConflictResolution): void {
    const participants = conflict.participants

    for (const agentA of participants) {
      for (const agentB of participants) {
        if (agentA !== agentB) {
          // 基于冲突解决结果调整信任
          const delta = conflict.status === 'resolved' ? 0.03 : -0.05
          this.updateTrustLevel(agentA, agentB, delta)
        }
      }
    }
  }

  /**
   * 处理调解消息
   */
  private async processMediationMessage(
    message: CommunicationMessage,
    conflict: ConflictResolution
  ): Promise<void> {
    // 处理调解逻辑
    if (message.type === 'proposal') {
      // 评估解决方案
      const evaluation = await this.evaluateSolution(message.content, conflict)

      // 如果是调解者，决定是否接受
      if (conflict.mediatorId === message.senderId && evaluation.score > 0.6) {
        await this.resolveConflict(conflict.id, message.id, message.senderId)
      }
    }
  }

  /**
   * 评估解决方案
   */
  private async evaluateSolution(
    solution: any,
    conflict: ConflictResolution
  ): Promise<{ score: number; reasoning: string }> {
    // 简化的解决方案评估
    let score = 0.5
    const reasoning = 'Basic evaluation'

    // 检查可行性
    if (solution.feasibility && solution.feasibility > 0.7) {
      score += 0.2
    }

    // 检查影响
    if (solution.impact && solution.impact < 0.3) {
      score += 0.2
    }

    // 检查成本
    if (solution.cost && solution.cost < 0.5) {
      score += 0.1
    }

    return { score: Math.min(1, score), reasoning }
  }

  /**
   * 设置响应超时
   */
  private scheduleResponseTimeout(message: CommunicationMessage): void {
    if (!message.metadata.responseDeadline) return

    const timeout = message.metadata.responseDeadline.getTime() - Date.now()

    if (timeout > 0) {
      setTimeout(() => {
        this.handleResponseTimeout(message)
      }, timeout)
    }
  }

  /**
   * 处理响应超时
   */
  private async handleResponseTimeout(message: CommunicationMessage): Promise<void> {
    // 降低发送者的可靠性评分
    const relationships = Array.from(this.trustRelationships.values()).filter(
      (rel) => rel.agentA === message.senderId || rel.agentB === message.senderId
    )

    for (const rel of relationships) {
      rel.reliability = Math.max(0, rel.reliability - 0.05)
    }

    this.emit('responseTimeout', message)
  }

  /**
   * 设置协商超时
   */
  private scheduleNegotiationTimeout(negotiationId: string): void {
    const negotiation = this.negotiations.get(negotiationId)
    if (!negotiation) return

    const timeout = negotiation.deadline.getTime() - Date.now()

    if (timeout > 0) {
      setTimeout(() => {
        this.handleNegotiationTimeout(negotiationId)
      }, timeout)
    }
  }

  /**
   * 处理协商超时
   */
  private handleNegotiationTimeout(negotiationId: string): void {
    const negotiation = this.negotiations.get(negotiationId)
    if (!negotiation || negotiation.status !== 'active') return

    // 选择得票最多的提案
    const proposalVotes = new Map<string, number>()

    for (const vote of negotiation.votes.values()) {
      if (vote.decision === 'accept') {
        proposalVotes.set(vote.proposalId, (proposalVotes.get(vote.proposalId) || 0) + vote.weight)
      }
    }

    let bestProposalId: string | undefined
    let maxVotes = 0

    for (const [proposalId, votes] of proposalVotes) {
      if (votes > maxVotes) {
        maxVotes = votes
        bestProposalId = proposalId
      }
    }

    if (bestProposalId) {
      const proposal = negotiation.proposals.find((p) => p.id === bestProposalId)
      if (proposal) {
        this.resolveNegotiation(negotiationId, proposal.content)
      }
    } else {
      negotiation.status = 'failed'
      this.emit('negotiationFailed', negotiation)
    }
  }

  /**
   * 初始化系统频道
   */
  private initializeSystemChannels(): void {
    // 创建系统广播频道
    this.createChannel('broadcast', [], 'System Announcements', 'high')

    // 创建Agent发现频道
    this.createChannel('broadcast', [], 'Agent Discovery', 'normal')
  }

  /**
   * 启动维护任务
   */
  private startMaintenanceTasks(): void {
    // 定期清理过期频道
    setInterval(() => {
      this.cleanupExpiredChannels()
    }, 300000) // 5分钟

    // 定期更新信任关系
    setInterval(() => {
      this.updateTrustDecay()
    }, 3600000) // 1小时
  }

  /**
   * 清理过期频道
   */
  private cleanupExpiredChannels(): void {
    const now = Date.now()
    const expiryTime = 24 * 60 * 60 * 1000 // 24小时

    for (const [channelId, channel] of this.channels) {
      if (channel.status === 'active' && now - channel.lastActivity.getTime() > expiryTime) {
        channel.status = 'closed'
        this.emit('channelExpired', channelId)
      }
    }
  }

  /**
   * 更新信任衰减
   */
  private updateTrustDecay(): void {
    const now = Date.now()
    const decayTime = 30 * 24 * 60 * 60 * 1000 // 30天

    for (const relationship of this.trustRelationships.values()) {
      const timeSinceLastInteraction = now - relationship.lastInteraction.getTime()

      if (timeSinceLastInteraction > decayTime) {
        // 轻微衰减信任
        relationship.trustLevel = Math.max(0.3, relationship.trustLevel * 0.98)
      }
    }
  }

  // ==================== 公共接口 ====================

  /**
   * 获取通信统计
   */
  getCommunicationStats(): {
    activeChannels: number
    activeNegotiations: number
    openConflicts: number
    trustRelationships: number
    messageHistorySize: number
  } {
    return {
      activeChannels: Array.from(this.channels.values()).filter((ch) => ch.status === 'active')
        .length,
      activeNegotiations: Array.from(this.negotiations.values()).filter(
        (n) => n.status === 'active'
      ).length,
      openConflicts: Array.from(this.conflicts.values()).filter((c) => c.status === 'open').length,
      trustRelationships: this.trustRelationships.size,
      messageHistorySize: this.messageHistory.length,
    }
  }

  /**
   * 获取Agent的通信历史
   */
  getAgentCommunicationHistory(agentId: string, limit: number = 50): CommunicationMessage[] {
    return this.messageHistory
      .filter((msg) => msg.senderId === agentId || msg.recipientId === agentId)
      .sort((a, b) => b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * 获取协商状态
   */
  getNegotiationStatus(negotiationId: string): NegotiationSession | null {
    return this.negotiations.get(negotiationId) || null
  }

  /**
   * 获取冲突状态
   */
  getConflictStatus(conflictId: string): ConflictResolution | null {
    return this.conflicts.get(conflictId) || null
  }
}

// 创建全局实例
export const agentAutonomousCommunication = new AgentAutonomousCommunication()
