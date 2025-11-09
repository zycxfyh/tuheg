// 文件路径: apps/backend-gateway/src/gateway/updates.gateway.ts (已改造为使用 Redis-backed Rooms)

import { createClerkClient } from '@clerk/backend'
import { Inject, Logger, UnauthorizedException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'

@WebSocketGateway({
  namespace: 'updates',
  cors: { origin: '*' },
})
export class UpdatesGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(UpdatesGateway.name)
  private readonly clerkClient: ReturnType<typeof createClerkClient>

  constructor(@Inject('ConfigService') private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY')
    if (!secretKey) {
      this.logger.error('CLERK_SECRET_KEY is not configured for WebSocket authentication.')
      throw new Error('Server configuration error: Clerk secret key is missing.')
    }
    this.clerkClient = createClerkClient({ secretKey })
  }

  afterInit(server: Server) {
    // 添加认证中间件到WebSocket服务器
    server.use(async (socket: Socket, next) => {
      try {
        await this.authenticateSocket(socket)
        next()
      } catch (error) {
        this.logger.warn(`WebSocket authentication failed: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`)
        next(error)
      }
    })
  }

  private async authenticateSocket(socket: Socket): Promise<void> {
    const authHeader = socket.handshake.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is missing or malformed.')
    }

    try {
      // 使用Clerk验证JWT token
      const authResult = await this.clerkClient.authenticateRequest({
        headers: new Headers({
          authorization: authHeader,
        }),
      })

      if (!authResult || !authResult.userId) {
        throw new UnauthorizedException('Authentication succeeded but user identification failed.')
      }

      // 将用户信息附加到socket对象上，供后续使用
      socket.data.userId = authResult.userId
      socket.data.auth = authResult
    } catch (error) {
      throw new UnauthorizedException(`WebSocket authentication failed: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`)
    }
  }

  public handleConnection(client: Socket) {
    const userId = client.data.userId as string

    if (!userId) {
      this.logger.warn(`Client connected without authenticated userId. Disconnecting...`)
      client.disconnect()
      return
    }

    // 让客户端加入以其 userId 命名的房间
    client.join(userId)
    this.logger.log(`Client connected: ${client.id}, UserID: ${userId} joined room: ${userId}`)
  }

  public handleDisconnect(client: Socket) {
    // [!] 核心改造：逻辑大大简化。Socket.IO 和 Redis Adapter 会自动处理房间的离开。
    // 我们只需要记录日志即可。
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  /**
   * [!] 核心改造：向指定用户的房间广播事件，而不是向单个 socket ID 发送。
   * Redis Adapter 会确保消息被路由到正确的服务器实例上的正确客户端。
   */
  public async sendToUser(userId: string, event: string, data: unknown): Promise<boolean> {
    // 检查该房间是否存在（即用户是否在线）
    const sockets = await this.server.in(userId).fetchSockets()

    if (sockets && sockets.length > 0) {
      this.server.to(userId).emit(event, data)
      this.logger.log(`Sent event '${event}' to room: ${userId}`)
      return true
    } else {
      this.logger.warn(
        `Attempted to send event '${event}' to UserID: ${userId}, but no active socket found in room.`
      )
      return false
    }
  }
}
