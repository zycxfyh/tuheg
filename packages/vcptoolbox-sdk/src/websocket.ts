import { EventEmitter } from 'eventemitter3'
import {
  VCPToolBoxError,
  type WebSocketConfig,
  type WebSocketEvent,
  type WebSocketEventHandler,
} from './types.js'

/**
 * WebSocket Connection Manager
 * WebSocket 连接管理器
 */
export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private isConnecting = false
  private heartbeatTimer: NodeJS.Timeout | null = null
  private lastHeartbeat = Date.now()

  constructor(config: WebSocketConfig) {
    super()
    this.config = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...config,
    }
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'))
        return
      }

      this.isConnecting = true

      try {
        const url = new URL(this.config.url)

        // 添加认证参数
        if (this.config.auth?.apiKey) {
          url.searchParams.set('apiKey', this.config.auth.apiKey)
        }
        if (this.config.auth?.bearerToken) {
          url.searchParams.set('token', this.config.auth.bearerToken)
        }

        this.ws = new WebSocket(url.toString())

        this.ws.onopen = () => {
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            this.emit(
              'error',
              new VCPToolBoxError(
                'Failed to parse WebSocket message',
                'WEBSOCKET_PARSE_ERROR',
                undefined,
                { originalMessage: event.data, parseError: error.message }
              )
            )
          }
        }

        this.ws.onclose = (event) => {
          this.isConnecting = false
          this.stopHeartbeat()
          this.emit('disconnected', event.code, event.reason)

          if (this.config.reconnect && event.code !== 1000) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          this.isConnecting = false
          this.emit(
            'error',
            new VCPToolBoxError(
              'WebSocket connection error',
              'WEBSOCKET_CONNECTION_ERROR',
              undefined,
              error
            )
          )
          reject(error)
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(code = 1000, reason = 'Client disconnect'): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(code, reason)
      this.ws = null
    }

    this.reconnectAttempts = 0
  }

  /**
   * 发送消息
   */
  send(event: WebSocketEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new VCPToolBoxError('WebSocket is not connected', 'WEBSOCKET_NOT_CONNECTED')
    }

    const message = JSON.stringify(event)
    this.ws.send(message)
  }

  /**
   * 发送游戏相关事件
   */
  sendGameEvent(gameId: string, type: string, payload: any): void {
    this.send({
      type,
      payload,
      timestamp: new Date(),
      gameId,
    })
  }

  /**
   * 订阅事件
   */
  on(event: string, handler: WebSocketEventHandler): this {
    return super.on(event, handler)
  }

  /**
   * 取消订阅事件
   */
  off(event: string, handler?: WebSocketEventHandler): this {
    return super.off(event, handler)
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isConnecting) return 'connecting'
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected'
    if (this.reconnectTimer) return 'reconnecting'
    return 'disconnected'
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: any): void {
    try {
      const event: WebSocketEvent = {
        type: message.type,
        payload: message.payload,
        timestamp: new Date(message.timestamp || Date.now()),
        gameId: message.gameId,
      }

      // 更新最后心跳时间
      if (event.type === 'heartbeat' || event.type === 'pong') {
        this.lastHeartbeat = Date.now()
      }

      // 触发事件
      this.emit(event.type, event)
      this.emit('message', event)
    } catch (error) {
      this.emit(
        'error',
        new VCPToolBoxError(
          'Failed to handle WebSocket message',
          'WEBSOCKET_MESSAGE_ERROR',
          undefined,
          { message, error: error.message }
        )
      )
    }
  }

  /**
   * 启动心跳机制
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        // 发送心跳
        this.send({
          type: 'heartbeat',
          payload: { timestamp: Date.now() },
          timestamp: new Date(),
        })

        // 检查最后心跳时间
        const now = Date.now()
        if (now - this.lastHeartbeat > 30000) {
          // 30秒超时
          this.emit(
            'error',
            new VCPToolBoxError('Heartbeat timeout', 'WEBSOCKET_HEARTBEAT_TIMEOUT')
          )
          this.disconnect(1001, 'Heartbeat timeout')
        }
      }
    }, 15000) // 每15秒发送一次心跳
  }

  /**
   * 停止心跳机制
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    if (
      !this.config.reconnect ||
      this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)
    ) {
      return
    }

    this.reconnectAttempts++
    const delay = (this.config.reconnectInterval || 3000) * this.reconnectAttempts

    this.reconnectTimer = setTimeout(() => {
      this.emit('reconnecting', this.reconnectAttempts)
      this.connect().catch((error) => {
        this.emit(
          'error',
          new VCPToolBoxError(
            `Reconnection attempt ${this.reconnectAttempts} failed`,
            'WEBSOCKET_RECONNECT_FAILED',
            undefined,
            error
          )
        )
      })
    }, delay)
  }

  /**
   * 获取连接统计信息
   */
  getStats(): {
    state: string
    reconnectAttempts: number
    lastHeartbeat: number
    uptime: number
  } {
    const now = Date.now()
    return {
      state: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      uptime: this.ws ? now - (this.ws as any).connectTime : 0,
    }
  }
}
