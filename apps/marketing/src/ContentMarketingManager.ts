import { EventEmitter } from 'events'

// 内容类型定义
export interface ContentPiece {
  id: string
  title: string
  type: ContentType
  status: ContentStatus
  author: string
  targetAudience: string[]
  keywords: string[]
  platforms: PublishingPlatform[]
  content: string
  excerpt?: string
  featuredImage?: string
  mediaAssets: MediaAsset[]
  metadata: ContentMetadata
  performance: ContentPerformance
  createdAt: Date
  publishedAt?: Date
  scheduledAt?: Date
}

export type ContentType =
  | 'blog-post'
  | 'video-tutorial'
  | 'case-study'
  | 'infographic'
  | 'newsletter'
  | 'social-post'
  | 'podcast'
  | 'webinar'
  | 'ebook'
  | 'whitepaper'

export type ContentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived'

export interface PublishingPlatform {
  name: string
  url?: string
  status: 'pending' | 'published' | 'failed'
  publishedAt?: Date
  engagement: {
    views: number
    likes: number
    shares: number
    comments: number
  }
}

export interface MediaAsset {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  title: string
  description?: string
  thumbnail?: string
  fileSize: number
  dimensions?: { width: number; height: number }
}

export interface ContentMetadata {
  wordCount: number
  readingTime: number
  seoTitle?: string
  seoDescription?: string
  canonicalUrl?: string
  tags: string[]
  categories: string[]
  series?: string
  relatedContent: string[]
}

export interface ContentPerformance {
  totalViews: number
  totalEngagement: number
  averageEngagementRate: number
  conversionRate: number
  bounceRate: number
  timeOnPage: number
  socialShares: number
  backlinks: number
  organicTraffic: number
  paidTraffic: number
}

// 内容营销活动
export interface MarketingCampaign {
  id: string
  name: string
  description: string
  type: CampaignType
  status: 'planning' | 'active' | 'completed' | 'paused'
  targetAudience: string[]
  goals: CampaignGoal[]
  budget: CampaignBudget
  timeline: {
    startDate: Date
    endDate: Date
    milestones: CampaignMilestone[]
  }
  content: string[] // 内容ID数组
  channels: MarketingChannel[]
  performance: CampaignPerformance
  createdAt: Date
}

export type CampaignType =
  | 'product-launch'
  | 'user-acquisition'
  | 'brand-awareness'
  | 'lead-generation'
  | 'community-building'
  | 'seasonal-promotion'

export interface CampaignGoal {
  id: string
  metric: string
  target: number
  current: number
  unit: string
}

export interface CampaignBudget {
  total: number
  currency: string
  allocation: {
    content: number
    advertising: number
    partnerships: number
    events: number
  }
  spent: number
}

export interface CampaignMilestone {
  id: string
  title: string
  description: string
  dueDate: Date
  completed: boolean
  deliverables: string[]
}

export interface MarketingChannel {
  platform: string
  type: 'organic' | 'paid' | 'partnership'
  targetAudience: string
  contentStrategy: string
  postingSchedule: string
  budget: number
  performance: ChannelPerformance
}

export interface ChannelPerformance {
  reach: number
  engagement: number
  conversions: number
  costPerAcquisition: number
  returnOnInvestment: number
}

export interface CampaignPerformance {
  reach: number
  engagement: number
  conversions: number
  revenue: number
  roi: number
  costPerAcquisition: number
}

// SEO优化建议
export interface SEORecommendation {
  contentId: string
  type: 'title' | 'description' | 'keywords' | 'structure' | 'internal-links' | 'external-links'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  impact: number
  effort: number
}

// 内容营销管理器
export class ContentMarketingManager extends EventEmitter {
  private content: Map<string, ContentPiece> = new Map()
  private campaigns: Map<string, MarketingCampaign> = new Map()
  private contentCalendar: Map<string, ContentPiece[]> = new Map() // 按日期分组
  private seoRecommendations: Map<string, SEORecommendation[]> = new Map()

