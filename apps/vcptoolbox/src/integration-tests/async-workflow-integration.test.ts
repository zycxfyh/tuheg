// ============================================================================
// 异步工作流引擎集成测试
// 验证 VCPToolBox 工作流编排能力的正确集成
// ============================================================================

import { ConfigService } from '@nestjs/config'
import { Test, type TestingModule } from '@nestjs/testing'
import { AsyncWorkflowService } from '@tuheg/ai-domain'

describe('AsyncWorkflowService Integration', () => {
  let service: AsyncWorkflowService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncWorkflowService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                WORKFLOW_MAX_CONCURRENT: 10,
                WORKFLOW_DEFAULT_TIMEOUT: 300000,
                WORKFLOW_CLEANUP_INTERVAL: 24,
                WORKFLOW_STATS_INTERVAL: 5,
              }
              return config[key] || defaultValue
            }),
          },
        },
      ],
    }).compile()

    service = module.get<AsyncWorkflowService>(AsyncWorkflowService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('应该能获取工作流统计信息', () => {
    const stats = service.getWorkflowStats()

    expect(stats).toHaveProperty('templates')
    expect(stats).toHaveProperty('instances')
    expect(stats).toHaveProperty('runningInstances')
    expect(stats).toHaveProperty('queuedInstances')
    expect(stats).toHaveProperty('nodeExecutors')
    expect(typeof stats.templates).toBe('number')
  })

  it('应该能执行健康检查', async () => {
    const health = await service.healthCheck()

    expect(health).toHaveProperty('status')
    expect(['healthy', 'warning', 'error']).toContain(health.status)

    if (health.status !== 'error') {
      expect(health).toHaveProperty('details')
      expect(health.details).toHaveProperty('stats')
      expect(health.details).toHaveProperty('activeWorkflows')
    }
  })

  it('应该能获取工作流性能指标', () => {
    const metrics = service.getWorkflowMetrics()

    expect(metrics).toHaveProperty('templates')
    expect(metrics).toHaveProperty('activeWorkflows')
    expect(metrics).toHaveProperty('averageCompletionTime')
    expect(metrics).toHaveProperty('successRate')
    expect(metrics).toHaveProperty('resourceUtilization')
  })

  it('应该能获取可用模板列表', () => {
    const templates = service.getAvailableTemplates()

    expect(Array.isArray(templates)).toBe(true)
    expect(templates.length).toBeGreaterThan(0)

    // 检查是否包含预期的模板
    const templateNames = templates.map((t) => t.name)
    expect(templateNames).toContain('故事创作工作流')
    expect(templateNames).toContain('角色开发工作流')
    expect(templateNames).toContain('世界构建工作流')
    expect(templateNames).toContain('多模态叙事工作流')

    templates.forEach((template) => {
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('tags')
      expect(Array.isArray(template.tags)).toBe(true)
    })
  })

  it('应该能获取模板详情', () => {
    const templates = service.getAvailableTemplates()
    const firstTemplate = templates[0]

    const details = service.getTemplateDetails(firstTemplate.id)
    expect(details).not.toBeNull()
    expect(details?.id).toBe(firstTemplate.id)
    expect(details?.name).toBe(firstTemplate.name)
    expect(details).toHaveProperty('nodes')
    expect(details).toHaveProperty('connections')
    expect(details).toHaveProperty('defaultConfig')
    expect(Array.isArray(details?.nodes)).toBe(true)
  })

  it('应该能创建故事创作工作流', async () => {
    const storyId = 'test-story-workflow'
    const userPrompt = '写一个关于太空探索的故事'

    const workflowId = await service.createStoryCreationWorkflow(storyId, userPrompt, {
      genre: 'sci-fi',
      length: 'medium',
      characters: 3,
    })

    expect(typeof workflowId).toBe('string')
    expect(workflowId.length).toBeGreaterThan(0)

    // 验证工作流状态
    const status = service.getWorkflowStatus(workflowId)
    expect(status).not.toBeNull()
    expect(status?.name).toContain('故事创作')
    expect(status?.status).toBe('running') // 应该自动启动
  })

  it('应该能创建角色开发工作流', async () => {
    const characterId = 'test-character-workflow'
    const characterConcept = '一个勇敢的年轻探险家'

    const workflowId = await service.createCharacterDevelopmentWorkflow(
      characterId,
      characterConcept,
      {
        archetype: 'hero',
        complexity: 'detailed',
      }
    )

    expect(typeof workflowId).toBe('string')

    const status = service.getWorkflowStatus(workflowId)
    expect(status).not.toBeNull()
    expect(status?.name).toContain('角色开发')
    expect(status?.status).toBe('running')
  })

  it('应该能创建世界构建工作流', async () => {
    const worldId = 'test-world-workflow'
    const worldConcept = '一个魔法与科技并存的奇幻世界'

    const workflowId = await service.createWorldBuildingWorkflow(worldId, worldConcept, {
      scope: 'large',
      genre: 'fantasy',
      technologyLevel: 'magitech',
      magicLevel: 'high',
    })

    expect(typeof workflowId).toBe('string')

    const status = service.getWorkflowStatus(workflowId)
    expect(status).not.toBeNull()
    expect(status?.name).toContain('世界构建')
    expect(status?.status).toBe('running')
  })

  it('应该能创建多模态叙事工作流', async () => {
    const narrativeId = 'test-multimodal-workflow'
    const script = '从前有一个勇敢的小孩，他决定探索未知的世界...'

    const workflowId = await service.createMultimodalNarrativeWorkflow(narrativeId, script, [
      'text',
      'image',
      'audio',
    ])

    expect(typeof workflowId).toBe('string')

    const status = service.getWorkflowStatus(workflowId)
    expect(status).not.toBeNull()
    expect(status?.name).toContain('多模态叙事')
    expect(status?.status).toBe('running')
  })

  it('应该能管理工作流生命周期', async () => {
    // 创建一个简单的工作流用于测试
    const storyId = 'lifecycle-test'
    const workflowId = await service.createStoryCreationWorkflow(storyId, '测试生命周期')

    // 验证初始状态
    let status = service.getWorkflowStatus(workflowId)
    expect(status?.status).toBe('running')

    // 暂停工作流
    await service.pauseWorkflow(workflowId)
    status = service.getWorkflowStatus(workflowId)
    expect(status?.status).toBe('paused')

    // 恢复工作流
    await service.resumeWorkflow(workflowId)
    status = service.getWorkflowStatus(workflowId)
    expect(status?.status).toBe('running')

    // 取消工作流
    await service.cancelWorkflow(workflowId, '测试取消')
    status = service.getWorkflowStatus(workflowId)
    expect(status?.status).toBe('cancelled')
  })

  it('应该能创建条件分支工作流', async () => {
    const conditions = [
      {
        condition: 'inputData.genre === "fantasy"',
        workflowTemplate: 'story-creation',
        parameters: { genre: 'fantasy' },
      },
      {
        condition: 'inputData.genre === "sci-fi"',
        workflowTemplate: 'story-creation',
        parameters: { genre: 'sci-fi' },
      },
    ]

    const workflowId = await service.createConditionalWorkflow('条件故事创作', conditions)

    expect(typeof workflowId).toBe('string')

    const status = service.getWorkflowStatus(workflowId)
    expect(status).not.toBeNull()
    expect(status?.name).toContain('条件工作流')
  })

  it('应该能获取活跃工作流列表', () => {
    const activeWorkflows = service.getActiveWorkflows()
    expect(Array.isArray(activeWorkflows)).toBe(true)
    // 当前实现可能返回空数组，取决于实际运行的工作流
  })

  it('应该能清理已完成的工作流', async () => {
    const cleaned = await service.cleanupCompletedWorkflows(0) // 清理所有已完成的
    expect(typeof cleaned).toBe('number')
    expect(cleaned).toBeGreaterThanOrEqual(0)
  })

  it('应该能创建基于模板的工作流实例', async () => {
    const templates = service.getAvailableTemplates()
    const storyTemplate = templates.find((t) => t.name === '故事创作工作流')

    expect(storyTemplate).toBeDefined()

    const workflowId = await service.createWorkflowFromTemplate(
      'story-creation',
      '基于模板的故事',
      {
        priority: 'high',
        inputData: { customPrompt: '测试模板实例化' },
      }
    )

    expect(typeof workflowId).toBe('string')

    const status = service.getWorkflowStatus(workflowId)
    expect(status).not.toBeNull()
    expect(status?.name).toBe('基于模板的故事')
  })

  it('应该能创建自定义工作流', async () => {
    const customTemplate = {
      name: '自定义测试工作流',
      description: '用于测试的简单工作流',
      version: '1.0.0',
      nodes: [
        {
          id: 'start-node',
          type: 'task' as const,
          name: '开始任务',
          description: '工作流的起始任务',
          config: { taskType: 'test' },
          inputs: [],
          outputs: [{ id: 'start-out', sourceNodeId: 'start-node', targetNodeId: 'end-node' }],
          status: 'pending' as const,
          retryCount: 0,
          maxRetries: 1,
          timeout: 30000,
        },
        {
          id: 'end-node',
          type: 'task' as const,
          name: '结束任务',
          description: '工作流的结束任务',
          config: { taskType: 'test' },
          inputs: [{ id: 'end-in', sourceNodeId: 'start-node', targetNodeId: 'end-node' }],
          outputs: [],
          status: 'pending' as const,
          retryCount: 0,
          maxRetries: 1,
          timeout: 30000,
          dependencies: ['start-node'],
        },
      ],
      connections: [],
      defaultConfig: {
        maxRetries: 1,
        timeout: 60000,
        priority: 'normal' as const,
      },
      tags: ['test', 'custom'],
    }

    const workflowId = await service.createCustomWorkflow(customTemplate, '自定义工作流测试')

    expect(typeof workflowId).toBe('string')

    const status = service.getWorkflowStatus(workflowId)
    expect(status).not.toBeNull()
    expect(status?.name).toBe('自定义工作流测试')
  })

  it('应该正确配置工作流参数', () => {
    expect(configService.get).toHaveBeenCalledWith('WORKFLOW_MAX_CONCURRENT', 10)
    expect(configService.get).toHaveBeenCalledWith('WORKFLOW_DEFAULT_TIMEOUT', 300000)
  })
})
