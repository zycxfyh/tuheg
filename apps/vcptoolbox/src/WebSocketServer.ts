// ============================================================================
// WebSocket通信服务器 - VCPToolBox核心特性
// 实现实时双向通信、事件驱动架构、分布式消息传递
// ============================================================================

import { EventEmitter } from 'events'
import type { IncomingMessage } from 'http'
import WebSocket from 'ws'

export interface WSConnection {
  id: string
  ws: WebSocket
  agentId?: string
  clientType: 'agent' | 'client' | 'monitor' | 'admin'
  authenticated: boolean
  metadata: {
    ip: string
    userAgent: string
    connectedAt: Date
    lastActivity: Date
  }
  subscriptions: Set<string> // 订阅的事件类型
  pendingRequests: Map<string, PendingRequest>
}

export interface PendingRequest {
  id: string
  type: string
  payload: any
  timestamp: Date
  timeout: NodeJS.Timeout
  resolve: (value: any) => void
  reject: (reason: any) => void
}

export interface WSMessage {
  id: string
  type: 'request' | 'response' | 'event' | 'broadcast' | 'heartbeat'
  action: string
  payload: any
  timestamp: Date
  source: string
  target?: string
  correlationId?: string
}

export interface WSRoom {
  id: string
  name: string
  participants: Set<string> // connection IDs
  topic: string
  createdAt: Date
  settings: {
    maxParticipants: number
    allowAnonymous: boolean
    messageHistory: boolean
    autoCleanup: boolean
  }
}

export class WebSocketServer extends EventEmitter {
  private wss: WebSocket.Server | null = null
  private connections: Map<string, WSConnection> = new Map()
  private rooms: Map<string, WSRoom> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(
    private port: number = 8080,
    private host: string = 'localhost'
  ) {
    super()
    this.setupCleanup()
  }

  // ==================== 服务器管理 ====================

  /**
   * 启动WebSocket服务器
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({
          port: this.port,
          host: this.host,
          perMessageDeflate: true,
          maxPayload: 1024 * 1024 * 10, // 10MB
        })

        this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
          this.handleConnection(ws, request)
        })

        this.wss.on('error', (error) => {
          console.error('WebSocket Server error:', error)
          this.emit('serverError', error)
        })

        this.startHeartbeat()
        this.emit('serverStarted', { port: this.port, host: this.host })

        console.log(`VCP WebSocket Server started on ws://${this.host}:${this.port}`)
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
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    if (this.wss) {
      // 关闭所有连接
      for (const [connectionId, connection] of this.connections) {
        await this.closeConnection(connectionId, 'server_shutdown')
      }

      this.wss.close()
      this.wss = null
    }

    this.emit('serverStopped')
  }

  /**
   * 处理新连接
   */
  private async handleConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const connection: WSConnection = {
      id: connectionId,
      ws,
      clientType: 'client',
      authenticated: false,
      metadata: {
        ip: this.extractIP(request),
        userAgent: request.headers['user-agent'] || 'unknown',
        connectedAt: new Date(),
        lastActivity: new Date(),
      },
      subscriptions: new Set(),
      pendingRequests: new Map(),
    }

    this.connections.set(connectionId, connection)

    // 设置连接事件处理器
    ws.on('message', (data: WebSocket.RawData) => {
      this.handleMessage(connectionId, data)
    })

    ws.on('close', (code: number, reason: Buffer) => {
      this.handleDisconnection(connectionId, code, reason)
    })

    ws.on('error', (error) => {
      console.error(`Connection ${connectionId} error:`, error)
      this.handleDisconnection(connectionId, 1006, Buffer.from('connection_error'))
    })

    ws.on('pong', () => {
      connection.metadata.lastActivity = new Date()
    })

    this.emit('connectionEstablished', connection)

