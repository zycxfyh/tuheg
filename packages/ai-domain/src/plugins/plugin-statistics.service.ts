import { Injectable } from '@nestjs/common'
import type { PluginStatisticsDto } from '../dto/plugin-marketplace.dto'
import type { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PluginStatisticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取插件统计信息
   */
  async getPluginStatistics(pluginId: string, options: PluginStatisticsDto) {
    const { period = 'month', startDate, endDate } = options

    // 计算时间范围
    const dateRange = this.calculateDateRange(period, startDate, endDate)

    const [downloadStats, reviewStats, versionStats, dailyDownloads, ratingDistribution] =
      await Promise.all([
        this.getDownloadStatistics(pluginId, dateRange),
        this.getReviewStatistics(pluginId, dateRange),
        this.getVersionStatistics(pluginId),
        this.getDailyDownloadTrend(pluginId, dateRange),
        this.getRatingDistribution(pluginId),
      ])

    return {
      pluginId,
      period,
      dateRange,
      downloads: downloadStats,
      reviews: reviewStats,
      versions: versionStats,
      trends: {
        dailyDownloads,
      },
      ratings: ratingDistribution,
    }
  }

  /**
   * 获取插件市场概览统计
   */
  async getMarketOverview(options: PluginStatisticsDto) {
    const { period = 'month', startDate, endDate } = options
    const dateRange = this.calculateDateRange(period, startDate, endDate)

    const [totalPlugins, totalDownloads, totalReviews, categoryStats, topPlugins, recentActivity] =
      await Promise.all([
        this.prisma.pluginMarketplace.count({
          where: { status: 'APPROVED', isPublic: true },
        }),
        this.prisma.pluginDownload.count({
          where: {
            downloadedAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        }),
        this.prisma.pluginReview.count({
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        }),
        this.getCategoryStatistics(dateRange),
        this.getTopPlugins(dateRange, 10),
        this.getRecentActivity(dateRange, 20),
      ])

    return {
      period,
      dateRange,
      overview: {
        totalPlugins,
        totalDownloads,
        totalReviews,
        averageRating: await this.getMarketAverageRating(),
      },
      categoryStats,
      topPlugins,
      recentActivity,
    }
  }

  /**
   * 获取热门插件
   */
  async getTrendingPlugins(limit: number = 10) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const plugins = await this.prisma.pluginMarketplace.findMany({
      where: {
        status: 'APPROVED',
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        author: {
          select: { id: true, email: true },
        },
        category: {
          select: { id: true, displayName: true },
        },
        totalDownloads: true,
        averageRating: true,
        reviewCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            downloads: {
              where: {
                downloadedAt: { gte: thirtyDaysAgo },
              },
            },
          },
        },
      },
      orderBy: {
        downloads: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    return plugins.map((plugin) => ({
      ...plugin,
      recentDownloads: plugin._count.downloads,
    }))
  }

  /**
   * 获取精选插件
   */
  async getFeaturedPlugins(limit: number = 10) {
    const plugins = await this.prisma.pluginMarketplace.findMany({
      where: {
        status: 'APPROVED',
        isPublic: true,
        isFeatured: true,
      },
      include: {
        author: {
          select: { id: true, email: true },
        },
        category: {
          select: { id: true, displayName: true },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { version: true, createdAt: true },
        },
        _count: {
          select: {
            downloads: true,
            reviews: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    return plugins
  }

  // ==================== 私有方法 ====================

  /**
   * 计算时间范围
   */
  private calculateDateRange(period: string, startDate?: string, endDate?: string) {
    const now = new Date()
    let start: Date
    const end: Date = endDate ? new Date(endDate) : now

    if (startDate) {
      start = new Date(startDate)
    } else {
      switch (period) {
        case 'day':
          start = new Date(now)
          start.setHours(0, 0, 0, 0)
          break
        case 'week':
          start = new Date(now)
          start.setDate(now.getDate() - 7)
          break
        case 'month':
          start = new Date(now)
          start.setMonth(now.getMonth() - 1)
          break
        case 'year':
          start = new Date(now)
          start.setFullYear(now.getFullYear() - 1)
          break
        case 'all':
          start = new Date(2020, 0, 1) // 假设从2020年开始
          break
        default:
          start = new Date(now)
          start.setMonth(now.getMonth() - 1)
      }
    }

    return { start, end }
  }

  /**
   * 获取下载统计
   */
  private async getDownloadStatistics(pluginId: string, dateRange: { start: Date; end: Date }) {
    const [totalDownloads, periodDownloads, uniqueUsers, topVersions] = await Promise.all([
      this.prisma.pluginDownload.count({ where: { pluginId } }),
      this.prisma.pluginDownload.count({
        where: {
          pluginId,
          downloadedAt: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
      this.prisma.pluginDownload.findMany({
        where: {
          pluginId,
          downloadedAt: { gte: dateRange.start, lte: dateRange.end },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.pluginVersion.groupBy({
        by: ['version'],
        where: { pluginId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ])

    return {
      total: totalDownloads,
      period: periodDownloads,
      uniqueUsers: new Set(uniqueUsers.map((d) => d.userId).filter(Boolean)).size,
      topVersions: topVersions.map((v) => ({
        version: v.version,
        downloads: v._count.id,
      })),
    }
  }

  /**
   * 获取评价统计
   */
  private async getReviewStatistics(pluginId: string, dateRange: { start: Date; end: Date }) {
    const [totalReviews, periodReviews, averageRating, ratingDistribution] = await Promise.all([
      this.prisma.pluginReview.count({ where: { pluginId } }),
      this.prisma.pluginReview.count({
        where: {
          pluginId,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
      this.prisma.pluginReview.aggregate({
        where: { pluginId },
        _avg: { rating: true },
      }),
      this.prisma.pluginReview.groupBy({
        by: ['rating'],
        where: { pluginId },
        _count: { rating: true },
      }),
    ])

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating
    })

    return {
      total: totalReviews,
      period: periodReviews,
      averageRating: averageRating._avg.rating || 0,
      distribution,
    }
  }

  /**
   * 获取版本统计
   */
  private async getVersionStatistics(pluginId: string) {
    const versions = await this.prisma.pluginVersion.findMany({
      where: { pluginId },
      select: {
        version: true,
        downloads: true,
        createdAt: true,
        isStable: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      total: versions.length,
      stable: versions.filter((v) => v.isStable).length,
      latest: versions[0]?.version || null,
      versions: versions.map((v) => ({
        version: v.version,
        downloads: v.downloads,
        releasedAt: v.createdAt,
        isStable: v.isStable,
      })),
    }
  }

  /**
   * 获取每日下载趋势
   */
  private async getDailyDownloadTrend(pluginId: string, dateRange: { start: Date; end: Date }) {
    const downloads = await this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE(downloaded_at) as date,
        COUNT(*) as count
      FROM plugin_downloads
      WHERE plugin_id = ${pluginId}
        AND downloaded_at >= ${dateRange.start}
        AND downloaded_at <= ${dateRange.end}
      GROUP BY DATE(downloaded_at)
      ORDER BY date
    `

    return downloads.map((d) => ({
      date: d.date.toISOString().split('T')[0],
      downloads: Number(d.count),
    }))
  }

  /**
   * 获取评分分布
   */
  private async getRatingDistribution(pluginId: string) {
    const distribution = await this.prisma.pluginReview.groupBy({
      by: ['rating'],
      where: { pluginId },
      _count: { rating: true },
    })

    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    distribution.forEach((item) => {
      result[item.rating as keyof typeof result] = item._count.rating
    })

    return result
  }

  /**
   * 获取分类统计
   */
  private async getCategoryStatistics(dateRange: { start: Date; end: Date }) {
    const stats = await this.prisma.pluginCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        _count: {
          select: {
            plugins: {
              where: { status: 'APPROVED', isPublic: true },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // 为每个分类计算下载量
    const categoryStats = await Promise.all(
      stats.map(async (category) => {
        const downloads = await this.prisma.pluginDownload.count({
          where: {
            plugin: {
              categoryId: category.id,
              status: 'APPROVED',
              isPublic: true,
            },
            downloadedAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        })

        return {
          id: category.id,
          name: category.name,
          displayName: category.displayName,
          pluginCount: category._count.plugins,
          downloads,
        }
      })
    )

    return categoryStats
  }

  /**
   * 获取市场平均评分
   */
  private async getMarketAverageRating(): Promise<number> {
    const result = await this.prisma.pluginReview.aggregate({
      _avg: { rating: true },
    })

    return result._avg.rating || 0
  }

  /**
   * 获取热门插件
   */
  private async getTopPlugins(dateRange: { start: Date; end: Date }, limit: number) {
    const plugins = await this.prisma.pluginMarketplace.findMany({
      where: {
        status: 'APPROVED',
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        totalDownloads: true,
        averageRating: true,
        _count: {
          select: {
            downloads: {
              where: {
                downloadedAt: { gte: dateRange.start, lte: dateRange.end },
              },
            },
          },
        },
      },
      orderBy: {
        downloads: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    return plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      displayName: plugin.displayName,
      totalDownloads: plugin.totalDownloads,
      averageRating: plugin.averageRating,
      periodDownloads: plugin._count.downloads,
    }))
  }

  /**
   * 获取最近活动
   */
  private async getRecentActivity(dateRange: { start: Date; end: Date }, limit: number) {
    // 获取最近的插件发布
    const newPlugins = await this.prisma.pluginMarketplace.findMany({
      where: {
        status: 'APPROVED',
        isPublic: true,
        createdAt: { gte: dateRange.start, lte: dateRange.end },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        author: { select: { email: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 3),
    })

    // 获取最近的版本更新
    const versionUpdates = await this.prisma.pluginVersion.findMany({
      where: {
        createdAt: { gte: dateRange.start, lte: dateRange.end },
        plugin: {
          status: 'APPROVED',
          isPublic: true,
        },
      },
      select: {
        version: true,
        createdAt: true,
        plugin: {
          select: {
            id: true,
            name: true,
            displayName: true,
            author: { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 3),
    })

    // 获取最近的评价
    const reviews = await this.prisma.pluginReview.findMany({
      where: {
        createdAt: { gte: dateRange.start, lte: dateRange.end },
        plugin: {
          status: 'APPROVED',
          isPublic: true,
        },
      },
      select: {
        rating: true,
        createdAt: true,
        user: { select: { email: true } },
        plugin: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 3),
    })

    // 合并并排序所有活动
    const activities = [
      ...newPlugins.map((p) => ({
        type: 'plugin_created' as const,
        timestamp: p.createdAt,
        plugin: p,
        user: p.author.email,
      })),
      ...versionUpdates.map((v) => ({
        type: 'version_released' as const,
        timestamp: v.createdAt,
        plugin: v.plugin,
        version: v.version,
        user: v.plugin.author.email,
      })),
      ...reviews.map((r) => ({
        type: 'review_added' as const,
        timestamp: r.createdAt,
        plugin: r.plugin,
        rating: r.rating,
        user: r.user.email,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return activities.slice(0, limit)
  }
}
