import { EventEmitter } from 'events'

// 插件类型定义
export interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: PluginAuthor
  category: PluginCategory
  tags: string[]
  pricing: PluginPricing
  stats: PluginStats
  reviews: PluginReview[]
  media: PluginMedia[]
  technical: PluginTechnical
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

// 插件作者
export interface PluginAuthor {
  id: string
  name: string
  email: string
  avatar?: string
  verified: boolean
  reputation: number
  pluginsCount: number
}

// 插件分类
export type PluginCategory =
  | 'world-building'
  | 'character-creation'
  | 'story-generation'
  | 'narrative-tools'
  | 'ui-themes'
  | 'language-packs'
  | 'integrations'
  | 'utilities'

// 插件定价
export interface PluginPricing {
  model: 'free' | 'freemium' | 'paid' | 'subscription'
  price?: number
  currency?: string
  trialDays?: number
  subscriptionPrice?: number
  features: {
    free: string[]
    premium: string[]
  }
}

// 插件统计
export interface PluginStats {
  downloads: number
  activeInstalls: number
  rating: number
  reviewCount: number
  revenue: number
  trending: boolean
}

// 插件评价
export interface PluginReview {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  content: string
  pros: string[]
  cons: string[]
  helpful: number
  createdAt: Date
  verified: boolean
}

// 插件媒体
export interface PluginMedia {
  type: 'image' | 'video' | 'demo'
  url: string
  thumbnail?: string
  title: string
  description?: string
}

// 插件技术信息
export interface PluginTechnical {
  compatibility: {
    minVersion: string
    maxVersion?: string
    platforms: string[]
  }
  dependencies: string[]
  permissions: string[]
  fileSize: number
  checksum: string
  downloadUrl: string
}

// 插件购买记录
export interface PluginPurchase {
  id: string
  userId: string
  pluginId: string
  type: 'purchase' | 'subscription' | 'trial'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'refunded' | 'cancelled'
  purchasedAt: Date
  expiresAt?: Date
  licenseKey?: string
}

