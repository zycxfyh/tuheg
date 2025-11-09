/**
 * 创世星环 - 叙事逻辑插件
 * 智能叙事结构分析和情节设计工具
 */

const axios = require('axios')
const winston = require('winston')

// 创世星环叙事逻辑插件
class NarrativeLogic {
  constructor() {
    this.name = 'NarrativeLogic'
    this.description = '智能叙事结构分析和情节设计工具'
    this.version = '1.0.0'
    this.author = 'Creation Ring Team'

    // 支持的工具
    this.tools = {
      structure: this.analyzeStructure.bind(this),
      plot: this.designPlot.bind(this),
      conflict: this.createConflict.bind(this),
      pacing: this.optimizePacing.bind(this),
      arc: this.buildCharacterArc.bind(this),
      theme: this.developTheme.bind(this),
      foreshadowing: this.addForeshadowing.bind(this),
    }

    // 配置
    this.config = {
      model: process.env.NARRATIVE_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.MAX_NARRATIVE_TOKENS || '2500', 10),
      temperature: 0.7,
      apiUrl: process.env.API_URL || 'https://api.openai.com/v1',
      apiKey: process.env.API_KEY,
    }

    // 日志器
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [NarrativeLogic] ${level.toUpperCase()}: ${message}`
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/narrative-logic.log',
        }),
      ],
    })

    // 经典叙事结构模板
    this.narrativeTemplates = {
      hero_journey: {
        name: '英雄之旅',
        stages: [
          '平凡世界',
          '冒险召唤',
          '拒绝召唤',
          '导师相遇',
          '跨越门槛',
          '考验与敌人',
          '接近最深处洞穴',
          '严峻考验',
          '获得报酬',
          '归途之路',
          '复活',
          '凯旋归来',
        ],
      },
      three_act: {
        name: '三幕结构',
        stages: ['设定', '冲突', '高潮建立', '高潮', '结局'],
      },
      save_cat: {
        name: '拯救猫咪',
        stages: [
          '开端设定',
          '引出问题',
          '英雄拒绝',
          '导师指导',
          '冒险开始',
          '盟友敌人',
          '接近目标',
          '严峻挑战',
          '最终对决',
          '黑暗时刻',
          '终极牺牲',
          '大团圆结局',
        ],
      },
    }
  }

  /**
   * VCP插件初始化
   */
  async initialize(vcpContext) {
    this.vcp = vcpContext
    this.logger.info('叙事逻辑插件初始化完成')
  }

  /**
   * 处理工具调用
   */
  async processToolCall(toolName, parameters, sessionId) {
    this.logger.info(`处理工具调用: ${toolName}`, { parameters, sessionId })

    if (!this.tools[toolName]) {
      throw new Error(`未知工具: ${toolName}`)
    }

    try {
      const result = await this.tools[toolName](parameters, sessionId)
      this.logger.info(`工具调用完成: ${toolName}`)
      return result
    } catch (error) {
      this.logger.error(`工具调用失败: ${toolName}`, error)
      throw error
    }
  }

  /**
   * 分析叙事结构
   */
  async analyzeStructure(parameters, _sessionId) {
    const {
      story,
      analysisType = 'comprehensive',
      focusAreas = ['plot', 'character', 'theme', 'pacing'],
    } = parameters

    this.logger.info('分析叙事结构', { analysisType, focusAreas })

    const analysisPrompt = this.buildStructureAnalysisPrompt({
      story,
      analysisType,
      focusAreas,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个专业的叙事分析师。请从结构、情节、人物、主题等多个维度分析故事。',
      userPrompt: analysisPrompt,
      maxTokens: this.config.maxTokens,
    })

    const analysis = this.parseStructureAnalysis(aiResponse, analysisType)

    return {
      success: true,
      analysis,
      metadata: {
        analyzedAt: new Date(),
        analysisType,
        focusAreas,
      },
    }
  }

  /**
   * 设计情节
   */
  async designPlot(parameters, _sessionId) {
    const {
      premise,
      genre = 'general',
      structure = 'three_act',
      complexity = 'medium',
      keyElements = [],
      desiredEnding = 'satisfying',
    } = parameters

    this.logger.info('设计情节', { premise: premise.substring(0, 50), genre, structure })

    const plotPrompt = this.buildPlotDesignPrompt({
      premise,
      genre,
      structure,
      complexity,
      keyElements,
      desiredEnding,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个专业的情节设计师。请根据要求设计完整、吸引人的故事情节。',
      userPrompt: plotPrompt,
      maxTokens: this.config.maxTokens,
    })

    const plot = this.parsePlotDesign(aiResponse, structure)

    return {
      success: true,
      plot,
      metadata: {
        designedAt: new Date(),
        structure,
        genre,
        complexity,
      },
    }
  }

  /**
   * 创建冲突
   */
  async createConflict(parameters, _sessionId) {
    const {
      characters,
      setting,
      conflictType = 'internal',
      intensity = 'medium',
      stakes = [],
      resolutionHint = '',
    } = parameters

    this.logger.info('创建冲突', { conflictType, intensity })

    const conflictPrompt = this.buildConflictCreationPrompt({
      characters,
      setting,
      conflictType,
      intensity,
      stakes,
      resolutionHint,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个冲突设计专家。请创造引人入胜、逻辑合理的故事情节冲突。',
      userPrompt: conflictPrompt,
      maxTokens: 2000,
    })

    const conflict = this.parseConflictData(aiResponse, conflictType)

    return {
      success: true,
      conflict,
      metadata: {
        createdAt: new Date(),
        conflictType,
        intensity,
      },
    }
  }

  /**
   * 优化节奏
   */
  async optimizePacing(parameters, _sessionId) {
    const { story, currentPacing, targetPacing, problemAreas = [], suggestions = [] } = parameters

    this.logger.info('优化节奏', { currentPacing, targetPacing })

    const pacingPrompt = this.buildPacingOptimizationPrompt({
      story,
      currentPacing,
      targetPacing,
      problemAreas,
      suggestions,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个节奏控制专家。请分析和优化故事的叙事节奏。',
      userPrompt: pacingPrompt,
      maxTokens: 2000,
    })

    const optimizedPacing = this.parsePacingOptimization(aiResponse)

    return {
      success: true,
      originalPacing: currentPacing,
      optimizedPacing,
      recommendations: optimizedPacing.recommendations || [],
      metadata: {
        optimizedAt: new Date(),
        targetPacing,
      },
    }
  }

  /**
   * 构建人物弧光
   */
  async buildCharacterArc(parameters, _sessionId) {
    const {
      character,
      arcType = 'hero',
      startingPoint,
      endingPoint,
      keyMoments = [],
      transformation = {},
    } = parameters

    this.logger.info('构建人物弧光', { characterName: character.name, arcType })

    const arcPrompt = this.buildCharacterArcPrompt({
      character,
      arcType,
      startingPoint,
      endingPoint,
      keyMoments,
      transformation,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个人物发展专家。请设计有深度、有说服力的人物成长弧线。',
      userPrompt: arcPrompt,
      maxTokens: 2000,
    })

    const characterArc = this.parseCharacterArc(aiResponse, arcType)

    return {
      success: true,
      character: character.name,
      arc: characterArc,
      metadata: {
        createdAt: new Date(),
        arcType,
      },
    }
  }

  /**
   * 发展主题
   */
  async developTheme(parameters, _sessionId) {
    const {
      story,
      centralTheme,
      subThemes = [],
      themeDevelopment = [],
      symbolicElements = [],
    } = parameters

    this.logger.info('发展主题', { centralTheme })

    const themePrompt = this.buildThemeDevelopmentPrompt({
      story,
      centralTheme,
      subThemes,
      themeDevelopment,
      symbolicElements,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个主题开发专家。请深化故事的主题内涵和象征意义。',
      userPrompt: themePrompt,
      maxTokens: 2000,
    })

    const developedTheme = this.parseThemeDevelopment(aiResponse)

    return {
      success: true,
      centralTheme,
      developedTheme,
      metadata: {
        developedAt: new Date(),
        subThemeCount: subThemes.length,
      },
    }
  }

  /**
   * 添加伏笔
   */
  async addForeshadowing(parameters, _sessionId) {
    const { story, futureEvent, subtlety = 'medium', placement = [], payoff = {} } = parameters

    this.logger.info('添加伏笔', { futureEvent: futureEvent.substring(0, 30), subtlety })

    const foreshadowingPrompt = this.buildForeshadowingPrompt({
      story,
      futureEvent,
      subtlety,
      placement,
      payoff,
    })

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个叙事技巧专家。请巧妙地在故事中安插伏笔。',
      userPrompt: foreshadowingPrompt,
      maxTokens: 1500,
    })

    const foreshadowing = this.parseForeshadowing(aiResponse)

    return {
      success: true,
      foreshadowing,
      metadata: {
        createdAt: new Date(),
        subtlety,
        placement,
      },
    }
  }

  // ==================== 辅助方法 ====================

  buildStructureAnalysisPrompt(options) {
    const { story, analysisType, focusAreas } = options

    const prompt = `请分析以下故事的叙事结构：

故事内容：
${story}

分析类型：${analysisType}
重点关注：${focusAreas.join('、')}

请从以下方面进行详细分析：
1. 情节结构（开头、发展、高潮、结局）
2. 人物弧光和性格发展
3. 主题表达和象征手法
4. 叙事节奏和张力控制
5. 冲突设置和解决方式
6. 世界观构建和设定运用
7. 语言风格和叙述技巧
8. 读者情感引导

请提供专业的叙事结构分析。`

    return prompt
  }

  buildPlotDesignPrompt(options) {
    const { premise, genre, structure, complexity, keyElements, desiredEnding } = options

    let prompt = `请根据以下要求设计故事情节：

故事前提：${premise}
类型：${genre}
结构框架：${structure}
复杂度：${complexity}
期望结局：${desiredEnding}`

    if (keyElements.length > 0) {
      prompt += `\n\n关键元素：${keyElements.join('、')}`
    }

    const template = this.narrativeTemplates[structure]
    if (template) {
      prompt += `\n\n参考结构：${template.name}
阶段：${template.stages.join(' → ')}`
    }

    prompt += `\n\n请设计：
1. 完整的故事情节概要
2. 主要情节转折点
3. 关键冲突和挑战
4. 人物成长轨迹
5. 主题表达方式
6. 高潮和结局设计
7. 留白和想象空间

请创造引人入胜的情节设计。`

    return prompt
  }

  buildConflictCreationPrompt(options) {
    const { characters, setting, conflictType, intensity, stakes, resolutionHint } = options

    let prompt = `请为以下情境创建冲突：

人物：
${characters.map((char) => `- ${char.name}: ${char.description || '无描述'}`).join('\n')}

场景设定：
${setting || '未指定'}

冲突类型：${conflictType}
冲突强度：${intensity}`

    if (stakes.length > 0) {
      prompt += `\n\n利害关系：${stakes.join('、')}`
    }

    if (resolutionHint) {
      prompt += `\n\n解决提示：${resolutionHint}`
    }

    prompt += `\n\n请设计：
1. 冲突的具体表现形式
2. 冲突的内在原因
3. 冲突对人物的影响
4. 冲突的发展过程
5. 可能的解决方式
6. 冲突带来的成长机会

请创造有深度、有张力的冲突。`

    return prompt
  }

  buildPacingOptimizationPrompt(options) {
    const { story, currentPacing, targetPacing, problemAreas, suggestions } = options

    let prompt = `请优化以下故事的叙事节奏：

故事内容：
${story}

当前节奏：${currentPacing}
目标节奏：${targetPacing}`

    if (problemAreas.length > 0) {
      prompt += `\n\n问题区域：${problemAreas.join('、')}`
    }

    if (suggestions.length > 0) {
      prompt += `\n\n已有建议：${suggestions.join('、')}`
    }

    prompt += `\n\n请提供：
1. 当前节奏的详细分析
2. 节奏问题的具体诊断
3. 针对性的优化建议
4. 具体的修改方案
5. 预期效果评估

请提供专业的节奏优化方案。`

    return prompt
  }

  buildCharacterArcPrompt(options) {
    const { character, arcType, startingPoint, endingPoint, keyMoments, transformation } = options

    let prompt = `请为以下人物设计成长弧线：

人物：${character.name}
弧线类型：${arcType}
起点：${startingPoint}
终点：${endingPoint}`

    if (keyMoments.length > 0) {
      prompt += `\n\n关键时刻：${keyMoments.join('、')}`
    }

    if (transformation && Object.keys(transformation).length > 0) {
      prompt += `\n\n转变过程：${JSON.stringify(transformation, null, 2)}`
    }

    prompt += `\n\n请设计：
1. 人物初始状态的详细描述
2. 成长过程中的关键事件
3. 内心的冲突和挣扎
4. 外在行为的改变
5. 最终成长结果
6. 成长的说服力和真实性

请创造有深度的人物成长弧线。`

    return prompt
  }

  buildThemeDevelopmentPrompt(options) {
    const { story, centralTheme, subThemes, themeDevelopment, symbolicElements } = options

    let prompt = `请深化以下故事的主题表达：

故事内容：
${story}

中心主题：${centralTheme}`

    if (subThemes.length > 0) {
      prompt += `\n\n子主题：${subThemes.join('、')}`
    }

    if (themeDevelopment.length > 0) {
      prompt += `\n\n主题发展：${themeDevelopment.join('、')}`
    }

    if (symbolicElements.length > 0) {
      prompt += `\n\n象征元素：${symbolicElements.join('、')}`
    }

    prompt += `\n\n请深化：
1. 主题的核心内涵
2. 主题在情节中的体现
3. 象征手法和隐喻运用
4. 主题与人物的关联
5. 主题对读者的影响
6. 主题的开放性和多义性

请提供富有层次感的主题分析和深化建议。`

    return prompt
  }

  buildForeshadowingPrompt(options) {
    const { story, futureEvent, subtlety, placement, payoff } = options

    let prompt = `请为以下故事添加伏笔：

故事当前内容：
${story}

未来事件：${futureEvent}
伏笔微妙程度：${subtlety}`

    if (placement.length > 0) {
      prompt += `\n\n安插位置：${placement.join('、')}`
    }

    if (payoff && Object.keys(payoff).length > 0) {
      prompt += `\n\n回收方式：${JSON.stringify(payoff, null, 2)}`
    }

    prompt += `\n\n请设计：
1. 伏笔的具体表现形式
2. 伏笔的微妙程度
3. 伏笔与未来事件的关联
4. 伏笔的安插时机
5. 伏笔的回收方式
6. 伏笔对叙事张力的贡献

请巧妙地设计伏笔，避免过于明显或隐晦。`

    return prompt
  }

  async callAI(options) {
    const { systemPrompt, userPrompt, maxTokens } = options

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: this.config.temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error) {
      this.logger.error('AI调用失败', error.response?.data || error.message)
      throw new Error('AI服务调用失败')
    }
  }

  parseStructureAnalysis(aiResponse, analysisType) {
    const content = aiResponse.choices[0].message.content

    return {
      type: analysisType,
      content: content,
      summary: `${content.substring(0, 300)}...`,
      fullAnalysis: content,
    }
  }

  parsePlotDesign(aiResponse, structure) {
    const content = aiResponse.choices[0].message.content

    return {
      structure,
      content: content,
      outline: this.extractPlotOutline(content),
      keyPoints: this.extractKeyPlotPoints(content),
    }
  }

  parseConflictData(aiResponse, conflictType) {
    const content = aiResponse.choices[0].message.content

    return {
      type: conflictType,
      content: content,
      description: content,
      resolutionIdeas: this.extractResolutionIdeas(content),
    }
  }

  parsePacingOptimization(aiResponse) {
    const content = aiResponse.choices[0].message.content

    return {
      analysis: content,
      recommendations: this.extractRecommendations(content),
      optimizedVersion: content,
    }
  }

  parseCharacterArc(aiResponse, arcType) {
    const content = aiResponse.choices[0].message.content

    return {
      type: arcType,
      content: content,
      stages: this.extractArcStages(content),
      transformation: this.extractTransformation(content),
    }
  }

  parseThemeDevelopment(aiResponse) {
    const content = aiResponse.choices[0].message.content

    return {
      content: content,
      deepenedTheme: content,
      symbolicAnalysis: this.extractSymbolicElements(content),
    }
  }

  parseForeshadowing(aiResponse) {
    const content = aiResponse.choices[0].message.content

    return {
      content: content,
      foreshadowingElements: this.extractForeshadowingElements(content),
      placement: content,
    }
  }

  // 辅助解析方法
  extractPlotOutline(content) {
    const lines = content.split('\n')
    return lines.filter(
      (line) => line.includes('第') || line.includes('阶段') || /^\d+\./.test(line.trim())
    )
  }

  extractKeyPlotPoints(content) {
    const points = []
    const lines = content.split('\n')
    lines.forEach((line) => {
      if (
        line.includes('转折') ||
        line.includes('高潮') ||
        line.includes('冲突') ||
        line.includes('解决')
      ) {
        points.push(line.trim())
      }
    })
    return points
  }

  extractResolutionIdeas(content) {
    const ideas = []
    const lines = content.split('\n')
    lines.forEach((line) => {
      if (line.includes('解决') || line.includes('方式') || line.includes('可能')) {
        ideas.push(line.trim())
      }
    })
    return ideas
  }

  extractRecommendations(content) {
    const recommendations = []
    const lines = content.split('\n')
    lines.forEach((line) => {
      if (
        line.includes('建议') ||
        line.includes('可以') ||
        line.includes('应该') ||
        line.includes('需要')
      ) {
        recommendations.push(line.trim())
      }
    })
    return recommendations
  }

  extractArcStages(content) {
    const stages = []
    const lines = content.split('\n')
    lines.forEach((line) => {
      if (
        line.includes('阶段') ||
        line.includes('转变') ||
        line.includes('成长') ||
        /^\d+\./.test(line.trim())
      ) {
        stages.push(line.trim())
      }
    })
    return stages
  }

  extractTransformation(content) {
    return {
      description: '人物成长转变过程',
      details: `${content.substring(0, 200)}...`,
    }
  }

  extractSymbolicElements(content) {
    const elements = []
    const lines = content.split('\n')
    lines.forEach((line) => {
      if (line.includes('象征') || line.includes('隐喻') || line.includes('代表')) {
        elements.push(line.trim())
      }
    })
    return elements
  }

  extractForeshadowingElements(content) {
    const elements = []
    const lines = content.split('\n')
    lines.forEach((line) => {
      if (line.includes('伏笔') || line.includes('暗示') || line.includes('预示')) {
        elements.push(line.trim())
      }
    })
    return elements
  }

  /**
   * VCP插件清理
   */
  async cleanup() {
    this.logger.info('叙事逻辑插件清理完成')
  }
}

module.exports = NarrativeLogic
