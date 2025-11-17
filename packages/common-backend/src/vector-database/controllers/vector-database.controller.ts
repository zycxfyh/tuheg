import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { VectorDatabaseService } from '../vector-database.interface'
import { VectorPoint } from '../vector-database.interface'

@Controller('vector-db')
export class VectorDatabaseController {
  constructor(
    @Inject('VectorDatabaseService')
    private readonly vectorDbService: VectorDatabaseService,
  ) {}

  @Post('collections/:collection/points')
  async insertPoint(
    @Param('collection') collection: string,
    @Body() point: VectorPoint,
  ) {
    const db = this.vectorDbService.getDatabase(collection)
    await db.insert(point)
    return { success: true }
  }

  @Post('collections/:collection/points/batch')
  async insertBatch(
    @Param('collection') collection: string,
    @Body() points: VectorPoint[],
  ) {
    const db = this.vectorDbService.getDatabase(collection)
    const result = await db.insertBatch(points)
    return result
  }

  @Get('collections/:collection/points/:id')
  async getPoint(
    @Param('collection') collection: string,
    @Param('id') id: string,
  ) {
    const db = this.vectorDbService.getDatabase(collection)
    const point = await db.get(id)
    return point
  }

  @Put('collections/:collection/points/:id')
  async updatePoint(
    @Param('collection') collection: string,
    @Param('id') id: string,
    @Body() updates: Partial<VectorPoint>,
  ) {
    const db = this.vectorDbService.getDatabase(collection)
    await db.update(id, updates)
    return { success: true }
  }

  @Delete('collections/:collection/points/:id')
  async deletePoint(
    @Param('collection') collection: string,
    @Param('id') id: string,
  ) {
    const db = this.vectorDbService.getDatabase(collection)
    await db.delete(id)
    return { success: true }
  }

  @Post('collections/:collection/search')
  async search(
    @Param('collection') collection: string,
    @Body() query: {
      queryVector: number[]
      limit?: number
      threshold?: number
      filters?: Record<string, any>
    },
  ) {
    const db = this.vectorDbService.getDatabase(collection)
    const results = await db.search(query)
    return results
  }

  @Post('collections/:collection/hybrid-search')
  async hybridSearch(
    @Param('collection') collection: string,
    @Body() query: {
      queryVector: number[]
      textQuery?: string
      limit?: number
      filters?: Record<string, any>
    },
  ) {
    const db = this.vectorDbService.getDatabase(collection)
    const results = await db.hybridSearch(query)
    return results
  }

  @Post('collections/:collection/index/build')
  async buildIndex(@Param('collection') collection: string) {
    const db = this.vectorDbService.getDatabase(collection)
    const result = await db.buildIndex()
    return result
  }

  @Post('collections/:collection/index/optimize')
  async optimizeIndex(@Param('collection') collection: string) {
    const db = this.vectorDbService.getDatabase(collection)
    const result = await db.optimizeIndex()
    return result
  }

  @Get('collections/:collection/stats')
  async getStats(@Param('collection') collection: string) {
    const db = this.vectorDbService.getDatabase(collection)
    const stats = await db.getStats()
    return stats
  }

  @Get('collections/:collection/health')
  async healthCheck(@Param('collection') collection: string) {
    const db = this.vectorDbService.getDatabase(collection)
    const health = await db.healthCheck()
    return health
  }

  @Post('collections')
  async createCollection(
    @Body() config: {
      name: string
      dimension: number
      metric: string
      index: any
      compression: any
      realTime: any
    },
  ) {
    await this.vectorDbService.createCollection(config.name, {
      dimension: config.dimension,
      metric: config.metric as any,
      index: config.index,
      compression: config.compression,
      realTime: config.realTime,
    })
    return { success: true }
  }

  @Delete('collections/:name')
  async deleteCollection(@Param('name') name: string) {
    await this.vectorDbService.deleteCollection(name)
    return { success: true }
  }

  @Get('collections')
  async listCollections() {
    const collections = await this.vectorDbService.listCollections()
    return collections
  }

  @Post('cross-search')
  async crossCollectionSearch(
    @Body() request: {
      collections: string[]
      query: any
    },
  ) {
    const results = await this.vectorDbService.crossCollectionSearch(
      request.collections,
      request.query,
    )
    return results
  }

  @Get('stats')
  async getServiceStats() {
    const stats = this.vectorDbService.getServiceStats()
    return stats
  }
}
