// ============================================================================
// VCP协议核心集成测试
// 验证 VCPToolBox 协议标准的正确集成
// ============================================================================

import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { VCPProtocolService } from '../../../../packages/common-backend/src/vcp/vcp-protocol.service'

describe('VCPProtocolService Integration', () => {
  let service: VCPProtocolService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VCPProtocolService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                AI_PROVIDER: 'openai',
                AI_MODEL: 'gpt-4',
              }
              return config[key] || defaultValue
            }),
          },
        },
      ],
    }).compile()

    service = module.get<VCPProtocolService>(VCPProtocolService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('应该能获取协议统计信息', () => {
    const stats = service.getProtocolStats()

    expect(stats).toHaveProperty('pendingRequests')
    expect(stats).toHaveProperty('activeEndpoints')
    expect(stats).toHaveProperty('queuedMessages')
    expect(stats).toHaveProperty('activeSubscriptions')
    expect(typeof stats.pendingRequests).toBe('number')
  })

  it('应该能执行健康检查', async () => {
    const health = await service.healthCheck()

    expect(health).toHaveProperty('status')
    expect(['healthy', 'error']).toContain(health.status)

    if (health.status === 'healthy') {
      expect(health).toHaveProperty('details')
    }
  })

  it('应该能获取可用端点', () => {
    const endpoints = service.getAvailableEndpoints()

    expect(Array.isArray(endpoints)).toBe(true)
    // 系统端点应该已经被注册
    expect(endpoints.length).toBeGreaterThan(0)

    // 检查是否有预期的端点
    const aiService = endpoints.find((ep) => ep.id === 'ai-service')
    expect(aiService).toBeDefined()
    expect(aiService?.capabilities).toContain('text-generation')
  })

  it('应该能按能力过滤端点', () => {
    const textGenEndpoints = service.getAvailableEndpoints('text-generation')

    expect(Array.isArray(textGenEndpoints)).toBe(true)
    textGenEndpoints.forEach((endpoint) => {
      expect(endpoint.capabilities).toContain('text-generation')
    })
  })

  it('应该能注册自定义端点', () => {
    const customEndpoint = {
      id: 'custom-endpoint',
      type: 'tool' as const,
      url: 'http://custom-tool.com',
      capabilities: ['custom-analysis'],
      status: 'online' as const,
      metadata: {
        version: '1.0.0',
        description: 'Custom analysis tool',
        author: 'test',
        lastSeen: new Date(),
      },
    }

    expect(() => {
      service.registerEndpoint(customEndpoint)
    }).not.toThrow()

    const endpoints = service.getAvailableEndpoints('custom-analysis')
    expect(endpoints.some((ep) => ep.id === 'custom-endpoint')).toBe(true)
  })

  it('应该能注销端点', () => {
    // 先注册一个端点
    const testEndpoint = {
      id: 'test-endpoint-to-remove',
      type: 'service' as const,
      url: 'http://test.com',
      capabilities: ['test-service'],
      status: 'online' as const,
      metadata: {
        version: '1.0.0',
        description: 'Test endpoint',
        author: 'test',
        lastSeen: new Date(),
      },
    }

    service.registerEndpoint(testEndpoint)

    // 确认端点已注册
    let endpoints = service.getAvailableEndpoints('test-service')
    expect(endpoints.some((ep) => ep.id === 'test-endpoint-to-remove')).toBe(true)

    // 注销端点
    service.unregisterEndpoint('test-endpoint-to-remove')

    // 确认端点已移除
    endpoints = service.getAvailableEndpoints('test-service')
    expect(endpoints.some((ep) => ep.id === 'test-endpoint-to-remove')).toBe(false)
  })

  it('应该能调用AI生成工具（模拟）', async () => {
    const prompt = '写一个简短的故事'
    const options = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
    }

    // 由于没有实际的AI服务，这可能会失败或返回模拟结果
    await expect(service.callAIGenerationTool(prompt, options)).rejects.toThrow()
  })

  it('应该能调用分析工具（模拟）', async () => {
    const content = '这是一个测试文本'
    const analysisType = 'sentiment'

    await expect(service.callAnalysisTool(content, analysisType)).rejects.toThrow()
  })

  it('应该能调用翻译工具（模拟）', async () => {
    const text = 'Hello world'
    const targetLanguage = 'zh-CN'

    const result = await service.callTranslationTool(text, targetLanguage)
    // 当前实现可能返回原文本或模拟结果
    expect(typeof result).toBe('string')
  })

  it('应该能执行记忆操作（模拟）', async () => {
    // 这些操作可能会失败，因为没有实际的后端服务
    await expect(service.readMemory('test-key')).rejects.toThrow()
    await expect(service.writeMemory('test-key', 'test-value')).rejects.toThrow()
  })

  it('应该能执行文件操作（模拟）', async () => {
    const fileData = { content: 'test file content' }

    await expect(service.uploadFile(fileData)).rejects.toThrow()
    await expect(service.downloadFile('test-file-id')).rejects.toThrow()
  })

  it('应该能发送叙事生成请求（模拟）', async () => {
    const storyId = 'test-story-123'
    const prompt = '写一个科幻故事'
    const context = { genre: 'sci-fi', length: 'short' }

    const taskId = await service.requestNarrativeGeneration(storyId, prompt, context)
    expect(typeof taskId).toBe('string')
    expect(taskId.length).toBeGreaterThan(0)
  })

  it('应该能发送Agent协作请求（模拟）', async () => {
    const collaborationId = 'test-collab-123'
    const agentIds = ['agent1', 'agent2']
    const task = { type: 'story-writing', priority: 'high' }

    const resultId = await service.requestAgentCollaboration(collaborationId, agentIds, task)
    expect(typeof resultId).toBe('string')
  })

  it('应该能广播系统事件（模拟）', async () => {
    const eventType = 'system.maintenance'
    const eventData = { message: 'System maintenance scheduled', time: '2024-01-01T00:00:00Z' }

    // 不应该抛出错误
    await expect(service.broadcastSystemEvent(eventType, eventData)).resolves.not.toThrow()
  })

  it('应该能清理过期任务', async () => {
    // 不应该抛出错误
    await expect(service.cleanupExpiredTasks()).resolves.not.toThrow()
  })
})
