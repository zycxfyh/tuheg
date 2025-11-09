/**
 * 创世星环 - 故事生成器插件
 */

const axios = require('axios')
const winston = require('winston')

// 故事生成器插件
class StoryGenerator {
  constructor() {
    this.name = 'StoryGenerator'
    this.description = '智能故事生成器'
    this.version = '1.0.0'
    this.author = 'Creation Ring Team'

    // 支持的工具
    this.tools = {
      generate: this.generateStory.bind(this),
      continue: this.continueStory.bind(this),
    }

    // 配置
    this.config = {
      model: process.env.STORY_GENERATION_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.MAX_STORY_TOKENS || '4000', 10),
      temperature: 0.8,
      apiUrl: process.env.API_URL || 'https://api.openai.com/v1',
      apiKey: process.env.API_KEY,
    }

    // 日志器
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [StoryGenerator] ${level.toUpperCase()}: ${message}`
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/story-generator.log',
        }),
      ],
    })
  }

  /**
   * VCP插件初始化
   */
  async initialize(vcpContext) {
    this.vcp = vcpContext
    this.logger.info('故事生成器插件初始化完成')
  }

  /**
   * 处理工具调用
   */
  async processToolCall(toolName, parameters, sessionId) {
    this.logger.info(`处理工具调用: ${toolName}`)

    if (!this.tools[toolName]) {
      throw new Error(`未知工具: ${toolName}`)
    }

    try {
      const result = await this.tools[toolName](parameters, sessionId)
      return result
    } catch (error) {
      this.logger.error(`工具调用失败: ${toolName}`, error)
      throw error
    }
  }

  /**
   * 生成新故事
   */
  async generateStory(parameters, _sessionId) {
    const { prompt, genre = '现代现实主义', length = '中等' } = parameters

    this.logger.info('开始生成故事', { genre, length })

    // 构建AI提示词
    const systemPrompt = `你是一个专业的${genre}小说作家。请根据要求创作一个完整的故事。`
    const userPrompt = `请创作一个${genre}风格的故事，篇幅${length}。故事主题：${prompt}`

    // 调用AI模型
    const aiResponse = await this.callAI({
      systemPrompt,
      userPrompt,
      maxTokens: this.getMaxTokensForLength(length),
    })

    // 解析故事
    const story = {
      id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.extractTitle(aiResponse.choices[0].message.content),
      content: aiResponse.choices[0].message.content,
      genre,
      wordCount: aiResponse.choices[0].message.content.length,
      createdAt: new Date(),
      status: 'draft',
    }

    this.logger.info('故事生成完成', { storyId: story.id })

    return {
      success: true,
      story,
      metadata: {
        generatedAt: new Date(),
        model: this.config.model,
        tokens: aiResponse.usage?.total_tokens || 0,
      },
    }
  }

  /**
   * 继续故事
   */
  async continueStory(parameters, _sessionId) {
    const { storyId, currentContent, direction, length = '短' } = parameters

    const continuationPrompt = `请继续以下故事的发展：

当前故事内容：
${currentContent}

续写方向：${direction}
续写长度：${length}`

    const aiResponse = await this.callAI({
      systemPrompt: '你是一个专业的小说续写大师。',
      userPrompt: continuationPrompt,
      maxTokens: this.getMaxTokensForLength(length),
    })

    const continuation = {
      content: aiResponse.choices[0].message.content,
      wordCount: aiResponse.choices[0].message.content.length,
      generatedAt: new Date(),
    }

    return {
      success: true,
      continuation,
      metadata: {
        storyId,
        continuedAt: new Date(),
        direction,
        length,
      },
    }
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

  getMaxTokensForLength(length) {
    const lengthMap = {
      短: 1000,
      中等: 2000,
      长: 4000,
    }
    return lengthMap[length] || 2000
  }

  extractTitle(content) {
    const lines = content.split('\n').filter((line) => line.trim())
    const firstLine = lines[0]?.trim()

    if (firstLine && firstLine.length < 50 && !firstLine.includes('。')) {
      return firstLine
    }

    return `故事 ${new Date().toLocaleDateString()}`
  }

  /**
   * VCP插件清理
   */
  async cleanup() {
    this.logger.info('故事生成器插件清理完成')
  }
}

module.exports = StoryGenerator
