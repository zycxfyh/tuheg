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
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var ContextSummarizerService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.ContextSummarizerService = void 0
const prompts_1 = require('@langchain/core/prompts')
const common_1 = require('@nestjs/common')
const zod_1 = require('zod')
const ai_guard_1 = require('./ai-guard')
const summarySchema = zod_1.z.object({
  summary: zod_1.z.string().describe('对话的简洁摘要，保留关键信息和事件'),
  keyPoints: zod_1.z
    .array(zod_1.z.string())
    .optional()
    .describe('关键信息点列表（如角色、事件、决策等）'),
})
let ContextSummarizerService = (ContextSummarizerService_1 = class ContextSummarizerService {
  configService
  scheduler
  vectorSearch
  logger = new common_1.Logger(ContextSummarizerService_1.name)
  summaryCache = new Map()
  config
  constructor(configService, scheduler, vectorSearch) {
    this.configService = configService
    this.scheduler = scheduler
    this.vectorSearch = vectorSearch
    this.config = {
      recentEntriesCount: this.configService.get('CONTEXT_RECENT_ENTRIES_COUNT') || 10,
      summaryCount: this.configService.get('CONTEXT_SUMMARY_COUNT') || 3,
      entriesPerSummary: this.configService.get('CONTEXT_ENTRIES_PER_SUMMARY') || 20,
      enableCache: this.configService.get('CONTEXT_SUMMARY_CACHE_ENABLED') ?? true,
      cacheExpiryMs: this.configService.get('CONTEXT_SUMMARY_CACHE_EXPIRY_MS') || 3600000,
    }
    this.logger.log(
      `ContextSummarizerService initialized with config: ${JSON.stringify(this.config)}`
    )
  }
  async compressContext(entries, user, gameId, currentContext) {
    let retrievedMemories = []
    if (gameId && currentContext && this.configService.get('VECTOR_SEARCH_ENABLED', true)) {
      try {
        const searchResults = await this.vectorSearch.searchSimilarMemories(
          currentContext,
          gameId,
          user,
          {
            limit: 3,
            minSimilarity: 0.7,
          }
        )
        retrievedMemories = searchResults.map((result) => result.content)
        this.logger.debug(
          `Retrieved ${retrievedMemories.length} relevant memories via vector search`
        )
      } catch (error) {
        this.logger.warn(
          `Vector search failed, falling back to time-based retrieval:`,
          error instanceof Error ? error.message : String(error)
        )
      }
    }
    if (entries.length <= this.config.recentEntriesCount) {
      this.logger.debug(`Context is short (${entries.length} entries), no compression needed`)
      return {
        recentEntries: entries,
        summaries: [],
      }
    }
    const recentEntries = entries.slice(-this.config.recentEntriesCount)
    const historicalEntries = entries.slice(0, entries.length - this.config.recentEntriesCount)
    this.logger.debug(
      `Compressing context: ${entries.length} total entries, ` +
        `${recentEntries.length} recent, ${historicalEntries.length} historical`
    )
    const summaries = []
    const chunks = this.chunkEntries(historicalEntries, this.config.entriesPerSummary)
    const summaryPromises = chunks.map((chunk) => this.generateSummary(chunk, user))
    const chunkSummaries = await Promise.all(summaryPromises)
    summaries.push(...chunkSummaries.slice(-this.config.summaryCount))
    this.logger.log(
      `Context compressed: ${recentEntries.length} recent entries + ${summaries.length} summaries` +
        (retrievedMemories.length > 0 ? ` + ${retrievedMemories.length} retrieved memories` : '')
    )
    return {
      recentEntries,
      summaries,
    }
  }
  chunkEntries(entries, chunkSize) {
    const chunks = []
    for (let i = 0; i < entries.length; i += chunkSize) {
      chunks.push(entries.slice(i, i + chunkSize))
    }
    return chunks
  }
  async generateSummary(entries, user) {
    if (this.config.enableCache) {
      const cacheKey = this.generateCacheKey(entries)
      const cached = this.summaryCache.get(cacheKey)
      if (cached && cached.expiry > Date.now()) {
        this.logger.debug(`Using cached summary for ${entries.length} entries`)
        return cached.result
      }
    }
    this.logger.debug(`Generating summary for ${entries.length} entries`)
    const conversationText = entries.map((entry) => `[${entry.role}]: ${entry.content}`).join('\n')
    const provider = await this.scheduler.getProviderForRole(user, 'narrative_synthesis')
    const prompt = new prompts_1.PromptTemplate({
      template: `你是一个专业的对话摘要助手。请将以下对话历史压缩为简洁的摘要，保留关键信息和事件。

对话历史:
{conversation}

要求:
- 摘要应该保留关键角色、重要事件、主要决策
- 摘要应该简洁但信息完整
- 使用第三人称叙述
- 摘要长度应该约为原对话的 10-20%

请生成摘要和关键信息点。`,
      inputVariables: ['conversation'],
    })
    const chain = prompt.pipe(provider.model)
    const result = await (0, ai_guard_1.callAiWithGuard)(
      chain,
      { conversation: conversationText },
      summarySchema
    )
    const summaryResult = {
      summary: result.summary,
      entryCount: entries.length,
      timestamp: new Date(),
      keyPoints: result.keyPoints,
    }
    if (this.config.enableCache) {
      const cacheKey = this.generateCacheKey(entries)
      this.summaryCache.set(cacheKey, {
        result: summaryResult,
        expiry: Date.now() + this.config.cacheExpiryMs,
      })
      this.logger.debug(`Cached summary for ${entries.length} entries`)
    }
    return summaryResult
  }
  generateCacheKey(entries) {
    const content = entries.map((e) => `${e.role}:${e.content}`).join('|')
    return Buffer.from(content).toString('base64').slice(0, 64)
  }
  formatCompressedContext(compressed, retrievedMemories) {
    const parts = []
    if (retrievedMemories && retrievedMemories.length > 0) {
      parts.push('## 相关历史记忆（语义检索）')
      retrievedMemories.forEach((memory, index) => {
        parts.push(`${index + 1}. ${memory}`)
      })
      parts.push('\n---\n')
    }
    if (compressed.summaries.length > 0) {
      parts.push('## 历史对话摘要')
      compressed.summaries.forEach((summary, index) => {
        parts.push(`\n### 摘要 ${index + 1} (${summary.entryCount} 条对话)`)
        parts.push(summary.summary)
        if (summary.keyPoints && summary.keyPoints.length > 0) {
          parts.push('\n关键信息:')
          for (const point of summary.keyPoints) {
            parts.push(`- ${point}`)
          }
        }
      })
      parts.push('\n---\n')
    }
    if (compressed.recentEntries.length > 0) {
      parts.push('## 最近完整对话')
      compressed.recentEntries.forEach((entry) => {
        parts.push(`[${entry.role}]: ${entry.content}`)
      })
    }
    return parts.join('\n')
  }
  async compressAndFormatContext(entries, user, gameId, currentContext) {
    const compressed = await this.compressContext(entries, user, gameId, currentContext)
    let retrievedMemories = []
    if (gameId && currentContext && this.configService.get('VECTOR_SEARCH_ENABLED', true)) {
      try {
        const searchResults = await this.vectorSearch.searchSimilarMemories(
          currentContext,
          gameId,
          user,
          {
            limit: 3,
            minSimilarity: 0.7,
          }
        )
        retrievedMemories = searchResults.map((result) => result.content)
      } catch {}
    }
    return this.formatCompressedContext(compressed, retrievedMemories)
  }
  clearExpiredCache() {
    const now = Date.now()
    let cleared = 0
    for (const [key, value] of this.summaryCache.entries()) {
      if (value.expiry <= now) {
        this.summaryCache.delete(key)
        cleared++
      }
    }
    if (cleared > 0) {
      this.logger.debug(`Cleared ${cleared} expired cache entries`)
    }
  }
  getCacheStats() {
    return {
      size: this.summaryCache.size,
      entries: Array.from(this.summaryCache.values()).reduce(
        (sum, v) => sum + v.result.entryCount,
        0
      ),
    }
  }
})
exports.ContextSummarizerService = ContextSummarizerService
exports.ContextSummarizerService =
  ContextSummarizerService =
  ContextSummarizerService_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [Function, Function, Function])],
      ContextSummarizerService
    )
//# sourceMappingURL=context-summarizer.service.js.map
