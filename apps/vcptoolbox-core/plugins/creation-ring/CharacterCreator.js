/**
 * 创世星环 - 角色创建器插件
 */

const axios = require('axios');
const winston = require('winston');

class CharacterCreator {
  constructor() {
    this.name = 'CharacterCreator';
    this.description = '智能角色创建和塑造工具';
    this.version = '1.0.0';

    this.tools = {
      create: this.createCharacter.bind(this),
      analyze: this.analyzeCharacter.bind(this)
    };

    this.config = {
      model: process.env.CHARACTER_CREATION_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.MAX_CHARACTER_TOKENS || '2000', 10),
      temperature: 0.7,
      apiUrl: process.env.API_URL || 'https://api.openai.com/v1',
      apiKey: process.env.API_KEY
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [CharacterCreator] ${level.toUpperCase()}: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/character-creator.log' })
      ]
    });
  }

  async initialize(vcpContext) {
    this.vcp = vcpContext;
    this.logger.info('角色创建器插件初始化完成');
  }

  async processToolCall(toolName, parameters, sessionId) {
    if (!this.tools[toolName]) {
      throw new Error(`未知工具: ${toolName}`);
    }
    return await this.tools[toolName](parameters, sessionId);
  }

  async createCharacter(parameters, sessionId) {
    const { name, archetype, age, personality = [] } = parameters;

    const characterPrompt = `请创建一个详细的角色形象：
姓名：${name}
原型：${archetype}
年龄：${age}
性格特征：${personality.join('、')}

请提供外貌描述、背景故事、动机和目标。`;

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个专业的角色设计师。',
      userPrompt: characterPrompt,
      maxTokens: this.config.maxTokens
    });

    const character = {
      id: `character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      archetype,
      age,
      personality,
      profile: aiResponse.choices[0].message.content,
      createdAt: new Date(),
      status: 'active'
    };

    return { success: true, character };
  }

  async analyzeCharacter(parameters, sessionId) {
    const { character } = parameters;

    const analysisPrompt = `请分析以下角色的心理特征和发展潜力：${JSON.stringify(character, null, 2)}`;

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个角色心理分析专家。',
      userPrompt: analysisPrompt,
      maxTokens: 1500
    });

    return {
      success: true,
      analysis: aiResponse.choices[0].message.content,
      character: character.name
    };
  }

  async callAI(options) {
    const { systemPrompt, userPrompt, maxTokens } = options;

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
  }

  async cleanup() {
    this.logger.info('角色创建器插件清理完成');
  }
}

module.exports = CharacterCreator;
