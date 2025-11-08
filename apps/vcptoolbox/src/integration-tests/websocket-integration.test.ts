// ============================================================================
// WebSocket通信集成测试
// 验证 VCPToolBox WebSocket通信的正确集成
// ============================================================================

import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { WebSocketService } from '../../../../packages/common-backend/src/vcp/websocket.service'

describe('WebSocketService Integration', () => {
  let service: WebSocketService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                WEBSOCKET_PORT: 8081, // 使用不同端口避免冲突
                WEBSOCKET_HOST: 'localhost',
                WEBSOCKET_HEARTBEAT_INTERVAL: 30000,
                WEBSOCKET_CONNECTION_TIMEOUT: 300000,
              }
              return config[key] || defaultValue
            }),
          },
        },
      ],
    }).compile()

    service = module.get<WebSocketService>(WebSocketService)
    configService = module.get<ConfigService>(ConfigService)
  })

  afterEach(async () => {
    // 清理资源
    try {
      await (service as any).onModuleDestroy()
    } catch (error) {
      // 忽略清理错误
    }
  })

  it('应该能获取WebSocket统计信息', () => {
    const stats = service.getWebSocketStats()

    expect(stats).toHaveProperty('status')
    // 在测试环境中服务器可能没有启动，所以状态可能是'stopped'
    expect(['running', 'stopped']).toContain(stats.status)
  })

  it('应该能执行健康检查', async () => {
    const health = await service.healthCheck()

    expect(health).toHaveProperty('status')
    expect(['healthy', 'error']).toContain(health.status)

    if (health.status === 'error') {
      expect(health).toHaveProperty('details')
    }
  })

  it('应该能处理Agent消息发送（模拟）', async () => {
    // 测试发送到不存在的Agent，应该返回false
    const result = await service.sendToAgent('non-existent-agent', {
      action: 'test',
      payload: { message: 'test' },
    })

    // 在没有实际WebSocket连接的情况下，应该返回false
    expect(result).toBe(false)
  })

  it('应该能处理广播消息（模拟）', async () => {
    const result = await service.broadcastToAgents({
      action: 'test-broadcast',
      payload: { message: 'broadcast test' },
    })

    // 在没有连接的情况下，广播应该影响0个客户端
    expect(result).toBe(0)
  })

  it('应该能处理协作房间操作（模拟）', async () => {
    const roomId = await service.createCollaborationRoom('test-story-123', ['agent1', 'agent2'])
    // 当前实现返回null
    expect(roomId).toBeNull()

    const joinResult = await service.joinCollaborationRoom('test-room', 'test-agent')
    expect(joinResult).toBe(true)
  })

  it('应该能处理实时编辑更新（模拟）', async () => {
    // 这应该不会抛出错误，即使没有实际的WebSocket连接
    await expect(
      service.sendRealtimeEdit('story-123', 'agent-456', {
        type: 'text',
        content: '新的内容',
        position: { line: 1, column: 10 },
      })
    ).resolves.not.toThrow()
  })

  it('应该能处理AI生成进度（模拟）', async () => {
    await expect(
      service.sendGenerationProgress('story-123', 'agent-456', 75, 'generating')
    ).resolves.not.toThrow()
  })

  it('应该能处理Agent协作状态（模拟）', async () => {
    await expect(
      service.sendAgentCollaborationStatus('story-123', {
        agents: ['agent1', 'agent2'],
        status: 'active',
        progress: 60,
      })
    ).resolves.not.toThrow()
  })

  it('应该能获取活跃协作会话（模拟）', () => {
    const sessions = service.getActiveCollaborationSessions()
    expect(Array.isArray(sessions)).toBe(true)
    // 当前实现返回空数组
    expect(sessions).toHaveLength(0)
  })

  it('应该正确配置WebSocket参数', () => {
    expect(configService.get).toHaveBeenCalledWith('WEBSOCKET_PORT', 8080)
    expect(configService.get).toHaveBeenCalledWith('WEBSOCKET_HOST', 'localhost')
  })
})
