import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { CreatePluginReviewDto, UpdatePluginReviewDto } from '../dto/plugin-marketplace.dto'
import type { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PluginReviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建插件评价
   */
  async createReview(pluginId: string, userId: string, data: CreatePluginReviewDto) {
    // 检查插件是否存在且已发布
    const plugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id: pluginId },
      select: { id: true, status: true, isPublic: true },
    })

    if (!plugin || plugin.status !== 'APPROVED' || !plugin.isPublic) {
      throw new NotFoundException('Plugin not found or not available')
    }

    // 检查用户是否已经评价过此插件
    const existingReview = await this.prisma.pluginReview.findUnique({
      where: {
        pluginId_userId: {
          pluginId,
          userId,
        },
      },
    })

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this plugin')
    }

    // 检查用户是否下载过此插件（可选，用于验证购买）
    const hasDownloaded =
      (await this.prisma.pluginDownload.count({
        where: {
          pluginId,
          userId,
        },
      })) > 0

    // 创建评价
    const review = await this.prisma.pluginReview.create({
      data: {
        pluginId,
        userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        isVerifiedPurchase: hasDownloaded,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    })

    // 更新插件的平均评分和评价数量
    await this.updatePluginRating(pluginId)

    return review
  }

  /**
   * 更新插件评价
   */
  async updateReview(reviewId: string, userId: string, data: UpdatePluginReviewDto) {
    // 检查评价是否存在且属于当前用户
    const review = await this.prisma.pluginReview.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, pluginId: true },
    })

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this review')
    }

    // 更新评价
    const updatedReview = await this.prisma.pluginReview.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        title: data.title,
        content: data.content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    })

    // 更新插件的平均评分
    await this.updatePluginRating(review.pluginId)

    return updatedReview
  }

  /**
   * 删除插件评价
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    // 检查评价是否存在且属于当前用户
    const review = await this.prisma.pluginReview.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, pluginId: true },
    })

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this review')
    }

    // 删除评价
    await this.prisma.pluginReview.delete({
      where: { id: reviewId },
    })

    // 更新插件的平均评分和评价数量
    await this.updatePluginRating(review.pluginId)
  }

  /**
   * 获取插件的评价列表
   */
  async getPluginReviews(
    pluginId: string,
    options: {
      page?: number
      limit?: number
      sort?: 'newest' | 'oldest' | 'rating' | 'helpful'
    } = {}
  ) {
    const { page = 1, limit = 20, sort = 'newest' } = options

    const skip = (page - 1) * limit

    // 构建排序条件
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'helpful':
        orderBy = { helpful: 'desc' }
        break
    }

    // 获取评价列表
    const [reviews, total] = await Promise.all([
      this.prisma.pluginReview.findMany({
        where: { pluginId },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.pluginReview.count({
        where: { pluginId },
      }),
    ])

    // 获取评分分布
    const ratingDistribution = await this.prisma.pluginReview.groupBy({
      by: ['rating'],
      where: { pluginId },
      _count: { rating: true },
    })

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating
    })

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      statistics: {
        totalReviews: total,
        averageRating: await this.getPluginAverageRating(pluginId),
        ratingDistribution: distribution,
      },
    }
  }

  /**
   * 为评价投票（有帮助/没帮助）
   */
  async voteReviewHelpful(reviewId: string, userId: string, helpful: boolean): Promise<void> {
    // 检查评价是否存在
    const review = await this.prisma.pluginReview.findUnique({
      where: { id: reviewId },
      select: { id: true, pluginId: true },
    })

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    // 检查用户是否已经投票过（这里简化处理，实际应该有投票记录表）
    // 为了简化，这里直接更新helpful计数
    const increment = helpful ? 1 : -1

    await this.prisma.pluginReview.update({
      where: { id: reviewId },
      data: {
        helpful: {
          increment,
        },
      },
    })
  }

  /**
   * 获取用户的评价列表
   */
  async getUserReviews(
    userId: string,
    options: {
      page?: number
      limit?: number
    } = {}
  ) {
    const { page = 1, limit = 20 } = options

    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      this.prisma.pluginReview.findMany({
        where: { userId },
        include: {
          plugin: {
            select: {
              id: true,
              name: true,
              displayName: true,
              author: {
                select: { id: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pluginReview.count({
        where: { userId },
      }),
    ])

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  }

  /**
   * 获取插件的平均评分
   */
  private async getPluginAverageRating(pluginId: string): Promise<number> {
    const result = await this.prisma.pluginReview.aggregate({
      where: { pluginId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return result._avg.rating || 0
  }

  /**
   * 更新插件的评分统计
   */
  private async updatePluginRating(pluginId: string): Promise<void> {
    const result = await this.prisma.pluginReview.aggregate({
      where: { pluginId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await this.prisma.pluginMarketplace.update({
      where: { id: pluginId },
      data: {
        averageRating: result._avg.rating,
        reviewCount: result._count.rating,
      },
    })
  }

  /**
   * 获取评价统计信息
   */
  async getReviewStatistics(pluginId: string) {
    const [totalReviews, averageRating, ratingDistribution, verifiedReviews] = await Promise.all([
      this.prisma.pluginReview.count({ where: { pluginId } }),
      this.getPluginAverageRating(pluginId),
      this.prisma.pluginReview.groupBy({
        by: ['rating'],
        where: { pluginId },
        _count: { rating: true },
      }),
      this.prisma.pluginReview.count({
        where: { pluginId, isVerifiedPurchase: true },
      }),
    ])

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating
    })

    return {
      totalReviews,
      averageRating,
      ratingDistribution: distribution,
      verifiedReviews,
      verificationRate: totalReviews > 0 ? verifiedReviews / totalReviews : 0,
    }
  }
}
