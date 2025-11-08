'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var ContentFilterStaticPlugin_1,
  SentimentAnalyzerPreprocessorPlugin_1,
  KeywordExtractorSyncPlugin_1,
  DeepContentAnalyzerAsyncPlugin_1,
  CleanupServicePlugin_1,
  SmartCacheHybridServicePlugin_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.VcpExamplePluginFactory =
  exports.SmartCacheHybridServicePlugin =
  exports.CleanupServicePlugin =
  exports.DeepContentAnalyzerAsyncPlugin =
  exports.KeywordExtractorSyncPlugin =
  exports.SentimentAnalyzerPreprocessorPlugin =
  exports.ContentFilterStaticPlugin =
    void 0
const common_1 = require('@nestjs/common')
const vcp_plugin_system_service_1 = require('./vcp-plugin-system.service')
let ContentFilterStaticPlugin = (ContentFilterStaticPlugin_1 = class ContentFilterStaticPlugin {
  config = {
    id: 'content-filter-static',
    name: '内容过滤器',
    version: '1.0.0',
    type: vcp_plugin_system_service_1.VcpPluginType.STATIC,
    description: '过滤敏感内容和不良信息',
    author: 'VCPToolBox',
    enabled: true,
    priority: 100,
  }
  logger = new common_1.Logger(ContentFilterStaticPlugin_1.name)
  sensitiveWords = ['敏感词1', '敏感词2', '不良内容']
  async init() {
    this.logger.log('Content filter static plugin initialized')
  }
  async destroy() {
    this.logger.log('Content filter static plugin destroyed')
  }
  getInfo() {
    return this.config
  }
  async handleStaticResource(resource, context) {
    const startTime = Date.now()
    try {
      let filteredContent = resource
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
})
exports.ContentFilterStaticPlugin = ContentFilterStaticPlugin
exports.ContentFilterStaticPlugin =
  ContentFilterStaticPlugin =
  ContentFilterStaticPlugin_1 =
    __decorate([(0, common_1.Injectable)()], ContentFilterStaticPlugin)
let SentimentAnalyzerPreprocessorPlugin =
  (SentimentAnalyzerPreprocessorPlugin_1 = class SentimentAnalyzerPreprocessorPlugin {
    config = {
      id: 'sentiment-analyzer-preprocessor',
      name: '情绪分析器',
      version: '1.0.0',
      type: vcp_plugin_system_service_1.VcpPluginType.MESSAGE_PREPROCESSOR,
      description: '分析消息情绪并添加情绪标签',
      author: 'VCPToolBox',
      enabled: true,
      priority: 90,
    }
    logger = new common_1.Logger(SentimentAnalyzerPreprocessorPlugin_1.name)
    async init() {
      this.logger.log('Sentiment analyzer preprocessor plugin initialized')
    }
    getInfo() {
      return this.config
    }
    async preprocessMessage(context) {
      const startTime = Date.now()
      try {
        const input = context.input
        const sentiment = this.analyzeSentiment(input)
        context.metadata = context.metadata || {}
        context.metadata.sentiment = sentiment
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
    analyzeSentiment(text) {
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
  })
exports.SentimentAnalyzerPreprocessorPlugin = SentimentAnalyzerPreprocessorPlugin
exports.SentimentAnalyzerPreprocessorPlugin =
  SentimentAnalyzerPreprocessorPlugin =
  SentimentAnalyzerPreprocessorPlugin_1 =
    __decorate([(0, common_1.Injectable)()], SentimentAnalyzerPreprocessorPlugin)
let KeywordExtractorSyncPlugin = (KeywordExtractorSyncPlugin_1 = class KeywordExtractorSyncPlugin {
  config = {
    id: 'keyword-extractor-sync',
    name: '关键词提取器',
    version: '1.0.0',
    type: vcp_plugin_system_service_1.VcpPluginType.SYNCHRONOUS,
    description: '提取文本中的重要关键词',
    author: 'VCPToolBox',
    enabled: true,
    priority: 80,
  }
  logger = new common_1.Logger(KeywordExtractorSyncPlugin_1.name)
  async init() {
    this.logger.log('Keyword extractor sync plugin initialized')
  }
  getInfo() {
    return this.config
  }
  async execute(context) {
    const startTime = Date.now()
    try {
      const input = context.input
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
  extractKeywords(text) {
    const words = text.split(/[^\u4e00-\u9fa5a-zA-Z]+/).filter((word) => word.length > 1)
    const wordFreq = new Map()
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
    return Array.from(wordFreq.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
        weight: frequency / words.length,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)
  }
})
exports.KeywordExtractorSyncPlugin = KeywordExtractorSyncPlugin
exports.KeywordExtractorSyncPlugin =
  KeywordExtractorSyncPlugin =
  KeywordExtractorSyncPlugin_1 =
    __decorate([(0, common_1.Injectable)()], KeywordExtractorSyncPlugin)
let DeepContentAnalyzerAsyncPlugin =
  (DeepContentAnalyzerAsyncPlugin_1 = class DeepContentAnalyzerAsyncPlugin {
    config = {
      id: 'deep-content-analyzer-async',
      name: '深度内容分析器',
      version: '1.0.0',
      type: vcp_plugin_system_service_1.VcpPluginType.ASYNCHRONOUS,
      description: '深度分析内容主题和情感',
      author: 'VCPToolBox',
      enabled: true,
      priority: 70,
    }
    logger = new common_1.Logger(DeepContentAnalyzerAsyncPlugin_1.name)
    activeTasks = new Map()
    async init() {
      this.logger.log('Deep content analyzer async plugin initialized')
    }
    getInfo() {
      return this.config
    }
    async executeAsync(context) {
      const taskId = `deep_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const abortController = new AbortController()
      const promise = this.performDeepAnalysis(context.input, abortController.signal)
      this.activeTasks.set(taskId, {
        promise,
        abortController,
      })
      promise.finally(() => {
        setTimeout(() => {
          this.activeTasks.delete(taskId)
        }, 300000)
      })
      return taskId
    }
    async getAsyncResult(taskId) {
      const task = this.activeTasks.get(taskId)
      if (!task) {
        throw new Error(`Task ${taskId} not found`)
      }
      return await task.promise
    }
    async cancelAsyncTask(taskId) {
      const task = this.activeTasks.get(taskId)
      if (!task || !task.abortController) {
        return false
      }
      task.abortController.abort()
      this.activeTasks.delete(taskId)
      return true
    }
    async performDeepAnalysis(content, signal) {
      const startTime = Date.now()
      try {
        if (signal.aborted) {
          throw new Error('Task was cancelled')
        }
        this.logger.debug('Starting deep content analysis...')
        await new Promise((resolve) => setTimeout(resolve, 2000))
        if (signal.aborted) throw new Error('Task was cancelled')
        const themes = this.analyzeThemes(content)
        await new Promise((resolve) => setTimeout(resolve, 3000))
        if (signal.aborted) throw new Error('Task was cancelled')
        const emotions = this.analyzeEmotions(content)
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
    analyzeThemes(content) {
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
    analyzeEmotions(content) {
      const emotions = {
        joy: content.includes('高兴') || content.includes('快乐') ? 0.8 : 0.1,
        sadness: content.includes('悲伤') || content.includes('难过') ? 0.7 : 0.1,
        anger: content.includes('生气') || content.includes('愤怒') ? 0.6 : 0.1,
        fear: content.includes('害怕') || content.includes('恐惧') ? 0.5 : 0.1,
      }
      const primary = Object.entries(emotions).sort(([, a], [, b]) => b - a)[0][0]
      return { primary, details: emotions }
    }
    assessQuality(content) {
      const factors = {
        length: Math.min(content.length / 100, 1),
        diversity: new Set(content.split('')).size / content.length,
        structure: content.includes('。') || content.includes('\n') ? 0.8 : 0.3,
      }
      const score = Math.round((Object.values(factors).reduce((sum, val) => sum + val, 0) / 3) * 10)
      return { score, factors }
    }
  })
exports.DeepContentAnalyzerAsyncPlugin = DeepContentAnalyzerAsyncPlugin
exports.DeepContentAnalyzerAsyncPlugin =
  DeepContentAnalyzerAsyncPlugin =
  DeepContentAnalyzerAsyncPlugin_1 =
    __decorate([(0, common_1.Injectable)()], DeepContentAnalyzerAsyncPlugin)
let CleanupServicePlugin = (CleanupServicePlugin_1 = class CleanupServicePlugin {
  config = {
    id: 'cleanup-service',
    name: '定时清理器',
    version: '1.0.0',
    type: vcp_plugin_system_service_1.VcpPluginType.SERVICE,
    description: '定时清理临时文件和过期数据',
    author: 'VCPToolBox',
    enabled: true,
    priority: 60,
    config: {
      cleanupInterval: 3600000,
      maxTempFiles: 1000,
    },
  }
  logger = new common_1.Logger(CleanupServicePlugin_1.name)
  cleanupInterval
  isRunning = false
  async init() {
    this.logger.log('Cleanup service plugin initialized')
  }
  async destroy() {
    await this.stopService()
    this.logger.log('Cleanup service plugin destroyed')
  }
  getInfo() {
    return this.config
  }
  async startService() {
    if (this.isRunning) {
      return
    }
    this.isRunning = true
    const interval = this.config.config?.cleanupInterval || 3600000
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performCleanup()
      } catch (error) {
        this.logger.error('Cleanup service error:', error)
      }
    }, interval)
    this.logger.log(`Cleanup service started with ${interval}ms interval`)
  }
  async stopService() {
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
  async healthCheck() {
    try {
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
  async performCleanup() {
    this.logger.debug('Performing cleanup...')
    const tempFilesCleaned = Math.floor(Math.random() * 50)
    const expiredDataCleaned = Math.floor(Math.random() * 20)
    this.logger.log(
      `Cleanup completed: ${tempFilesCleaned} temp files, ${expiredDataCleaned} expired data entries`
    )
  }
})
exports.CleanupServicePlugin = CleanupServicePlugin
exports.CleanupServicePlugin =
  CleanupServicePlugin =
  CleanupServicePlugin_1 =
    __decorate([(0, common_1.Injectable)()], CleanupServicePlugin)
let SmartCacheHybridServicePlugin =
  (SmartCacheHybridServicePlugin_1 = class SmartCacheHybridServicePlugin {
    config = {
      id: 'smart-cache-hybrid-service',
      name: '智能缓存服务',
      version: '1.0.0',
      type: vcp_plugin_system_service_1.VcpPluginType.HYBRID_SERVICE,
      description: '智能缓存管理和预热服务',
      author: 'VCPToolBox',
      enabled: true,
      priority: 50,
      config: {
        maxCacheSize: 1000,
        preheatInterval: 1800000,
        cacheExpiryMs: 3600000,
      },
    }
    logger = new common_1.Logger(SmartCacheHybridServicePlugin_1.name)
    cache = new Map()
    preheatInterval
    isRunning = false
    async init() {
      this.logger.log('Smart cache hybrid service plugin initialized')
    }
    async destroy() {
      await this.stopService()
      this.cache.clear()
      this.logger.log('Smart cache hybrid service plugin destroyed')
    }
    getInfo() {
      return this.config
    }
    async execute(context) {
      const startTime = Date.now()
      try {
        const { action, key, data } = context.input
        let result
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
    async executeAsync(context) {
      const taskId = `cache_prewarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const promise = this.performCachePrewarm(context.input)
      global.asyncTasks = global.asyncTasks || new Map()
      global.asyncTasks.set(taskId, promise)
      return taskId
    }
    async getAsyncResult(taskId) {
      const tasks = global.asyncTasks
      const promise = tasks?.get(taskId)
      if (!promise) {
        throw new Error(`Async task ${taskId} not found`)
      }
      const result = await promise
      tasks.delete(taskId)
      return result
    }
    async cancelAsyncTask(taskId) {
      const tasks = global.asyncTasks
      return tasks?.delete(taskId) || false
    }
    async startService() {
      if (this.isRunning) {
        return
      }
      this.isRunning = true
      const preheatInterval = this.config.config?.preheatInterval || 1800000
      this.preheatInterval = setInterval(async () => {
        try {
          await this.performPeriodicPrewarm()
        } catch (error) {
          this.logger.error('Cache prewarm error:', error)
        }
      }, preheatInterval)
      this.logger.log(`Smart cache service started with ${preheatInterval}ms preheat interval`)
    }
    async stopService() {
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
    async healthCheck() {
      try {
        const cacheSize = this.cache.size
        const maxSize = this.config.config?.maxCacheSize || 1000
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
    async executeHybrid(context, mode) {
      if (mode === 'sync') {
        return this.execute(context)
      } else {
        return this.executeAsync(context)
      }
    }
    getFromCache(key) {
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
    setInCache(key, data) {
      const maxSize = this.config.config?.maxCacheSize || 1000
      const expiryMs = this.config.config?.cacheExpiryMs || 3600000
      if (this.cache.size >= maxSize) {
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
    deleteFromCache(key) {
      return this.cache.delete(key)
    }
    hasInCache(key) {
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
    async performCachePrewarm(keys) {
      const startTime = Date.now()
      try {
        this.logger.debug(`Starting cache prewarm for ${keys.length} keys`)
        for (const key of keys) {
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
    async performPeriodicPrewarm() {
      this.logger.debug('Performing periodic cache prewarm...')
      const prewarmCandidates = ['hot_data_1', 'hot_data_2', 'frequently_accessed_data']
      await this.performCachePrewarm(prewarmCandidates)
    }
  })
exports.SmartCacheHybridServicePlugin = SmartCacheHybridServicePlugin
exports.SmartCacheHybridServicePlugin =
  SmartCacheHybridServicePlugin =
  SmartCacheHybridServicePlugin_1 =
    __decorate([(0, common_1.Injectable)()], SmartCacheHybridServicePlugin)
class VcpExamplePluginFactory {
  static createAllExamplePlugins() {
    return [
      new ContentFilterStaticPlugin(),
      new SentimentAnalyzerPreprocessorPlugin(),
      new KeywordExtractorSyncPlugin(),
      new DeepContentAnalyzerAsyncPlugin(),
      new CleanupServicePlugin(),
      new SmartCacheHybridServicePlugin(),
    ]
  }
  static createPluginByType(type) {
    switch (type) {
      case vcp_plugin_system_service_1.VcpPluginType.STATIC:
        return new ContentFilterStaticPlugin()
      case vcp_plugin_system_service_1.VcpPluginType.MESSAGE_PREPROCESSOR:
        return new SentimentAnalyzerPreprocessorPlugin()
      case vcp_plugin_system_service_1.VcpPluginType.SYNCHRONOUS:
        return new KeywordExtractorSyncPlugin()
      case vcp_plugin_system_service_1.VcpPluginType.ASYNCHRONOUS:
        return new DeepContentAnalyzerAsyncPlugin()
      case vcp_plugin_system_service_1.VcpPluginType.SERVICE:
        return new CleanupServicePlugin()
      case vcp_plugin_system_service_1.VcpPluginType.HYBRID_SERVICE:
        return new SmartCacheHybridServicePlugin()
      default:
        return null
    }
  }
}
exports.VcpExamplePluginFactory = VcpExamplePluginFactory
//# sourceMappingURL=vcp-example-plugins.js.map
