import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { DataWarehouseAnalyticsService } from '../data-warehouse.interface'

@Controller('data-warehouse')
export class DataWarehouseController {
  constructor(
    @Inject('DataWarehouseAnalyticsService')
    private readonly analyticsService: DataWarehouseAnalyticsService,
  ) {}

  @Post('tables/:tableName')
  async createTable(
    @Param('tableName') tableName: string,
    @Body() config: { schema: Record<string, any>; layer: string },
  ) {
    const warehouseManager = this.analyticsService.getWarehouseManager()
    await warehouseManager.createTable(tableName, config.schema, config.layer as any)
    return { success: true }
  }

  @Post('tables/:tableName/data')
  async insertData(
    @Param('tableName') tableName: string,
    @Body() data: any[],
  ) {
    const warehouseManager = this.analyticsService.getWarehouseManager()
    const result = await warehouseManager.insertData(tableName, data)
    return result
  }

  @Get('tables/:tableName/stats')
  async getTableStats(@Param('tableName') tableName: string) {
    const warehouseManager = this.analyticsService.getWarehouseManager()
    const stats = await warehouseManager.getTableStats(tableName)
    return stats
  }

  @Post('behavior/track')
  async trackBehavior(@Body() event: any) {
    const behaviorAnalyzer = this.analyticsService.getUserBehaviorAnalyzer()
    await behaviorAnalyzer.trackEvent(event)
    return { success: true }
  }

  @Get('behavior/users/:userId/analyze')
  async analyzeUserBehavior(
    @Param('userId') userId: string,
    @Query() query: { start: string; end: string; type?: string },
  ) {
    const behaviorAnalyzer = this.analyticsService.getUserBehaviorAnalyzer()
    const result = await behaviorAnalyzer.analyzeUserBehavior(
      userId,
      {
        start: new Date(query.start),
        end: new Date(query.end),
      },
      query.type,
    )
    return result
  }

  @Get('behavior/group/analyze')
  async analyzeGroupBehavior(
    @Query() query: { start: string; end: string; filters: any },
  ) {
    const behaviorAnalyzer = this.analyticsService.getUserBehaviorAnalyzer()
    const result = await behaviorAnalyzer.analyzeGroupBehavior(
      query.filters || {},
      {
        start: new Date(query.start),
        end: new Date(query.end),
      },
    )
    return result
  }

  @Post('behavior/predict/:userId')
  async predictUserBehavior(
    @Param('userId') userId: string,
    @Body() config: { type: 'churn' | 'engagement' | 'feature_adoption'; timeWindow: number },
  ) {
    const behaviorAnalyzer = this.analyticsService.getUserBehaviorAnalyzer()
    const result = await behaviorAnalyzer.predictUserBehavior(
      userId,
      config.type,
      config.timeWindow,
    )
    return result
  }

  @Get('behavior/stats')
  async getBehaviorStats(
    @Query() query: { start: string; end: string; granularity: string },
  ) {
    const behaviorAnalyzer = this.analyticsService.getUserBehaviorAnalyzer()
    const result = await behaviorAnalyzer.getBehaviorStats(
      {
        start: new Date(query.start),
        end: new Date(query.end),
      },
      query.granularity as any,
    )
    return result
  }

  @Post('ai-content/evaluate')
  async evaluateAIContent(@Body() request: { content: string; metadata: any }) {
    const contentEvaluator = this.analyticsService.getAIContentEvaluator()
    const result = await contentEvaluator.evaluateContent(
      request.content,
      request.metadata,
    )
    return result
  }

  @Post('ai-content/compare')
  async compareAIModels(@Body() request: { evaluations: any[]; criteria: string[] }) {
    const contentEvaluator = this.analyticsService.getAIContentEvaluator()
    const result = await contentEvaluator.compareModels(
      request.evaluations,
      request.criteria,
    )
    return result
  }

  @Post('analytics/query')
  async executeAnalyticsQuery(@Body() query: any) {
    const analyticsEngine = this.analyticsService.getAnalyticsEngine()
    const result = await analyticsEngine.executeQuery(query)
    return result
  }

  @Get('stats')
  async getServiceStats() {
    const stats = this.analyticsService.getServiceStats()
    return stats
  }

  @Get('health')
  async healthCheck() {
    const health = await this.analyticsService.healthCheck()
    return health
  }
}
