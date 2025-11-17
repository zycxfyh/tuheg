import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common'
import { PluginMarketplaceService } from './plugin-marketplace.service'
import { PluginReviewService } from './plugin-review.service'
import { PluginStatisticsService } from './plugin-statistics.service'
import { JwtAuthGuard } from '../security/jwt-auth.guard'
import { RolesGuard } from '../security/roles.guard'
import { Roles } from '../security/roles.decorator'
import {
  CreatePluginCategoryDto,
  UpdatePluginCategoryDto,
} from '../dto/plugin-marketplace.dto'

@Controller('plugins/marketplace/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
export class PluginMarketplaceAdminController {
  constructor(
    private readonly pluginService: PluginMarketplaceService,
    private readonly reviewService: PluginReviewService,
    private readonly statsService: PluginStatisticsService
  ) {}

  // ==================== 插件审核管理 ====================

  /**
   * 获取待审核插件列表
   */
  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async getPendingPlugins(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    const plugins = await this.pluginService.getPluginsByStatus('PENDING_REVIEW', {
      page,
      limit,
      includeAuthor: true,
      includeCategory: true,
      includeTags: true,
      includeStats: true
    })

    return {
      success: true,
      data: plugins,
      message: 'Pending plugins retrieved successfully'
    }
  }

  /**
   * 批准插件
   */
  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approvePlugin(@Param('id') pluginId: string, @Request() req: any) {
    const plugin = await this.pluginService.updatePluginStatus(
      pluginId,
      'APPROVED',
      req.user.id
    )

    return {
      success: true,
      data: plugin,
      message: 'Plugin approved successfully'
    }
  }

  /**
   * 拒绝插件
   */
  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectPlugin(
    @Param('id') pluginId: string,
    @Body() body: { reason?: string },
    @Request() req: any
  ) {
    const plugin = await this.pluginService.updatePluginStatus(
      pluginId,
      'REJECTED',
      req.user.id,
      body.reason
    )

    return {
      success: true,
      data: plugin,
      message: 'Plugin rejected successfully'
    }
  }

  /**
   * 暂停插件
   */
  @Put(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendPlugin(
    @Param('id') pluginId: string,
    @Body() body: { reason?: string },
    @Request() req: any
  ) {
    const plugin = await this.pluginService.updatePluginStatus(
      pluginId,
      'SUSPENDED',
      req.user.id,
      body.reason
    )

    return {
      success: true,
      data: plugin,
      message: 'Plugin suspended successfully'
    }
  }

  /**
   * 恢复插件
   */
  @Put(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendPlugin(@Param('id') pluginId: string, @Request() req: any) {
    const plugin = await this.pluginService.updatePluginStatus(
      pluginId,
      'APPROVED',
      req.user.id
    )

    return {
      success: true,
      data: plugin,
      message: 'Plugin unsuspended successfully'
    }
  }

  // ==================== 已发布插件管理 ====================

  /**
   * 获取已发布插件列表
   */
  @Get('published')
  @HttpCode(HttpStatus.OK)
  async getPublishedPlugins(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('q') query?: string
  ) {
    const plugins = await this.pluginService.searchPlugins(
      {
        status: status as any,
        query,
        page,
        limit
      },
      {
        includeAuthor: true,
        includeCategory: true,
        includeStats: true
      }
    )

    return {
      success: true,
      data: {
        plugins,
        pagination: {
          page,
          limit,
          total: plugins.length // TODO: 实现总数统计
        }
      },
      message: 'Published plugins retrieved successfully'
    }
  }

  // ==================== 分类管理 ====================

  /**
   * 创建插件分类
   */
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() createCategoryDto: CreatePluginCategoryDto) {
    const category = await this.pluginService.createCategory(createCategoryDto)

    return {
      success: true,
      data: category,
      message: 'Category created successfully'
    }
  }

  /**
   * 更新插件分类
   */
  @Put('categories/:id')
  @HttpCode(HttpStatus.OK)
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() updateCategoryDto: UpdatePluginCategoryDto
  ) {
    const category = await this.pluginService.updateCategory(categoryId, updateCategoryDto)

    return {
      success: true,
      data: category,
      message: 'Category updated successfully'
    }
  }

  /**
   * 删除插件分类
   */
  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCategory(@Param('id') categoryId: string) {
    await this.pluginService.deleteCategory(categoryId)

    return {
      success: true,
      message: 'Category deleted successfully'
    }
  }

  /**
   * 获取所有分类
   */
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getAllCategories() {
    const categories = await this.pluginService.getAllCategories()

    return {
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    }
  }

  // ==================== 标签管理 ====================

  /**
   * 创建插件标签
   */
  @Post('tags')
  @HttpCode(HttpStatus.CREATED)
  async createTag(@Body() body: { name: string; displayName: string; color?: string }) {
    const tag = await this.pluginService.createTag(body)

    return {
      success: true,
      data: tag,
      message: 'Tag created successfully'
    }
  }

  /**
   * 更新插件标签
   */
  @Put('tags/:id')
  @HttpCode(HttpStatus.OK)
  async updateTag(
    @Param('id') tagId: string,
    @Body() body: { displayName?: string; color?: string }
  ) {
    const tag = await this.pluginService.updateTag(tagId, body)

    return {
      success: true,
      data: tag,
      message: 'Tag updated successfully'
    }
  }

  /**
   * 删除插件标签
   */
  @Delete('tags/:id')
  @HttpCode(HttpStatus.OK)
  async deleteTag(@Param('id') tagId: string) {
    await this.pluginService.deleteTag(tagId)

    return {
      success: true,
      message: 'Tag deleted successfully'
    }
  }

  /**
   * 获取所有标签
   */
  @Get('tags')
  @HttpCode(HttpStatus.OK)
  async getAllTags() {
    const tags = await this.pluginService.getAllTags()

    return {
      success: true,
      data: tags,
      message: 'Tags retrieved successfully'
    }
  }

  // ==================== 统计分析 ====================

  /**
   * 获取插件市场统计数据
   */
  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  async getAnalytics(@Query('period') period: string = '30d') {
    const analytics = await this.statsService.getMarketplaceAnalytics(period)

    return {
      success: true,
      data: analytics,
      message: 'Analytics retrieved successfully'
    }
  }

  /**
   * 获取插件下载趋势
   */
  @Get('analytics/downloads')
  @HttpCode(HttpStatus.OK)
  async getDownloadTrends(@Query('days') days: number = 30) {
    const trends = await this.statsService.getDownloadTrends(days)

    return {
      success: true,
      data: trends,
      message: 'Download trends retrieved successfully'
    }
  }

  /**
   * 获取插件分类统计
   */
  @Get('analytics/categories')
  @HttpCode(HttpStatus.OK)
  async getCategoryStats() {
    const stats = await this.statsService.getCategoryStats()

    return {
      success: true,
      data: stats,
      message: 'Category stats retrieved successfully'
    }
  }

  // ==================== 审核历史 ====================

  /**
   * 获取插件审核历史
   */
  @Get(':id/audit-log')
  @HttpCode(HttpStatus.OK)
  async getPluginAuditLog(
    @Param('id') pluginId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const auditLog = await this.pluginService.getPluginAuditLog(pluginId, { page, limit })

    return {
      success: true,
      data: auditLog,
      message: 'Audit log retrieved successfully'
    }
  }

  /**
   * 获取所有插件审核历史
   */
  @Get('audit-log/all')
  @HttpCode(HttpStatus.OK)
  async getAllAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const auditLogs = await this.pluginService.getAuditLogs({
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    })

    return {
      success: true,
      data: auditLogs,
      message: 'Audit logs retrieved successfully'
    }
  }

  // ==================== 批量操作 ====================

  /**
   * 批量批准插件
   */
  @Post('batch/approve')
  @HttpCode(HttpStatus.OK)
  async batchApprovePlugins(@Body() body: { pluginIds: string[] }, @Request() req: any) {
    const results = await this.pluginService.batchUpdatePluginStatus(
      body.pluginIds,
      'APPROVED',
      req.user.id
    )

    return {
      success: true,
      data: results,
      message: `${results.successful.length} plugins approved successfully`
    }
  }

  /**
   * 批量暂停插件
   */
  @Post('batch/suspend')
  @HttpCode(HttpStatus.OK)
  async batchSuspendPlugins(
    @Body() body: { pluginIds: string[]; reason?: string },
    @Request() req: any
  ) {
    const results = await this.pluginService.batchUpdatePluginStatus(
      body.pluginIds,
      'SUSPENDED',
      req.user.id,
      body.reason
    )

    return {
      success: true,
      data: results,
      message: `${results.successful.length} plugins suspended successfully`
    }
  }

  // ==================== 系统配置 ====================

  /**
   * 获取插件市场配置
   */
  @Get('config')
  @HttpCode(HttpStatus.OK)
  async getMarketplaceConfig() {
    const config = await this.pluginService.getMarketplaceConfig()

    return {
      success: true,
      data: config,
      message: 'Marketplace config retrieved successfully'
    }
  }

  /**
   * 更新插件市场配置
   */
  @Put('config')
  @HttpCode(HttpStatus.OK)
  async updateMarketplaceConfig(@Body() config: any) {
    const updatedConfig = await this.pluginService.updateMarketplaceConfig(config)

    return {
      success: true,
      data: updatedConfig,
      message: 'Marketplace config updated successfully'
    }
  }
}
