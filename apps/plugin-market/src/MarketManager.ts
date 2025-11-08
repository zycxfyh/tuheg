import { EventEmitter } from 'events'
import { type PluginPackage, PluginRegistry } from '../vcptoolbox/src/publisher/Publisher'

// 插件市场管理器
// 专注于AI叙事插件的分发、发现和商业化

export interface MarketPlugin {
  id: string
  package: PluginPackage
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  featured: boolean
  trending: boolean
  verified: boolean
  tags: string[]
  categories: string[]
  screenshots: string[]
  videos?: string[]
  demoUrl?: string
  documentationUrl?: string
  supportUrl?: string
  sourceUrl?: string
  license: string
  stats: MarketStats
  reviews: PluginReview[]
  pricing: MarketPricing
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface MarketStats {
  downloads: number
  activeInstalls: number
  rating: number
  reviewCount: number
  revenue: number
  trendingScore: number
  popularityRank: number
  weeklyDownloads: number
  monthlyDownloads: number
  lastUpdated: Date
}

export interface PluginReview {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  content: string
  pros: string[]
  cons: string[]
  helpful: number
  verified: boolean
  version: string
  platform: string
  createdAt: Date
  updatedAt?: Date
}

export interface MarketPricing {
  model: 'free' | 'freemium' | 'paid' | 'subscription'
  currency: string
  basePrice?: number
  subscriptionPrice?: number
  trialDays?: number
  discount?: {
    percentage: number
    validUntil: Date
  }
  features: {
    free: string[]
    premium: string[]
  }
}

export interface MarketCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  pluginCount: number
  featured: boolean
  subcategories: string[]
}

export interface MarketSearchFilters {
  query?: string
  category?: string
  type?: string
  pricing?: 'free' | 'paid' | 'subscription'
  rating?: number
  verified?: boolean
  featured?: boolean
  trending?: boolean
  author?: string
  tags?: string[]
  compatibility?: string
  sortBy?: 'downloads' | 'rating' | 'newest' | 'trending' | 'price'
  sortOrder?: 'asc' | 'desc'
}

export interface MarketAnalytics {
  totalPlugins: number
  totalDownloads: number
  totalRevenue: number
  activeUsers: number
  topCategories: { category: string; downloads: number }[]
  revenueByCategory: { category: string; revenue: number }[]
  downloadTrends: { date: string; downloads: number }[]
  userGrowth: { date: string; users: number }[]
  topPlugins: MarketPlugin[]
  marketHealth: {
    averageRating: number
    reviewRate: number
    updateFrequency: number
    supportResponseTime: number
  }
}

export interface DeveloperProfile {
  id: string
  userId: string
  name: string
  bio: string
  avatar: string
  website?: string
  socialLinks: {
    twitter?: string
    github?: string
    linkedin?: string
  }
  verified: boolean
  reputation: number
  plugins: string[]
  stats: {
    totalDownloads: number
    totalRevenue: number
    averageRating: number
    followerCount: number
  }
  badges: DeveloperBadge[]
  joinedAt: Date
}

export interface DeveloperBadge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: Date
}

// 市场管理器类
export class MarketManager extends EventEmitter {
  private plugins: Map<string, MarketPlugin> = new Map()
  private categories: Map<string, MarketCategory> = new Map()
  private developers: Map<string, DeveloperProfile> = new Map()
  private featuredPlugins: string[] = []
  private trendingPlugins: string[] = []

  constructor() {
    super()
    this.initializeCategories()
    this.initializeSampleData()
  }

  // 初始化分类
  private initializeCategories() {
    const categories: MarketCategory[] = [
      {
        id: 'story-generation',
        name: '故事生成',
        description: 'AI驱动的故事创作和生成工具',
        icon: '📖',
        color: '#667eea',
        pluginCount: 0,
        featured: true,
        subcategories: ['fantasy', 'sci-fi', 'mystery', 'romance'],
      },
      {
        id: 'character-creation',
        name: '角色创建',
        description: '个性化角色设计和性格生成',
        icon: '👤',
        color: '#764ba2',
        pluginCount: 0,
        featured: true,
        subcategories: ['personality', 'appearance', 'relationships'],
      },
      {
        id: 'world-building',
        name: '世界构建',
        description: '沉浸式游戏世界和环境构建',
        icon: '🌍',
        color: '#f093fb',
        pluginCount: 0,
        featured: true,
        subcategories: ['geography', 'culture', 'magic', 'technology'],
      },
      {
        id: 'narrative-tools',
        name: '叙事工具',
        description: '故事结构和情节设计辅助工具',
        icon: '🎭',
        color: '#4facfe',
        pluginCount: 0,
        featured: false,
        subcategories: ['plot', 'dialogue', 'pacing', 'structure'],
      },
      {
        id: 'ui-themes',
        name: '界面主题',
        description: '自定义UI主题和视觉样式',
        icon: '🎨',
        color: '#43e97b',
        pluginCount: 0,
        featured: false,
        subcategories: ['dark', 'light', 'custom', 'animated'],
      },
      {
        id: 'integrations',
        name: '集成工具',
        description: '第三方服务和API集成',
        icon: '🔗',
        color: '#fa709a',
        pluginCount: 0,
        featured: false,
        subcategories: ['social', 'cloud', 'ai-services', 'export'],
      },
    ]

    categories.forEach((category) => {
      this.categories.set(category.id, category)
    })
  }