  constructor() {
    super()
    this.initializeSampleContent()
  }

  // 初始化示例内容
  private initializeSampleContent() {
    const sampleContent: ContentPiece[] = [
      {
        id: 'blog-multi-agent-architecture',
        title: '多Agent协作：重塑AI创作的架构革新',
        type: 'blog-post',
        status: 'published',
        author: '创世星环团队',
        targetAudience: ['AI开发者', '游戏开发者', '技术爱好者'],
        keywords: ['多Agent', 'AI协作', '架构设计', '游戏开发'],
        platforms: [
          {
            name: '博客',
            url: '/blog/multi-agent-architecture',
            status: 'published',
            publishedAt: new Date('2024-11-01'),
            engagement: { views: 2500, likes: 120, shares: 45, comments: 28 }
          },
          {
            name: 'DEV.to',
            url: 'https://dev.to/creation-ring/multi-agent-architecture',
            status: 'published',
            publishedAt: new Date('2024-11-02'),
            engagement: { views: 1200, likes: 85, shares: 32, comments: 15 }
          }
        ],
        content: '多Agent协作架构的详细介绍...',
        excerpt: '探索如何通过多个AI代理的智能协作，实现从概念到完整游戏世界的创作流程。',
        featuredImage: '/blog/multi-agent-hero.jpg',
        mediaAssets: [
          {
            id: 'architecture-diagram',
            type: 'image',
            url: '/blog/architecture-diagram.png',
            title: '多Agent协作架构图',
            fileSize: 245760,
            dimensions: { width: 1200, height: 800 }
          }
        ],
        metadata: {
          wordCount: 2800,
          readingTime: 14,
          seoTitle: '多Agent协作架构：AI创作的新范式',
          seoDescription: '深入了解多Agent协作技术如何革新AI驱动的内容创作过程',
          tags: ['AI', '多Agent', '架构设计'],
          categories: ['技术深度', 'AI研究'],
          relatedContent: ['video-agent-demo', 'case-study-rpg-maker'],
          canonicalUrl: '/blog/multi-agent-architecture'
        },
        performance: {
          totalViews: 3700,
          totalEngagement: 225,
          averageEngagementRate: 6.1,
          conversionRate: 2.8,
          bounceRate: 35.2,
          timeOnPage: 420,
          socialShares: 77,
          backlinks: 12,
          organicTraffic: 2850,
          paidTraffic: 850
        },
        createdAt: new Date('2024-10-25'),
        publishedAt: new Date('2024-11-01')
      },
      {
        id: 'video-product-demo',
        title: '创世星环产品演示：从想法到游戏世界',
        type: 'video-tutorial',
        status: 'published',
        author: '产品团队',
        targetAudience: ['潜在用户', '游戏开发者', '创意工作者'],
        keywords: ['产品演示', '教程', '游戏创作'],
        platforms: [
          {
            name: 'YouTube',
            url: 'https://youtube.com/watch?v=demo-video',
            status: 'published',
            publishedAt: new Date('2024-11-05'),
            engagement: { views: 8500, likes: 420, shares: 156, comments: 89 }
          },
          {
            name: 'B站',
            url: 'https://bilibili.com/video/demo',
            status: 'published',
            publishedAt: new Date('2024-11-06'),
            engagement: { views: 3200, likes: 280, shares: 95, comments: 67 }
          }
        ],
        content: '完整的产品功能演示视频脚本和内容...',
        excerpt: '跟随我们的演示，亲眼见证AI如何将简单的想法转化为完整的游戏世界。',
        featuredImage: '/videos/demo-thumbnail.jpg',
        mediaAssets: [
          {
            id: 'demo-video',
            type: 'video',
            url: '/videos/product-demo.mp4',
            title: '创世星环产品演示视频',
            thumbnail: '/videos/demo-thumbnail.jpg',
            fileSize: 157286400,
            dimensions: { width: 1920, height: 1080 }
          }
        ],
        metadata: {
          wordCount: 0,
          readingTime: 0,
          tags: ['产品演示', '教程', '视频'],
          categories: ['产品介绍'],
          relatedContent: ['blog-getting-started', 'case-study-fantasy-world']
        },
        performance: {
          totalViews: 11700,
          totalEngagement: 1107,
          averageEngagementRate: 9.5,
          conversionRate: 5.2,
          bounceRate: 0,
          timeOnPage: 0,
          socialShares: 251,
          backlinks: 8,
          organicTraffic: 9200,
          paidTraffic: 2500
        },
        createdAt: new Date('2024-10-28'),
        publishedAt: new Date('2024-11-05')
      }
    ]

    sampleContent.forEach(content => this.content.set(content.id, content))

    // 初始化营销活动
    this.initializeSampleCampaigns()
  }

