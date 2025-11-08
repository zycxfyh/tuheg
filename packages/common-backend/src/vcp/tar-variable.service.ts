// ============================================================================
// Tar* 变量系统集成服务
// 集成 VCPToolBox 的动态配置和环境感知能力
// ============================================================================

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  type TarVariable,
  tarVariableManager,
  type VariableContext,
} from '../../../apps/vcptoolbox/src/modules/core/TarVariableSystem'

@Injectable()
export class TarVariableService implements OnModuleInit {
  private readonly logger = new Logger(TarVariableService.name)

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeSystemVariables()
    this.setupDynamicUpdates()
    this.logger.log('Tar* 变量系统已初始化')
  }

  // ==================== 系统变量初始化 ====================

  /**
   * 初始化系统变量
   */
  private async initializeSystemVariables(): Promise<void> {
    // 时间相关变量
    await this.registerSystemVariable({
      name: 'VarTimeNow',
      value: () => new Date().toLocaleString('zh-CN'),
      type: 'dynamic',
      scope: 'global',
      dependencies: [],
      metadata: {
        description: '当前时间（中文格式）',
        author: 'system',
        tags: ['time', 'system', 'narrative'],
      },
    })

    // 位置相关变量（简化实现，实际应该调用地理位置API）
    await this.registerSystemVariable({
      name: 'VarCity',
      value: this.configService.get('DEFAULT_CITY', '北京市'),
      type: 'dynamic',
      scope: 'global',
      dependencies: [],
      updater: async () => {
        // 实际实现中应该调用地理位置服务
        return this.configService.get('DEFAULT_CITY', '北京市')
      },
      metadata: {
        description: '当前位置城市',
        author: 'system',
        tags: ['location', 'system', 'narrative'],
      },
    })

    // 天气信息变量
    await this.registerSystemVariable({
      name: 'VCPWeatherInfo',
      value: '晴天，温度适中',
      type: 'dynamic',
      scope: 'global',
      dependencies: ['VarCity'],
      updater: async (context: VariableContext) => {
        const city = await this.getVariableValue('VarCity', context)
        // 实际实现中应该调用天气API
        return `${city} - 晴天，温度20-25°C，适合创作`
      },
      metadata: {
        description: '天气信息，用于叙事环境设定',
        author: 'system',
        tags: ['weather', 'system', 'narrative'],
      },
    })

    // 用户相关变量
    await this.registerSystemVariable({
      name: 'UserName',
      value: '创作者',
      type: 'dynamic',
      scope: 'session',
      dependencies: [],
      metadata: {
        description: '当前用户名称',
        author: 'system',
        tags: ['user', 'session', 'narrative'],
      },
    })

    // 创作风格变量
    await this.registerSystemVariable({
      name: 'NarrativeStyle',
      value: this.configService.get('DEFAULT_NARRATIVE_STYLE', '现代现实主义'),
      type: 'dynamic',
      scope: 'session',
      dependencies: [],
      metadata: {
        description: '当前叙事风格',
        author: 'system',
        tags: ['narrative', 'style', 'session'],
      },
    })

    // AI模型配置变量
    await this.registerSystemVariable({
      name: 'AIModelConfig',
      value: {
        provider: this.configService.get('AI_PROVIDER', 'openai'),
        model: this.configService.get('AI_MODEL', 'gpt-4'),
        temperature: 0.7,
        maxTokens: 2000,
      },
      type: 'static',
      scope: 'global',
      dependencies: [],
      metadata: {
        description: 'AI模型配置参数',
        author: 'system',
        tags: ['ai', 'config', 'model'],
      },
    })

    // 故事世界设定变量
    await this.registerSystemVariable({
      name: 'WorldSetting',
      value: '现代都市',
      type: 'dynamic',
      scope: 'session',
      dependencies: [],
      metadata: {
        description: '当前故事世界设定',
        author: 'system',
        tags: ['world', 'setting', 'narrative'],
      },
    })

    // 角色性格模板变量
    await this.registerSystemVariable({
      name: 'CharacterTemplate',
      value: 'balanced',
      type: 'dynamic',
      scope: 'task',
      dependencies: [],
      metadata: {
        description: '角色性格模板',
        author: 'system',
        tags: ['character', 'template', 'narrative'],
      },
    })

    // 工具列表变量（VCP兼容）
    await this.registerSystemVariable({
      name: 'VarToolList',
      value:
        '文生图工具{{VCPFluxGen}},对话生成工具{{VCPDialogueGen}},情感分析工具{{VCPEmotionAnalyzer}}',
      type: 'computed',
      scope: 'agent',
      dependencies: ['VCPFluxGen', 'VCPDialogueGen', 'VCPEmotionAnalyzer'],
      metadata: {
        description: '可用工具列表（VCP格式）',
        author: 'system',
        tags: ['tools', 'vcp', 'agent'],
      },
    })
  }

  // ==================== 变量管理接口 ====================

  /**
   * 注册系统变量
   */
  private async registerSystemVariable(variable: Omit<TarVariable, 'metadata'>): Promise<void> {
    try {
      tarVariableManager.registerVariable(variable)
      this.logger.debug(`系统变量已注册: ${variable.name}`)
    } catch (error) {
      this.logger.error(`注册系统变量失败 ${variable.name}:`, error)
    }
  }

  /**
   * 获取变量值
   */
  async getVariableValue(name: string, context?: VariableContext): Promise<any> {
    try {
      return await tarVariableManager.getVariableValue(name, context)
    } catch (error) {
      this.logger.warn(`获取变量值失败 ${name}:`, error)
      return null
    }
  }

  /**
   * 设置变量值
   */
  async setVariableValue(name: string, value: any, context?: VariableContext): Promise<void> {
    try {
      tarVariableManager.setVariableValue(name, value, context)
      this.logger.debug(`变量值已设置: ${name} = ${value}`)
    } catch (error) {
      this.logger.error(`设置变量值失败 ${name}:`, error)
      throw error
    }
  }

  /**
   * 批量获取变量值
   */
  async getMultipleValues(
    names: string[],
    context?: VariableContext
  ): Promise<Record<string, any>> {
    return await tarVariableManager.getMultipleValues(names, context)
  }

  /**
   * 处理嵌套变量替换
   */
  async processNestedVariables(template: string, context?: VariableContext): Promise<string> {
    try {
      return await tarVariableManager.processNestedVariables(template, context)
    } catch (error) {
      this.logger.warn(`变量替换失败:`, error)
      return template // 返回原模板
    }
  }

  /**
   * 监听变量变化
   */
  watchVariable(name: string, callback: (variable: TarVariable) => void): () => void {
    return tarVariableManager.watchVariable(name, callback)
  }

  // ==================== 动态更新设置 ====================

  /**
   * 设置动态更新
   */
  private setupDynamicUpdates(): void {
    // 设置时间变量的定期更新
    setInterval(async () => {
      try {
        await this.updateTimeVariables()
      } catch (error) {
        this.logger.error('更新时间变量失败:', error)
      }
    }, 60000) // 每分钟更新

    // 设置用户状态变量的监听
    this.watchVariable('UserName', (variable) => {
      this.logger.debug(`用户名已更新: ${variable.value}`)
      // 触发相关变量的重新计算
      tarVariableManager.triggerVariableUpdate('NarrativeStyle')
    })

    // 设置世界设定变化的监听
    this.watchVariable('WorldSetting', async (variable) => {
      this.logger.debug(`世界设定已更新: ${variable.value}`)
      // 根据世界设定调整相关变量
      await this.adjustVariablesForWorldSetting(variable.value)
    })
  }

  /**
   * 更新时间相关变量
   */
  private async updateTimeVariables(): Promise<void> {
    const now = new Date()
    const context: VariableContext = {
      environment: { timestamp: now.getTime() },
      timestamp: now,
    }

    // 触发时间变量更新
    tarVariableManager.triggerVariableUpdate('VarTimeNow', context)
    tarVariableManager.triggerVariableUpdate('VCPWeatherInfo', context)
  }

  /**
   * 根据世界设定调整变量
   */
  private async adjustVariablesForWorldSetting(worldSetting: string): Promise<void> {
    const settingAdjustments: Record<string, any> = {
      现代都市: {
        narrativeStyle: '现实主义',
        characterTemplate: 'urban-professional',
      },
      奇幻世界: {
        narrativeStyle: '奇幻史诗',
        characterTemplate: 'heroic-fantasy',
      },
      科幻未来: {
        narrativeStyle: '赛博朋克',
        characterTemplate: 'cybernetic-enhanced',
      },
      历史古代: {
        narrativeStyle: '古典文学',
        characterTemplate: 'historical-figure',
      },
    }

    const adjustments = settingAdjustments[worldSetting]
    if (adjustments) {
      await this.setVariableValue('NarrativeStyle', adjustments.narrativeStyle)
      await this.setVariableValue('CharacterTemplate', adjustments.characterTemplate)
    }
  }

  // ==================== 叙事专用接口 ====================

  /**
   * 为故事生成准备变量上下文
   */
  async prepareNarrativeContext(storyId: string, userId?: string): Promise<VariableContext> {
    const context: VariableContext = {
      agentId: `narrative-agent-${storyId}`,
      sessionId: storyId,
      userId,
      environment: {},
      timestamp: new Date(),
    }

    // 获取相关变量值
    const [timeNow, city, weather, userName, narrativeStyle, worldSetting, characterTemplate] =
      await Promise.all([
        this.getVariableValue('VarTimeNow', context),
        this.getVariableValue('VarCity', context),
        this.getVariableValue('VCPWeatherInfo', context),
        this.getVariableValue('UserName', context),
        this.getVariableValue('NarrativeStyle', context),
        this.getVariableValue('WorldSetting', context),
        this.getVariableValue('CharacterTemplate', context),
      ])

    context.environment = {
      timeNow,
      city,
      weather,
      userName,
      narrativeStyle,
      worldSetting,
      characterTemplate,
    }

    return context
  }

  /**
   * 生成叙事提示词
   */
  async generateNarrativePrompt(basePrompt: string, context?: VariableContext): Promise<string> {
    const fullContext = context || (await this.prepareNarrativeContext('default'))

    // 构建增强的提示词
    const enhancedPrompt = `
当前环境信息：
- 时间：{{VarTimeNow}}
- 地点：{{VarCity}}
- 天气：{{VCPWeatherInfo}}
- 用户：{{UserName}}
- 叙事风格：{{NarrativeStyle}}
- 世界设定：{{WorldSetting}}
- 角色模板：{{CharacterTemplate}}

原始创作需求：${basePrompt}

请基于以上环境信息，创作符合当前设定和风格的故事内容。
`

    return await this.processNestedVariables(enhancedPrompt, fullContext)
  }

  /**
   * 更新用户创作偏好
   */
  async updateUserPreferences(
    userId: string,
    preferences: {
      narrativeStyle?: string
      worldSetting?: string
      characterTemplate?: string
    }
  ): Promise<void> {
    const context: VariableContext = {
      userId,
      environment: {},
      timestamp: new Date(),
    }

    if (preferences.narrativeStyle) {
      await this.setVariableValue('NarrativeStyle', preferences.narrativeStyle, context)
    }

    if (preferences.worldSetting) {
      await this.setVariableValue('WorldSetting', preferences.worldSetting, context)
    }

    if (preferences.characterTemplate) {
      await this.setVariableValue('CharacterTemplate', preferences.characterTemplate, context)
    }

    this.logger.log(`用户偏好已更新: ${userId}`)
  }

  // ==================== 工具集成接口 ====================

  /**
   * 获取工具配置
   */
  async getToolConfig(toolName: string): Promise<any> {
    const toolConfig = await this.getVariableValue(`VCP${toolName}`)
    return toolConfig || null
  }

  /**
   * 注册工具变量
   */
  async registerToolVariable(toolName: string, config: any): Promise<void> {
    await this.registerSystemVariable({
      name: `VCP${toolName}`,
      value: config,
      type: 'static',
      scope: 'global',
      dependencies: [],
      metadata: {
        description: `${toolName} 工具配置`,
        author: 'system',
        tags: ['tool', 'vcp', 'config'],
      },
    })
  }

  // ==================== 监控和统计 ====================

  /**
   * 获取变量系统统计
   */
  getVariableStats(): any {
    // 这里可以返回变量系统的统计信息
    return {
      totalVariables: 0, // 实际实现中应该从tarVariableManager获取
      activeWatchers: 0,
      recentUpdates: [],
    }
  }

  /**
   * 清理过期变量
   */
  async cleanupExpiredVariables(): Promise<void> {
    // 清理逻辑
    this.logger.log('变量清理完成')
  }
}
