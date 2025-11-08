import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type {
  CreatePluginCategoryDto,
  CreatePluginDto,
  CreatePluginReviewDto,
  CreatePluginTagDto,
  DownloadPluginDto,
  PluginStatisticsDto,
  ReviewPluginDto,
  SearchPluginsDto,
  UpdatePluginCategoryDto,
  UpdatePluginDto,
  UpdatePluginReviewDto,
} from '../dto/plugin-marketplace.dto'
import { JwtAuthGuard } from '../security/jwt-auth.guard'
import { Roles } from '../security/roles.decorator'
import { RolesGuard } from '../security/roles.guard'
import type { PluginMarketplaceService } from './plugin-marketplace.service'
import type { PluginReviewService } from './plugin-review.service'
import type { PluginSearchService } from './plugin-search.service'
import type { PluginStatisticsService } from './plugin-statistics.service'
import type { PluginUploadService } from './plugin-upload.service'

@Controller('plugins/marketplace')
export class PluginMarketplaceController {
  constructor(
    private readonly pluginService: PluginMarketplaceService,
    private readonly reviewService: PluginReviewService,
    private readonly statsService: PluginStatisticsService,
    private readonly uploadService: PluginUploadService,
    private readonly searchService: PluginSearchService
  ) {}

  // ==================== 插件管理 ====================

  /**
   * 获取插件列表（公开接口）
   */
  @Get()
  async getPlugins(@Query() query: SearchPluginsDto) {
    return this.pluginService.searchPlugins(query)
  }

  /**
   * 获取插件详情（公开接口）
   */
  @Get(':id')
  async getPlugin(@Param('id') id: string) {
    return this.pluginService.getPlugin(id, true)
  }

  /**
   * 创建新插件
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createPlugin(@Request() req, @Body() data: CreatePluginDto) {
    return this.pluginService.createPlugin(req.user.id, data)
  }

  /**
   * 更新插件信息
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePlugin(@Param('id') id: string, @Request() req, @Body() data: UpdatePluginDto) {
    return this.pluginService.updatePlugin(id, req.user.id, data)
  }

  /**
   * 删除插件（软删除）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePlugin(@Param('id') id: string, @Request() req) {
    await this.pluginService.deletePlugin(id, req.user.id)
    return { message: 'Plugin deleted successfully' }
  }

  /**
   * 上传插件包
   */
  @Post(':id/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPluginFile(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() data: { version: string; changelog?: string }
  ) {
    // 检查用户是否有权限上传到此插件
    const plugin = await this.pluginService.getPlugin(id)
    if (plugin.authorId !== req.user.id) {
      throw new ForbiddenException('You do not have permission to upload to this plugin')
    }

    return this.uploadService.uploadPluginFile(id, file, data)
  }

  /**
   * 下载插件
   */
  @Post(':id/download')
  async downloadPlugin(@Param('id') id: string, @Body() data: DownloadPluginDto, @Request() req) {
    return this.uploadService.downloadPlugin(
      id,
      data.version,
      req.user?.id,
      req.ip,
      req.get('User-Agent')
    )
  }

  // ==================== 插件审核（管理员权限） ====================

