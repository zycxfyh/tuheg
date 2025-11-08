// 文件路径: packages/common-backend/src/plugins/vcp-example-plugins.ts
// 职责: VCPToolBox 插件协议系统的示例实现
// 展示6大类型插件的具体实现方式

import { Injectable, Logger } from '@nestjs/common'
import {
  VcpBasePlugin,
  VcpStaticPlugin,
  VcpMessagePreprocessorPlugin,
  VcpSynchronousPlugin,
  VcpAsynchronousPlugin,
  VcpServicePlugin,
  VcpHybridServicePlugin,
  VcpPluginType,
  VcpPluginConfig,
  PluginContext,
  PluginExecutionResult,
} from './vcp-plugin-system.service'

/**
 * 示例1: 静态插件 - 内容过滤器
 * 处理静态资源，过滤敏感内容
 */
@Injectable()
export class ContentFilterStaticPlugin implements VcpStaticPlugin {
  config: VcpPluginConfig = {
    id: 'content-filter-static',
    name: '内容过滤器',
    version: '1.0.0',
    type: VcpPluginType.STATIC,
    description: '过滤敏感内容和不良信息',
    author: 'VCPToolBox',
    enabled: true,
    priority: 100,
  }

  private readonly logger = new Logger(ContentFilterStaticPlugin.name)
  private readonly sensitiveWords = ['敏感词1', '敏感词2', '不良内容']

  async init(): Promise<void> {
    this.logger.log('Content filter static plugin initialized')
  }

  async destroy(): Promise<void> {
    this.logger.log('Content filter static plugin destroyed')
  }

  getInfo() {
    return this.config
  }