  // 初始化示例营销活动
  private initializeSampleCampaigns() {
    const campaigns: MarketingCampaign[] = [
      {
        id: 'product-launch-q4-2024',
        name: '创世星环Q4产品发布营销活动',
        description: '面向AI和游戏开发者的产品发布营销活动',
        type: 'product-launch',
        status: 'active',
        targetAudience: ['独立游戏开发者', 'AI技术爱好者', '创意作家'],
        goals: [
          { id: 'website-traffic', metric: '网站访问量', target: 50000, current: 32500, unit: 'PV' },
          { id: 'beta-signups', metric: 'Beta注册数', target: 2000, current: 1250, unit: '人' },
          { id: 'social-followers', metric: '社交媒体关注者', target: 5000, current: 2800, unit: '人' }
        ],
        budget: {
          total: 50000,
          currency: 'CNY',
          allocation: {
            content: 20000,
            advertising: 20000,
            partnerships: 5000,
            events: 5000
          },
          spent: 28500
        },
        timeline: {
          startDate: new Date('2024-11-01'),
          endDate: new Date('2024-12-31'),
          milestones: [
            {
              id: 'launch-announcement',
              title: '产品发布公告',
              description: '在各大平台发布产品上线消息',
              dueDate: new Date('2024-11-15'),
              completed: true,
              deliverables: ['网站更新', '社交媒体发布', '邮件通知']
            },
            {
              id: 'content-series',
              title: '内容系列发布',
              description: '发布技术博客、教程视频、案例研究',
              dueDate: new Date('2024-12-15'),
              completed: false,
              deliverables: ['5篇博客文章', '3个视频教程', '2个案例研究']
            }
          ]
        },
        content: ['blog-multi-agent-architecture', 'video-product-demo'],
        channels: [
          {
            platform: 'Twitter',
            type: 'organic',
            targetAudience: '技术开发者',
            contentStrategy: '技术分享和产品更新',
            postingSchedule: '每日2-3条',
            budget: 2000,
            performance: {
              reach: 25000,
              engagement: 1200,
              conversions: 45,
              costPerAcquisition: 44.4,
              returnOnInvestment: 3.2
            }
          },
          {
            platform: 'YouTube',
            type: 'organic',
            targetAudience: '视频学习者',
            contentStrategy: '教程视频和产品演示',
            postingSchedule: '每周2-3个视频',
            budget: 1000,
            performance: {
              reach: 15000,
              engagement: 850,
              conversions: 32,
              costPerAcquisition: 31.3,
              returnOnInvestment: 4.1
            }
          }
        ],
        performance: {
          reach: 40000,
          engagement: 2050,
          conversions: 77,
          revenue: 0,
          roi: 3.6,
          costPerAcquisition: 370
        },
        createdAt: new Date('2024-10-20')
      }
    ]

    campaigns.forEach(campaign => this.campaigns.set(campaign.id, campaign))
  }

  // 创建内容
  async createContent(contentData: Omit<ContentPiece, 'id' | 'createdAt' | 'performance'>): Promise<ContentPiece> {
    const content: ContentPiece = {
      ...contentData,
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      performance: {
        totalViews: 0,
        totalEngagement: 0,
        averageEngagementRate: 0,
        conversionRate: 0,
        bounceRate: 0,
        timeOnPage: 0,
        socialShares: 0,
        backlinks: 0,
        organicTraffic: 0,
        paidTraffic: 0
      }
    }

    this.content.set(content.id, content)

    // 生成SEO建议
    await this.generateSEORecommendations(content.id)

    this.emit('contentCreated', content)
    return content
  }

