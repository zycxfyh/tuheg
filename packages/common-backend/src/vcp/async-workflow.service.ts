// ============================================================================
// 异步工作流引擎服务集成
// 集成 VCPToolBox 的非线性异步工作流，支持复杂任务编排
// ============================================================================

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  asyncWorkflowEngine,
  WorkflowConnection,
  type WorkflowExecutionOptions,
  type WorkflowInstance,
  WorkflowNode,
  type WorkflowTemplate,
} from '../../../vcptoolbox/src/modules/tools/AsyncWorkflowEngine'

@Injectable()
export class AsyncWorkflowService implements OnModuleInit {
  private readonly logger = new Logger(AsyncWorkflowService.name)
  private predefinedTemplates: Map<string, WorkflowTemplate> = new Map()

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeWorkflowEngine()
    await this.createPredefinedTemplates()
    this.setupEventHandlers()
    this.logger.log('异步工作流引擎已初始化')
  }

  // ==================== 引擎初始化 ====================

  /**
   * 初始化工作流引擎
   */
  private async initializeWorkflowEngine(): Promise<void> {
    // 设置引擎参数
    // 这里可以根据配置调整引擎参数

    this.logger.log('工作流引擎参数已配置')
  }

  /**
   * 创建预定义模板
   */
  private async createPredefinedTemplates(): Promise<void> {
    // 故事创作工作流模板
    await this.createStoryCreationTemplate()

    // 角色开发工作流模板
    await this.createCharacterDevelopmentTemplate()

    // 世界构建工作流模板
    await this.createWorldBuildingTemplate()

    // 多模态叙事工作流模板
    await this.createMultimodalNarrativeTemplate()

    this.logger.log('预定义工作流模板已创建')
  }

  /**
   * 创建故事创作模板
   */
  private async createStoryCreationTemplate(): Promise<string> {
    const template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: '故事创作工作流',
      description: '完整的AI辅助故事创作流程',
      version: '1.0.0',
      nodes: [
        {
          id: 'concept-generation',
          type: 'task',
          name: '创意概念生成',
          description: '基于用户输入生成故事概念',
          config: { taskType: 'ai', model: 'gpt-4', maxTokens: 500 },
          inputs: [],
          outputs: [
            {
              id: 'concept-out',
              sourceNodeId: 'concept-generation',
              targetNodeId: 'logic-validation',
              condition: { type: 'expression', expression: 'true' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          timeout: 60000,
        },
        {
          id: 'logic-validation',
          type: 'task',
          name: '逻辑验证',
          description: '验证故事概念的逻辑一致性',
          config: { taskType: 'ai', analysisType: 'logic' },
          inputs: [
            {
              id: 'logic-in',
              sourceNodeId: 'concept-generation',
              targetNodeId: 'logic-validation',
            },
          ],
          outputs: [
            {
              id: 'logic-valid',
              sourceNodeId: 'logic-validation',
              targetNodeId: 'character-creation',
              condition: { type: 'expression', expression: 'result.isValid === true' },
            },
            {
              id: 'logic-invalid',
              sourceNodeId: 'logic-validation',
              targetNodeId: 'concept-revision',
              condition: { type: 'expression', expression: 'result.isValid === false' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 30000,
          dependencies: ['concept-generation'],
        },
        {
          id: 'concept-revision',
          type: 'task',
          name: '概念修改',
          description: '根据逻辑验证结果修改故事概念',
          config: { taskType: 'ai', revisionType: 'logic-fix' },
          inputs: [
            {
              id: 'revision-in',
              sourceNodeId: 'logic-validation',
              targetNodeId: 'concept-revision',
            },
          ],
          outputs: [
            {
              id: 'revision-out',
              sourceNodeId: 'concept-revision',
              targetNodeId: 'logic-validation',
              condition: { type: 'expression', expression: 'true' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          timeout: 45000,
          dependencies: ['logic-validation'],
        },
        {
          id: 'character-creation',
          type: 'parallel',
          name: '角色创建',
          description: '并行创建多个主要角色',
          config: { tasks: ['protagonist', 'antagonist', 'supporting'] },
          inputs: [
            { id: 'char-in', sourceNodeId: 'logic-validation', targetNodeId: 'character-creation' },
          ],
          outputs: [
            {
              id: 'char-out',
              sourceNodeId: 'character-creation',
              targetNodeId: 'world-building',
              condition: { type: 'expression', expression: 'true' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 120000,
          dependencies: ['logic-validation'],
        },
        {
          id: 'world-building',
          type: 'task',
          name: '世界构建',
          description: '构建故事的世界观和设定',
          config: { taskType: 'ai', worldType: 'comprehensive' },
          inputs: [
            { id: 'world-in', sourceNodeId: 'character-creation', targetNodeId: 'world-building' },
          ],
          outputs: [
            {
              id: 'world-out',
              sourceNodeId: 'world-building',
              targetNodeId: 'plot-structure',
              condition: { type: 'expression', expression: 'true' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 90000,
          dependencies: ['character-creation'],
        },
        {
          id: 'plot-structure',
          type: 'task',
          name: '情节结构设计',
          description: '设计故事的情节框架和转折点',
          config: { taskType: 'ai', structureType: 'three-act' },
          inputs: [
            { id: 'plot-in', sourceNodeId: 'world-building', targetNodeId: 'plot-structure' },
          ],
          outputs: [
            {
              id: 'plot-out',
              sourceNodeId: 'plot-structure',
              targetNodeId: 'content-generation',
              condition: { type: 'expression', expression: 'true' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 75000,
          dependencies: ['world-building'],
        },
        {
          id: 'content-generation',
          type: 'task',
          name: '内容生成',
          description: '生成完整的故事情节内容',
          config: { taskType: 'ai', contentType: 'full-narrative', maxLength: 5000 },
          inputs: [
            {
              id: 'content-in',
              sourceNodeId: 'plot-structure',
              targetNodeId: 'content-generation',
            },
          ],
          outputs: [
            {
              id: 'content-out',
              sourceNodeId: 'content-generation',
              targetNodeId: 'quality-review',
              condition: { type: 'expression', expression: 'true' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          timeout: 300000,
          dependencies: ['plot-structure'],
        },
        {
          id: 'quality-review',
          type: 'task',
          name: '质量审查',
          description: '对生成内容进行质量评估和修改',
          config: { taskType: 'ai', reviewType: 'comprehensive' },
          inputs: [
            { id: 'review-in', sourceNodeId: 'content-generation', targetNodeId: 'quality-review' },
          ],
          outputs: [
            {
              id: 'review-pass',
              sourceNodeId: 'quality-review',
              targetNodeId: 'final-output',
              condition: { type: 'expression', expression: 'result.quality > 0.8' },
            },
            {
              id: 'review-fail',
              sourceNodeId: 'quality-review',
              targetNodeId: 'content-revision',
              condition: { type: 'expression', expression: 'result.quality <= 0.8' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 60000,
          dependencies: ['content-generation'],
        },
        {
          id: 'content-revision',
          type: 'task',
          name: '内容修改',
          description: '根据质量审查结果修改内容',
          config: { taskType: 'ai', revisionType: 'quality-improvement' },
          inputs: [
            { id: 'revision-in', sourceNodeId: 'quality-review', targetNodeId: 'content-revision' },
          ],
          outputs: [
            {
              id: 'revision-out',
              sourceNodeId: 'content-revision',
              targetNodeId: 'quality-review',
              condition: { type: 'expression', expression: 'true' },
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          timeout: 180000,
          dependencies: ['quality-review'],
        },
        {
          id: 'final-output',
          type: 'task',
          name: '最终输出',
          description: '格式化并输出最终的故事',
          config: { taskType: 'format', outputFormat: 'markdown' },
          inputs: [
            { id: 'final-in', sourceNodeId: 'quality-review', targetNodeId: 'final-output' },
          ],
          outputs: [],
          status: 'pending',
          retryCount: 0,
          maxRetries: 1,
          timeout: 30000,
          dependencies: ['quality-review'],
        },
      ],
      connections: [], // 连接已在节点中定义
      defaultConfig: {
        maxRetries: 3,
        timeout: 300000,
        priority: 'high',
      },
      tags: ['story-creation', 'narrative', 'ai-assisted'],
    }

    const templateId = asyncWorkflowEngine.createTemplate(template)
    this.predefinedTemplates.set('story-creation', asyncWorkflowEngine.getTemplate(templateId)!)

    return templateId
  }

  /**
   * 创建角色开发模板
   */
  private async createCharacterDevelopmentTemplate(): Promise<string> {
    // 简化的角色开发模板
    const template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: '角色开发工作流',
      description: '详细的角色塑造和性格发展流程',
      version: '1.0.0',
      nodes: [
        {
          id: 'character-basics',
          type: 'task',
          name: '角色基础设定',
          description: '定义角色的基本属性和背景',
          config: { taskType: 'character', step: 'basics' },
          inputs: [],
          outputs: [
            {
              id: 'basics-out',
              sourceNodeId: 'character-basics',
              targetNodeId: 'personality-analysis',
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 30000,
        },
        {
          id: 'personality-analysis',
          type: 'task',
          name: '性格分析',
          description: '深入分析角色性格特征和动机',
          config: { taskType: 'character', step: 'personality' },
          inputs: [
            {
              id: 'personality-in',
              sourceNodeId: 'character-basics',
              targetNodeId: 'personality-analysis',
            },
          ],
          outputs: [
            {
              id: 'personality-out',
              sourceNodeId: 'personality-analysis',
              targetNodeId: 'development-arc',
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 45000,
          dependencies: ['character-basics'],
        },
        {
          id: 'development-arc',
          type: 'task',
          name: '发展弧线设计',
          description: '设计角色的成长和变化轨迹',
          config: { taskType: 'character', step: 'arc' },
          inputs: [
            { id: 'arc-in', sourceNodeId: 'personality-analysis', targetNodeId: 'development-arc' },
          ],
          outputs: [
            { id: 'arc-out', sourceNodeId: 'development-arc', targetNodeId: 'character-output' },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 60000,
          dependencies: ['personality-analysis'],
        },
        {
          id: 'character-output',
          type: 'task',
          name: '角色资料输出',
          description: '生成完整的角色资料文档',
          config: { taskType: 'format', format: 'character-sheet' },
          inputs: [
            { id: 'output-in', sourceNodeId: 'development-arc', targetNodeId: 'character-output' },
          ],
          outputs: [],
          status: 'pending',
          retryCount: 0,
          maxRetries: 1,
          timeout: 20000,
          dependencies: ['development-arc'],
        },
      ],
      connections: [],
      defaultConfig: {
        maxRetries: 2,
        timeout: 120000,
        priority: 'normal',
      },
      tags: ['character-development', 'personality', 'characterization'],
    }

    const templateId = asyncWorkflowEngine.createTemplate(template)
    this.predefinedTemplates.set(
      'character-development',
      asyncWorkflowEngine.getTemplate(templateId)!
    )

    return templateId
  }

  /**
   * 创建世界构建模板
   */
  private async createWorldBuildingTemplate(): Promise<string> {
    // 简化的世界构建模板
    const template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: '世界构建工作流',
      description: '系统性的世界观和设定构建流程',
      version: '1.0.0',
      nodes: [
        {
          id: 'world-concept',
          type: 'task',
          name: '世界概念设计',
          description: '定义世界的基本概念和规则',
          config: { taskType: 'world', step: 'concept' },
          inputs: [],
          outputs: [
            { id: 'concept-out', sourceNodeId: 'world-concept', targetNodeId: 'setting-details' },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 45000,
        },
        {
          id: 'setting-details',
          type: 'parallel',
          name: '设定细节完善',
          description: '并行完善世界的各个方面设定',
          config: { tasks: ['geography', 'culture', 'magic-system', 'technology'] },
          inputs: [
            { id: 'details-in', sourceNodeId: 'world-concept', targetNodeId: 'setting-details' },
          ],
          outputs: [
            {
              id: 'details-out',
              sourceNodeId: 'setting-details',
              targetNodeId: 'consistency-check',
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 180000,
          dependencies: ['world-concept'],
        },
        {
          id: 'consistency-check',
          type: 'task',
          name: '一致性检查',
          description: '验证世界设定的内部一致性',
          config: { taskType: 'validation', checkType: 'world-consistency' },
          inputs: [
            { id: 'check-in', sourceNodeId: 'setting-details', targetNodeId: 'consistency-check' },
          ],
          outputs: [
            { id: 'check-out', sourceNodeId: 'consistency-check', targetNodeId: 'world-output' },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 60000,
          dependencies: ['setting-details'],
        },
        {
          id: 'world-output',
          type: 'task',
          name: '世界设定输出',
          description: '生成完整的世界设定文档',
          config: { taskType: 'format', format: 'world-bible' },
          inputs: [
            { id: 'output-in', sourceNodeId: 'consistency-check', targetNodeId: 'world-output' },
          ],
          outputs: [],
          status: 'pending',
          retryCount: 0,
          maxRetries: 1,
          timeout: 30000,
          dependencies: ['consistency-check'],
        },
      ],
      connections: [],
      defaultConfig: {
        maxRetries: 2,
        timeout: 150000,
        priority: 'normal',
      },
      tags: ['world-building', 'lore', 'setting', 'world-design'],
    }

    const templateId = asyncWorkflowEngine.createTemplate(template)
    this.predefinedTemplates.set('world-building', asyncWorkflowEngine.getTemplate(templateId)!)

    return templateId
  }

  /**
   * 创建多模态叙事模板
   */
  private async createMultimodalNarrativeTemplate(): Promise<string> {
    // 多模态叙事模板
    const template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: '多模态叙事工作流',
      description: '结合文本、图像、音频的多模态故事创作',
      version: '1.0.0',
      nodes: [
        {
          id: 'text-script',
          type: 'task',
          name: '文本脚本创作',
          description: '创作故事的文本脚本',
          config: { taskType: 'ai', modality: 'text', maxLength: 2000 },
          inputs: [],
          outputs: [
            { id: 'text-out', sourceNodeId: 'text-script', targetNodeId: 'parallel-modality' },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 90000,
        },
        {
          id: 'parallel-modality',
          type: 'parallel',
          name: '多模态内容生成',
          description: '并行生成图像、音频等模态内容',
          config: { tasks: ['image-generation', 'audio-narration', 'music-scoring'] },
          inputs: [
            { id: 'modality-in', sourceNodeId: 'text-script', targetNodeId: 'parallel-modality' },
          ],
          outputs: [
            { id: 'modality-out', sourceNodeId: 'parallel-modality', targetNodeId: 'integration' },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          timeout: 300000,
          dependencies: ['text-script'],
        },
        {
          id: 'integration',
          type: 'task',
          name: '多模态集成',
          description: '将各模态内容整合为连贯的叙事体验',
          config: { taskType: 'integration', integrationType: 'multimodal' },
          inputs: [
            {
              id: 'integration-in',
              sourceNodeId: 'parallel-modality',
              targetNodeId: 'integration',
            },
          ],
          outputs: [
            {
              id: 'integration-out',
              sourceNodeId: 'integration',
              targetNodeId: 'multimodal-output',
            },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 120000,
          dependencies: ['parallel-modality'],
        },
        {
          id: 'multimodal-output',
          type: 'task',
          name: '多模态输出',
          description: '生成最终的多模态叙事作品',
          config: { taskType: 'format', format: 'multimodal-package' },
          inputs: [
            { id: 'output-in', sourceNodeId: 'integration', targetNodeId: 'multimodal-output' },
          ],
          outputs: [],
          status: 'pending',
          retryCount: 0,
          maxRetries: 1,
          timeout: 60000,
          dependencies: ['integration'],
        },
      ],
      connections: [],
      defaultConfig: {
        maxRetries: 3,
        timeout: 480000,
        priority: 'high',
      },
      tags: ['multimodal', 'narrative', 'media', 'integration'],
    }

    const templateId = asyncWorkflowEngine.createTemplate(template)
    this.predefinedTemplates.set(
      'multimodal-narrative',
      asyncWorkflowEngine.getTemplate(templateId)!
    )

    return templateId
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听工作流事件
    asyncWorkflowEngine.on('workflowInstantiated', (workflow) => {
      this.logger.log(`工作流已实例化: ${workflow.id} - ${workflow.name}`)
    })

    asyncWorkflowEngine.on('workflowStarted', (workflow) => {
      this.logger.log(`工作流已启动: ${workflow.id}`)
    })

    asyncWorkflowEngine.on('workflowCompleted', (workflow) => {
      this.logger.log(`工作流已完成: ${workflow.id} (${workflow.metadata.actualDuration}ms)`)
    })

    asyncWorkflowEngine.on('workflowFailed', (workflow) => {
      this.logger.error(`工作流执行失败: ${workflow.id}`)
    })

    asyncWorkflowEngine.on(
      'nodeCompleted',
      (data: { instanceId: string; nodeId: string; result: any }) => {
        this.logger.debug(`工作流节点完成: ${data.nodeId}`)
      }
    )

    asyncWorkflowEngine.on(
      'nodeFailed',
      (data: { instanceId: string; nodeId: string; error: string }) => {
        this.logger.warn(`工作流节点失败: ${data.nodeId}`, data.error)
      }
    )
  }

  // ==================== 工作流管理 ====================

  /**
   * 使用预定义模板创建工作流实例
   */
  async createWorkflowFromTemplate(
    templateName: string,
    name: string,
    options: WorkflowExecutionOptions = {}
  ): Promise<string> {
    const template = this.predefinedTemplates.get(templateName)
    if (!template) {
      throw new Error(`预定义模板 '${templateName}' 不存在`)
    }

    const instanceId = asyncWorkflowEngine.instantiateWorkflow(template.id, name, options)
    this.logger.log(`基于模板 '${templateName}' 创建工作流实例: ${instanceId}`)

    return instanceId
  }

  /**
   * 创建自定义工作流
   */
  async createCustomWorkflow(
    templateData: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    instanceName: string,
    options: WorkflowExecutionOptions = {}
  ): Promise<string> {
    const templateId = asyncWorkflowEngine.createTemplate(templateData)
    const instanceId = asyncWorkflowEngine.instantiateWorkflow(templateId, instanceName, options)

    this.logger.log(`创建自定义工作流: ${instanceId}`)
    return instanceId
  }

  /**
   * 启动工作流
   */
  async startWorkflow(instanceId: string): Promise<void> {
    await asyncWorkflowEngine.startWorkflow(instanceId)
    this.logger.log(`工作流已启动: ${instanceId}`)
  }

  /**
   * 暂停工作流
   */
  async pauseWorkflow(instanceId: string): Promise<void> {
    await asyncWorkflowEngine.pauseWorkflow(instanceId)
    this.logger.log(`工作流已暂停: ${instanceId}`)
  }

  /**
   * 恢复工作流
   */
  async resumeWorkflow(instanceId: string): Promise<void> {
    await asyncWorkflowEngine.resumeWorkflow(instanceId)
    this.logger.log(`工作流已恢复: ${instanceId}`)
  }

  /**
   * 取消工作流
   */
  async cancelWorkflow(instanceId: string, reason?: string): Promise<void> {
    await asyncWorkflowEngine.cancelWorkflow(instanceId, reason)
    this.logger.log(`工作流已取消: ${instanceId}${reason ? ` - ${reason}` : ''}`)
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(instanceId: string): WorkflowInstance | null {
    return asyncWorkflowEngine.getWorkflowStatus(instanceId)
  }

  /**
   * 获取所有活跃工作流
   */
  getActiveWorkflows(): WorkflowInstance[] {
    // 这里需要从引擎获取活跃工作流列表
    // 由于引擎API限制，暂时返回空数组
    return []
  }

  // ==================== 叙事专用工作流 ====================

  /**
   * 创建故事创作工作流
   */
  async createStoryCreationWorkflow(
    storyId: string,
    userPrompt: string,
    options: {
      genre?: string
      length?: 'short' | 'medium' | 'long'
      style?: string
      characters?: number
    } = {}
  ): Promise<string> {
    const workflowName = `故事创作: ${storyId}`

    const workflowOptions: WorkflowExecutionOptions = {
      priority: 'high',
      variables: {
        storyId,
        userPrompt,
        genre: options.genre || 'fantasy',
        length: options.length || 'medium',
        style: options.style || 'narrative',
        characterCount: options.characters || 3,
      },
      inputData: {
        prompt: userPrompt,
        requirements: options,
      },
    }

    const instanceId = await this.createWorkflowFromTemplate(
      'story-creation',
      workflowName,
      workflowOptions
    )

    // 自动启动工作流
    await this.startWorkflow(instanceId)

    return instanceId
  }

  /**
   * 创建角色开发工作流
   */
  async createCharacterDevelopmentWorkflow(
    characterId: string,
    characterConcept: string,
    options: {
      archetype?: string
      complexity?: 'simple' | 'detailed' | 'complex'
      background?: any
    } = {}
  ): Promise<string> {
    const workflowName = `角色开发: ${characterId}`

    const workflowOptions: WorkflowExecutionOptions = {
      priority: 'normal',
      variables: {
        characterId,
        characterConcept,
        archetype: options.archetype || 'hero',
        complexity: options.complexity || 'detailed',
      },
      inputData: {
        concept: characterConcept,
        options: options,
      },
    }

    const instanceId = await this.createWorkflowFromTemplate(
      'character-development',
      workflowName,
      workflowOptions
    )
    await this.startWorkflow(instanceId)

    return instanceId
  }

  /**
   * 创建世界构建工作流
   */
  async createWorldBuildingWorkflow(
    worldId: string,
    worldConcept: string,
    options: {
      scope?: 'small' | 'medium' | 'large'
      genre?: string
      technologyLevel?: string
      magicLevel?: string
    } = {}
  ): Promise<string> {
    const workflowName = `世界构建: ${worldId}`

    const workflowOptions: WorkflowExecutionOptions = {
      priority: 'normal',
      variables: {
        worldId,
        worldConcept,
        scope: options.scope || 'medium',
        genre: options.genre || 'fantasy',
        technologyLevel: options.technologyLevel || 'medieval',
        magicLevel: options.magicLevel || 'high',
      },
      inputData: {
        concept: worldConcept,
        options: options,
      },
    }

    const instanceId = await this.createWorkflowFromTemplate(
      'world-building',
      workflowName,
      workflowOptions
    )
    await this.startWorkflow(instanceId)

    return instanceId
  }

  /**
   * 创建多模态叙事工作流
   */
  async createMultimodalNarrativeWorkflow(
    narrativeId: string,
    script: string,
    modalities: ('text' | 'image' | 'audio' | 'video')[] = ['text', 'image']
  ): Promise<string> {
    const workflowName = `多模态叙事: ${narrativeId}`

    const workflowOptions: WorkflowExecutionOptions = {
      priority: 'high',
      variables: {
        narrativeId,
        modalities: modalities.join(','),
      },
      inputData: {
        script,
        modalities,
      },
    }

    const instanceId = await this.createWorkflowFromTemplate(
      'multimodal-narrative',
      workflowName,
      workflowOptions
    )
    await this.startWorkflow(instanceId)

    return instanceId
  }

  // ==================== 工作流监控 ====================

  /**
   * 获取工作流统计信息
   */
  getWorkflowStats(): any {
    return asyncWorkflowEngine.getEngineStats()
  }

  /**
   * 获取工作流性能指标
   */
  getWorkflowMetrics(): any {
    const stats = this.getWorkflowStats()
    const activeWorkflows = this.getActiveWorkflows()

    return {
      ...stats,
      activeWorkflows: activeWorkflows.length,
      averageCompletionTime: this.calculateAverageCompletionTime(activeWorkflows),
      successRate: this.calculateSuccessRate(activeWorkflows),
      resourceUtilization: this.calculateResourceUtilization(),
    }
  }

  /**
   * 计算平均完成时间
   */
  private calculateAverageCompletionTime(workflows: WorkflowInstance[]): number {
    const completedWorkflows = workflows.filter(
      (w) => w.status === 'completed' && w.metadata.actualDuration
    )

    if (completedWorkflows.length === 0) return 0

    const totalTime = completedWorkflows.reduce(
      (sum, w) => sum + (w.metadata.actualDuration || 0),
      0
    )
    return totalTime / completedWorkflows.length
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(workflows: WorkflowInstance[]): number {
    if (workflows.length === 0) return 0

    const successful = workflows.filter((w) => w.status === 'completed').length
    return successful / workflows.length
  }

  /**
   * 计算资源利用率
   */
  private calculateResourceUtilization(): any {
    // 简化的资源利用率计算
    const stats = this.getWorkflowStats()

    return {
      executorUtilization: stats.runningInstances / Math.max(stats.nodeExecutors, 1),
      queueUtilization: stats.queuedInstances / Math.max(stats.maxConcurrentExecutions || 10, 1),
      memoryEfficiency: 0.85, // 模拟值
    }
  }

  // ==================== 模板管理 ====================

  /**
   * 获取可用模板列表
   */
  getAvailableTemplates(): Array<{
    id: string
    name: string
    description: string
    tags: string[]
  }> {
    return Array.from(this.predefinedTemplates.values()).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      tags: template.tags,
    }))
  }

  /**
   * 获取模板详情
   */
  getTemplateDetails(templateId: string): WorkflowTemplate | null {
    return asyncWorkflowEngine.getTemplate(templateId)
  }

  // ==================== 高级功能 ====================

  /**
   * 创建条件分支工作流
   */
  async createConditionalWorkflow(
    name: string,
    conditions: Array<{
      condition: string
      workflowTemplate: string
      parameters: any
    }>
  ): Promise<string> {
    // 创建一个决策节点，根据条件选择不同的子工作流
    const template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `条件工作流: ${name}`,
      description: '基于条件动态选择执行路径的工作流',
      version: '1.0.0',
      nodes: [
        {
          id: 'decision',
          type: 'decision',
          name: '条件判断',
          description: '评估条件并选择执行路径',
          config: { conditions },
          inputs: [],
          outputs: conditions.map((cond, index) => ({
            id: `branch-${index}`,
            sourceNodeId: 'decision',
            targetNodeId: `subworkflow-${index}`,
            condition: { type: 'expression', expression: cond.condition },
          })),
          status: 'pending',
          retryCount: 0,
          maxRetries: 1,
          timeout: 30000,
        },
        ...conditions.map((cond, index) => ({
          id: `subworkflow-${index}`,
          type: 'subprocess',
          name: `子工作流 ${index + 1}`,
          description: `执行 ${cond.workflowTemplate} 模板`,
          config: {
            subTemplate: cond.workflowTemplate,
            parameters: cond.parameters,
          },
          inputs: [
            {
              id: `input-${index}`,
              sourceNodeId: 'decision',
              targetNodeId: `subworkflow-${index}`,
            },
          ],
          outputs: [
            { id: `output-${index}`, sourceNodeId: `subworkflow-${index}`, targetNodeId: 'merge' },
          ],
          status: 'pending',
          retryCount: 0,
          maxRetries: 2,
          timeout: 300000,
          dependencies: ['decision'],
        })),
        {
          id: 'merge',
          type: 'gateway',
          name: '结果合并',
          description: '合并各分支的执行结果',
          config: { gatewayType: 'exclusive' },
          inputs: conditions.map((_, index) => ({
            id: `merge-input-${index}`,
            sourceNodeId: `subworkflow-${index}`,
            targetNodeId: 'merge',
          })),
          outputs: [],
          status: 'pending',
          retryCount: 0,
          maxRetries: 1,
          timeout: 30000,
          dependencies: conditions.map((_, index) => `subworkflow-${index}`),
        },
      ],
      connections: [],
      defaultConfig: {
        maxRetries: 2,
        timeout: 600000,
        priority: 'normal',
      },
      tags: ['conditional', 'dynamic', 'branching'],
    }

    const instanceId = await this.createCustomWorkflow(template, name)
    return instanceId
  }

  // ==================== 健康检查和维护 ====================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      const stats = this.getWorkflowStats()
      const activeWorkflows = this.getActiveWorkflows()

      const issues = []

      // 检查是否有长时间运行的工作流
      const longRunning = activeWorkflows.filter((w) => {
        if (!w.startTime) return false
        const runtime = Date.now() - w.startTime.getTime()
        return runtime > 30 * 60 * 1000 // 30分钟
      })

      if (longRunning.length > 0) {
        issues.push(`${longRunning.length} 个工作流运行时间过长`)
      }

      // 检查队列积压
      if (stats.queuedInstances > 10) {
        issues.push(`工作流队列积压: ${stats.queuedInstances} 个实例`)
      }

      return {
        status: issues.length > 0 ? 'warning' : 'healthy',
        details: {
          stats,
          activeWorkflows: activeWorkflows.length,
          issues,
        },
      }
    } catch (error: any) {
      return {
        status: 'error',
        details: error.message,
      }
    }
  }

  /**
   * 清理已完成的工作流
   */
  async cleanupCompletedWorkflows(olderThanHours: number = 24): Promise<number> {
    const cleaned = asyncWorkflowEngine.cleanupCompletedInstances(olderThanHours)
    this.logger.log(`清理了 ${cleaned} 个过期的工作流实例`)
    return cleaned
  }
}
