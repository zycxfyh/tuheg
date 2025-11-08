/**
 * 创世星环 - 世界构建器插件
 * 智能世界观构建和环境设计工具
 */

const axios = require('axios');
const winston = require('winston');

// 创世星环世界构建器插件
class WorldBuilder {
  constructor() {
    this.name = 'WorldBuilder';
    this.description = '智能世界观构建和环境设计工具';
    this.version = '1.0.0';
    this.author = 'Creation Ring Team';

    // 支持的工具
    this.tools = {
      create: this.createWorld.bind(this),
      expand: this.expandWorld.bind(this),
      location: this.createLocation.bind(this),
      culture: this.buildCulture.bind(this),
      history: this.createHistory.bind(this),
      rules: this.defineRules.bind(this)
    };

    // 配置
    this.config = {
      model: process.env.WORLD_BUILDING_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.MAX_WORLD_TOKENS || '3000', 10),
      temperature: 0.6,
      apiUrl: process.env.API_URL || 'https://api.openai.com/v1',
      apiKey: process.env.API_KEY
    };

    // 日志器
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [WorldBuilder] ${level.toUpperCase()}: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/world-builder.log'
        })
      ]
    });
  }

  /**
   * VCP插件初始化
   */
  async initialize(vcpContext) {
    this.vcp = vcpContext;
    this.logger.info('世界构建器插件初始化完成');
  }

  /**
   * 处理工具调用
   */
  async processToolCall(toolName, parameters, sessionId) {
    this.logger.info(`处理工具调用: ${toolName}`, { parameters, sessionId });

    if (!this.tools[toolName]) {
      throw new Error(`未知工具: ${toolName}`);
    }

    try {
      const result = await this.tools[toolName](parameters, sessionId);
      this.logger.info(`工具调用完成: ${toolName}`);
      return result;
    } catch (error) {
      this.logger.error(`工具调用失败: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * 创建新世界
   */
  async createWorld(parameters, sessionId) {
    const {
      name,
      type = 'fantasy',
      scale = 'continent',
      era = 'medieval',
      themes = [],
      uniqueElements = [],
      conflicts = [],
      magic = {}
    } = parameters;

    this.logger.info('开始创建世界', { name, type, scale });

    // 构建世界创建提示
    const worldPrompt = this.buildWorldCreationPrompt({
      name,
      type,
      scale,
      era,
      themes,
      uniqueElements,
      conflicts,
      magic
    });

    // 调用AI模型
    const aiResponse = await this.callAI({
      systemPrompt: '你是一个专业的世界观设计师。请根据要求构建一个完整、富有创意的世界观。',
      userPrompt: worldPrompt,
      maxTokens: this.config.maxTokens
    });

    // 解析世界数据
    const world = this.parseWorldData(aiResponse, {
      name,
      type,
      scale,
      era
    });

    this.logger.info('世界创建完成', { worldId: world.id });

    return {
      success: true,
      world,
      metadata: {
        createdAt: new Date(),
        model: this.config.model,
        tokens: aiResponse.usage?.total_tokens || 0
      }
    };
  }

  /**
   * 扩展世界
   */
  async expandWorld(parameters, sessionId) {
    const {
      worldId,
      currentWorld,
      expansionArea,
      expansionType,
      integrationRequirements = []
    } = parameters;

    this.logger.info('扩展世界', { worldId, expansionArea, expansionType });

    const expansionPrompt = this.buildWorldExpansionPrompt({
      currentWorld,
      expansionArea,
      expansionType,
      integrationRequirements
    });

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个世界观扩展专家。请在保持世界一致性的前提下进行有创意的扩展。',
      userPrompt: expansionPrompt,
      maxTokens: 2500
    });

    const expandedWorld = this.parseWorldExpansion(aiResponse, currentWorld);

    return {
      success: true,
      originalWorld: currentWorld,
      expandedWorld,
      changes: this.compareWorldStates(currentWorld, expandedWorld),
      metadata: {
        worldId,
        expansionArea,
        expansionType,
        expandedAt: new Date()
      }
    };
  }

  /**
   * 创建具体地点
   */
  async createLocation(parameters, sessionId) {
    const {
      world,
      name,
      type = 'city',
      importance = 'minor',
      features = [],
      inhabitants = [],
      significance = []
    } = parameters;

    this.logger.info('创建地点', { name, type, importance });

    const locationPrompt = this.buildLocationCreationPrompt({
      world,
      name,
      type,
      importance,
      features,
      inhabitants,
      significance
    });

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个地理和文化专家。请为世界观创建详细、生动的地点描述。',
      userPrompt: locationPrompt,
      maxTokens: 2000
    });

    const location = this.parseLocationData(aiResponse, {
      name,
      type,
      importance,
      worldId: world.id
    });

    return {
      success: true,
      location,
      metadata: {
        createdAt: new Date(),
        worldId: world.id,
        type,
        importance
      }
    };
  }

  /**
   * 构建文化体系
   */
  async buildCulture(parameters, sessionId) {
    const {
      world,
      cultureName,
      aspects = ['religion', 'social', 'artistic', 'technological'],
      influences = [],
      conflicts = [],
      uniqueTraits = []
    } = parameters;

    this.logger.info('构建文化体系', { cultureName, aspects });

    const culturePrompt = this.buildCultureCreationPrompt({
      world,
      cultureName,
      aspects,
      influences,
      conflicts,
      uniqueTraits
    });

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个文化人类学家。请构建丰富、立体的文化体系。',
      userPrompt: culturePrompt,
      maxTokens: 2500
    });

    const culture = this.parseCultureData(aiResponse, {
      cultureName,
      aspects,
      worldId: world.id
    });

    return {
      success: true,
      culture,
      metadata: {
        createdAt: new Date(),
        worldId: world.id,
        aspects
      }
    };
  }

  /**
   * 创建世界历史
   */
  async createHistory(parameters, sessionId) {
    const {
      world,
      timeline = [],
      keyEvents = [],
      historicalFigures = [],
      majorConflicts = [],
      technologicalProgress = []
    } = parameters;

    this.logger.info('创建世界历史', { worldName: world.name });

    const historyPrompt = this.buildHistoryCreationPrompt({
      world,
      timeline,
      keyEvents,
      historicalFigures,
      majorConflicts,
      technologicalProgress
    });

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个历史学家。请为世界构建完整、逻辑的历史进程。',
      userPrompt: historyPrompt,
      maxTokens: 3000
    });

    const history = this.parseHistoryData(aiResponse, {
      worldId: world.id,
      timeline,
      keyEvents
    });

    return {
      success: true,
      history,
      metadata: {
        createdAt: new Date(),
        worldId: world.id,
        eventCount: keyEvents.length
      }
    };
  }

  /**
   * 定义世界规则
   */
  async defineRules(parameters, sessionId) {
    const {
      world,
      ruleType,
      physicalRules = [],
      magicalRules = [],
      socialRules = [],
      exceptions = [],
      consequences = []
    } = parameters;

    this.logger.info('定义世界规则', { worldName: world.name, ruleType });

    const rulesPrompt = this.buildRulesDefinitionPrompt({
      world,
      ruleType,
      physicalRules,
      magicalRules,
      socialRules,
      exceptions,
      consequences
    });

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个系统设计师。请为世界定义清晰、一致的规则体系。',
      userPrompt: rulesPrompt,
      maxTokens: 2000
    });

    const rules = this.parseRulesData(aiResponse, {
      worldId: world.id,
      ruleType
    });

    return {
      success: true,
      rules,
      metadata: {
        createdAt: new Date(),
        worldId: world.id,
        ruleType
      }
    };
  }

  // ==================== 辅助方法 ====================

  buildWorldCreationPrompt(options) {
    const {
      name,
      type,
      scale,
      era,
      themes,
      uniqueElements,
      conflicts,
      magic
    } = options;

    let prompt = `请构建一个完整的世界观：

世界基本信息：
- 世界名称：${name}
- 世界类型：${type}
- 世界规模：${scale}
- 时间时代：${era}`;

    if (themes.length > 0) {
      prompt += `\n\n核心主题：${themes.join('、')}`;
    }

    if (uniqueElements.length > 0) {
      prompt += `\n\n独特元素：${uniqueElements.join('、')}`;
    }

    if (conflicts.length > 0) {
      prompt += `\n\n主要冲突：${conflicts.join('、')}`;
    }

    if (magic && Object.keys(magic).length > 0) {
      prompt += `\n\n魔法体系：
- 魔法类型：${magic.type || '无'}
- 魔法来源：${magic.source || '无'}
- 魔法限制：${magic.limitations || '无'}`;
    }

    prompt += `\n\n请详细描述：
1. 地理环境和气候
2. 政治格局和社会结构
3. 文化和宗教信仰
4. 科技和魔法水平
5. 主要种族和生物
6. 历史背景和重大事件
7. 世界特色和独特机制
8. 潜在的剧情冲突点

请创建富有创意和逻辑一致的世界观。`;

    return prompt;
  }

  buildWorldExpansionPrompt(options) {
    const {
      currentWorld,
      expansionArea,
      expansionType,
      integrationRequirements
    } = options;

    let prompt = `请为现有世界进行扩展：

当前世界概况：
${JSON.stringify(currentWorld, null, 2)}

扩展区域：${expansionArea}
扩展类型：${expansionType}`;

    if (integrationRequirements.length > 0) {
      prompt += `\n\n整合要求：
${integrationRequirements.map(req => `- ${req}`).join('\n')}`;
    }

    prompt += `\n\n请确保扩展内容：
1. 与现有世界观保持一致
2. 增加新的可能性和冲突点
3. 丰富世界细节和深度
4. 提供新的故事机会

请进行有创意的世界扩展。`;

    return prompt;
  }

  buildLocationCreationPrompt(options) {
    const {
      world,
      name,
      type,
      importance,
      features,
      inhabitants,
      significance
    } = options;

    let prompt = `请为世界创建一个详细的地点：

世界背景：
${world.name} (${world.type})

地点信息：
- 地点名称：${name}
- 地点类型：${type}
- 重要程度：${importance}`;

    if (features.length > 0) {
      prompt += `\n\n地理特征：${features.join('、')}`;
    }

    if (inhabitants.length > 0) {
      prompt += `\n\n主要居民：${inhabitants.join('、')}`;
    }

    if (significance.length > 0) {
      prompt += `\n\n重要意义：${significance.join('、')}`;
    }

    prompt += `\n\n请详细描述：
1. 地理位置和环境
2. 建筑风格和布局
3. 居民生活和社会结构
4. 经济活动和贸易
5. 文化特色和传统
6. 历史事件和传说
7. 在世界中的作用

请创建生动、立体的地点描述。`;

    return prompt;
  }

  buildCultureCreationPrompt(options) {
    const {
      world,
      cultureName,
      aspects,
      influences,
      conflicts,
      uniqueTraits
    } = options;

    let prompt = `请构建一个文化体系：

所属世界：${world.name}
文化名称：${cultureName}
构建方面：${aspects.join('、')}`;

    if (influences.length > 0) {
      prompt += `\n\n受影响因素：${influences.join('、')}`;
    }

    if (conflicts.length > 0) {
      prompt += `\n\n文化冲突：${conflicts.join('、')}`;
    }

    if (uniqueTraits.length > 0) {
      prompt += `\n\n独特特征：${uniqueTraits.join('、')}`;
    }

    prompt += `\n\n请详细描述每个方面的文化内涵：
1. 宗教信仰和仪式
2. 社会规范和价值观
3. 艺术表现形式
4. 科技发展水平
5. 语言和交流方式
6. 饮食和生活习惯
7. 节日和庆典活动

请创建丰富、多层次的文化体系。`;

    return prompt;
  }

  buildHistoryCreationPrompt(options) {
    const {
      world,
      timeline,
      keyEvents,
      historicalFigures,
      majorConflicts,
      technologicalProgress
    } = options;

    let prompt = `请为世界创建完整的历史进程：

世界名称：${world.name}
时间线范围：${timeline.join(' - ') || '完整历史'}`;

    if (keyEvents.length > 0) {
      prompt += `\n\n关键事件：${keyEvents.join('、')}`;
    }

    if (historicalFigures.length > 0) {
      prompt += `\n\n历史人物：${historicalFigures.join('、')}`;
    }

    if (majorConflicts.length > 0) {
      prompt += `\n\n重大冲突：${majorConflicts.join('、')}`;
    }

    if (technologicalProgress.length > 0) {
      prompt += `\n\n科技发展：${technologicalProgress.join('、')}`;
    }

    prompt += `\n\n请构建：
1. 创世神话和起源传说
2. 主要历史时期划分
3. 关键历史事件的时间线
4. 重要历史人物和他们的影响
5. 社会变迁和发展历程
6. 科技和文化进步
7. 重大战争和和平时期
8. 当前世界的形成过程

请创建逻辑连贯的历史叙述。`;

    return prompt;
  }

  buildRulesDefinitionPrompt(options) {
    const {
      world,
      ruleType,
      physicalRules,
      magicalRules,
      socialRules,
      exceptions,
      consequences
    } = options;

    let prompt = `请为世界定义规则体系：

世界名称：${world.name}
规则类型：${ruleType}`;

    if (physicalRules.length > 0) {
      prompt += `\n\n物理规则：${physicalRules.join('、')}`;
    }

    if (magicalRules.length > 0) {
      prompt += `\n\n魔法规则：${magicalRules.join('、')}`;
    }

    if (socialRules.length > 0) {
      prompt += `\n\n社会规则：${socialRules.join('、')}`;
    }

    if (exceptions.length > 0) {
      prompt += `\n\n特殊例外：${exceptions.join('、')}`;
    }

    if (consequences.length > 0) {
      prompt += `\n\n违反后果：${consequences.join('、')}`;
    }

    prompt += `\n\n请详细定义：
1. 规则的具体内容和限制
2. 规则的逻辑基础
3. 规则的实际应用方式
4. 规则的例外情况
5. 违反规则的后果
6. 规则对世界的影响

请创建清晰、一致的规则体系。`;

    return prompt;
  }

  async callAI(options) {
    const { systemPrompt, userPrompt, maxTokens } = options;

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: maxTokens,
          temperature: this.config.temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('AI调用失败', error.response?.data || error.message);
      throw new Error('AI服务调用失败');
    }
  }

  parseWorldData(aiResponse, basicInfo) {
    const content = aiResponse.choices[0].message.content;

    return {
      id: `world-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...basicInfo,
      description: content,
      createdAt: new Date(),
      version: 1,
      status: 'active'
    };
  }

  parseWorldExpansion(aiResponse, currentWorld) {
    const content = aiResponse.choices[0].message.content;

    return {
      ...currentWorld,
      expandedDescription: content,
      version: (currentWorld.version || 1) + 1,
      lastExpansion: new Date()
    };
  }

  parseLocationData(aiResponse, context) {
    const content = aiResponse.choices[0].message.content;

    return {
      id: `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...context,
      description: content,
      createdAt: new Date()
    };
  }

  parseCultureData(aiResponse, context) {
    const content = aiResponse.choices[0].message.content;

    return {
      id: `culture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...context,
      description: content,
      createdAt: new Date()
    };
  }

  parseHistoryData(aiResponse, context) {
    const content = aiResponse.choices[0].message.content;

    return {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...context,
      description: content,
      createdAt: new Date()
    };
  }

  parseRulesData(aiResponse, context) {
    const content = aiResponse.choices[0].message.content;

    return {
      id: `rules-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...context,
      description: content,
      createdAt: new Date()
    };
  }

  compareWorldStates(original, expanded) {
    return {
      changesDetected: true,
      summary: '世界得到了扩展',
      details: '增加了新的区域和内容'
    };
  }

  /**
   * VCP插件清理
   */
  async cleanup() {
    this.logger.info('世界构建器插件清理完成');
  }
}

module.exports = WorldBuilder;