  /**
   * 审核插件
   */
  @Put(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  async reviewPlugin(@Param('id') id: string, @Request() req, @Body() data: ReviewPluginDto) {
    return this.pluginService.reviewPlugin(id, req.user.id, data)
  }

  /**
   * 获取待审核插件列表
   */
  @Get('admin/pending-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  async getPendingPlugins() {
    return this.pluginService.searchPlugins({
      status: 'PENDING_REVIEW',
      limit: 50,
    })
  }

  // ==================== 用户插件管理 ====================

  /**
   * 获取当前用户的插件
   */
  @Get('user/my-plugins')
  @UseGuards(JwtAuthGuard)
  async getMyPlugins(@Request() req, @Query('status') status?: string) {
    return this.pluginService.getUserPlugins(req.user.id, status as any)
  }

  /**
   * 获取用户发布的插件（公开接口）
   */
  @Get('user/:userId/plugins')
  async getUserPlugins(@Param('userId') userId: string) {
    return this.pluginService.getUserPlugins(userId, 'APPROVED')
  }

  // ==================== 插件评价 ====================

  /**
   * 获取插件评价列表
   */
  @Get(':id/reviews')
  async getPluginReviews(
    @Param('id') id: string,
    @Query() query: { page?: number; limit?: number; sort?: 'newest' | 'oldest' | 'rating' }
  ) {
    return this.reviewService.getPluginReviews(id, query)
  }

  /**
   * 创建插件评价
   */
  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  async createPluginReview(
    @Param('id') id: string,
    @Request() req,
    @Body() data: CreatePluginReviewDto
  ) {
    return this.reviewService.createReview(id, req.user.id, data)
  }

  /**
   * 更新插件评价
   */
  @Put(':id/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  async updatePluginReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Request() req,
    @Body() data: UpdatePluginReviewDto
  ) {
    return this.reviewService.updateReview(reviewId, req.user.id, data)
  }

  /**
   * 删除插件评价
   */
  @Delete(':id/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  async deletePluginReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Request() req
  ) {
    await this.reviewService.deleteReview(reviewId, req.user.id)
    return { message: 'Review deleted successfully' }
  }

  /**
   * 有帮助的评价投票
   */
  @Post(':id/reviews/:reviewId/helpful')
  @UseGuards(JwtAuthGuard)
  async voteReviewHelpful(
    @Param('reviewId') reviewId: string,
    @Request() req,
    @Body() data: { helpful: boolean }
  ) {
    return this.reviewService.voteReviewHelpful(reviewId, req.user.id, data.helpful)
  }

  // ==================== 插件分类管理 ====================

  /**
   * 获取所有插件分类
   */
  @Get('categories/all')
  async getCategories(@Query('activeOnly') activeOnly?: string) {
    const active = activeOnly !== 'false'
    return this.pluginService.getCategories(active)
  }

  /**
   * 创建插件分类（管理员权限）
   */
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createCategory(@Body() data: CreatePluginCategoryDto) {
    return this.pluginService.createCategory(data)
  }

  /**
   * 更新插件分类（管理员权限）
   */
  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateCategory(@Param('id') id: string, @Body() data: UpdatePluginCategoryDto) {
    return this.pluginService.updateCategory(id, data)
  }

  /**
   * 删除插件分类（管理员权限）
   */
  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteCategory(@Param('id') id: string) {
    await this.pluginService.deleteCategory(id)
    return { message: 'Category deleted successfully' }
  }

  // ==================== 插件标签管理 ====================

  /**
   * 获取所有插件标签
   */
  @Get('tags/all')
  async getTags(@Query('activeOnly') activeOnly?: string) {
    const active = activeOnly !== 'false'
    return this.pluginService.getTags(active)
  }

  /**
   * 创建插件标签（管理员权限）
   */
  @Post('tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createTag(@Body() data: CreatePluginTagDto) {
    return this.pluginService.createTag(data)
  }

  /**
   * 删除插件标签（管理员权限）
   */
  @Delete('tags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteTag(@Param('id') id: string) {
    await this.pluginService.deleteTag(id)
    return { message: 'Tag deleted successfully' }
  }

  // ==================== 插件搜索 ====================

  /**
   * 高级搜索插件
   */
  @Get('search/advanced')
  async advancedSearch(@Query() query: SearchPluginsDto) {
    return this.searchService.advancedSearch(query)
  }

  /**
   * 获取搜索建议
   */
  @Get('search/suggestions')
  async getSearchSuggestions(@Query('q') q: string) {
    return this.searchService.getSearchSuggestions(q)
  }

  // ==================== 插件统计 ====================

  /**
   * 获取插件统计信息
   */
  @Get(':id/statistics')
  async getPluginStatistics(@Param('id') id: string, @Query() query: PluginStatisticsDto) {
    return this.statsService.getPluginStatistics(id, query)
  }

  /**
   * 获取插件市场整体统计
   */
  @Get('statistics/market-overview')
  async getMarketStatistics(@Query() query: PluginStatisticsDto) {
    return this.statsService.getMarketOverview(query)
  }

  /**
   * 获取热门插件
   */
  @Get('statistics/trending')
  async getTrendingPlugins(@Query('limit') limit?: number) {
    return this.statsService.getTrendingPlugins(limit ? parseInt(limit.toString()) : 10)
  }

  /**
   * 获取精选插件
   */
  @Get('statistics/featured')
  async getFeaturedPlugins(@Query('limit') limit?: number) {
    return this.statsService.getFeaturedPlugins(limit ? parseInt(limit.toString()) : 10)
  }
}
