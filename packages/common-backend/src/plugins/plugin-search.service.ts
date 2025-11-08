import { Injectable } from '@nestjs/common'
import type { SearchPluginsDto } from '../dto/plugin-marketplace.dto'
import type { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PluginSearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * 高级搜索插件
   */
  async advancedSearch(params: SearchPluginsDto) {
    const where: any = {
      status: 'APPROVED',
      isPublic: true,
    }

    // 全文搜索
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { displayName: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        {
          tags: {
            some: {
              name: { contains: params.q, mode: 'insensitive' },
            },
          },
        },
        {
          author: {
            email: { contains: params.q, mode: 'insensitive' },
          },
        },
      ]
    }

    // 分类过滤
    if (params.category) {
      where.categoryId = params.category
    }

    // 作者过滤
    if (params.author) {
      where.authorId = params.author
    }

    // 标签过滤
    if (params.tags && params.tags.length > 0) {
      where.tags = {
        some: {
          name: { in: params.tags },
        },
      }
    }

    // 状态过滤
    if (params.status) {
      where.status = params.status
    }

    // 精选过滤
    if (params.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured
    }

    // 评分过滤
    if (params.minRating) {
      where.averageRating = {
        gte: params.minRating,
      }
    }

    // 排序
    const orderBy: any = {}
    switch (params.sortBy) {
      case 'name':
        orderBy.name = params.sortOrder
        break
      case 'downloads':
        orderBy.totalDownloads = params.sortOrder
        break
      case 'rating':
        orderBy.averageRating = params.sortOrder
        break
      case 'createdAt':
        orderBy.createdAt = params.sortOrder
        break
      case 'updatedAt':
        orderBy.updatedAt = params.sortOrder
        break
      default:
        orderBy.totalDownloads = 'desc'
    }

    // 查询插件
    const [plugins, total] = await Promise.all([
      this.prisma.pluginMarketplace.findMany({
        where,
        include: {
          author: {
            select: { id: true, email: true },
          },
          category: {
            select: { id: true, displayName: true },
          },
          tags: {
            select: { id: true, name: true, displayName: true },
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
        orderBy,
        skip: params.offset,
        take: params.limit,
      }),
      this.prisma.pluginMarketplace.count({ where }),
    ])

    // 添加搜索相关的元数据
    const searchMetadata = await this.getSearchMetadata(params.q)

    return {
      plugins: plugins.map((plugin) => ({
        ...plugin,
        latestVersion: plugin.versions[0]?.version || null,
        lastUpdated: plugin.versions[0]?.createdAt || plugin.updatedAt,
      })),
      total,
      hasMore: params.offset + params.limit < total,
      searchMetadata,
    }
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return {
        plugins: [],
        tags: [],
        categories: [],
        authors: [],
      }
    }

    const [pluginSuggestions, tagSuggestions, categorySuggestions, authorSuggestions] =
      await Promise.all([
        // 插件名称建议
        this.prisma.pluginMarketplace.findMany({
          where: {
            OR: [
              { name: { startsWith: query, mode: 'insensitive' } },
              { displayName: { startsWith: query, mode: 'insensitive' } },
            ],
            status: 'APPROVED',
            isPublic: true,
          },
          select: {
            id: true,
            name: true,
            displayName: true,
            totalDownloads: true,
          },
          orderBy: { totalDownloads: 'desc' },
          take: Math.floor(limit / 4),
        }),

        // 标签建议
        this.prisma.pluginTag.findMany({
          where: {
            OR: [
              { name: { startsWith: query, mode: 'insensitive' } },
              { displayName: { startsWith: query, mode: 'insensitive' } },
            ],
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            displayName: true,
            usageCount: true,
          },
          orderBy: { usageCount: 'desc' },
          take: Math.floor(limit / 4),
        }),

        // 分类建议
        this.prisma.pluginCategory.findMany({
          where: {
            OR: [
              { name: { startsWith: query, mode: 'insensitive' } },
              { displayName: { startsWith: query, mode: 'insensitive' } },
            ],
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            displayName: true,
          },
          orderBy: { sortOrder: 'asc' },
          take: Math.floor(limit / 4),
        }),

        // 作者建议
        this.prisma.user.findMany({
          where: {
            authoredPlugins: {
              some: {
                status: 'APPROVED',
                isPublic: true,
              },
            },
          },
          select: {
            id: true,
            email: true,
            _count: {
              select: {
                authoredPlugins: {
                  where: {
                    status: 'APPROVED',
                    isPublic: true,
                  },
                },
              },
            },
          },
          orderBy: {
            authoredPlugins: {
              _count: 'desc',
            },
          },
          take: Math.floor(limit / 4),
        }),
      ])

    return {
      plugins: pluginSuggestions.map((p) => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        type: 'plugin',
      })),
      tags: tagSuggestions.map((t) => ({
        id: t.id,
        name: t.name,
        displayName: t.displayName,
        type: 'tag',
      })),
      categories: categorySuggestions.map((c) => ({
        id: c.id,
        name: c.name,
        displayName: c.displayName,
        type: 'category',
      })),
      authors: authorSuggestions.map((a) => ({
        id: a.id,
        name: a.email,
        displayName: a.email,
        pluginCount: a._count.authoredPlugins,
        type: 'author',
      })),
    }
  }

  /**
   * 相关插件推荐
   */
  async getRelatedPlugins(pluginId: string, limit: number = 6) {
    // 获取当前插件信息
    const currentPlugin = await this.prisma.pluginMarketplace.findUnique({
      where: { id: pluginId },
      select: {
        categoryId: true,
        tags: { select: { id: true } },
        authorId: true,
      },
    })

    if (!currentPlugin) {
      return []
    }

    const tagIds = currentPlugin.tags.map((t) => t.id)

    // 查找相关插件
    const relatedPlugins = await this.prisma.pluginMarketplace.findMany({
      where: {
        AND: [
          { id: { not: pluginId } },
          { status: 'APPROVED' },
          { isPublic: true },
          {
            OR: [
              { categoryId: currentPlugin.categoryId },
              {
                tags: {
                  some: {
                    id: { in: tagIds },
                  },
                },
              },
              { authorId: currentPlugin.authorId },
            ],
          },
        ],
      },
      include: {
        author: {
          select: { id: true, email: true },
        },
        category: {
          select: { id: true, displayName: true },
        },
        tags: {
          select: { id: true, name: true, displayName: true },
        },
        _count: {
          select: {
            downloads: true,
            reviews: true,
          },
        },
      },
      orderBy: { totalDownloads: 'desc' },
      take: limit,
    })

    return relatedPlugins
  }

  /**
   * 插件发现（基于用户偏好）
   */
  async discoverPlugins(userId?: string, limit: number = 10) {
    let preferredCategories: string[] = []
    let preferredTags: string[] = []

    if (userId) {
      // 基于用户历史下载和评价来推荐
      const userActivity = await Promise.all([
        // 用户下载过的插件
        this.prisma.pluginDownload.findMany({
          where: { userId },
          select: {
            plugin: {
              select: {
                categoryId: true,
                tags: { select: { id: true } },
              },
            },
          },
          take: 20,
        }),

        // 用户评价过的插件
        this.prisma.pluginReview.findMany({
          where: { userId },
          select: {
            plugin: {
              select: {
                categoryId: true,
                tags: { select: { id: true } },
              },
            },
          },
          take: 20,
        }),
      ])

      // 统计偏好分类和标签
      const categoryCount: Record<string, number> = {}
      const tagCount: Record<string, number> = {}

      ;[...userActivity[0], ...userActivity[1]].forEach((activity) => {
        if (activity.plugin.categoryId) {
          categoryCount[activity.plugin.categoryId] =
            (categoryCount[activity.plugin.categoryId] || 0) + 1
        }

        activity.plugin.tags.forEach((tag) => {
          tagCount[tag.id] = (tagCount[tag.id] || 0) + 1
        })
      })

      // 获取最受欢迎的分类和标签
      preferredCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id)

      preferredTags = Object.entries(tagCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id)
    }

    // 根据偏好推荐插件
    const where: any = {
      status: 'APPROVED',
      isPublic: true,
    }

    if (preferredCategories.length > 0 || preferredTags.length > 0) {
      where.OR = []

      if (preferredCategories.length > 0) {
        where.OR.push({
          categoryId: { in: preferredCategories },
        })
      }

      if (preferredTags.length > 0) {
        where.OR.push({
          tags: {
            some: {
              id: { in: preferredTags },
            },
          },
        })
      }
    }

    // 如果没有用户偏好数据，返回热门插件
    if (!where.OR || where.OR.length === 0) {
      return this.getTrendingPlugins(limit)
    }

    const plugins = await this.prisma.pluginMarketplace.findMany({
      where,
      include: {
        author: {
          select: { id: true, email: true },
        },
        category: {
          select: { id: true, displayName: true },
        },
        tags: {
          select: { id: true, name: true, displayName: true },
        },
        _count: {
          select: {
            downloads: true,
            reviews: true,
          },
        },
      },
      orderBy: { totalDownloads: 'desc' },
      take: limit,
    })

    return plugins
  }

  /**
   * 搜索热门关键词
   */
  async getPopularSearchTerms(limit: number = 20) {
    // 这里需要实现搜索关键词统计
    // 暂时返回一些热门标签作为建议
    const popularTags = await this.prisma.pluginTag.findMany({
      where: { isActive: true },
      select: {
        name: true,
        displayName: true,
        usageCount: true,
      },
      orderBy: { usageCount: 'desc' },
      take: limit,
    })

    return popularTags.map((tag) => ({
      term: tag.name,
      displayTerm: tag.displayName,
      count: tag.usageCount,
      type: 'tag',
    }))
  }

  /**
   * 高级过滤器选项
   */
  async getFilterOptions() {
    const [categories, tags, ratingRanges, dateRanges] = await Promise.all([
      // 分类选项
      this.prisma.pluginCategory.findMany({
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
      }),

      // 标签选项（最热门的）
      this.prisma.pluginTag.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          displayName: true,
          usageCount: true,
        },
        orderBy: { usageCount: 'desc' },
        take: 50,
      }),

      // 评分范围统计
      this.getRatingRangeStats(),

      // 时间范围选项
      Promise.resolve([
        { key: 'today', label: '今天', days: 1 },
        { key: 'week', label: '本周', days: 7 },
        { key: 'month', label: '本月', days: 30 },
        { key: 'quarter', label: '本季度', days: 90 },
        { key: 'year', label: '今年', days: 365 },
      ]),
    ])

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        displayName: c.displayName,
        count: c._count.plugins,
      })),
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        displayName: t.displayName,
        count: t.usageCount,
      })),
      ratingRanges,
      dateRanges,
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取搜索元数据
   */
  private async getSearchMetadata(query?: string) {
    if (!query) {
      return null
    }

    // 计算搜索结果的各种统计
    const searchTerm = query.toLowerCase()

    const [totalPlugins, categoryMatches, tagMatches, authorMatches] = await Promise.all([
      this.prisma.pluginMarketplace.count({
        where: {
          status: 'APPROVED',
          isPublic: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      }),

      // 匹配的分类数量
      this.prisma.pluginCategory.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      }),

      // 匹配的标签数量
      this.prisma.pluginTag.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      }),

      // 匹配的作者数量
      this.prisma.user.count({
        where: {
          authoredPlugins: {
            some: {
              status: 'APPROVED',
              isPublic: true,
            },
          },
          email: { contains: searchTerm, mode: 'insensitive' },
        },
      }),
    ])

    return {
      totalResults: totalPlugins,
      categoriesFound: categoryMatches,
      tagsFound: tagMatches,
      authorsFound: authorMatches,
      searchTerm: query,
      searchTimestamp: new Date().toISOString(),
    }
  }

  /**
   * 获取评分范围统计
   */
  private async getRatingRangeStats() {
    const ranges = [
      { min: 4.5, max: 5.0, label: '4.5星以上' },
      { min: 4.0, max: 4.5, label: '4.0-4.5星' },
      { min: 3.5, max: 4.0, label: '3.5-4.0星' },
      { min: 3.0, max: 3.5, label: '3.0-3.5星' },
      { min: 0, max: 3.0, label: '3.0星以下' },
    ]

    const stats = await Promise.all(
      ranges.map(async (range) => {
        const count = await this.prisma.pluginMarketplace.count({
          where: {
            status: 'APPROVED',
            isPublic: true,
            averageRating: {
              gte: range.min,
              lt: range.max,
            },
          },
        })

        return {
          ...range,
          count,
        }
      })
    )

    return stats
  }

  /**
   * 获取热门插件（内部方法）
   */
  private async getTrendingPlugins(limit: number) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return this.prisma.pluginMarketplace.findMany({
      where: {
        status: 'APPROVED',
        isPublic: true,
      },
      include: {
        author: {
          select: { id: true, email: true },
        },
        category: {
          select: { id: true, displayName: true },
        },
        tags: {
          select: { id: true, name: true, displayName: true },
        },
        _count: {
          select: {
            downloads: true,
            reviews: true,
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
  }
}
