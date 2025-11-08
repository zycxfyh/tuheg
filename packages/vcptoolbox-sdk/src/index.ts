/**
 * VCPToolBox SDK
 * 创世星环AI创作平台SDK
 *
 * @packageDocumentation
 */

export * from './types.js'
export * from './client.js'
export * from './auth.js'
export * from './games.js'
export * from './plugins.js'
export * from './websocket.js'

// Re-export for convenience
export { VCPToolBoxClient } from './client.js'
export { AuthManager } from './auth.js'
export { GameManager } from './games.js'
export { PluginManager } from './plugins.js'
export { WebSocketManager } from './websocket.js'

import { VCPToolBoxClient } from './client.js'
import { AuthManager } from './auth.js'
import { GameManager } from './games.js'
import { PluginManager } from './plugins.js'
import { WebSocketManager } from './websocket.js'
import { ClientConfig, WebSocketConfig } from './types.js'

/**
 * VCPToolBox SDK 主类
 * Main VCPToolBox SDK class
 */
export class VCPToolBox {
  public readonly client: VCPToolBoxClient
  public readonly auth: AuthManager
  public readonly games: GameManager
  public readonly plugins: PluginManager
  public readonly ws: WebSocketManager

  constructor(config: ClientConfig & { websocket?: WebSocketConfig }) {
    // 创建客户端
    this.client = new VCPToolBoxClient(config)

    // 创建管理模块
    this.auth = new AuthManager(this.client)
    this.games = new GameManager(this.client)
    this.plugins = new PluginManager(this.client)

    // 创建WebSocket管理器
    const wsUrl = config.websocket?.url || config.baseURL.replace(/^http/, 'ws') + '/ws'
    this.ws = new WebSocketManager({
      url: wsUrl,
      auth: config.auth,
      ...config.websocket,
    })

    // 初始化认证状态
    this.auth.initializeFromStorage()

    // 设置自动令牌刷新
    this.setupAutoRefresh()
  }

  /**
   * 快速创建实例（使用默认配置）
   */
  static create(
    baseURL: string,
    options?: Partial<ClientConfig & { websocket?: WebSocketConfig }>
  ) {
    return new VCPToolBox({
      baseURL,
      ...options,
    })
  }

  /**
   * 获取SDK版本
   */
  static getVersion(): string {
    return '1.0.0'
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck()
  }

  /**
   * 连接WebSocket
   */
  async connectWebSocket(): Promise<void> {
    return this.ws.connect()
  }

  /**
   * 断开WebSocket连接
   */
  disconnectWebSocket(): void {
    this.ws.disconnect()
  }

  /**
   * 设置自动令牌刷新
   */
  private setupAutoRefresh(): void {
    // 每5分钟检查一次令牌是否即将过期
    const checkInterval = setInterval(
      async () => {
        if (this.client.isAuth()) {
          const refreshed = await this.auth.autoRefreshIfNeeded()
          if (!refreshed) {
            this.client.emit('error', new Error('Failed to auto-refresh token'))
          }
        }
      },
      5 * 60 * 1000
    ) // 5分钟

    // 页面可见性变化时也检查
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && this.client.isAuth()) {
          await this.auth.autoRefreshIfNeeded()
        }
      })
    }

    // 页面卸载时清理
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        clearInterval(checkInterval)
      })
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.disconnectWebSocket()
    this.auth.clearTokens()
  }
}

// 默认导出
export default VCPToolBox
