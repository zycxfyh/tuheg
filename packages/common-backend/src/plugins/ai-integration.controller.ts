import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../security/jwt-auth.guard'
import type { AiMetricsService } from './ai-metrics.service'
import type { AiModelService } from './ai-model.service'
import type { AiProviderService } from './ai-provider.service'
import type { AiTaskQueueService } from './ai-task-queue.service'
import type { ModelRouterService } from './model-router.service'

@Controller('ai')
export class AiIntegrationController {
  constructor(
    private readonly providerService: AiProviderService,
    private readonly modelService: AiModelService,
    private readonly routerService: ModelRouterService,
    private readonly metricsService: AiMetricsService,
    private readonly taskQueueService: AiTaskQueueService
  ) {}

  // ==================== AI提供商管理 ====================

  /**
   * 获取所有AI提供商
   */
  @Get('providers')
  async getProviders(@Query('status') status?: string) {
    return this.providerService.getProviders(status ? { status: status as any } : undefined)
  }

  /**
   * 获取提供商详情
   */
  @Get('providers/:id')
  async getProvider(@Param('id') id: string) {
    return this.providerService.getProvider(id)
  }

  /**
   * 注册新提供商（管理员）
   */
  @Post('providers')
  @UseGuards(JwtAuthGuard)
  async registerProvider(@Body() data: any) {
    return this.providerService.registerProvider(data)
  }

  /**
   * 更新提供商
   */
  @Put('providers/:id')
  @UseGuards(JwtAuthGuard)
  async updateProvider(@Param('id') id: string, @Body() data: any) {
    return this.providerService.updateProvider(id, data)
  }

  /**
   * 删除提供商
   */
  @Delete('providers/:id')
  @UseGuards(JwtAuthGuard)
  async deleteProvider(@Param('id') id: string) {
    await this.providerService.deleteProvider(id)
    return { message: 'Provider deleted successfully' }
  }

  /**
   * 提供商健康检查
   */
  @Get('providers/:id/health')
  async checkProviderHealth(@Param('id') id: string) {
    return this.providerService.healthCheck(id)
  }

  /**
   * 批量健康检查
   */
  @Get('providers/health/batch')
  async batchHealthCheck() {
    return this.providerService.batchHealthCheck()
  }

  // ==================== AI模型管理 ====================

  /**
   * 获取所有AI模型
   */
  @Get('models')
  async getModels(@Query() filters: any) {
    return this.modelService.getModels(filters)
  }

  /**
   * 获取模型详情
   */
  @Get('models/:id')
  async getModel(@Param('id') id: string) {
    return this.modelService.getModel(id)
  }

  /**
   * 注册新模型
   */
  @Post('models')
  @UseGuards(JwtAuthGuard)
  async registerModel(@Body() data: { providerId: string; model: any }) {
    return this.modelService.registerModel(data.providerId, data.model)
  }

  /**
   * 更新模型
   */
  @Put('models/:id')
  @UseGuards(JwtAuthGuard)
  async updateModel(@Param('id') id: string, @Body() data: any) {
    return this.modelService.updateModel(id, data)
  }

  /**
   * 删除模型
   */
  @Delete('models/:id')
  @UseGuards(JwtAuthGuard)
  async deleteModel(@Param('id') id: string) {
    await this.modelService.deleteModel(id)
    return { message: 'Model deleted successfully' }
  }

  /**
   * 根据能力查找模型
   */
  @Get('models/capability/:capability')
  async findModelsByCapability(
    @Param('capability') capability: string,
    @Query('limit') limit?: number
  ) {
    return this.modelService.findModelsByCapability(capability, limit)
  }

  // ==================== 模型路由 ====================

  /**
   * 获取所有路由器
   */
  @Get('routers')
  async getRouters(@Query('activeOnly') activeOnly?: string) {
    const active = activeOnly !== 'false'
    return this.routerService.getRouters(active)
  }

  /**
   * 获取路由器详情
   */
  @Get('routers/:id')
  async getRouter(@Param('id') id: string) {
    return this.routerService.getRouter(id)
  }

  /**
   * 创建路由器
   */
  @Post('routers')
  @UseGuards(JwtAuthGuard)
  async createRouter(@Body() data: any) {
    return this.routerService.createRouter(data)
  }

  /**
   * 更新路由器
   */
  @Put('routers/:id')
  @UseGuards(JwtAuthGuard)
  async updateRouter(@Param('id') id: string, @Body() data: any) {
    return this.routerService.updateRouter(id, data)
  }

  /**
   * 删除路由器
   */
  @Delete('routers/:id')
  @UseGuards(JwtAuthGuard)
  async deleteRouter(@Param('id') id: string) {
    await this.routerService.deleteRouter(id)
    return { message: 'Router deleted successfully' }
  }

  /**
   * 执行智能路由
   */
  @Post('route')
  async routeRequest(@Body() request: any) {
    return this.routerService.routeRequest(request)
  }

  /**
   * 路由器健康检查
   */
  @Get('routers/:id/health')
  async checkRouterHealth(@Param('id') id: string) {
    return this.routerService.healthCheck(id)
  }

