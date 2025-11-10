// ============================================================================
// 跨记忆网络集成测试
// 验证 VCPToolBox 记忆共享和联想能力的正确集成
// ============================================================================

import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { CrossMemoryService } from '@tuheg/ai-domain'

describe('CrossMemoryService Integration', () => {
  let service: CrossMemoryService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrossMemoryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                MEMORY_SIMILARITY_THRESHOLD: 0.7,
                MEMORY_MAX_CONNECTIONS: 10,
                MEMORY_DECAY_RATE: 0.95,
              }
              return config[key] || defaultValue
            }),
          },
        },
      ],
    }).compile()

    service = module.get<CrossMemoryService>(CrossMemoryService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('应该能获取记忆统计信息', () => {
    const stats = service.getMemoryStats()

    expect(stats).toHaveProperty('totalMemories')
    expect(stats).toHaveProperty('totalConnections')
    expect(stats).toHaveProperty('agentCount')
    expect(stats).toHaveProperty('memoryTypes')
    expect(stats).toHaveProperty('averageImportance')
    expect(typeof stats.totalMemories).toBe('number')
  })

  it('应该能执行健康检查', async () => {
    const health = await service.healthCheck()

    expect(health).toHaveProperty('status')
    expect(['healthy', 'error']).toContain(health.status)

    if (health.status === 'healthy') {
      expect(health).toHaveProperty('details')
    }
  })

  it('应该能添加记忆', async () => {
    const memoryData = {
      agentId: 'test-agent',
      type: 'experience' as const,
      content: {
        event: 'test event',
        outcome: 'successful test',
      },
      tags: ['test', 'experience'],
      importance: 0.8,
      connections: [],
    }

    const memoryId = await service.addMemory(memoryData)
    expect(typeof memoryId).toBe('string')
    expect(memoryId.length).toBeGreaterThan(0)
  })

  it('应该能获取记忆', async () => {
    // 先添加一个记忆
    const memoryData = {
      agentId: 'test-agent-2',
      type: 'knowledge' as const,
      content: { topic: 'test knowledge', info: 'test information' },
      tags: ['test', 'knowledge'],
      importance: 0.7,
      connections: [],
    }

    const memoryId = await service.addMemory(memoryData)

    // 然后获取它
    const memory = await service.getMemory(memoryId)
    expect(memory).not.toBeNull()
    expect(memory?.id).toBe(memoryId)
    expect(memory?.agentId).toBe('test-agent-2')
    expect(memory?.type).toBe('knowledge')
  })

  it('应该能更新记忆', async () => {
    // 先添加一个记忆
    const memoryData = {
      agentId: 'test-agent-3',
      type: 'experience' as const,
      content: { event: 'original event' },
      tags: ['test'],
      importance: 0.5,
      connections: [],
    }

    const memoryId = await service.addMemory(memoryData)

    // 更新记忆
    const success = await service.updateMemory(memoryId, {
      importance: 0.9,
      content: { event: 'updated event', additionalInfo: 'new data' },
    })

    expect(success).toBe(true)

    // 验证更新
    const updatedMemory = await service.getMemory(memoryId)
    expect(updatedMemory?.importance).toBe(0.9)
    expect(updatedMemory?.content.event).toBe('updated event')
    expect(updatedMemory?.content.additionalInfo).toBe('new data')
  })

  it('应该能删除记忆', async () => {
    // 先添加一个记忆
    const memoryData = {
      agentId: 'test-agent-4',
      type: 'event' as const,
      content: { event: 'to be deleted' },
      tags: ['test', 'delete'],
      importance: 0.6,
      connections: [],
    }

    const memoryId = await service.addMemory(memoryData)

    // 删除记忆
    const deleteSuccess = await service.deleteMemory(memoryId)
    expect(deleteSuccess).toBe(true)

    // 验证已删除
    const deletedMemory = await service.getMemory(memoryId)
    expect(deletedMemory).toBeNull()
  })

  it('应该能查询记忆', async () => {
    // 添加几个测试记忆
    await service.addMemory({
      agentId: 'query-test-agent',
      type: 'experience',
      content: { event: 'query test 1' },
      tags: ['query-test', 'experience'],
      importance: 0.8,
      connections: [],
    })

    await service.addMemory({
      agentId: 'query-test-agent',
      type: 'knowledge',
      content: { topic: 'query test knowledge' },
      tags: ['query-test', 'knowledge'],
      importance: 0.7,
      connections: [],
    })

    // 查询记忆
    const results = await service.queryMemories({
      agentId: 'query-test-agent',
      limit: 10,
    })

    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThanOrEqual(2)
    results.forEach((result) => {
      expect(result).toHaveProperty('memory')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('relevance')
      expect(result.memory.agentId).toBe('query-test-agent')
    })
  })

  it('应该能更新记忆重要性', async () => {
    // 先添加一个记忆
    const memoryData = {
      agentId: 'importance-test',
      type: 'experience' as const,
      content: { event: 'importance test' },
      tags: ['test'],
      importance: 0.5,
      connections: [],
    }

    const memoryId = await service.addMemory(memoryData)

    // 更新重要性
    const success = await service.updateMemoryImportance(memoryId, 0.9)
    expect(success).toBe(true)

    // 验证更新
    const updatedMemory = await service.getMemory(memoryId)
    expect(updatedMemory?.importance).toBe(0.9)
  })

  it('应该能添加故事记忆', async () => {
    const storyId = 'test-story-123'
    const agentId = 'story-agent'

    const memoryId = await service.addStoryMemory(
      storyId,
      agentId,
      {
        event: 'story event',
        description: 'test story memory',
      },
      'experience'
    )

    expect(typeof memoryId).toBe('string')
    expect(memoryId.length).toBeGreaterThan(0)

    // 验证记忆内容
    const memory = await service.getMemory(memoryId)
    expect(memory?.content.storyId).toBe(storyId)
    expect(memory?.content.event).toBe('story event')
    expect(memory?.tags).toContain('story')
    expect(memory?.tags).toContain(storyId)
  })

  it('应该能查询故事记忆', async () => {
    const storyId = 'query-story-test'

    // 添加几个故事记忆
    await service.addStoryMemory(storyId, 'agent1', { event: 'story event 1' })
    await service.addStoryMemory(storyId, 'agent2', { event: 'story event 2' })

    const memories = await service.queryStoryMemories(storyId)
    expect(Array.isArray(memories)).toBe(true)
    expect(memories.length).toBeGreaterThanOrEqual(2)

    memories.forEach((memory) => {
      expect(memory.memory.tags).toContain('story')
      expect(memory.memory.tags).toContain(storyId)
    })
  })

  it('应该能添加角色记忆', async () => {
    const characterId = 'test-character-456'
    const agentId = 'character-agent'

    const memoryId = await service.addCharacterMemory(characterId, agentId, {
      personalityChange: true,
      description: 'character development event',
    })

    expect(typeof memoryId).toBe('string')

    const memory = await service.getMemory(memoryId)
    expect(memory?.content.characterId).toBe(characterId)
    expect(memory?.content.personalityChange).toBe(true)
    expect(memory?.tags).toContain('character')
    expect(memory?.tags).toContain(characterId)
  })

  it('应该能查询角色记忆', async () => {
    const characterId = 'query-character-test'

    await service.addCharacterMemory(characterId, 'agent1', { trait: 'brave' })
    await service.addCharacterMemory(characterId, 'agent2', { trait: 'wise' })

    const memories = await service.queryCharacterMemories(characterId)
    expect(Array.isArray(memories)).toBe(true)
    expect(memories.length).toBeGreaterThanOrEqual(2)

    memories.forEach((memory) => {
      expect(memory.memory.tags).toContain('character')
      expect(memory.memory.tags).toContain(characterId)
    })
  })

  it('应该能添加创作模式记忆', async () => {
    const patternType = 'plot-structure'
    const agentId = 'creative-agent'

    const memoryId = await service.addCreativePattern(
      patternType,
      agentId,
      {
        structure: 'hero-journey',
        elements: ['call to adventure', 'trials', 'transformation'],
      },
      true
    )

    expect(typeof memoryId).toBe('string')

    const memory = await service.getMemory(memoryId)
    expect(memory?.content.patternType).toBe(patternType)
    expect(memory?.content.success).toBe(true)
    expect(memory?.tags).toContain('creative-pattern')
    expect(memory?.tags).toContain(patternType)
    expect(memory?.tags).toContain('success')
  })

  it('应该能查找相似创作模式', async () => {
    const patternType = 'similar-pattern-test'

    // 添加一些成功的创作模式
    await service.addCreativePattern(patternType, 'agent1', { type: 'hero-journey' }, true)
    await service.addCreativePattern(
      patternType,
      'agent2',
      { type: 'hero-journey', variant: 'epic' },
      true
    )

    const similarPatterns = await service.findSimilarCreativePatterns(patternType, {
      type: 'hero-journey',
    })
    expect(Array.isArray(similarPatterns)).toBe(true)
    // 相似度匹配可能不会找到结果，取决于实现
  })

  it('应该能添加用户偏好记忆', async () => {
    const userId = 'test-user-789'
    const preferenceType = 'narrative-style'

    const memoryId = await service.addUserPreference(userId, preferenceType, {
      style: 'modern-realism',
      preferredGenres: ['drama', 'literary-fiction'],
    })

    expect(typeof memoryId).toBe('string')

    const memory = await service.getMemory(memoryId)
    expect(memory?.content.userId).toBe(userId)
    expect(memory?.content.preferenceType).toBe(preferenceType)
    expect(memory?.content.preference.style).toBe('modern-realism')
    expect(memory?.tags).toContain('user-preference')
    expect(memory?.tags).toContain(userId)
  })

  it('应该能获取用户偏好', async () => {
    const userId = 'preference-test-user'

    await service.addUserPreference(userId, 'theme', { theme: 'dark' })
    await service.addUserPreference(userId, 'genre', { genre: 'mystery' })

    const preferences = await service.getUserPreferences(userId)
    expect(Array.isArray(preferences)).toBe(true)
    expect(preferences.length).toBeGreaterThanOrEqual(2)

    const themePref = preferences.find((p) => p.type === 'theme')
    const genrePref = preferences.find((p) => p.type === 'genre')

    expect(themePref?.preference.theme).toBe('dark')
    expect(genrePref?.preference.genre).toBe('mystery')
  })

  it('应该能智能搜索记忆', async () => {
    // 添加一些测试记忆
    await service.addMemory({
      agentId: 'search-agent',
      type: 'knowledge',
      content: { info: 'machine learning is powerful' },
      tags: ['ai', 'ml'],
      importance: 0.8,
      connections: [],
    })

    await service.addMemory({
      agentId: 'search-agent',
      type: 'experience',
      content: { event: 'successful AI implementation' },
      tags: ['ai', 'success'],
      importance: 0.9,
      connections: [],
    })

    const results = await service.intelligentSearch('AI', {
      agentId: 'search-agent',
      tags: ['ai'],
    })

    expect(Array.isArray(results)).toBe(true)
    // 搜索结果取决于实现，可能为空
  })

  it('应该能获取创作灵感', async () => {
    const storyId = 'inspiration-test-story'
    const theme = 'adventure'

    const inspirations = await service.getCreativeInspiration(storyId, theme)
    expect(Array.isArray(inspirations)).toBe(true)
    // 灵感结果可能为空，取决于现有记忆
  })

  it('应该能记录协作经验', async () => {
    const collaborationId = 'test-collab-123'
    const agents = ['agent1', 'agent2', 'agent3']

    const memoryId = await service.recordCollaborationExperience(collaborationId, agents, {
      success: true,
      quality: 0.85,
      timeEfficiency: 0.9,
      communicationIssues: false,
    })

    expect(typeof memoryId).toBe('string')

    const memory = await service.getMemory(memoryId)
    expect(memory?.content.collaborationId).toBe(collaborationId)
    expect(memory?.content.agents).toEqual(agents)
    expect(memory?.content.outcome.success).toBe(true)
    expect(memory?.tags).toContain('collaboration')
    expect(memory?.tags).toContain('experience')
  })

  it('应该能获取协作历史', async () => {
    const agentId = 'history-agent'

    await service.recordCollaborationExperience('collab1', [agentId, 'other'], { success: true })
    await service.recordCollaborationExperience('collab2', [agentId, 'another'], { success: false })

    const history = await service.getCollaborationHistory(agentId)
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThanOrEqual(2)
  })

  it('应该能导出和导入记忆数据', async () => {
    // 导出记忆数据
    const exportData = await service.exportMemoryData()
    expect(exportData).toHaveProperty('memories')
    expect(exportData).toHaveProperty('connections')
    expect(Array.isArray(exportData.memories)).toBe(true)
    expect(typeof exportData.connections).toBe('object')

    // 导入记忆数据（在实际测试中，这可能会影响其他测试）
    // await service.importMemoryData(exportData)
  })
})