  // 初始化示例数据
  private initializeSampleData() {
    // 示例插件数据
    const samplePlugins: MarketPlugin[] = [
      {
        id: 'fantasy-world-builder-pro',
        package: {
          id: 'fantasy-world-builder-pro',
          version: '2.1.0',
          name: '奇幻世界构建大师Pro',
          description: '专业级奇幻世界构建工具，支持魔法体系、种族设定、地理环境生成',
          author: '奇幻大师工作室',
          type: 'world-builder',
          compatibility: {
            minVersion: '1.0.0',
            platforms: ['web', 'desktop'],
          },
          files: [],
          dependencies: ['@vcptoolbox/core'],
          metadata: {
            createdAt: new Date('2024-10-01'),
            updatedAt: new Date('2024-11-01'),
            downloads: 0,
            rating: 0,
            tags: ['fantasy', 'world-building', 'magic'],
            license: 'MIT',
            changelog: [],
          },
          checksum: 'abc123',
          createdAt: new Date('2024-10-01'),
          size: 15.2 * 1024 * 1024,
        },
        status: 'approved',
        featured: true,
        trending: true,
        verified: true,
        tags: ['fantasy', 'world-building', 'magic', 'pro'],
        categories: ['world-building'],
        screenshots: [
          '/plugins/fantasy-world-builder-pro/screenshot1.jpg',
          '/plugins/fantasy-world-builder-pro/screenshot2.jpg',
        ],
        videos: ['/plugins/fantasy-world-builder-pro/demo.mp4'],
        documentationUrl: '/docs/plugins/fantasy-world-builder-pro',
        supportUrl: '/support/plugins/fantasy-world-builder-pro',
        license: 'MIT',
        stats: {
          downloads: 15420,
          activeInstalls: 8950,
          rating: 4.8,
          reviewCount: 342,
          revenue: 89500,
          trendingScore: 95.2,
          popularityRank: 1,
          weeklyDownloads: 1250,
          monthlyDownloads: 5200,
          lastUpdated: new Date('2024-11-01'),
        },
        reviews: [],
        pricing: {
          model: 'paid',
          currency: 'CNY',
          basePrice: 199,
          features: {
            free: ['基础模板'],
            premium: ['高级魔法体系', '自定义种族', '复杂地形', '天气系统', '导出功能'],
          },
        },
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-11-01'),
        publishedAt: new Date('2024-10-15'),
      },
    ]

    samplePlugins.forEach((plugin) => {
      this.plugins.set(plugin.id, plugin)
      // 更新分类计数
      plugin.categories.forEach((catId) => {
        const category = this.categories.get(catId)
        if (category) {
          category.pluginCount++
        }
      })
    })

    this.featuredPlugins = ['fantasy-world-builder-pro']
    this.trendingPlugins = ['fantasy-world-builder-pro']
  }