  async handleStaticResource(
    resource: string,
    context: PluginContext
  ): Promise<PluginExecutionResult> {
    const startTime = Date.now()

    try {
      let filteredContent = resource

      // 过滤敏感词
      for (const word of this.sensitiveWords) {
        const regex = new RegExp(word, 'gi')
        filteredContent = filteredContent.replace(regex, '***')
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: filteredContent,
        metadata: {
          filtered: filteredContent !== resource,
          filterCount: this.sensitiveWords.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

/**
 * 示例2: 消息预处理器插件 - 情绪分析器
 * 在消息进入处理链之前分析情绪
 */
@Injectable()
export class SentimentAnalyzerPreprocessorPlugin implements VcpMessagePreprocessorPlugin {
  config: VcpPluginConfig = {
    id: 'sentiment-analyzer-preprocessor',
    name: '情绪分析器',
    version: '1.0.0',
    type: VcpPluginType.MESSAGE_PREPROCESSOR,
    description: '分析消息情绪并添加情绪标签',
    author: 'VCPToolBox',
    enabled: true,
    priority: 90,
  }

  private readonly logger = new Logger(SentimentAnalyzerPreprocessorPlugin.name)

  async init(): Promise<void> {
    this.logger.log('Sentiment analyzer preprocessor plugin initialized')
  }

  getInfo() {
    return this.config
  }

  async preprocessMessage(context: PluginContext): Promise<PluginExecutionResult> {
    const startTime = Date.now()

    try {
      const input = context.input as string
      const sentiment = this.analyzeSentiment(input)

      // 在上下文中添加情绪信息
      context.metadata = context.metadata || {}
      context.metadata.sentiment = sentiment

      // 根据情绪调整输入（例如，负面情绪的消息可以被标记）
      let processedInput = input
      if (sentiment.score < -0.5) {
        processedInput = `[负面情绪] ${input}`
      } else if (sentiment.score > 0.5) {
        processedInput = `[正面情绪] ${input}`
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: processedInput,
        metadata: { sentiment },
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private analyzeSentiment(text: string): { label: string; score: number; confidence: number } {
    // 简化的情绪分析逻辑
    const positiveWords = ['好', '棒', '喜欢', '高兴', '优秀']
    const negativeWords = ['坏', '差', '讨厌', '生气', '糟糕']

    let score = 0
    const words = text.split('')

    for (const word of words) {
      if (positiveWords.includes(word)) score += 0.2
      if (negativeWords.includes(word)) score -= 0.2
    }

    let label = 'neutral'
    if (score > 0.3) label = 'positive'
    else if (score < -0.3) label = 'negative'

    return {
      label,
      score: Math.max(-1, Math.min(1, score)),
      confidence: 0.8,
    }
  }
}

/**
 * 示例3: 同步插件 - 关键词提取器
 * 同步提取文本中的关键词
 */
@Injectable()
export class KeywordExtractorSyncPlugin implements VcpSynchronousPlugin {
  config: VcpPluginConfig = {
    id: 'keyword-extractor-sync',
    name: '关键词提取器',
    version: '1.0.0',
    type: VcpPluginType.SYNCHRONOUS,
    description: '提取文本中的重要关键词',
    author: 'VCPToolBox',
    enabled: true,
    priority: 80,
  }

  private readonly logger = new Logger(KeywordExtractorSyncPlugin.name)

  async init(): Promise<void> {
    this.logger.log('Keyword extractor sync plugin initialized')
  }

  getInfo() {
    return this.config
  }

  async execute(context: PluginContext): Promise<PluginExecutionResult> {
    const startTime = Date.now()

    try {
      const input = context.input as string
      const keywords = this.extractKeywords(input)

      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: {
          originalText: input,
          keywords,
          keywordCount: keywords.length,
        },
        metadata: {
          extractionMethod: 'frequency_analysis',
          keywordCount: keywords.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private extractKeywords(
    text: string
  ): Array<{ word: string; frequency: number; weight: number }> {
    // 简化的关键词提取逻辑
    const words = text.split(/[^\u4e00-\u9fa5a-zA-Z]+/).filter((word) => word.length > 1)
    const wordFreq = new Map<string, number>()

    // 计算词频
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }

    // 转换为关键词数组
    return Array.from(wordFreq.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
        weight: frequency / words.length, // 简化的权重计算
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10) // 返回前10个关键词
  }
}

/**
 * 示例4: 异步插件 - 深度内容分析器
 * 异步执行深度内容分析，可能需要调用外部API
 */
@Injectable()
export class DeepContentAnalyzerAsyncPlugin implements VcpAsynchronousPlugin {
  config: VcpPluginConfig = {
    id: 'deep-content-analyzer-async',
    name: '深度内容分析器',
    version: '1.0.0',
    type: VcpPluginType.ASYNCHRONOUS,
    description: '深度分析内容主题和情感',
    author: 'VCPToolBox',
    enabled: true,
    priority: 70,
  }

  private readonly logger = new Logger(DeepContentAnalyzerAsyncPlugin.name)
  private readonly activeTasks = new Map<
    string,
    {
      promise: Promise<PluginExecutionResult>
      abortController?: AbortController
    }
  >()

  async init(): Promise<void> {
    this.logger.log('Deep content analyzer async plugin initialized')
  }

  getInfo() {
    return this.config
  }

  async executeAsync(context: PluginContext): Promise<string> {
    const taskId = `deep_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建可取消的任务
    const abortController = new AbortController()

    const promise = this.performDeepAnalysis(context.input as string, abortController.signal)

    this.activeTasks.set(taskId, {
      promise,
      abortController,
    })

    // 自动清理任务
    promise.finally(() => {
      setTimeout(() => {
        this.activeTasks.delete(taskId)
      }, 300000) // 5分钟后清理
    })

    return taskId
  }

  async getAsyncResult(taskId: string): Promise<PluginExecutionResult> {
    const task = this.activeTasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    return await task.promise
  }

  async cancelAsyncTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (!task || !task.abortController) {
      return false
    }

    task.abortController.abort()
    this.activeTasks.delete(taskId)
    return true
  }

  private async performDeepAnalysis(
    content: string,
    signal: AbortSignal
  ): Promise<PluginExecutionResult> {
    const startTime = Date.now()

    try {
      // 检查是否已被取消
      if (signal.aborted) {
        throw new Error('Task was cancelled')
      }

      // 模拟深度分析过程
      this.logger.debug('Starting deep content analysis...')

      // 步骤1: 主题分析 (2秒)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      if (signal.aborted) throw new Error('Task was cancelled')

      const themes = this.analyzeThemes(content)

      // 步骤2: 情感深度分析 (3秒)
      await new Promise((resolve) => setTimeout(resolve, 3000))
      if (signal.aborted) throw new Error('Task was cancelled')

      const emotions = this.analyzeEmotions(content)

      // 步骤3: 内容质量评估 (2秒)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      if (signal.aborted) throw new Error('Task was cancelled')

      const quality = this.assessQuality(content)

      const analysis = {
        themes,
        emotions,
        quality,
        summary: `内容包含${themes.length}个主题，情感倾向为${emotions.primary}，质量评分为${quality.score}/10`,
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: analysis,
        metadata: {
          analysisDepth: 'deep',
          processingSteps: ['theme_analysis', 'emotion_analysis', 'quality_assessment'],
        },
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private analyzeThemes(content: string): Array<{ theme: string; confidence: number }> {
    // 简化的主题分析
    const themes = [
      { theme: '技术', keywords: ['技术', '编程', '软件', 'AI'] },
      { theme: '生活', keywords: ['生活', '日常', '美食', '旅行'] },
      { theme: '学习', keywords: ['学习', '教育', '知识', '课程'] },
    ]

    return themes
      .map(({ theme, keywords }) => {
        const matches = keywords.filter((keyword) => content.includes(keyword)).length
        const confidence = matches / keywords.length
        return { theme, confidence }
      })
      .filter((item) => item.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
  }

  private analyzeEmotions(content: string): { primary: string; details: Record<string, number> } {
    // 简化的情感分析
    const emotions = {
      joy: content.includes('高兴') || content.includes('快乐') ? 0.8 : 0.1,
      sadness: content.includes('悲伤') || content.includes('难过') ? 0.7 : 0.1,
      anger: content.includes('生气') || content.includes('愤怒') ? 0.6 : 0.1,
      fear: content.includes('害怕') || content.includes('恐惧') ? 0.5 : 0.1,
    }

    const primary = Object.entries(emotions).sort(([, a], [, b]) => b - a)[0][0]

    return { primary, details: emotions }
  }

  private assessQuality(content: string): { score: number; factors: Record<string, number> } {
    const factors = {
      length: Math.min(content.length / 100, 1), // 内容长度
      diversity: new Set(content.split('')).size / content.length, // 字符多样性
      structure: content.includes('。') || content.includes('\n') ? 0.8 : 0.3, // 结构完整性
    }

    const score = Math.round((Object.values(factors).reduce((sum, val) => sum + val, 0) / 3) * 10)

    return { score, factors }
  }
}

/**
 * 示例5: 服务插件 - 定时清理器
 * 提供定时清理服务
 */
@Injectable()
export class CleanupServicePlugin implements VcpServicePlugin {
  config: VcpPluginConfig = {
    id: 'cleanup-service',
    name: '定时清理器',
    version: '1.0.0',
    type: VcpPluginType.SERVICE,
    description: '定时清理临时文件和过期数据',
    author: 'VCPToolBox',
    enabled: true,
    priority: 60,
    config: {
      cleanupInterval: 3600000, // 1小时
      maxTempFiles: 1000,
    },
  }

  private readonly logger = new Logger(CleanupServicePlugin.name)
  private cleanupInterval?: NodeJS.Timeout
  private isRunning = false

  async init(): Promise<void> {
    this.logger.log('Cleanup service plugin initialized')
  }

  async destroy(): Promise<void> {
    await this.stopService()
    this.logger.log('Cleanup service plugin destroyed')
  }

  getInfo() {
    return this.config
  }

  async startService(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    const interval = (this.config.config?.cleanupInterval as number) || 3600000

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performCleanup()
      } catch (error) {
        this.logger.error('Cleanup service error:', error)
      }
    }, interval)

    this.logger.log(`Cleanup service started with ${interval}ms interval`)
  }

  async stopService(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }

    this.logger.log('Cleanup service stopped')
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // 检查服务状态
      const healthy = this.isRunning && !!this.cleanupInterval

      return {
        healthy,
        message: healthy ? 'Cleanup service is running' : 'Cleanup service is not running',
      }
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async performCleanup(): Promise<void> {
    this.logger.debug('Performing cleanup...')

    // 模拟清理操作
    const tempFilesCleaned = Math.floor(Math.random() * 50)
    const expiredDataCleaned = Math.floor(Math.random() * 20)

    // 这里可以实现实际的清理逻辑
    // 例如：清理临时文件、过期缓存、旧日志等

    this.logger.log(
      `Cleanup completed: ${tempFilesCleaned} temp files, ${expiredDataCleaned} expired data entries`
    )
  }
}

/**
 * 示例6: 混合服务插件 - 智能缓存服务
 * 结合同步缓存操作和异步预热功能的服务
 */
@Injectable()
export class SmartCacheHybridServicePlugin implements VcpHybridServicePlugin {
  config: VcpPluginConfig = {
    id: 'smart-cache-hybrid-service',
    name: '智能缓存服务',
    version: '1.0.0',
    type: VcpPluginType.HYBRID_SERVICE,
    description: '智能缓存管理和预热服务',
    author: 'VCPToolBox',
    enabled: true,
    priority: 50,
    config: {
      maxCacheSize: 1000,
      preheatInterval: 1800000, // 30分钟
      cacheExpiryMs: 3600000, // 1小时
    },
  }

  private readonly logger = new Logger(SmartCacheHybridServicePlugin.name)
  private readonly cache = new Map<string, { data: unknown; timestamp: number; expiry: number }>()
  private preheatInterval?: NodeJS.Timeout
  private isRunning = false

  async init(): Promise<void> {
    this.logger.log('Smart cache hybrid service plugin initialized')
  }

  async destroy(): Promise<void> {
    await this.stopService()
    this.cache.clear()
    this.logger.log('Smart cache hybrid service plugin destroyed')
  }

  getInfo() {
    return this.config
  }

  // VcpSynchronousPlugin 接口
  async execute(context: PluginContext): Promise<PluginExecutionResult> {
    const startTime = Date.now()

    try {
      const { action, key, data } = context.input as {
        action: 'get' | 'set' | 'delete' | 'has'
        key: string
        data?: unknown
      }

      let result: unknown

      switch (action) {
        case 'get':
          result = this.getFromCache(key)
          break
        case 'set':
          result = this.setInCache(key, data)
          break
        case 'delete':
          result = this.deleteFromCache(key)
          break
        case 'has':
          result = this.hasInCache(key)
          break
        default:
          throw new Error(`Unsupported cache action: ${action}`)
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: result,
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // VcpAsynchronousPlugin 接口
  async executeAsync(context: PluginContext): Promise<string> {
    const taskId = `cache_prewarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 异步预热缓存
    const promise = this.performCachePrewarm(context.input as string[])

    // 存储任务（简化实现，实际应该有更好的异步任务管理）
    ;(global as any).asyncTasks = (global as any).asyncTasks || new Map()
    ;(global as any).asyncTasks.set(taskId, promise)

    return taskId
  }

  async getAsyncResult(taskId: string): Promise<PluginExecutionResult> {
    const tasks = (global as any).asyncTasks as Map<string, Promise<PluginExecutionResult>>
    const promise = tasks?.get(taskId)

    if (!promise) {
      throw new Error(`Async task ${taskId} not found`)
    }

    const result = await promise
    tasks.delete(taskId)
    return result
  }

  async cancelAsyncTask(taskId: string): Promise<boolean> {
    // 简化实现，实际应该支持取消
    const tasks = (global as any).asyncTasks as Map<string, Promise<PluginExecutionResult>>
    return tasks?.delete(taskId) || false
  }

  // VcpServicePlugin 接口
  async startService(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    const preheatInterval = (this.config.config?.preheatInterval as number) || 1800000

    this.preheatInterval = setInterval(async () => {
      try {
        await this.performPeriodicPrewarm()
      } catch (error) {
        this.logger.error('Cache prewarm error:', error)
      }
    }, preheatInterval)

    this.logger.log(`Smart cache service started with ${preheatInterval}ms preheat interval`)
  }

  async stopService(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.preheatInterval) {
      clearInterval(this.preheatInterval)
      this.preheatInterval = undefined
    }

    this.logger.log('Smart cache service stopped')
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const cacheSize = this.cache.size
      const maxSize = (this.config.config?.maxCacheSize as number) || 1000
      const healthy = this.isRunning && cacheSize <= maxSize

      return {
        healthy,
        message: healthy
          ? `Cache healthy: ${cacheSize}/${maxSize} entries`
          : `Cache unhealthy: ${cacheSize}/${maxSize} entries`,
      }
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // VcpHybridServicePlugin 接口
  async executeHybrid(
    context: PluginContext,
    mode: 'sync' | 'async'
  ): Promise<PluginExecutionResult | string> {
    if (mode === 'sync') {
      return this.execute(context)
    } else {
      return this.executeAsync(context)
    }
  }

  // 私有方法
  private getFromCache(key: string): unknown {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setInCache(key: string, data?: unknown): boolean {
    const maxSize = (this.config.config?.maxCacheSize as number) || 1000
    const expiryMs = (this.config.config?.cacheExpiryMs as number) || 3600000

    if (this.cache.size >= maxSize) {
      // 简单的LRU清理
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data: data || null,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs,
    })

    return true
  }

  private deleteFromCache(key: string): boolean {
    return this.cache.delete(key)
  }

  private hasInCache(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    const now = Date.now()
    if (now > entry.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  private async performCachePrewarm(keys: string[]): Promise<PluginExecutionResult> {
    const startTime = Date.now()

    try {
      this.logger.debug(`Starting cache prewarm for ${keys.length} keys`)

      // 模拟预热操作
      for (const key of keys) {
        // 这里可以实现实际的数据预热逻辑
        // 例如：预加载热门数据、预测性缓存等
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
        output: {
          prewarmedKeys: keys.length,
          cacheSize: this.cache.size,
        },
        metadata: {
          operation: 'cache_prewarm',
          keysCount: keys.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async performPeriodicPrewarm(): Promise<void> {
    this.logger.debug('Performing periodic cache prewarm...')

    // 模拟定期预热逻辑
    // 可以基于访问模式预测需要预热的数据

    const prewarmCandidates = ['hot_data_1', 'hot_data_2', 'frequently_accessed_data']

    await this.performCachePrewarm(prewarmCandidates)
  }
}

/**
 * 插件工厂类 - 用于创建和配置示例插件
 */
export class VcpExamplePluginFactory {
  static createAllExamplePlugins(): VcpBasePlugin[] {
    return [
      new ContentFilterStaticPlugin(),
      new SentimentAnalyzerPreprocessorPlugin(),
      new KeywordExtractorSyncPlugin(),
      new DeepContentAnalyzerAsyncPlugin(),
      new CleanupServicePlugin(),
      new SmartCacheHybridServicePlugin(),
    ]
  }

  static createPluginByType(type: VcpPluginType): VcpBasePlugin | null {
    switch (type) {
      case VcpPluginType.STATIC:
        return new ContentFilterStaticPlugin()
      case VcpPluginType.MESSAGE_PREPROCESSOR:
        return new SentimentAnalyzerPreprocessorPlugin()
      case VcpPluginType.SYNCHRONOUS:
        return new KeywordExtractorSyncPlugin()
      case VcpPluginType.ASYNCHRONOUS:
        return new DeepContentAnalyzerAsyncPlugin()
      case VcpPluginType.SERVICE:
        return new CleanupServicePlugin()
      case VcpPluginType.HYBRID_SERVICE:
        return new SmartCacheHybridServicePlugin()
      default:
        return null
    }
  }
}
