// ============================================================================
// WebSocket通信模块 - VCPToolBox 通信模块
// 实现分布式Agent网络的实时通信支持
// ============================================================================

import { EventEmitter } from 'events'
import WebSocket from 'ws'

export interface WSClient {
  id: string
  ws: WebSocket
  agentId?: string
  subscriptions: Set<string>
  metadata: {
    connectedAt: Date
    lastActivity: Date
    ip: string
    userAgent: string
  }
  authenticated: boolean
  heartbeatInterval?: NodeJS.Timeout
}

export interface WSMessage {
  id: string
  type: 'request' | 'response' | 'event' | 'broadcast'
  action: string
  payload: any
  timestamp: Date
  source: string
  target?: string
  correlationId?: string
  ttl?: number
}

export interface WSRoom {
  id: string
  name: string
  participants: Set<string>
  createdAt: Date
  settings: {
    maxParticipants: number
    allowAnonymous: boolean
    persistent: boolean
  }
}

export class WebSocketCommunication extends EventEmitter {
  private server: WebSocket.Server | null = null
  private clients: Map<string, WSClient> = new Map()
  private rooms: Map<string, WSRoom> = new Map()
  private heartbeatCheckInterval?: NodeJS.Timeout

  constructor(private port: number = 8080) {
    super()
  }

  // ==================== 服务器管理 ====================

  /**
   * 启动WebSocket服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocket.Server({ port: this.port })

        this.server.on('connection', (ws: WebSocket, request) => {
          this.handleConnection(ws, request)
        })

        this.server.on('error', (error) => {
          this.emit('serverError', error)
        })

        // 启动心跳检查
        this.startHeartbeatCheck()

        console.log(`WebSocket Communication Server started on port ${this.port}`)
        this.emit('serverStarted', { port: this.port })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval)
    }

    for (const client of this.clients.values()) {
      if (client.heartbeatInterval) {
        clearInterval(client.heartbeatInterval)
      }
      client.ws.close()
    }

    if (this.server) {
      this.server.close()
      this.server = null
    }

    this.emit('serverStopped')
  }

  // ==================== 连接管理 ====================

  /**
   * 处理新连接
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const client: WSClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      metadata: {
        connectedAt: new Date(),
        lastActivity: new Date(),
        ip: request.socket.remoteAddress || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
      },
      authenticated: false,
    }

    this.clients.set(clientId, client)

    // 设置消息处理器
    ws.on('message', (data: WebSocket.RawData) => {
      this.handleMessage(clientId, data)
    })

    ws.on('close', () => {
      this.handleDisconnection(clientId)
    })

    ws.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error)
      this.handleDisconnection(clientId)
    })

    // 启动心跳
    this.startClientHeartbeat(client)

    this.emit('clientConnected', client)
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId)
    if (!client) return

    // 清理心跳
    if (client.heartbeatInterval) {
      clearInterval(client.heartbeatInterval)
    }

    // 从房间中移除
    for (const room of this.rooms.values()) {
      room.participants.delete(clientId)
    }

    this.clients.delete(clientId)
    this.emit('clientDisconnected', client)
  }

  // ==================== 消息处理 ====================

  /**
   * 处理接收到的消息
   */
  private async handleMessage(clientId: string, data: WebSocket.RawData): Promise<void> {
    try {
      const message: WSMessage = JSON.parse(data.toString())

      const client = this.clients.get(clientId)
      if (!client) return

      client.metadata.lastActivity = new Date()

      // 路由消息
      await this.routeMessage(message, client)
    } catch (error) {
      console.error(`Failed to handle message from ${clientId}:`, error)
      this.sendError(clientId, 'parse_error', 'Invalid message format')
    }
  }

  /**
   * 路由消息
   */
  private async routeMessage(message: WSMessage, sender: WSClient): Promise<void> {
    switch (message.type) {
      case 'request':
        await this.handleRequest(message, sender)
        break
      case 'response':
        this.handleResponse(message)
        break
      case 'event':
        await this.handleEvent(message, sender)
        break
      case 'broadcast':
        await this.handleBroadcast(message, sender)
        break
    }
  }