  // 发布插件到市场
  async publishPlugin(
    pluginPackage: PluginPackage,
    metadata: {
      screenshots?: string[]
      videos?: string[]
      demoUrl?: string
      documentationUrl?: string
      supportUrl?: string
      categories: string[]
      tags: string[]
    }
  ): Promise<MarketPlugin> {
    const marketPlugin: MarketPlugin = {
      id: pluginPackage.id,
      package: pluginPackage,
      status: 'pending',
      featured: false,
      trending: false,
      verified: false,
      tags: metadata.tags,
      categories: metadata.categories,
      screenshots: metadata.screenshots || [],
      videos: metadata.videos,
      demoUrl: metadata.demoUrl,
      documentationUrl: metadata.documentationUrl,
      supportUrl: metadata.supportUrl,
      license: pluginPackage.metadata.license,
      stats: {
        downloads: 0,
        activeInstalls: 0,
        rating: 0,
        reviewCount: 0,
        revenue: 0,
        trendingScore: 0,
        popularityRank: 0,
        weeklyDownloads: 0,
        monthlyDownloads: 0,
        lastUpdated: new Date(),
      },
      reviews: [],
      pricing: {
        model: 'free',
        currency: 'CNY',
        features: {
          free: ['基础功能'],
          premium: [],
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.plugins.set(marketPlugin.id, marketPlugin)
    this.emit('pluginPublished', marketPlugin)

    return marketPlugin
  }

  // 审核插件
  async reviewPlugin(pluginId: string, approved: boolean, feedback?: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    if (approved) {
      plugin.status = 'approved'
      plugin.publishedAt = new Date()
    } else {
      plugin.status = 'rejected'
    }

    plugin.updatedAt = new Date()

    this.emit('pluginReviewed', { plugin, approved, feedback })
    return true
  }

  // 更新插件统计
  updatePluginStats(pluginId: string, stats: Partial<MarketStats>): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return

    plugin.stats = { ...plugin.stats, ...stats }
    plugin.stats.lastUpdated = new Date()
    plugin.updatedAt = new Date()

    // 重新计算排名
    this.updatePopularityRankings()
    this.updateTrendingPlugins()
  }

  // 记录下载
  recordDownload(pluginId: string, userId?: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return

    plugin.stats.downloads++
    plugin.stats.weeklyDownloads++
    plugin.stats.monthlyDownloads++

    // 更新趋势分数
    this.updateTrendingScore(plugin)

    this.emit('pluginDownloaded', { pluginId, userId })
  }

  // 添加评价
  async addReview(
    pluginId: string,
    review: Omit<PluginReview, 'id' | 'createdAt'>
  ): Promise<PluginReview> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return null as any

    const newReview: PluginReview = {
      ...review,
      id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    plugin.reviews.push(newReview)

    // 更新评分
    this.updatePluginRating(plugin)

    plugin.stats.reviewCount++
    plugin.updatedAt = new Date()

    this.emit('reviewAdded', { pluginId, review: newReview })

    return newReview
  }

  // 搜索插件
  searchPlugins(
    filters: MarketSearchFilters,
    limit = 20,
    offset = 0
  ): {
    plugins: MarketPlugin[]
    total: number
    hasMore: boolean
  } {
    let plugins = Array.from(this.plugins.values())

    // 应用过滤器
    if (filters.query) {
      const query = filters.query.toLowerCase()
      plugins = plugins.filter(
        (p) =>
          p.package.name.toLowerCase().includes(query) ||
          p.package.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    if (filters.category) {
      plugins = plugins.filter((p) => p.categories.includes(filters.category!))
    }

    if (filters.type) {
      plugins = plugins.filter((p) => p.package.type === filters.type)
    }

    if (filters.pricing) {
      plugins = plugins.filter((p) => p.pricing.model === filters.pricing)
    }

    if (filters.rating) {
      plugins = plugins.filter((p) => p.stats.rating >= filters.rating!)
    }

    if (filters.verified !== undefined) {
      plugins = plugins.filter((p) => p.verified === filters.verified)
    }

    if (filters.featured !== undefined) {
      plugins = plugins.filter((p) => p.featured === filters.featured)
    }

    if (filters.trending !== undefined) {
      plugins = plugins.filter((p) => p.trending === filters.trending)
    }

    if (filters.author) {
      plugins = plugins.filter((p) => p.package.author === filters.author)
    }

    if (filters.tags && filters.tags.length > 0) {
      plugins = plugins.filter((p) => filters.tags!.some((tag) => p.tags.includes(tag)))
    }

    // 只返回已批准的插件
    plugins = plugins.filter((p) => p.status === 'approved')

    const total = plugins.length

    // 排序
    const sortBy = filters.sortBy || 'downloads'
    const sortOrder = filters.sortOrder || 'desc'

    plugins.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'downloads':
          aValue = a.stats.downloads
          bValue = b.stats.downloads
          break
        case 'rating':
          aValue = a.stats.rating
          bValue = b.stats.rating
          break
        case 'newest':
          aValue = a.publishedAt?.getTime() || 0
          bValue = b.publishedAt?.getTime() || 0
          break
        case 'trending':
          aValue = a.stats.trendingScore
          bValue = b.stats.trendingScore
          break
        case 'price':
          aValue = a.pricing.basePrice || 0
          bValue = b.pricing.basePrice || 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    // 分页
    const startIndex = offset
    const endIndex = startIndex + limit
    const paginatedPlugins = plugins.slice(startIndex, endIndex)

    return {
      plugins: paginatedPlugins,
      total,
      hasMore: endIndex < total,
    }
  }

  // 获取推荐插件
  getRecommendedPlugins(userId?: string, limit = 10): MarketPlugin[] {
    // 简化版推荐算法
    // 实际实现应该基于用户行为、偏好等
    const plugins = Array.from(this.plugins.values())
      .filter((p) => p.status === 'approved')
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .slice(0, limit)

    return plugins
  }

  // 获取热门插件
  getTrendingPlugins(limit = 10): MarketPlugin[] {
    return this.trendingPlugins
      .map((id) => this.plugins.get(id))
      .filter((p) => p !== undefined)
      .slice(0, limit) as MarketPlugin[]
  }

  // 获取精选插件
  getFeaturedPlugins(limit = 10): MarketPlugin[] {
    return this.featuredPlugins
      .map((id) => this.plugins.get(id))
      .filter((p) => p !== undefined)
      .slice(0, limit) as MarketPlugin[]
  }

  // 获取插件详情
  getPlugin(pluginId: string): MarketPlugin | null {
    return this.plugins.get(pluginId) || null
  }

  // 获取分类
  getCategories(): MarketCategory[] {
    return Array.from(this.categories.values())
  }

  // 获取市场分析
  getMarketAnalytics(): MarketAnalytics {
    const plugins = Array.from(this.plugins.values())
    const approvedPlugins = plugins.filter((p) => p.status === 'approved')

    const totalDownloads = approvedPlugins.reduce((sum, p) => sum + p.stats.downloads, 0)
    const totalRevenue = approvedPlugins.reduce((sum, p) => sum + p.stats.revenue, 0)

    // 分类统计
    const categoryStats = new Map<string, { downloads: number; revenue: number }>()
    approvedPlugins.forEach((plugin) => {
      plugin.categories.forEach((catId) => {
        const stats = categoryStats.get(catId) || { downloads: 0, revenue: 0 }
        stats.downloads += plugin.stats.downloads
        stats.revenue += plugin.stats.revenue
        categoryStats.set(catId, stats)
      })
    })

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({ category, downloads: stats.downloads }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10)

    const revenueByCategory = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({ category, revenue: stats.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // 模拟趋势数据
    const downloadTrends = []
    const userGrowth = []
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      downloadTrends.push({
        date: date.toISOString().split('T')[0],
        downloads: Math.floor((totalDownloads * (0.5 + Math.random() * 0.5)) / 30),
      })
      userGrowth.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(1000 + Math.random() * 500),
      })
    }

    const topPlugins = approvedPlugins
      .sort((a, b) => b.stats.downloads - a.stats.downloads)
      .slice(0, 10)

    const averageRating =
      approvedPlugins.length > 0
        ? approvedPlugins.reduce((sum, p) => sum + p.stats.rating, 0) / approvedPlugins.length
        : 0

    return {
      totalPlugins: approvedPlugins.length,
      totalDownloads,
      totalRevenue,
      activeUsers: 1250, // 模拟数据
      topCategories,
      revenueByCategory,
      downloadTrends,
      userGrowth,
      topPlugins,
      marketHealth: {
        averageRating,
        reviewRate: 0.15, // 15%的插件有评价
        updateFrequency: 7, // 平均7天更新一次
        supportResponseTime: 4, // 平均4小时回复
      },
    }
  }

  // 私有方法
  private updatePluginRating(plugin: MarketPlugin): void {
    if (plugin.reviews.length === 0) {
      plugin.stats.rating = 0
      return
    }

    const totalRating = plugin.reviews.reduce((sum, review) => sum + review.rating, 0)
    plugin.stats.rating = totalRating / plugin.reviews.length
  }

  private updatePopularityRankings(): void {
    const plugins = Array.from(this.plugins.values())
      .filter((p) => p.status === 'approved')
      .sort((a, b) => b.stats.downloads - a.stats.downloads)

    plugins.forEach((plugin, index) => {
      plugin.stats.popularityRank = index + 1
    })
  }

  private updateTrendingPlugins(): void {
    const plugins = Array.from(this.plugins.values())
      .filter((p) => p.status === 'approved')
      .sort((a, b) => b.stats.trendingScore - a.stats.trendingScore)

    this.trendingPlugins = plugins.slice(0, 20).map((p) => p.id)
  }

  private updateTrendingScore(plugin: MarketPlugin): void {
    // 简化的趋势评分算法
    // 综合考虑下载量增长、评分、活跃度等
    const downloadWeight = 0.4
    const ratingWeight = 0.3
    const recencyWeight = 0.3

    const daysSinceUpdate =
      (Date.now() - plugin.stats.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 30 - daysSinceUpdate) / 30 // 30天内更新有加成

    plugin.stats.trendingScore =
      plugin.stats.downloads * downloadWeight +
      plugin.stats.rating * ratingWeight * 20 +
      recencyScore * recencyWeight * 100
  }
}

// 创建单例实例
export const marketManager = new MarketManager()