// 插件市场管理器
export class PluginMarketManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map()
  private purchases: Map<string, PluginPurchase[]> = new Map()
  private categories: PluginCategory[] = [
    'world-building',
    'character-creation',
    'story-generation',
    'narrative-tools',
    'ui-themes',
    'language-packs',
    'integrations',
    'utilities',
  ]

  constructor() {
    super()
    this.initializeMarketplace()
  }

  // 初始化市场
  private initializeMarketplace() {
    // 创建一些示例插件
    const samplePlugins: Plugin[] = [
      {
        id: 'fantasy-world-builder',
        name: '奇幻世界构建器',
        description: '专业的奇幻世界构建工具，支持魔法体系、种族设定、地理环境等',
        version: '1.2.0',
        author: {
          id: 'author-1',
          name: '奇幻大师工作室',
          email: 'contact@fantasy-master.com',
          verified: true,
          reputation: 4.8,
          pluginsCount: 5,
        },
        category: 'world-building',
        tags: ['fantasy', 'magic', 'world-building', 'rpg'],
        pricing: {
          model: 'freemium',
          price: 49,
          currency: 'CNY',
          trialDays: 7,
          features: {
            free: ['基础世界模板', '简单地理生成'],
            premium: ['高级魔法体系', '自定义种族', '复杂地形', '天气系统'],
          },
        },
        stats: {
          downloads: 1250,
          activeInstalls: 890,
          rating: 4.6,
          reviewCount: 89,
          revenue: 24500,
          trending: true,
        },
        reviews: [],
        media: [
          {
            type: 'image',
            url: '/plugins/fantasy-world-builder/screenshot1.jpg',
            title: '魔法森林生成器界面',
          },
          {
            type: 'video',
            url: '/plugins/fantasy-world-builder/demo.mp4',
            thumbnail: '/plugins/fantasy-world-builder/video-thumb.jpg',
            title: '完整功能演示',
          },
        ],
        technical: {
          compatibility: {
            minVersion: '1.0.0',
            platforms: ['web', 'desktop'],
          },
          dependencies: [],
          permissions: ['world-building', 'file-system'],
          fileSize: 15.2,
          checksum: 'abc123...',
          downloadUrl: '/downloads/plugins/fantasy-world-builder-1.2.0.zip',
        },
        status: 'approved',
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-11-01'),
        publishedAt: new Date('2024-10-15'),
      },
      {
        id: 'character-relationship-mapper',
        name: '角色关系映射器',
        description: '可视化角色关系网络，支持复杂的人物关系图谱分析',
        version: '2.1.0',
        author: {
          id: 'author-2',
          name: '叙事工具专家',
          email: 'tools@narrative-expert.com',
          verified: true,
          reputation: 4.9,
          pluginsCount: 8,
        },
        category: 'character-creation',
        tags: ['character', 'relationships', 'visualization', 'network'],
        pricing: {
          model: 'subscription',
          subscriptionPrice: 19,
          currency: 'CNY',
          features: {
            free: ['基础关系图', '最多5个角色'],
            premium: ['无限角色', '关系分析', '导出功能', '协作编辑'],
          },
        },
        stats: {
          downloads: 2100,
          activeInstalls: 1450,
          rating: 4.8,
          reviewCount: 156,
          revenue: 18500,
          trending: true,
        },
        reviews: [],
        media: [
          {
            type: 'image',
            url: '/plugins/character-relationship-mapper/network-view.jpg',
            title: '复杂关系网络视图',
          },
        ],
        technical: {
          compatibility: {
            minVersion: '1.1.0',
            platforms: ['web', 'desktop'],
          },
          dependencies: ['character-interaction'],
          permissions: ['character-data', 'export'],
          fileSize: 8.7,
          checksum: 'def456...',
          downloadUrl: '/downloads/plugins/character-relationship-mapper-2.1.0.zip',
        },
        status: 'approved',
        createdAt: new Date('2024-09-15'),
        updatedAt: new Date('2024-10-20'),
        publishedAt: new Date('2024-09-20'),
      },
      {
        id: 'dark-theme-pack',
        name: '深色主题包',
        description: '精美的深色UI主题，支持多种配色方案和自定义选项',
        version: '1.0.5',
        author: {
          id: 'author-3',
          name: 'UI设计工作室',
          email: 'design@ui-studio.com',
          verified: false,
          reputation: 4.2,
          pluginsCount: 3,
        },
        category: 'ui-themes',
        tags: ['theme', 'dark', 'ui', 'design'],
        pricing: {
          model: 'free',
        },
        stats: {
          downloads: 5200,
          activeInstalls: 3800,
          rating: 4.4,
          reviewCount: 234,
          revenue: 0,
          trending: false,
        },
        reviews: [],
        media: [
          {
            type: 'image',
            url: '/plugins/dark-theme-pack/preview.jpg',
            title: '深色主题预览',
          },
        ],
        technical: {
          compatibility: {
            minVersion: '1.0.0',
            platforms: ['web'],
          },
          dependencies: [],
          permissions: ['ui-customization'],
          fileSize: 2.1,
          checksum: 'ghi789...',
          downloadUrl: '/downloads/plugins/dark-theme-pack-1.0.5.zip',
        },
        status: 'approved',
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-09-01'),
        publishedAt: new Date('2024-08-10'),
      },
    ]

    samplePlugins.forEach((plugin) => this.plugins.set(plugin.id, plugin))
  }

  // 获取所有插件
  getPlugins(filters?: {
    category?: PluginCategory
    pricing?: 'free' | 'paid' | 'subscription'
    author?: string
    search?: string
    sortBy?: 'downloads' | 'rating' | 'newest' | 'trending'
  }): Plugin[] {
    let plugins = Array.from(this.plugins.values())

    // 应用过滤器
    if (filters) {
      if (filters.category) {
        plugins = plugins.filter((p) => p.category === filters.category)
      }

      if (filters.pricing) {
        plugins = plugins.filter((p) => p.pricing.model === filters.pricing)
      }

      if (filters.author) {
        plugins = plugins.filter((p) => p.author.id === filters.author)
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        plugins = plugins.filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        )
      }
    }

    // 排序
    if (filters?.sortBy) {
      plugins.sort((a, b) => {
        switch (filters.sortBy) {
          case 'downloads':
            return b.stats.downloads - a.stats.downloads
          case 'rating':
            return b.stats.rating - a.stats.rating
          case 'newest':
            return (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
          case 'trending':
            return (b.stats.trending ? 1 : 0) - (a.stats.trending ? 1 : 0)
          default:
            return 0
        }
      })
    }

    return plugins
  }

  // 获取单个插件
  getPlugin(pluginId: string): Plugin | null {
    return this.plugins.get(pluginId) || null
  }

  // 提交插件
  async submitPlugin(
    pluginData: Omit<Plugin, 'id' | 'stats' | 'reviews' | 'createdAt' | 'updatedAt'>
  ): Promise<Plugin> {
    const plugin: Plugin = {
      ...pluginData,
      id: `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stats: {
        downloads: 0,
        activeInstalls: 0,
        rating: 0,
        reviewCount: 0,
        revenue: 0,
        trending: false,
      },
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
    }

    this.plugins.set(plugin.id, plugin)
    this.emit('pluginSubmitted', plugin)

    return plugin
  }

  // 批准插件
  approvePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    plugin.status = 'approved'
    plugin.publishedAt = new Date()
    plugin.updatedAt = new Date()

    this.emit('pluginApproved', plugin)
    return true
  }

  // 拒绝插件
  rejectPlugin(pluginId: string, reason: string): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    plugin.status = 'rejected'
    plugin.updatedAt = new Date()

    this.emit('pluginRejected', { plugin, reason })
    return true
  }

  // 购买插件
  async purchasePlugin(
    userId: string,
    pluginId: string,
    purchaseType: 'purchase' | 'subscription' | 'trial' = 'purchase'
  ): Promise<PluginPurchase> {
    const plugin = this.getPlugin(pluginId)
    if (!plugin) throw new Error('Plugin not found')

    let amount = 0
    let currency = 'CNY'

    if (purchaseType === 'purchase' && plugin.pricing.model === 'paid') {
      amount = plugin.pricing.price || 0
      currency = plugin.pricing.currency || 'CNY'
    } else if (purchaseType === 'subscription' && plugin.pricing.model === 'subscription') {
      amount = plugin.pricing.subscriptionPrice || 0
      currency = plugin.pricing.currency || 'CNY'
    }

    const purchase: PluginPurchase = {
      id: `purchase-${Date.now()}`,
      userId,
      pluginId,
      type: purchaseType,
      amount,
      currency,
      status: 'completed',
      purchasedAt: new Date(),
      expiresAt:
        purchaseType === 'subscription'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : undefined,
      licenseKey: this.generateLicenseKey(),
    }

    // 更新插件统计
    plugin.stats.downloads++
    plugin.stats.activeInstalls++
    plugin.stats.revenue += amount

    // 记录用户购买
    const userPurchases = this.purchases.get(userId) || []
    userPurchases.push(purchase)
    this.purchases.set(userId, userPurchases)

    this.emit('pluginPurchased', { purchase, plugin })

    return purchase
  }

  // 检查用户是否拥有插件
  hasPluginAccess(userId: string, pluginId: string): boolean {
    const userPurchases = this.purchases.get(userId) || []
    return userPurchases.some(
      (purchase) =>
        purchase.pluginId === pluginId &&
        purchase.status === 'completed' &&
        (!purchase.expiresAt || purchase.expiresAt > new Date())
    )
  }

  // 添加插件评价
  addReview(
    pluginId: string,
    review: Omit<PluginReview, 'id' | 'helpful' | 'createdAt'>
  ): PluginReview {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) throw new Error('Plugin not found')

    const newReview: PluginReview = {
      ...review,
      id: `review-${Date.now()}`,
      helpful: 0,
      createdAt: new Date(),
    }

    plugin.reviews.push(newReview)

    // 更新插件评分
    this.updatePluginRating(plugin)

    this.emit('reviewAdded', { plugin, review: newReview })

    return newReview
  }

  // 更新插件评分
  private updatePluginRating(plugin: Plugin): void {
    if (plugin.reviews.length === 0) {
      plugin.stats.rating = 0
      plugin.stats.reviewCount = 0
      return
    }

    const totalRating = plugin.reviews.reduce((sum, review) => sum + review.rating, 0)
    plugin.stats.rating = totalRating / plugin.reviews.length
    plugin.stats.reviewCount = plugin.reviews.length
  }

  // 获取热门插件
  getTrendingPlugins(limit = 10): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.status === 'approved')
      .sort((a, b) => {
        // 综合评分：下载量 * 0.4 + 评分 * 0.3 + 是否热门 * 0.3
        const scoreA = a.stats.downloads * 0.4 + a.stats.rating * 0.3 + (a.stats.trending ? 10 : 0)
        const scoreB = b.stats.downloads * 0.4 + b.stats.rating * 0.3 + (b.stats.trending ? 10 : 0)
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  // 获取作者插件
  getAuthorPlugins(authorId: string): Plugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.author.id === authorId)
  }

  // 获取插件分类
  getCategories(): PluginCategory[] {
    return this.categories
  }

  // 获取市场统计
  getMarketStats(): {
    totalPlugins: number
    totalDownloads: number
    totalRevenue: number
    activePlugins: number
    averageRating: number
  } {
    const plugins = Array.from(this.plugins.values())
    const approvedPlugins = plugins.filter((p) => p.status === 'approved')

    return {
      totalPlugins: plugins.length,
      totalDownloads: plugins.reduce((sum, p) => sum + p.stats.downloads, 0),
      totalRevenue: plugins.reduce((sum, p) => sum + p.stats.revenue, 0),
      activePlugins: approvedPlugins.length,
      averageRating:
        approvedPlugins.length > 0
          ? approvedPlugins.reduce((sum, p) => sum + p.stats.rating, 0) / approvedPlugins.length
          : 0,
    }
  }

  // 生成许可证密钥
  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let key = ''
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      if (i < 3) key += '-'
    }
    return key
  }

  // 获取用户购买记录
  getUserPurchases(userId: string): PluginPurchase[] {
    return this.purchases.get(userId) || []
  }

  // 退款处理
  async processRefund(purchaseId: string, reason: string): Promise<boolean> {
    // 查找购买记录
    for (const [userId, purchases] of this.purchases.entries()) {
      const purchase = purchases.find((p) => p.id === purchaseId)
      if (purchase) {
        purchase.status = 'refunded'

        // 更新插件统计
        const plugin = this.plugins.get(purchase.pluginId)
        if (plugin) {
          plugin.stats.revenue -= purchase.amount
        }

        this.emit('refundProcessed', { purchase, reason })
        return true
      }
    }
    return false
  }
}

// 创建单例实例
export const pluginMarketManager = new PluginMarketManager()
