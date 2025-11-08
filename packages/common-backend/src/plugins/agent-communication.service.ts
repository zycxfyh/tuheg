import { Injectable } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import type { AgentConversation, MessageType, Prisma } from '@prisma/client'
import type { PrismaService } from '../prisma/prisma.service'

export interface MessagePayload {
  type: MessageType
  content: string
  metadata?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  ttl?: number // 消息生存时间（秒）
}

export interface CommunicationChannel {
  id: string
  name: string
  type: 'direct' | 'broadcast' | 'collaboration' | 'system'
  participants: string[]
  createdAt: Date
  lastActivity: Date
}

@Injectable()
export class AgentCommunicationService {
  private channels = new Map<string, CommunicationChannel>()

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  // ==================== 消息传递 ====================

  /**
   * 发送消息给单个Agent
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    payload: MessagePayload,
    collaborationId?: string
  ): Promise<AgentConversation> {
    // 验证发送者和接收者存在
    await this.validateAgents([senderId, receiverId])

    const message = await this.prisma.agentConversation.create({
      data: {
        collaborationId,
        senderId,
        receiverId,
        message: payload.content,
        messageType: payload.type,
        metadata: {
          ...payload.metadata,
          priority: payload.priority || 'normal',
          ttl: payload.ttl,
          sentAt: new Date(),
        },
      },
      include: {
        sender: true,
        receiver: true,
      },
    })

    // 处理消息TTL
    if (payload.ttl) {
      setTimeout(() => {
        this.expireMessage(message.id)
      }, payload.ttl * 1000)
    }

    this.eventEmitter.emit('agent.messageSent', {
      message,
      payload,
      collaborationId,
    })

    // 触发接收者的事件
    this.eventEmitter.emit(`agent.${receiverId}.messageReceived`, {
      message,
      payload,
    })

    return message
  }

  /**
   * 广播消息给多个Agent
   */
  async broadcastMessage(
    senderId: string,
    receiverIds: string[],
    payload: MessagePayload,
    collaborationId?: string
  ): Promise<AgentConversation[]> {
    const messages: AgentConversation[] = []

    for (const receiverId of receiverIds) {
      if (receiverId !== senderId) {
        // 不给自己发消息
        try {
          const message = await this.sendMessage(senderId, receiverId, payload, collaborationId)
          messages.push(message)
        } catch (error) {
          console.error(`Failed to send message to ${receiverId}:`, error)
        }
      }
    }

    this.eventEmitter.emit('agent.messageBroadcasted', {
      senderId,
      receiverIds,
      messages,
      payload,
      collaborationId,
    })

    return messages
  }

  /**
   * 获取Agent的消息历史
   */
  async getAgentMessages(
    agentId: string,
    filters?: {
      senderId?: string
      messageType?: MessageType
      collaborationId?: string
      since?: Date
      limit?: number
    }
  ): Promise<AgentConversation[]> {
    const where: Prisma.AgentConversationWhereInput = {
      OR: [{ senderId: agentId }, { receiverId: agentId }],
    }

    if (filters?.senderId) {
      where.senderId = filters.senderId
    }

    if (filters?.messageType) {
      where.messageType = filters.messageType
    }

    if (filters?.collaborationId) {
      where.collaborationId = filters.collaborationId
    }

    if (filters?.since) {
      where.createdAt = { gte: filters.since }
    }

    return this.prisma.agentConversation.findMany({
      where,
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    })
  }

  // ==================== 通信频道 ====================