  // 更新内容
  async updateContent(contentId: string, updates: Partial<ContentPiece>): Promise<ContentPiece> {
    const content = this.content.get(contentId)
    if (!content) throw new Error('Content not found')

    const updatedContent = { ...content, ...updates, updatedAt: new Date() }
    this.content.set(contentId, updatedContent)

    this.emit('contentUpdated', { content: updatedContent, changes: updates })
    return updatedContent
  }

  // 发布内容
  async publishContent(contentId: string, platforms: string[], scheduledAt?: Date): Promise<ContentPiece> {
    const content = this.content.get(contentId)
    if (!content) throw new Error('Content not found')

    content.status = scheduledAt ? 'scheduled' : 'published'
    content.scheduledAt = scheduledAt
    content.publishedAt = scheduledAt ? undefined : new Date()

    // 初始化平台发布状态
    content.platforms = platforms.map(platform => ({
      name: platform,
      status: 'pending',
      engagement: { views: 0, likes: 0, shares: 0, comments: 0 }
    }))

    this.emit('contentPublished', { content, platforms, scheduledAt })
    return content
  }

  // 更新内容性能数据
  updateContentPerformance(contentId: string, performance: Partial<ContentPerformance>): void {
    const content = this.content.get(contentId)
    if (content) {
      content.performance = { ...content.performance, ...performance }
      this.emit('performanceUpdated', { contentId, performance })
    }
  }

  // 生成SEO建议
  private async generateSEORecommendations(contentId: string): Promise<void> {
    const content = this.content.get(contentId)
    if (!content) return

    const recommendations: SEORecommendation[] = []

    // 标题优化建议
    if (content.title.length < 30 || content.title.length > 60) {
      recommendations.push({
        contentId,
        type: 'title',
        priority: 'high',
        suggestion: '标题长度应在30-60字符之间，便于搜索引擎显示',
        impact: 0.8,
        effort: 0.2
      })
    }

    // 描述优化建议
    if (!content.metadata.seoDescription || content.metadata.seoDescription.length < 120) {
      recommendations.push({
        contentId,
        type: 'description',
        priority: 'high',
        suggestion: '添加120-160字符的SEO描述，提升点击率',
        impact: 0.7,
        effort: 0.3
      })
    }

    // 关键词优化建议
    if (content.keywords.length < 3) {
      recommendations.push({
        contentId,
        type: 'keywords',
        priority: 'medium',
        suggestion: '添加更多相关关键词，提升搜索排名',
        impact: 0.5,
        effort: 0.4
      })
    }

    // 内部链接建议
    if (content.metadata.relatedContent.length === 0) {
      recommendations.push({
        contentId,
        type: 'internal-links',
        priority: 'medium',
        suggestion: '添加相关内容的内部链接，提升网站粘性',
        impact: 0.4,
        effort: 0.3
      })
    }

    this.seoRecommendations.set(contentId, recommendations)
  }

  // 创建营销活动
  async createCampaign(campaignData: Omit<MarketingCampaign, 'id' | 'createdAt'>): Promise<MarketingCampaign> {
    const campaign: MarketingCampaign = {
      ...campaignData,
      id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }

    this.campaigns.set(campaign.id, campaign)
    this.emit('campaignCreated', campaign)

    return campaign
  }

