// ============================================================================
// WebSocket通信服务集成
// 集成 VCPToolBox 的实时通信能力到创世星环
// ============================================================================

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import {
  type WSMessage,
  webSocketCommunication,
} from '../../../apps/vcptoolbox/src/modules/communication/WebSocketCommunication'

@Injectable()
export class WebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketService.name)
  private serverStarted = false

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeWebSocketServer()
    this.setupEventHandlers()
    this.logger.log('WebSocket通信服务已初始化')
  }

  async onModuleDestroy() {
    if (this.serverStarted) {
      await webSocketCommunication.stop()
      this.logger.log('WebSocket通信服务已停止')
    }
  }

  // ==================== 服务器管理 ====================

  /**
   * 初始化WebSocket服务器
   */
  private async initializeWebSocketServer(): Promise<void> {
    try {
      const port = this.configService.get('WEBSOCKET_PORT', 8080)
      const host = this.configService.get('WEBSOCKET_HOST', 'localhost')

      await webSocketCommunication.start()
      this.serverStarted = true

      this.logger.log(`WebSocket服务器启动成功: ws://${host}:${port}`)
    } catch (error) {
      this.logger.error('WebSocket服务器启动失败:', error)
      throw error
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听连接事件
    webSocketCommunication.on('clientConnected', (client: any) => {
      this.logger.debug(`客户端已连接: ${client.id}`)
      this.handleClientConnected(client)
    })

    webSocketCommunication.on('clientDisconnected', (client: any) => {
      this.logger.debug(`客户端已断开: ${client.id}`)
      this.handleClientDisconnected(client)
    })

    webSocketCommunication.on(
      'messageReceived',
      (data: { recipientId: string; message: WSMessage }) => {
        this.handleMessageReceived(data.recipientId, data.message)
      }
    )

    webSocketCommunication.on('broadcastSent', (data: { message: WSMessage; sender: any }) => {
      this.logger.debug(`广播消息已发送: ${data.message.action}`)
    })

    // 监听服务器事件
    webSocketCommunication.on('serverError', (error: Error) => {
      this.logger.error('WebSocket服务器错误:', error)
    })
  }

  // ==================== 客户端管理 ====================

  /**
   * 处理客户端连接
   */
  private async handleClientConnected(client: any): Promise<void> {
    // 可以在这里执行额外的连接初始化逻辑
    // 比如验证用户身份、设置默认订阅等
    this.logger.log(`新客户端连接: ${client.id} (${client.metadata.ip})`)
  }

  /**
   * 处理客户端断开
   */
  private async handleClientDisconnected(client: any): Promise<void> {
    this.logger.log(`客户端断开连接: ${client.id}`)
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessageReceived(recipientId: string, message: WSMessage): Promise<void> {
    // 根据消息类型路由到相应的处理逻辑
    switch (message.action) {
      case 'narrative.update':
        await this.handleNarrativeUpdate(recipientId, message)
        break
      case 'agent.status':
        await this.handleAgentStatusUpdate(recipientId, message)
        break
      case 'collaboration.invite':
        await this.handleCollaborationInvite(recipientId, message)
        break
      default:
        this.logger.debug(`接收到消息: ${message.action} -> ${recipientId}`)
    }
  }

  // ==================== 叙事专用消息处理 ====================

  /**
   * 处理叙事更新消息
   */
  private async handleNarrativeUpdate(recipientId: string, message: WSMessage): Promise<void> {
    // 处理实时叙事协作更新
    const { storyId, content, authorId } = message.payload

    this.logger.debug(`叙事更新: 故事 ${storyId} 由 ${authorId} 更新`)

    // 可以在这里触发其他协作参与者的实时更新
    // 比如广播给所有协作者
    await this.broadcastToStoryCollaborators(
      storyId,
      {
        type: 'event',
        action: 'narrative.collaborative_update',
        payload: {
          storyId,
          content,
          authorId,
          timestamp: new Date(),
        },
        timestamp: new Date(),
        source: 'system',
      },
      [recipientId]
    ) // 排除发送者自己
  }

  /**
   * 处理Agent状态更新
   */
  private async handleAgentStatusUpdate(_recipientId: string, message: WSMessage): Promise<void> {
    const { agentId, status, currentTask } = message.payload

    this.logger.debug(`Agent状态更新: ${agentId} -> ${status}`)

    // 广播Agent状态变化
    await this.broadcastToAgents({
      type: 'event',
      action: 'agent.status_changed',
      payload: {
        agentId,
        status,
        currentTask,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      source: 'system',
    })
  }

  /**
   * 处理协作邀请
   */
  private async handleCollaborationInvite(_recipientId: string, message: WSMessage): Promise<void> {
    const { storyId, inviterId, inviteeId, role } = message.payload

    this.logger.debug(`协作邀请: ${inviterId} 邀请 ${inviteeId} 加入故事 ${storyId}`)

    // 发送邀请通知给被邀请者
    const success = webSocketCommunication.sendToAgent(inviteeId, {
      type: 'event',
      action: 'collaboration.invited',
      payload: {
        storyId,
        inviterId,
        role,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      source: 'system',
    })

    if (success) {
      this.logger.debug(`协作邀请已发送给: ${inviteeId}`)
    } else {
      this.logger.warn(`协作邀请发送失败，被邀请者不在线: ${inviteeId}`)
    }
  }

  // ==================== 公共接口 ====================

  /**
   * 向特定Agent发送消息
   */
  async sendToAgent(agentId: string, message: Partial<WSMessage>): Promise<boolean> {
    return webSocketCommunication.sendToAgent(agentId, {
      id: `msg-${Date.now()}`,
      type: message.type || 'event',
      action: message.action || 'message',
      payload: message.payload || {},
      timestamp: new Date(),
      source: 'system',
      ...message,
    })
  }

  /**
   * 广播到所有Agent
   */
  async broadcastToAgents(message: Partial<WSMessage>): Promise<number> {
    return webSocketCommunication.broadcastToAgents({
      id: `broadcast-${Date.now()}`,
      type: message.type || 'event',
      action: message.action || 'broadcast',
      payload: message.payload || {},
      timestamp: new Date(),
      source: 'system',
      ...message,
    })
  }

  /**
   * 广播到故事协作者
   */
  async broadcastToStoryCollaborators(
    _storyId: string,
    message: Partial<WSMessage>,
    _excludeClientIds: string[] = []
  ): Promise<void> {
    // 这里应该从数据库获取故事的协作者列表
    // 暂时模拟广播到所有连接的客户端
    await this.broadcastToAgents(message)
  }

  /**
   * 创建协作房间
   */
  async createCollaborationRoom(storyId: string, participants: string[]): Promise<string | null> {
    // 这里应该创建专门的协作房间
    // 暂时返回null表示未实现
    this.logger.debug(`创建协作房间: ${storyId} 参与者: ${participants.join(', ')}`)
    return null
  }

  /**
   * 加入协作房间
   */
  async joinCollaborationRoom(roomId: string, agentId: string): Promise<boolean> {
    // 这里应该实现加入协作房间的逻辑
    this.logger.debug(`Agent ${agentId} 加入房间: ${roomId}`)
    return true
  }

  /**
   * 发送实时编辑更新
   */
  async sendRealtimeEdit(storyId: string, agentId: string, editData: any): Promise<void> {
    await this.broadcastToStoryCollaborators(
      storyId,
      {
        type: 'event',
        action: 'realtime.edit',
        payload: {
          storyId,
          agentId,
          editData,
          timestamp: new Date(),
        },
      },
      [agentId]
    ) // 排除自己
  }

  /**
   * 发送AI生成进度
   */
  async sendGenerationProgress(
    storyId: string,
    agentId: string,
    progress: number,
    status: string
  ): Promise<void> {
    await this.broadcastToStoryCollaborators(storyId, {
      type: 'event',
      action: 'generation.progress',
      payload: {
        storyId,
        agentId,
        progress,
        status,
        timestamp: new Date(),
      },
    })
  }

  /**
   * 发送Agent协作状态
   */
  async sendAgentCollaborationStatus(storyId: string, collaborationData: any): Promise<void> {
    await this.broadcastToAgents({
      type: 'event',
      action: 'agent.collaboration_status',
      payload: {
        storyId,
        collaborationData,
        timestamp: new Date(),
      },
    })
  }

  // ==================== 统计和监控 ====================

  /**
   * 获取WebSocket统计信息
   */
  getWebSocketStats(): any {
    if (!this.serverStarted) {
      return { status: 'stopped' }
    }

    return {
      status: 'running',
      ...webSocketCommunication.getServerStats(),
    }
  }

  /**
   * 获取活跃协作会话
   */
  getActiveCollaborationSessions(): any[] {
    // 这里应该返回活跃的协作会话信息
    // 暂时返回空数组
    return []
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; details?: any }> {
    if (!this.serverStarted) {
      return { status: 'error', details: 'WebSocket server not started' }
    }

    try {
      const stats = this.getWebSocketStats()
      return {
        status: 'healthy',
        details: stats,
      }
    } catch (error) {
      return {
        status: 'error',
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }
}