  /**
   * 创建通信频道
   */
  createChannel(
    name: string,
    type: CommunicationChannel['type'],
    participants: string[]
  ): CommunicationChannel {
    const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const channel: CommunicationChannel = {
      id: channelId,
      name,
      type,
      participants: [...new Set(participants)], // 去重
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    this.channels.set(channelId, channel)

    this.eventEmitter.emit('communication.channelCreated', channel)

    return channel
  }

  /**
   * 获取通信频道
   */
  getChannel(channelId: string): CommunicationChannel | undefined {
    return this.channels.get(channelId)
  }

  /**
   * 加入通信频道
   */
  joinChannel(channelId: string, agentId: string): boolean {
    const channel = this.channels.get(channelId)
    if (!channel) return false

    if (!channel.participants.includes(agentId)) {
      channel.participants.push(agentId)
      channel.lastActivity = new Date()

      this.eventEmitter.emit('communication.channelJoined', {
        channelId,
        agentId,
        channel,
      })
    }

    return true
  }

  /**
   * 离开通信频道
   */
  leaveChannel(channelId: string, agentId: string): boolean {
    const channel = this.channels.get(channelId)
    if (!channel) return false

    const index = channel.participants.indexOf(agentId)
    if (index > -1) {
      channel.participants.splice(index, 1)
      channel.lastActivity = new Date()

      this.eventEmitter.emit('communication.channelLeft', {
        channelId,
        agentId,
        channel,
      })

      // 如果频道为空，删除频道
      if (channel.participants.length === 0) {
        this.channels.delete(channelId)
        this.eventEmitter.emit('communication.channelDestroyed', {
          channelId,
        })
      }
    }

    return true
  }

  /**
   * 在频道中发送消息
   */
  async sendChannelMessage(
    channelId: string,
    senderId: string,
    payload: MessagePayload
  ): Promise<AgentConversation[]> {
    const channel = this.channels.get(channelId)
    if (!channel) {
      throw new Error('Channel not found')
    }

    if (!channel.participants.includes(senderId)) {
      throw new Error('Sender is not a channel participant')
    }

    const receiverIds = channel.participants.filter((id) => id !== senderId)
    return this.broadcastMessage(senderId, receiverIds, payload)
  }

  /**
   * 获取所有活跃频道
   */
  getActiveChannels(): CommunicationChannel[] {
    return Array.from(this.channels.values()).filter((channel) => {
      // 检查频道是否在最近1小时内有活动
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return channel.lastActivity > oneHourAgo
    })
  }

  // ==================== 消息队列和路由 ====================

  /**
   * 发送延迟消息
   */
  async sendDelayedMessage(
    senderId: string,
    receiverId: string,
    payload: MessagePayload,
    delayMs: number,
    collaborationId?: string
  ): Promise<string> {
    const messageId = `delayed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    setTimeout(async () => {
      try {
        await this.sendMessage(senderId, receiverId, payload, collaborationId)
      } catch (error) {
        console.error('Failed to send delayed message:', error)
      }
    }, delayMs)

    return messageId
  }

  /**
   * 发送周期性消息
   */
  scheduleRecurringMessage(
    senderId: string,
    receiverId: string,
    payload: MessagePayload,
    intervalMs: number,
    maxOccurrences: number = 10,
    collaborationId?: string
  ): string {
    const messageId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    let occurrences = 0

    const intervalId = setInterval(async () => {
      try {
        await this.sendMessage(senderId, receiverId, payload, collaborationId)
        occurrences++

        if (occurrences >= maxOccurrences) {
          clearInterval(intervalId)
        }
      } catch (error) {
        console.error('Failed to send recurring message:', error)
        clearInterval(intervalId)
      }
    }, intervalMs)

    // 存储intervalId以便后续清理
    this.eventEmitter.emit('communication.recurringMessageScheduled', {
      messageId,
      senderId,
      receiverId,
      intervalMs,
      maxOccurrences,
      intervalId,
    })

    return messageId
  }

  /**
   * 路由消息到最佳接收者
   */
  async routeMessageToBestAgent(
    senderId: string,
    capability: string,
    payload: MessagePayload,
    collaborationId?: string
  ): Promise<AgentConversation | null> {
    // 查找具有指定能力的在线Agent
    const capableAgents = await this.prisma.agent.findMany({
      where: {
        status: 'ONLINE',
        capabilities: {
          path: '$[*].id',
          array_contains: [capability],
        },
      },
      select: {
        id: true,
        priority: true,
      },
    })

    if (capableAgents.length === 0) {
      return null
    }

    // 选择优先级最高的Agent
    capableAgents.sort((a, b) => b.priority - a.priority)
    const bestAgent = capableAgents[0]

    return this.sendMessage(senderId, bestAgent.id, payload, collaborationId)
  }

  // ==================== 通信监控和分析 ====================

  /**
   * 获取通信统计
   */
  async getCommunicationStats(agentId?: string, period: 'hour' | 'day' | 'week' = 'day') {
    const now = new Date()
    let startTime: Date

    switch (period) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
    }

    const where: Prisma.AgentConversationWhereInput = {
      createdAt: { gte: startTime },
    }

    if (agentId) {
      where.OR = [{ senderId: agentId }, { receiverId: agentId }]
    }

    const [totalMessages, messagesByType, messagesByAgent] = await Promise.all([
      this.prisma.agentConversation.count({ where }),

      this.prisma.agentConversation.groupBy({
        by: ['messageType'],
        where,
        _count: { id: true },
      }),

      this.prisma.agentConversation.groupBy({
        by: ['senderId'],
        where,
        _count: { id: true },
      }),
    ])

    const messagesByTypeMap = messagesByType.reduce(
      (acc, item) => {
        acc[item.messageType] = item._count.id
        return acc
      },
      {} as Record<MessageType, number>
    )

    const messagesByAgentMap = messagesByAgent.reduce(
      (acc, item) => {
        acc[item.senderId] = item._count.id
        return acc
      },
      {} as Record<string, number>
    )

    return {
      period,
      totalMessages,
      messagesByType: messagesByTypeMap,
      messagesByAgent: messagesByAgentMap,
      averageMessagesPerHour: totalMessages / (period === 'hour' ? 1 : period === 'day' ? 24 : 168),
      peakCommunicationTimes: await this.getPeakCommunicationTimes(where),
    }
  }

  /**
   * 获取通信高峰期
   */
  private async getPeakCommunicationTimes(where: Prisma.AgentConversationWhereInput) {
    const messages = await this.prisma.agentConversation.findMany({
      where,
      select: { createdAt: true },
    })

    // 按小时统计消息数量
    const hourlyStats: Record<number, number> = {}
    messages.forEach((msg) => {
      const hour = msg.createdAt.getHours()
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1
    })

    // 找到消息量最多的时段
    const sortedHours = Object.entries(hourlyStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    return sortedHours.map(([hour, count]) => ({
      hour: parseInt(hour),
      messageCount: count,
    }))
  }

  /**
   * 监控通信质量
   */
  async monitorCommunicationQuality(agentId: string) {
    const [recentMessages, responseTimes] = await Promise.all([
      this.getAgentMessages(agentId, { limit: 100 }),
      this.calculateResponseTimes(agentId),
    ])

    const totalMessages = recentMessages.length
    const errorMessages = recentMessages.filter((m) => m.messageType === 'ERROR').length
    const commandMessages = recentMessages.filter((m) => m.messageType === 'COMMAND').length
    const resultMessages = recentMessages.filter((m) => m.messageType === 'RESULT').length

    return {
      agentId,
      metrics: {
        totalMessages,
        errorRate: totalMessages > 0 ? errorMessages / totalMessages : 0,
        commandSuccessRate: commandMessages > 0 ? resultMessages / commandMessages : 0,
        averageResponseTime: responseTimes.average,
        responseTimeVariance: responseTimes.variance,
      },
      health: {
        status: errorMessages / totalMessages < 0.1 ? 'healthy' : 'degraded',
        issues: this.identifyCommunicationIssues(recentMessages),
      },
    }
  }

  /**
   * 计算响应时间
   */
  private async calculateResponseTimes(agentId: string) {
    // 获取最近的请求-响应对
    const conversations = await this.prisma.agentConversation.findMany({
      where: {
        OR: [{ senderId: agentId }, { receiverId: agentId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const responseTimes: number[] = []

    // 简化的响应时间计算（实际需要更复杂的配对逻辑）
    for (let i = 0; i < conversations.length - 1; i++) {
      const current = conversations[i]
      const next = conversations[i + 1]

      // 如果当前是命令，下一个是结果，计算时间差
      if (
        current.messageType === 'COMMAND' &&
        next.messageType === 'RESULT' &&
        current.senderId === next.receiverId &&
        current.receiverId === next.senderId
      ) {
        const responseTime = next.createdAt.getTime() - current.createdAt.getTime()
        if (responseTime > 0 && responseTime < 300000) {
          // 5分钟内
          responseTimes.push(responseTime)
        }
      }
    }

    const average =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0

    const variance =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + (time - average) ** 2, 0) / responseTimes.length
        : 0

    return {
      average: Math.round(average),
      variance: Math.round(variance),
      sampleSize: responseTimes.length,
    }
  }

  /**
   * 识别通信问题
   */
  private identifyCommunicationIssues(messages: AgentConversation[]): string[] {
    const issues: string[] = []

    const errorCount = messages.filter((m) => m.messageType === 'ERROR').length
    const totalCount = messages.length

    if (errorCount / totalCount > 0.1) {
      issues.push('高错误率：通信中出现过多错误消息')
    }

    // 检查消息延迟
    const now = Date.now()
    const recentMessages = messages.filter(
      (m) => now - m.createdAt.getTime() < 60 * 60 * 1000 // 1小时内
    )

    if (recentMessages.length < 5) {
      issues.push('低通信频率：最近通信活动较少')
    }

    // 检查消息类型分布
    const commandCount = messages.filter((m) => m.messageType === 'COMMAND').length
    const resultCount = messages.filter((m) => m.messageType === 'RESULT').length

    if (commandCount > resultCount * 2) {
      issues.push('响应不匹配：命令数量远超结果数量')
    }

    return issues
  }

  // ==================== 私有方法 ====================

  /**
   * 验证Agent存在
   */
  private async validateAgents(agentIds: string[]): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true },
    })

    const foundIds = agents.map((a) => a.id)
    const missingIds = agentIds.filter((id) => !foundIds.includes(id))

    if (missingIds.length > 0) {
      throw new Error(`Agents not found: ${missingIds.join(', ')}`)
    }
  }

  /**
   * 使消息过期
   */
  private async expireMessage(messageId: string): Promise<void> {
    try {
      await this.prisma.agentConversation.update({
        where: { id: messageId },
        data: {
          metadata: {
            expired: true,
            expiredAt: new Date(),
          },
        },
      })

      this.eventEmitter.emit('agent.messageExpired', { messageId })
    } catch (error) {
      console.error('Failed to expire message:', error)
    }
  }

  /**
   * 清理过期频道
   */
  cleanupExpiredChannels(): void {
    const now = Date.now()
    const expiryTime = 2 * 60 * 60 * 1000 // 2小时

    for (const [channelId, channel] of this.channels.entries()) {
      if (now - channel.lastActivity.getTime() > expiryTime) {
        this.channels.delete(channelId)
        this.eventEmitter.emit('communication.channelExpired', { channelId })
      }
    }
  }

  /**
   * 定期清理任务
   */
  startCleanupTask(): void {
    // 每30分钟清理一次过期频道
    setInterval(
      () => {
        this.cleanupExpiredChannels()
      },
      30 * 60 * 1000
    )
  }
}