  /**
   * 处理请求
   */
  private async handleRequest(message: WSMessage, sender: WSClient): Promise<void> {
    try {
      let result: any

      switch (message.action) {
        case 'auth.login':
          result = await this.handleAuthLogin(message.payload, sender)
          break
        case 'room.join':
          result = await this.handleRoomJoin(message.payload, sender)
          break
        case 'room.create':
          result = await this.handleRoomCreate(message.payload, sender)
          break
        case 'agent.message':
          result = await this.handleAgentMessage(message.payload, sender)
          break
        default:
          throw new Error(`Unknown action: ${message.action}`)
      }

      // 发送响应
      this.sendToClient(sender.id, {
        id: message.id,
        type: 'response',
        action: message.action,
        payload: result,
        timestamp: new Date(),
        correlationId: message.id,
      })
    } catch (error: any) {
      this.sendError(sender.id, message.id, 'request_failed', error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
    }
  }

  /**
   * 处理事件
   */
  private async handleEvent(message: WSMessage, sender: WSClient): Promise<void> {
    // 广播事件到订阅者
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(message.action) && clientId !== sender.id) {
        this.sendToClient(clientId, message)
      }
    }

    this.emit('eventReceived', { message, sender })
  }

  /**
   * 处理广播
   */
  private async handleBroadcast(message: WSMessage, sender: WSClient): Promise<void> {
    // 广播到所有连接的客户端
    for (const [clientId, client] of this.clients) {
      if (clientId !== sender.id && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message)
      }
    }

    this.emit('broadcastSent', { message, sender })
  }

  // ==================== 认证相关 ====================

  /**
   * 处理登录认证
   */
  private async handleAuthLogin(payload: any, client: WSClient): Promise<any> {
    // 简化的认证逻辑
    if (payload.token && payload.agentId) {
      client.authenticated = true
      client.agentId = payload.agentId

      // 订阅默认频道
      client.subscriptions.add('agent.discovery')
      client.subscriptions.add('system.announcements')

      this.emit('clientAuthenticated', client)
      return { success: true, agentId: payload.agentId }
    }

    throw new Error('Authentication failed')
  }

  // ==================== 房间管理 ====================

  /**
   * 创建房间
   */
  private async handleRoomCreate(payload: any, creator: WSClient): Promise<any> {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const room: WSRoom = {
      id: roomId,
      name: payload.name || `Room ${roomId}`,
      participants: new Set([creator.id]),
      createdAt: new Date(),
      settings: {
        maxParticipants: payload.maxParticipants || 50,
        allowAnonymous: payload.allowAnonymous || false,
        persistent: payload.persistent || false,
      },
    }

    this.rooms.set(roomId, room)
    creator.subscriptions.add(roomId)

    this.emit('roomCreated', room)
    return { success: true, roomId, room }
  }

  /**
   * 加入房间
   */
  private async handleRoomJoin(payload: any, client: WSClient): Promise<any> {
    const room = this.rooms.get(payload.roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    if (room.participants.size >= room.settings.maxParticipants) {
      throw new Error('Room is full')
    }

    room.participants.add(client.id)
    client.subscriptions.add(payload.roomId)

    // 广播加入事件
    this.broadcastToRoom(
      payload.roomId,
      {
        id: `event-${Date.now()}`,
        type: 'event',
        action: 'room.participant_joined',
        payload: {
          participantId: client.id,
          agentId: client.agentId,
          timestamp: new Date(),
        },
        timestamp: new Date(),
        source: client.id,
      },
      [client.id]
    )

    this.emit('participantJoinedRoom', { roomId: payload.roomId, participantId: client.id })
    return { success: true, room }
  }

  /**
   * 处理Agent消息
   */
  private async handleAgentMessage(payload: any, sender: WSClient): Promise<any> {
    if (!sender.agentId) {
      throw new Error('Not authenticated as agent')
    }

    // 查找目标Agent
    const targetClient = Array.from(this.clients.values()).find(
      (c) => c.agentId === payload.targetAgentId && c.authenticated
    )

    if (!targetClient) {
      throw new Error('Target agent not connected')
    }

    // 发送消息给目标Agent
    this.sendToClient(targetClient.id, {
      id: `msg-${Date.now()}`,
      type: 'event',
      action: 'agent.direct_message',
      payload: {
        fromAgent: sender.agentId,
        toAgent: payload.targetAgentId,
        message: payload.message,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      source: sender.id,
      target: targetClient.id,
    })

    return { success: true, delivered: true }
  }

  // ==================== 消息发送 ====================

  /**
   * 发送消息到指定客户端
   */
  private sendToClient(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId)
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      client.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error)
    }
  }

  /**
   * 广播到房间
   */
  broadcastToRoom(roomId: string, message: WSMessage, excludeClientIds: string[] = []): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    for (const clientId of room.participants) {
      if (!excludeClientIds.includes(clientId)) {
        this.sendToClient(clientId, message)
      }
    }
  }

  /**
   * 发送错误消息
   */
  private sendError(
    clientId: string,
    correlationId: string,
    errorCode: string,
    details?: string
  ): void {
    this.sendToClient(clientId, {
      id: `error-${Date.now()}`,
      type: 'response',
      action: 'error',
      payload: {
        errorCode,
        message: this.getErrorMessage(errorCode),
        details,
      },
      timestamp: new Date(),
      correlationId,
    })
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      parse_error: 'Message parse error',
      request_failed: 'Request processing failed',
      auth_failed: 'Authentication failed',
      room_not_found: 'Room not found',
      room_full: 'Room is full',
      not_authenticated: 'Not authenticated',
    }
    return messages[errorCode] || 'Unknown error'
  }

  // ==================== 心跳管理 ====================

  /**
   * 启动客户端心跳
   */
  private startClientHeartbeat(client: WSClient): void {
    client.heartbeatInterval = setInterval(() => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping()
      }
    }, 30000) // 30秒心跳
  }

  /**
   * 启动心跳检查
   */
  private startHeartbeatCheck(): void {
    this.heartbeatCheckInterval = setInterval(() => {
      const now = Date.now()

      for (const [clientId, client] of this.clients) {
        const timeSinceActivity = now - client.metadata.lastActivity.getTime()

        // 5分钟没有活动，断开连接
        if (timeSinceActivity > 300000) {
          client.ws.close(1000, 'heartbeat_timeout')
        }
      }
    }, 60000) // 每分钟检查一次
  }

  // ==================== 公共接口 ====================

  /**
   * 获取服务器统计
   */
  getServerStats(): {
    clients: number
    rooms: number
    authenticatedClients: number
  } {
    return {
      clients: this.clients.size,
      rooms: this.rooms.size,
      authenticatedClients: Array.from(this.clients.values()).filter((c) => c.authenticated).length,
    }
  }

  /**
   * 向特定Agent发送消息
   */
  sendToAgent(agentId: string, message: Partial<WSMessage>): boolean {
    const client = Array.from(this.clients.values()).find(
      (c) => c.agentId === agentId && c.authenticated
    )

    if (client) {
      this.sendToClient(client.id, {
        id: `msg-${Date.now()}`,
        type: 'event',
        action: message.action || 'message',
        payload: message.payload || {},
        timestamp: new Date(),
        source: 'server',
        ...message,
      })
      return true
    }

    return false
  }

  /**
   * 广播到所有Agent
   */
  broadcastToAgents(message: Partial<WSMessage>): number {
    let sent = 0
    for (const client of this.clients.values()) {
      if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(client.id, {
          id: `msg-${Date.now()}`,
          type: 'event',
          action: message.action || 'broadcast',
          payload: message.payload || {},
          timestamp: new Date(),
          source: 'server',
          ...message,
        })
        sent++
      }
    }
    return sent
  }
}

// 创建全局实例
export const webSocketCommunication = new WebSocketCommunication()