  // ==================== AI使用统计 ====================

  /**
   * 记录模型使用
   */
  @Post('usage')
  @UseGuards(JwtAuthGuard)
  async recordUsage(@Request() req, @Body() data: any) {
    return this.metricsService.recordModelUsage(req.user.id, data)
  }

  /**
   * 获取模型使用统计
   */
  @Get('usage/models/:modelId')
  async getModelUsageStats(@Param('modelId') modelId: string, @Query() query: any) {
    return this.metricsService.getModelUsageStats(modelId, query)
  }

  /**
   * 获取用户使用统计
   */
  @Get('usage/users/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserUsageStats(@Param('userId') userId: string, @Query() query: any) {
    return this.metricsService.getUserUsageStats(userId, query)
  }

  /**
   * 获取提供商统计
   */
  @Get('usage/providers/:providerId')
  async getProviderUsageStats(
    @Param('providerId') providerId: string,
    @Query('period') period?: string
  ) {
    return this.metricsService.getProviderUsageStats(providerId, period as any)
  }

  // ==================== AI任务队列 ====================

  /**
   * 添加任务到队列
   */
  @Post('queue')
  @UseGuards(JwtAuthGuard)
  async addToQueue(@Body() data: any) {
    return this.taskQueueService.addToQueue(data)
  }

  /**
   * 获取队列状态
   */
  @Get('queue')
  async getQueueStatus(@Query() filters: any) {
    return this.taskQueueService.getQueueStatus(filters)
  }

  /**
   * 获取任务详情
   */
  @Get('queue/:id')
  async getQueuedTask(@Param('id') id: string) {
    return this.taskQueueService.getQueuedTask(id)
  }

  /**
   * 取消队列任务
   */
  @Delete('queue/:id')
  @UseGuards(JwtAuthGuard)
  async cancelQueuedTask(@Param('id') id: string) {
    await this.taskQueueService.cancelQueuedTask(id)
    return { message: 'Task cancelled successfully' }
  }

  /**
   * 重试失败的任务
   */
  @Post('queue/:id/retry')
  @UseGuards(JwtAuthGuard)
  async retryQueuedTask(@Param('id') id: string) {
    return this.taskQueueService.retryQueuedTask(id)
  }

  // ==================== 智能推荐 ====================

  /**
   * 获取模型推荐
   */
  @Post('recommend/models')
  async getModelRecommendations(@Body() context: any) {
    return this.modelService.getRecommendations(context)
  }

  /**
   * 获取使用建议
   */
  @Get('recommend/usage/:userId')
  @UseGuards(JwtAuthGuard)
  async getUsageRecommendations(@Param('userId') userId: string) {
    return this.metricsService.getUsageRecommendations(userId)
  }

  /**
   * 获取性能洞察
   */
  @Get('insights/performance')
  async getPerformanceInsights(@Query() query: any) {
    return this.metricsService.getPerformanceInsights(query)
  }

  // ==================== 系统管理 ====================

  /**
   * 初始化内置提供商
   */
  @Post('setup/providers')
  @UseGuards(JwtAuthGuard)
  async initializeBuiltInProviders() {
    await this.providerService.initializeBuiltInProviders()
    return { message: 'Built-in providers initialized successfully' }
  }

  /**
   * 初始化内置路由器
   */
  @Post('setup/routers')
  @UseGuards(JwtAuthGuard)
  async initializeBuiltInRouters() {
    await this.routerService.initializeBuiltInRouters()
    return { message: 'Built-in routers initialized successfully' }
  }

  /**
   * 系统健康检查
   */
  @Get('health')
  async getSystemHealth() {
    const [providersHealth, modelsCount, activeRouters] = await Promise.all([
      this.providerService.batchHealthCheck(),
      this.modelService.getModels({ status: 'ACTIVE' }),
      this.routerService.getRouters(true),
    ])

    const unhealthyProviders = Object.values(providersHealth).filter(
      (health: any) => health.status === 'unhealthy'
    ).length

    const status =
      unhealthyProviders === 0
        ? 'healthy'
        : unhealthyProviders < Object.keys(providersHealth).length * 0.5
          ? 'degraded'
          : 'unhealthy'

    return {
      status,
      timestamp: new Date().toISOString(),
      components: {
        providers: {
          total: Object.keys(providersHealth).length,
          healthy: Object.values(providersHealth).filter((h: any) => h.status === 'healthy').length,
          unhealthy: unhealthyProviders,
        },
        models: {
          active: modelsCount.length,
        },
        routers: {
          active: activeRouters.length,
        },
      },
    }
  }

  /**
   * 获取系统统计
   */
  @Get('stats')
  async getSystemStats(@Query('period') period?: string) {
    const [totalUsage, providerStats, modelStats] = await Promise.all([
      this.metricsService.getTotalUsageStats(period as any),
      this.metricsService.getProviderStatsSummary(),
      this.metricsService.getModelStatsSummary(),
    ])

    return {
      period: period || 'month',
      usage: totalUsage,
      providers: providerStats,
      models: modelStats,
    }
  }
}