    // 发送欢迎消息
    this.sendToConnection(connectionId, {
      id: `msg-${Date.now()}`,
      type: 'event',
      action: 'welcome',
      payload: {
        connectionId,
        serverVersion: '1.0.0',
        supportedProtocols: ['vcp-1.0', 'agent-comm-1.0'],
      },
      timestamp: new Date(),
      source: 'server',
    })
  }

  // ==================== 消息处理 ====================

  /**
   * 处理接收到的消息
   */
  private async handleMessage(connectionId: string, data: WebSocket.RawData): Promise<void> {
    try {
      const message: WSMessage = JSON.parse(data.toString())

      const connection = this.connections.get(connectionId)
      if (!connection) return

      connection.metadata.lastActivity = new Date()

      // 验证消息格式
      if (!this.validateMessage(message)) {
        this.sendError(connectionId, message.id, 'invalid_message_format')
        return
      }

      // 处理不同类型的消息
      switch (message.type) {
        case 'request':
          await this.handleRequest(connectionId, message)
          break
        case 'response':
          await this.handleResponse(connectionId, message)
          break
        case 'event':
          await this.handleEvent(connectionId, message)
          break
        case 'heartbeat':
          this.handleHeartbeat(connectionId, message)
          break
        default:
          this.sendError(connectionId, message.id, 'unknown_message_type')
      }
    } catch (error) {
      console.error(`Failed to handle message from ${connectionId}:`, error)
      this.sendError(connectionId, 'unknown', 'message_parse_error')
    }
  }

  /**
   * 处理请求消息
   */
  private async handleRequest(connectionId: string, message: WSMessage): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      // 权限检查
      if (!(await this.checkRequestPermission(connection, message))) {
        this.sendError(connectionId, message.id, 'insufficient_permissions')
        return
      }

      // 路由到相应的处理器
      const result = await this.routeRequest(connection, message)

      // 发送响应
      this.sendToConnection(connectionId, {
        id: message.id,
        type: 'response',
        action: message.action,
        payload: result,
        timestamp: new Date(),
        source: 'server',
        correlationId: message.id,
      })
    } catch (error: any) {
      console.error(`Request handling failed:`, error)
      this.sendError(connectionId, message.id, 'request_processing_error', error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
    }
  }

  /**
   * 处理响应消息
   */
  private async handleResponse(connectionId: string, message: WSMessage): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const pendingRequest = connection.pendingRequests.get(message.correlationId!)
    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout)
      connection.pendingRequests.delete(message.correlationId!)

      if (message.payload?.error) {
        pendingRequest.reject(new Error(message.payload.error))
      } else {
        pendingRequest.resolve(message.payload)
      }
    }
  }

  /**
   * 处理事件消息
   */
  private async handleEvent(connectionId: string, message: WSMessage): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // 广播事件到订阅者
    if (message.target === 'broadcast') {
      this.broadcast(message, [connectionId])
    } else if (message.target) {
      // 发送到特定目标
      this.sendToConnection(message.target, message)
    }

    this.emit('eventReceived', { connectionId, message })
  }

  /**
   * 处理心跳
   */
  private handleHeartbeat(connectionId: string, message: WSMessage): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.metadata.lastActivity = new Date()

      // 响应心跳
      this.sendToConnection(connectionId, {
        id: message.id,
        type: 'heartbeat',
        action: 'pong',
        payload: { timestamp: Date.now() },
        timestamp: new Date(),
        source: 'server',
        correlationId: message.id,
      })
    }
  }

  /**
   * 路由请求到处理器
   */
  private async routeRequest(connection: WSConnection, message: WSMessage): Promise<any> {
    const [module, action] = message.action.split('.')

    switch (module) {
      case 'auth':
        return await this.handleAuthRequest(connection, action, message.payload)
      case 'agent':
        return await this.handleAgentRequest(connection, action, message.payload)
      case 'room':
        return await this.handleRoomRequest(connection, action, message.payload)
      case 'tool':
        return await this.handleToolRequest(connection, action, message.payload)
      case 'memory':
        return await this.handleMemoryRequest(connection, action, message.payload)
      default:
        throw new Error(`Unknown module: ${module}`)
    }
  }

  // ==================== 认证相关 ====================

  /**
   * 处理认证请求
   */
  private async handleAuthRequest(
    connection: WSConnection,
    action: string,
    payload: any
  ): Promise<any> {
    switch (action) {
      case 'login':
        return await this.authenticateConnection(connection, payload)
      case 'logout':
        return await this.deauthenticateConnection(connection)
      case 'validate':
        return { authenticated: connection.authenticated, agentId: connection.agentId }
      default:
        throw new Error(`Unknown auth action: ${action}`)
    }
  }

  /**
   * 认证连接
   */
  private async authenticateConnection(connection: WSConnection, credentials: any): Promise<any> {
    // 简化的认证逻辑
    // 实际应该验证token、API密钥等
    if (credentials.token && credentials.agentId) {
      connection.authenticated = true
      connection.agentId = credentials.agentId
      connection.clientType = credentials.clientType || 'agent'

      this.emit('connectionAuthenticated', connection)
      return { success: true, agentId: connection.agentId }
    }

    throw new Error('Invalid credentials')
  }

  /**
   * 取消认证
   */
  private async deauthenticateConnection(connection: WSConnection): Promise<any> {
    connection.authenticated = false
    connection.agentId = undefined

    this.emit('connectionDeauthenticated', connection)
    return { success: true }
  }

  // ==================== Agent相关 ====================

  /**
   * 处理Agent请求
   */
  private async handleAgentRequest(
    connection: WSConnection,
    action: string,
    payload: any
  ): Promise<any> {
    if (!connection.authenticated) {
      throw new Error('Authentication required')
    }

    switch (action) {
      case 'register':
        return await this.registerAgent(connection, payload)
      case 'status':
        return await this.getAgentStatus(connection, payload)
      case 'communicate':
        return await this.handleAgentCommunication(connection, payload)
      case 'task':
        return await this.handleAgentTask(connection, payload)
      default:
        throw new Error(`Unknown agent action: ${action}`)
    }
  }

  /**
   * 注册Agent
   */
  private async registerAgent(connection: WSConnection, agentData: any): Promise<any> {
    // 注册Agent到系统
    connection.agentId = agentData.id
    connection.clientType = 'agent'

    this.emit('agentRegistered', { connectionId: connection.id, agentData })
    return { success: true, agentId: agentData.id }
  }

  /**
   * 获取Agent状态
   */
  private async getAgentStatus(connection: WSConnection, payload: any): Promise<any> {
    // 返回Agent状态信息
    return {
      agentId: connection.agentId,
      status: 'active',
      connections: this.connections.size,
      rooms: Array.from(connection.subscriptions),
    }
  }

  /**
   * 处理Agent间通信
   */
  private async handleAgentCommunication(connection: WSConnection, payload: any): Promise<any> {
    const { targetAgentId, message } = payload

    // 查找目标Agent连接
    const targetConnection = Array.from(this.connections.values()).find(
      (conn) => conn.agentId === targetAgentId && conn.authenticated
    )

    if (!targetConnection) {
      throw new Error('Target agent not found or not connected')
    }

    // 发送消息到目标Agent
    this.sendToConnection(targetConnection.id, {
      id: `msg-${Date.now()}`,
      type: 'event',
      action: 'agent_message',
      payload: {
        fromAgent: connection.agentId,
        toAgent: targetAgentId,
        message,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      source: connection.id,
      target: targetConnection.id,
    })

    return { success: true, delivered: true }
  }

  /**
   * 处理Agent任务
   */
  private async handleAgentTask(connection: WSConnection, payload: any): Promise<any> {
    // 处理任务相关的操作
    this.emit('agentTask', { connectionId: connection.id, task: payload })
    return { success: true, taskId: payload.id }
  }

  // ==================== 房间相关 ====================

  /**
   * 处理房间请求
   */
  private async handleRoomRequest(
    connection: WSConnection,
    action: string,
    payload: any
  ): Promise<any> {
    switch (action) {
      case 'create':
        return await this.createRoom(connection, payload)
      case 'join':
        return await this.joinRoom(connection, payload)
      case 'leave':
        return await this.leaveRoom(connection, payload)
      case 'list':
        return await this.listRooms(connection)
      default:
        throw new Error(`Unknown room action: ${action}`)
    }
  }

  /**
   * 创建房间
   */
  private async createRoom(connection: WSConnection, roomData: any): Promise<any> {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const room: WSRoom = {
      id: roomId,
      name: roomData.name,
      participants: new Set([connection.id]),
      topic: roomData.topic || '',
      createdAt: new Date(),
      settings: {
        maxParticipants: roomData.maxParticipants || 50,
        allowAnonymous: roomData.allowAnonymous || false,
        messageHistory: roomData.messageHistory !== false,
        autoCleanup: roomData.autoCleanup !== false,
      },
    }

    this.rooms.set(roomId, room)
    connection.subscriptions.add(roomId)

    this.emit('roomCreated', { roomId, creator: connection.id })
    return { success: true, roomId, room }
  }

  /**
   * 加入房间
   */
  private async joinRoom(connection: WSConnection, payload: any): Promise<any> {
    const room = this.rooms.get(payload.roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    if (room.participants.size >= room.settings.maxParticipants) {
      throw new Error('Room is full')
    }

    room.participants.add(connection.id)
    connection.subscriptions.add(payload.roomId)

    // 广播加入事件
    this.broadcastToRoom(
      payload.roomId,
      {
        id: `msg-${Date.now()}`,
        type: 'event',
        action: 'participant_joined',
        payload: {
          participantId: connection.id,
          agentId: connection.agentId,
          timestamp: new Date(),
        },
        timestamp: new Date(),
        source: connection.id,
      },
      [connection.id]
    )

    this.emit('participantJoinedRoom', { roomId: payload.roomId, participantId: connection.id })
    return { success: true, room }
  }

  /**
   * 离开房间
   */
  private async leaveRoom(connection: WSConnection, payload: any): Promise<any> {
    const room = this.rooms.get(payload.roomId)
    if (!room) {
      return { success: false, error: 'Room not found' }
    }

    room.participants.delete(connection.id)
    connection.subscriptions.delete(payload.roomId)

    // 广播离开事件
    this.broadcastToRoom(payload.roomId, {
      id: `msg-${Date.now()}`,
      type: 'event',
      action: 'participant_left',
      payload: {
        participantId: connection.id,
        agentId: connection.agentId,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      source: connection.id,
    })

    // 如果房间为空且设置了自动清理，删除房间
    if (room.participants.size === 0 && room.settings.autoCleanup) {
      this.rooms.delete(payload.roomId)
      this.emit('roomDeleted', { roomId: payload.roomId })
    }

    this.emit('participantLeftRoom', { roomId: payload.roomId, participantId: connection.id })
    return { success: true }
  }

  /**
   * 列出房间
   */
  private async listRooms(connection: WSConnection): Promise<any> {
    const rooms = Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      topic: room.topic,
      participantCount: room.participants.size,
      maxParticipants: room.settings.maxParticipants,
      createdAt: room.createdAt,
    }))

    return { success: true, rooms }
  }

  // ==================== 工具和记忆相关 ====================

  /**
   * 处理工具请求
   */
  private async handleToolRequest(
    connection: WSConnection,
    action: string,
    payload: any
  ): Promise<any> {
    // 处理工具调用请求
    this.emit('toolRequest', { connectionId: connection.id, action, payload })
    return { success: true, action, result: 'Tool executed' }
  }

  /**
   * 处理记忆请求
   */
  private async handleMemoryRequest(
    connection: WSConnection,
    action: string,
    payload: any
  ): Promise<any> {
    // 处理记忆相关请求
    this.emit('memoryRequest', { connectionId: connection.id, action, payload })
    return { success: true, action, result: 'Memory operation completed' }
  }

  // ==================== 消息发送 ====================

  /**
   * 发送消息到指定连接
   */
  private sendToConnection(connectionId: string, message: WSMessage): void {
    const connection = this.connections.get(connectionId)
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      connection.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error(`Failed to send message to ${connectionId}:`, error)
    }
  }

  /**
   * 广播消息
   */
  broadcast(message: WSMessage, excludeConnectionIds: string[] = []): void {
    for (const [connectionId, connection] of this.connections) {
      if (
        !excludeConnectionIds.includes(connectionId) &&
        connection.ws.readyState === WebSocket.OPEN
      ) {
        this.sendToConnection(connectionId, message)
      }
    }
  }

  /**
   * 广播到房间
   */
  broadcastToRoom(roomId: string, message: WSMessage, excludeConnectionIds: string[] = []): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    for (const connectionId of room.participants) {
      if (!excludeConnectionIds.includes(connectionId)) {
        this.sendToConnection(connectionId, message)
      }
    }
  }

  /**
   * 发送错误消息
   */
  private sendError(
    connectionId: string,
    requestId: string,
    errorCode: string,
    details?: string
  ): void {
    this.sendToConnection(connectionId, {
      id: `error-${Date.now()}`,
      type: 'response',
      action: 'error',
      payload: {
        errorCode,
        message: this.getErrorMessage(errorCode),
        details,
        requestId,
      },
      timestamp: new Date(),
      source: 'server',
      correlationId: requestId,
    })
  }

  // ==================== 工具方法 ====================

  /**
   * 验证消息格式
   */
  private validateMessage(message: any): message is WSMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      typeof message.action === 'string' &&
      message.timestamp &&
      typeof message.source === 'string'
    )
  }

  /**
   * 检查请求权限
   */
  private async checkRequestPermission(
    connection: WSConnection,
    message: WSMessage
  ): Promise<boolean> {
    // 简化的权限检查
    // 实际应该基于用户角色和资源权限
    if (message.action.startsWith('auth.')) {
      return true // 认证相关请求总是允许
    }

    return connection.authenticated
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      invalid_message_format: 'Invalid message format',
      unknown_message_type: 'Unknown message type',
      insufficient_permissions: 'Insufficient permissions',
      request_processing_error: 'Request processing error',
      message_parse_error: 'Message parse error',
      authentication_required: 'Authentication required',
    }

    return errorMessages[errorCode] || 'Unknown error'
  }

  /**
   * 提取IP地址
   */
  private extractIP(request: IncomingMessage): string {
    const forwarded = request.headers['x-forwarded-for']
    if (forwarded && typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }

    const realIP = request.headers['x-real-ip']
    if (realIP && typeof realIP === 'string') {
      return realIP
    }

    return request.socket.remoteAddress || 'unknown'
  }

  /**
   * 处理连接断开
   */
  private async handleDisconnection(
    connectionId: string,
    code: number,
    reason: Buffer
  ): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // 从所有房间中移除
    for (const roomId of connection.subscriptions) {
      const room = this.rooms.get(roomId)
      if (room) {
        room.participants.delete(connectionId)

        // 广播离开事件
        this.broadcastToRoom(roomId, {
          id: `msg-${Date.now()}`,
          type: 'event',
          action: 'participant_left',
          payload: {
            participantId: connectionId,
            agentId: connection.agentId,
            reason: reason.toString(),
            timestamp: new Date(),
          },
          timestamp: new Date(),
          source: connectionId,
        })

        // 清理空房间
        if (room.participants.size === 0 && room.settings.autoCleanup) {
          this.rooms.delete(roomId)
          this.emit('roomDeleted', { roomId })
        }
      }
    }

    // 清理待处理的请求
    for (const [requestId, pendingRequest] of connection.pendingRequests) {
      clearTimeout(pendingRequest.timeout)
      pendingRequest.reject(new Error('Connection closed'))
    }

    // 移除连接
    this.connections.delete(connectionId)

    this.emit('connectionClosed', {
      connectionId,
      code,
      reason: reason.toString(),
      agentId: connection.agentId,
    })
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()

      for (const [connectionId, connection] of this.connections) {
        const timeSinceActivity = now - connection.metadata.lastActivity.getTime()

        // 如果超过60秒没有活动，发送ping
        if (timeSinceActivity > 60000) {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.ping()
          }
        }

        // 如果超过5分钟没有活动，断开连接
        if (timeSinceActivity > 300000) {
          connection.ws.close(1000, 'heartbeat_timeout')
        }
      }
    }, 30000) // 每30秒检查一次
  }

  /**
   * 设置清理任务
   */
  private setupCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // 清理非活跃连接（已经在handleDisconnection中处理）
      // 清理空房间（在leaveRoom中处理）
      // 可以在这里添加其他清理逻辑
    }, 60000) // 每分钟清理一次
  }

  // ==================== 公共接口 ====================

  /**
   * 获取服务器状态
   */
  getServerStats(): any {
    return {
      connections: this.connections.size,
      rooms: this.rooms.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
    }
  }

  /**
   * 获取活跃连接列表
   */
  getActiveConnections(): WSConnection[] {
    return Array.from(this.connections.values())
  }

  /**
   * 获取房间列表
   */
  getRooms(): WSRoom[] {
    return Array.from(this.rooms.values())
  }

  /**
   * 向特定Agent发送消息
   */
  sendToAgent(agentId: string, message: Partial<WSMessage>): boolean {
    const connection = Array.from(this.connections.values()).find(
      (conn) => conn.agentId === agentId && conn.authenticated
    )

    if (connection) {
      this.sendToConnection(connection.id, {
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
    let sentCount = 0
    for (const connection of this.connections.values()) {
      if (connection.clientType === 'agent' && connection.authenticated) {
        this.sendToConnection(connection.id, {
          id: `msg-${Date.now()}`,
          type: 'event',
          action: message.action || 'broadcast',
          payload: message.payload || {},
          timestamp: new Date(),
          source: 'server',
          ...message,
        })
        sentCount++
      }
    }
    return sentCount
  }
}

// 创建全局WebSocket服务器实例
export const webSocketServer = new WebSocketServer()
