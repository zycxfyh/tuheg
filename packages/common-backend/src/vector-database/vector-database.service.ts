import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  VectorDatabaseService,
  VectorDatabase,
  DistanceMetric,
  IndexConfig,
  IndexType,
  CompressionConfig,
  RealTimeConfig,
} from './vector-database.interface'
import { PgVectorDatabase } from './pgvector-database.impl'

@Injectable()
export class VectorDatabaseServiceImpl implements VectorDatabaseService {
  private readonly logger = new Logger(VectorDatabaseServiceImpl.name)
  private databases = new Map<string, VectorDatabase>()
  private serviceStats = {
    totalCollections: 0,
    totalVectors: 0,
    totalStorage: 0,
    activeConnections: 0,
    uptime: Date.now(),
  }

  constructor(private configService: ConfigService) {}

  getDatabase(collection: string): VectorDatabase {
    if (!this.databases.has(collection)) {
      // 创建新的数据库实例
      const databaseUrl = this.configService.get<string>('DATABASE_URL')
      const db = new PgVectorDatabase({
        collectionName: collection,
        databaseUrl: databaseUrl || 'postgresql://localhost:5432/vectordb',
        dimension: 384, // 默认维度
        metric: DistanceMetric.COSINE,
        index: {
          type: IndexType.HNSW,
          metric: DistanceMetric.COSINE,
          parameters: {
            M: 16,
            efConstruction: 64,
          },
        },
        compression: {
          enabled: false,
          algorithm: 'pq',
          parameters: {},
        },
        realTime: {
          enabled: true,
          updateInterval: 1000,
          batchSize: 100,
          bufferSize: 1000,
          strategy: 'buffered',
        },
      })

      this.databases.set(collection, db)
      this.serviceStats.totalCollections++
    }

    return this.databases.get(collection)!
  }

  async createCollection(
    name: string,
    config: {
      dimension: number
      metric: DistanceMetric
      index: IndexConfig
      compression: CompressionConfig
      realTime: RealTimeConfig
    },
  ): Promise<void> {
    if (this.databases.has(name)) {
      throw new Error(`Collection ${name} already exists`)
    }

    const databaseUrl = this.configService.get<string>('DATABASE_URL')
    const db = new PgVectorDatabase({
      collectionName: name,
      databaseUrl: databaseUrl || 'postgresql://localhost:5432/vectordb',
      dimension: config.dimension,
      metric: config.metric,
      index: config.index,
      compression: config.compression,
      realTime: config.realTime,
    })

    await db.initialize(config)
    this.databases.set(name, db)
    this.serviceStats.totalCollections++

    this.logger.log(`Collection ${name} created successfully`)
  }

  async deleteCollection(name: string): Promise<void> {
    if (!this.databases.has(name)) {
      throw new Error(`Collection ${name} does not exist`)
    }

    // 在实际实现中，这里应该删除数据库表
    this.databases.delete(name)
    this.serviceStats.totalCollections--

    this.logger.log(`Collection ${name} deleted`)
  }

  async listCollections(): Promise<Array<{
    name: string
    stats: any
  }>> {
    const collections = []

    for (const [name, db] of this.databases) {
      try {
        const stats = await db.getStats()
        collections.push({ name, stats })
      } catch (error) {
        this.logger.error(`Failed to get stats for collection ${name}:`, error)
        collections.push({
          name,
          stats: { totalVectors: 0, error: 'Failed to get stats' },
        })
      }
    }

    return collections
  }

  async crossCollectionSearch(
    collections: string[],
    query: any,
  ): Promise<Record<string, any[]>> {
    const results: Record<string, any[]> = {}

    for (const collection of collections) {
      const db = this.databases.get(collection)
      if (db) {
        try {
          const searchResults = await db.search(query)
          results[collection] = searchResults
        } catch (error) {
          this.logger.error(`Failed to search collection ${collection}:`, error)
          results[collection] = []
        }
      } else {
        results[collection] = []
      }
    }

    return results
  }

  getServiceStats() {
    return { ...this.serviceStats }
  }
}