  // 获取内容列表
  getContent(filters?: {
    type?: ContentType
    status?: ContentStatus
    author?: string
    platform?: string
    dateRange?: { start: Date; end: Date }
  }): ContentPiece[] {
    let content = Array.from(this.content.values())

    if (filters) {
      if (filters.type) {
        content = content.filter(c => c.type === filters.type)
      }

      if (filters.status) {
        content = content.filter(c => c.status === filters.status)
      }

      if (filters.author) {
        content = content.filter(c => c.author === filters.author)
      }

      if (filters.platform) {
        content = content.filter(c => c.platforms.some(p => p.name === filters.platform))
      }

      if (filters.dateRange) {
        content = content.filter(c => {
          const pubDate = c.publishedAt || c.createdAt
          return pubDate >= filters.dateRange!.start && pubDate <= filters.dateRange!.end
        })
      }
    }

    return content.sort((a, b) => (b.publishedAt || b.createdAt).getTime() - (a.publishedAt || a.createdAt).getTime())
  }

  // 获取营销活动
  getCampaigns(filters?: { type?: CampaignType; status?: string }): MarketingCampaign[] {
    let campaigns = Array.from(this.campaigns.values())

    if (filters) {
      if (filters.type) {
        campaigns = campaigns.filter(c => c.type === filters.type)
      }

      if (filters.status) {
        campaigns = campaigns.filter(c => c.status === filters.status)
      }
    }

    return campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // 获取内容日历
  getContentCalendar(startDate: Date, endDate: Date): Map<string, ContentPiece[]> {
    const calendar = new Map<string, ContentPiece[]>()

    this.content.forEach(content => {
      if (content.scheduledAt || content.publishedAt) {
        const date = content.scheduledAt || content.publishedAt!
        const dateKey = date.toISOString().split('T')[0]

        if (date >= startDate && date <= endDate) {
          if (!calendar.has(dateKey)) {
            calendar.set(dateKey, [])
          }
          calendar.get(dateKey)!.push(content)
        }
      }
    })

    return calendar
  }

  // 获取SEO建议
  getSEORecommendations(contentId: string): SEORecommendation[] {
    return this.seoRecommendations.get(contentId) || []
  }

  // 获取内容分析报告
  getContentAnalytics(dateRange?: { start: Date; end: Date }): {
    totalContent: number
    publishedContent: number
    totalViews: number
    totalEngagement: number
    averageEngagementRate: number
    topPerformingContent: ContentPiece[]
    contentTypeBreakdown: Record<ContentType, number>
    platformPerformance: Record<string, any>
  } {
    const content = dateRange ?
      this.getContent({ dateRange }) :
      Array.from(this.content.values())

    const publishedContent = content.filter(c => c.status === 'published')

    const totalViews = publishedContent.reduce((sum, c) => sum + c.performance.totalViews, 0)
    const totalEngagement = publishedContent.reduce((sum, c) => sum + c.performance.totalEngagement, 0)
    const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

    // 内容类型分布
    const contentTypeBreakdown: Record<ContentType, number> = {} as any
    publishedContent.forEach(c => {
      contentTypeBreakdown[c.type] = (contentTypeBreakdown[c.type] || 0) + 1
    })

    // 平台表现
    const platformPerformance: Record<string, any> = {}
    publishedContent.forEach(c => {
      c.platforms.forEach(p => {
        if (!platformPerformance[p.name]) {
          platformPerformance[p.name] = { views: 0, engagement: 0, contentCount: 0 }
        }
        platformPerformance[p.name].views += p.engagement.views
        platformPerformance[p.name].engagement += p.engagement.likes + p.engagement.shares + p.engagement.comments
        platformPerformance[p.name].contentCount += 1
      })
    })

    // 表现最好的内容
    const topPerformingContent = publishedContent
      .sort((a, b) => b.performance.totalEngagement - a.performance.totalEngagement)
      .slice(0, 5)

    return {
      totalContent: content.length,
      publishedContent: publishedContent.length,
      totalViews,
      totalEngagement,
      averageEngagementRate,
      topPerformingContent,
      contentTypeBreakdown,
      platformPerformance
    }
  }

  // 获取营销活动分析
  getCampaignAnalytics(campaignId: string): CampaignPerformance | null {
    const campaign = this.campaigns.get(campaignId)
    return campaign ? campaign.performance : null
  }
}

// 创建单例实例
export const contentMarketingManager = new ContentMarketingManager()
