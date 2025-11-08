var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
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
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var VectorSearchService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.VectorSearchService = void 0
const openai_1 = require('@langchain/openai')
const common_1 = require('@nestjs/common')
let VectorSearchService = (VectorSearchService_1 = class VectorSearchService {
  prisma
  configService
  logger = new common_1.Logger(VectorSearchService_1.name)
  embeddingsCache = new Map()
  config
  constructor(prisma, configService) {
    this.prisma = prisma
    this.configService = configService
    this.config = {
      limit: this.configService.get('VECTOR_SEARCH_LIMIT') || 5,
      minSimilarity: this.configService.get('VECTOR_SEARCH_MIN_SIMILARITY') || 0.7,
      enableCache: this.configService.get('VECTOR_SEARCH_CACHE_ENABLED') ?? true,
    }
    this.logger.log(`VectorSearchService initialized with config: ${JSON.stringify(this.config)}`)
  }
  async generateEmbedding(text, user) {
    if (this.config.enableCache) {
      const cached = this.embeddingsCache.get(text)
      if (cached) {
        this.logger.debug(`Using cached embedding for text: ${text.slice(0, 50)}...`)
        return cached
      }
    }
    try {
      let apiKey
      let baseUrl
      try {
        const userConfigs = await this.prisma.aiConfiguration.findMany({
          where: { ownerId: user.id },
        })
        if (userConfigs.length === 0) {
          throw new Error('用户没有配置AI提供商，无法进行向量搜索')
        }
        apiKey =
          this.configService.get('OPENAI_API_KEY') ||
          this.configService.get('EMBEDDING_API_KEY') ||
          ''
        baseUrl =
          this.configService.get('OPENAI_BASE_URL') ||
          this.configService.get('EMBEDDING_BASE_URL') ||
          'https://api.openai.com/v1'
      } catch (error) {
        this.logger.warn(
          `Failed to get user AI config, using system defaults:`,
          error instanceof Error ? error.message : String(error)
        )
        apiKey =
          this.configService.get('OPENAI_API_KEY') ||
          this.configService.get('EMBEDDING_API_KEY') ||
          ''
        baseUrl = this.configService.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1'
      }
      if (!apiKey) {
        throw new Error(
          'OpenAI API key not found. Please set OPENAI_API_KEY or EMBEDDING_API_KEY environment variable.'
        )
      }
      const embeddings = new openai_1.OpenAIEmbeddings({
        openAIApiKey: apiKey,
        configuration: {
          baseURL: baseUrl,
        },
        modelName: 'text-embedding-ada-002',
      })
      const embedding = await embeddings.embedQuery(text)
      if (embedding.length !== 1536) {
        throw new Error(`Unexpected embedding dimension: ${embedding.length}, expected 1536`)
      }
      if (this.config.enableCache) {
        this.embeddingsCache.set(text, embedding)
      }
      this.logger.debug(
        `Generated embedding for text: ${text.slice(0, 50)}... (dim: ${embedding.length})`
      )
      return embedding
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding:`,
        error instanceof Error ? error.message : String(error)
      )
      throw new Error(
        `Failed to generate embedding vector: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
  async searchSimilarMemories(queryText, gameId, user, options) {
    const startTime = Date.now()
    try {
      const queryEmbedding = await this.generateEmbedding(queryText, user)
      const minSimilarity = options?.minSimilarity ?? this.config.minSimilarity
      const limit = options?.limit ?? this.config.limit
      const embeddingStr = `[${queryEmbedding.join(',')}]`
      const results = await this.prisma.$queryRawUnsafe(
        `SELECT 
          id,
          content,
          "createdAt",
          1 - (embedding <=> $1::vector) AS similarity
        FROM "Memory"
        WHERE 
          "gameId" = $2
          AND embedding IS NOT NULL
          AND (1 - (embedding <=> $1::vector)) >= $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4`,
        embeddingStr,
        gameId,
        minSimilarity,
        limit
      )
      const duration = Date.now() - startTime
      this.logger.debug(`Vector search completed in ${duration}ms, found ${results.length} results`)
      return results.map((result) => ({
        id: result.id,
        content: result.content,
        similarity: Number(result.similarity),
        createdAt: result.createdAt,
      }))
    } catch (error) {
      this.logger.error(
        `Vector search failed:`,
        error instanceof Error ? error.message : String(error)
      )
      return []
    }
  }
  async generateAndStoreEmbedding(memoryId, content, user) {
    try {
      const embedding = await this.generateEmbedding(content, user)
      await this.prisma.$executeRaw`
        UPDATE "Memory"
        SET embedding = ${JSON.stringify(embedding)}::vector
        WHERE id = ${memoryId}
      `
      this.logger.debug(`Stored embedding for memory ${memoryId}`)
    } catch (error) {
      this.logger.error(
        `Failed to generate and store embedding for memory ${memoryId}:`,
        error instanceof Error ? error.message : String(error)
      )
    }
  }
  clearCache() {
    this.embeddingsCache.clear()
    this.logger.debug('Embeddings cache cleared')
  }
  getCacheStats() {
    return {
      size: this.embeddingsCache.size,
    }
  }
})
exports.VectorSearchService = VectorSearchService
exports.VectorSearchService =
  VectorSearchService =
  VectorSearchService_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [Function, Function])],
      VectorSearchService
    )
//# sourceMappingURL=vector-search.service.js.map
