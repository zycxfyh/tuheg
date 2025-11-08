import { EventEmitter } from 'events'

// 社区用户类型
export interface CommunityUser {
  id: string
  username: string
  displayName: string
  avatar?: string
  email: string
  role: CommunityRole
  reputation: number
  badges: UserBadge[]
  joinedAt: Date
  lastActive: Date
  isVerified: boolean
  isBanned: boolean
  banReason?: string
  banExpiresAt?: Date
  socialLinks: {
    twitter?: string
    github?: string
    linkedin?: string
    discord?: string
  }
  stats: UserStats
}

export type CommunityRole =
  | 'member' // 普通成员
  | 'contributor' // 贡献者
  | 'moderator' // 版主
  | 'admin' // 管理员
  | 'founder' // 创始人

export interface UserBadge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserStats {
  postsCount: number
  commentsCount: number
  likesReceived: number
  likesGiven: number
  helpfulVotes: number
  reputationPoints: number
  streakDays: number
  achievements: string[]
}

// 社区内容类型
export interface CommunityPost {
  id: string
  author: CommunityUser
  title: string
  content: string
  type: PostType
  category: PostCategory
  tags: string[]
  status: PostStatus
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: Date
  updatedAt: Date
  lastActivity: Date
  attachments: PostAttachment[]
  poll?: PostPoll
  metadata: Record<string, any>
}

export type PostType =
  | 'discussion' // 讨论
  | 'question' // 问题
  | 'showcase' // 作品展示
  | 'tutorial' // 教程
  | 'announcement' // 公告
  | 'bug-report' // 问题反馈
  | 'feature-request' // 功能请求

export type PostCategory =
  | 'general'
  | 'technical-support'
  | 'showcase'
  | 'tutorials'
  | 'brainstorming'
  | 'bug-reports'
  | 'feature-requests'
  | 'announcements'
  | 'off-topic'

export type PostStatus = 'published' | 'draft' | 'pending-review' | 'flagged' | 'deleted'

export interface PostAttachment {
  id: string
  type: 'image' | 'video' | 'file' | 'link'
  url: string
  filename: string
  size: number
  thumbnail?: string
}

export interface PostPoll {
  question: string
  options: PollOption[]
  isMultipleChoice: boolean
  totalVotes: number
  endsAt?: Date
}

export interface PollOption {
  id: string
  text: string
  votes: number
  voters: string[] // 用户ID列表
}

// 评论系统
export interface Comment {
  id: string
  postId: string
  parentId?: string // 回复的评论ID
  author: CommunityUser
  content: string
  isEdited: boolean
  editedAt?: Date
  likeCount: number
  replyCount: number
  isAccepted?: boolean // 是否为最佳答案
  createdAt: Date
  attachments?: PostAttachment[]
}

// 社区活动和事件
export interface CommunityEvent {
  id: string
  title: string
  description: string
  type: EventType
  startDate: Date
  endDate: Date
  location: EventLocation
  capacity: number
  registeredCount: number
  status: EventStatus
  organizer: CommunityUser
  attendees: string[] // 用户ID列表
  agenda: EventAgendaItem[]
  resources: EventResource[]
  tags: string[]
  createdAt: Date
}

export type EventType =
  | 'workshop' // 工作坊
  | 'webinar' // 网络研讨会
  | 'hackathon' // 黑客马拉松
  | 'meetup' // 聚会
  | 'conference' // 会议
  | 'ama' // 问答会

export interface EventLocation {
  type: 'online' | 'offline' | 'hybrid'
  platform?: string // Zoom, Discord等
  address?: string
  city?: string
  country?: string
  timezone: string
}

export type EventStatus =
  | 'draft'
  | 'published'
  | 'registration-open'
  | 'registration-closed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'

export interface EventAgendaItem {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  speaker?: string
  type: 'presentation' | 'workshop' | 'break' | 'networking'
}

export interface EventResource {
  id: string
  title: string
  type: 'slides' | 'video' | 'document' | 'link'
  url: string
  description?: string
}

// 社区成就系统
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirements: AchievementRequirement[]
  rewards: AchievementReward[]
  unlockedBy: number // 解锁人数
  createdAt: Date
}

export type AchievementCategory =
  | 'engagement' // 参与度
  | 'contribution' // 贡献
  | 'learning' // 学习
  | 'community' // 社区
  | 'special' // 特殊

export interface AchievementRequirement {
  type: 'posts' | 'comments' | 'likes' | 'reputation' | 'streak' | 'events'
  value: number
  operator: 'gte' | 'lte' | 'eq'
}

export interface AchievementReward {
  type: 'badge' | 'title' | 'access' | 'discount'
  value: string
  description: string
}

// 社区统计
export interface CommunityStats {
  totalUsers: number
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
  }
  totalPosts: number
  totalComments: number
  totalEvents: number
  topCategories: { category: PostCategory; count: number }[]
  userGrowth: { date: string; users: number }[]
  engagementMetrics: {
    avgPostsPerUser: number
    avgCommentsPerPost: number
    avgLikesPerPost: number
    responseTime: number // 平均回复时间(小时)
  }
  contentQuality: {
    avgPostLength: number
    helpfulVotesRate: number
    flaggedContentRate: number
  }
}

// 社区管理器
export class CommunityManager extends EventEmitter {
  private users: Map<string, CommunityUser> = new Map()
  private posts: Map<string, CommunityPost> = new Map()
  private comments: Map<string, Comment[]> = new Map()
  private events: Map<string, CommunityEvent> = new Map()
  private achievements: Map<string, Achievement> = new Map()
  private userAchievements: Map<string, string[]> = new Map() // 用户ID -> 成就ID列表

  constructor() {
    super()
    this.initializeCommunity()
  }

  // 初始化社区
  private initializeCommunity() {
    // 创建初始成就系统
    this.initializeAchievements()

    // 创建示例用户和内容
    this.createSampleContent()
  }

  // 初始化成就系统
  private initializeAchievements() {
    const achievements: Achievement[] = [
      {
        id: 'first-post',
        name: '初次发帖',
        description: '发布你的第一篇帖子',
        icon: '📝',
        category: 'engagement',
        rarity: 'common',
        requirements: [{ type: 'posts', value: 1, operator: 'gte' }],
        rewards: [{ type: 'badge', value: '新手创作者', description: '新手创作者徽章' }],
        unlockedBy: 0,
        createdAt: new Date('2024-10-01'),
      },
      {
        id: 'helpful-contributor',
        name: '乐于助人',
        description: '获得10个有帮助的投票',
        icon: '🤝',
        category: 'contribution',
        rarity: 'rare',
        requirements: [{ type: 'likes', value: 10, operator: 'gte' }],
        rewards: [{ type: 'badge', value: '社区助手', description: '社区助手徽章' }],
        unlockedBy: 0,
        createdAt: new Date('2024-10-01'),
      },
      {
        id: 'community-leader',
        name: '社区领袖',
        description: '获得100个赞和50个回复',
        icon: '👑',
        category: 'community',
        rarity: 'epic',
        requirements: [
          { type: 'likes', value: 100, operator: 'gte' },
          { type: 'comments', value: 50, operator: 'gte' },
        ],
        rewards: [
          { type: 'badge', value: '社区领袖', description: '社区领袖徽章' },
          { type: 'access', value: 'moderator-tools', description: '版主工具访问权限' },
        ],
        unlockedBy: 0,
        createdAt: new Date('2024-10-01'),
      },
      {
        id: 'streak-master',
        name: '连续登录大师',
        description: '连续登录30天',
        icon: '🔥',
        category: 'engagement',
        rarity: 'legendary',
        requirements: [{ type: 'streak', value: 30, operator: 'gte' }],
        rewards: [
          { type: 'title', value: '连续登录大师', description: '特殊称号' },
          { type: 'discount', value: '20%', description: '订阅折扣20%' },
        ],
        unlockedBy: 0,
        createdAt: new Date('2024-10-01'),
      },
    ]

    achievements.forEach((achievement) => {
      this.achievements.set(achievement.id, achievement)
    })
  }

  // 创建示例内容
  private createSampleContent() {
    // 示例用户
    const sampleUser: CommunityUser = {
      id: 'user-1',
      username: 'alice_dev',
      displayName: 'Alice Developer',
      email: 'alice@example.com',
      role: 'contributor',
      reputation: 450,
      badges: [
        {
          id: 'first-post',
          name: '初次发帖',
          description: '发布第一篇帖子',
          icon: '📝',
          earnedAt: new Date('2024-10-15'),
          rarity: 'common',
        },
      ],
      joinedAt: new Date('2024-10-01'),
      lastActive: new Date(),
      isVerified: true,
      isBanned: false,
      socialLinks: {
        github: 'https://github.com/alice-dev',
        twitter: '@alice_dev',
      },
      stats: {
        postsCount: 12,
        commentsCount: 45,
        likesReceived: 89,
        likesGiven: 156,
        helpfulVotes: 23,
        reputationPoints: 450,
        streakDays: 15,
        achievements: ['first-post', 'helpful-contributor'],
      },
    }

    this.users.set(sampleUser.id, sampleUser)

    // 示例帖子
    const samplePost: CommunityPost = {
      id: 'post-1',
      author: sampleUser,
      title: '如何使用多Agent协作创建复杂的故事世界？',
      content: `大家好！

我最近在使用创世星环的多Agent协作功能来创建一个科幻故事世界，但是遇到了一些挑战：

1. 如何平衡不同Agent的创作风格？
2. 世界观设定的一致性如何保证？
3. 大型世界的管理技巧有哪些？

希望能得到大家的建议和经验分享！

#AI创作 #世界构建 #多Agent`,
      type: 'question',
      category: 'technical-support',
      tags: ['AI创作', '世界构建', '多Agent'],
      status: 'published',
      isPinned: false,
      isLocked: false,
      viewCount: 245,
      likeCount: 23,
      commentCount: 8,
      shareCount: 5,
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date('2024-11-01'),
      lastActivity: new Date('2024-11-02'),
      attachments: [],
      metadata: {},
    }

    this.posts.set(samplePost.id, samplePost)
  }

  // 用户管理
  async createUser(
    userData: Omit<
      CommunityUser,
      'id' | 'reputation' | 'badges' | 'joinedAt' | 'lastActive' | 'stats'
    >
  ): Promise<CommunityUser> {
    const user: CommunityUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reputation: 0,
      badges: [],
      joinedAt: new Date(),
      lastActive: new Date(),
      stats: {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        likesGiven: 0,
        helpfulVotes: 0,
        reputationPoints: 0,
        streakDays: 0,
        achievements: [],
      },
    }

    this.users.set(user.id, user)
    this.userAchievements.set(user.id, [])

    this.emit('userJoined', user)
    return user
  }

  // 更新用户角色
  async updateUserRole(userId: string, newRole: CommunityRole): Promise<boolean> {
    const user = this.users.get(userId)
    if (!user) return false

    const oldRole = user.role
    user.role = newRole

    this.emit('userRoleChanged', { user, oldRole, newRole })
    return true
  }

  // 禁言用户
  async banUser(userId: string, reason: string, duration?: number): Promise<boolean> {
    const user = this.users.get(userId)
    if (!user) return false

    user.isBanned = true
    user.banReason = reason
    if (duration) {
      user.banExpiresAt = new Date(Date.now() + duration * 60 * 60 * 1000)
    }

    this.emit('userBanned', { user, reason, duration })
    return true
  }

  // 解禁用户
  async unbanUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId)
    if (!user) return false

    user.isBanned = false
    user.banReason = undefined
    user.banExpiresAt = undefined

    this.emit('userUnbanned', user)
    return true
  }

  // 内容管理
  async createPost(
    postData: Omit<
      CommunityPost,
      | 'id'
      | 'viewCount'
      | 'likeCount'
      | 'commentCount'
      | 'shareCount'
      | 'createdAt'
      | 'updatedAt'
      | 'lastActivity'
    >
  ): Promise<CommunityPost> {
    const post: CommunityPost = {
      ...postData,
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
    }

    this.posts.set(post.id, post)
    this.comments.set(post.id, [])

    // 更新用户统计
    this.updateUserStats(post.author.id, 'postsCount', 1)

    // 检查成就
    this.checkAchievements(post.author.id)

    this.emit('postCreated', post)
    return post
  }

  // 更新帖子
  async updatePost(postId: string, updates: Partial<CommunityPost>): Promise<CommunityPost> {
    const post = this.posts.get(postId)
    if (!post) throw new Error('Post not found')

    Object.assign(post, updates, { updatedAt: new Date() })

    this.emit('postUpdated', { post, changes: updates })
    return post
  }

  // 删除帖子
  async deletePost(postId: string): Promise<boolean> {
    const post = this.posts.get(postId)
    if (!post) return false

    this.posts.delete(postId)
    this.comments.delete(postId)

    // 更新用户统计
    this.updateUserStats(post.author.id, 'postsCount', -1)

    this.emit('postDeleted', post)
    return true
  }

  // 点赞帖子
  async likePost(userId: string, postId: string): Promise<boolean> {
    const post = this.posts.get(postId)
    if (!post) return false

    post.likeCount++
    post.lastActivity = new Date()

    // 更新用户统计
    this.updateUserStats(post.author.id, 'likesReceived', 1)
    this.updateUserStats(userId, 'likesGiven', 1)

    this.emit('postLiked', { userId, post })
    return true
  }

  // 评论管理
  async createComment(
    commentData: Omit<Comment, 'id' | 'likeCount' | 'replyCount' | 'createdAt'>
  ): Promise<Comment> {
    const comment: Comment = {
      ...commentData,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      likeCount: 0,
      replyCount: 0,
      createdAt: new Date(),
    }

    const postComments = this.comments.get(comment.postId) || []
    postComments.push(comment)
    this.comments.set(comment.postId, postComments)

    // 更新帖子统计
    const post = this.posts.get(comment.postId)
    if (post) {
      post.commentCount++
      post.lastActivity = new Date()
    }

    // 更新用户统计
    this.updateUserStats(comment.author.id, 'commentsCount', 1)

    // 检查成就
    this.checkAchievements(comment.author.id)

    this.emit('commentCreated', comment)
    return comment
  }

  // 事件管理
  async createEvent(
    eventData: Omit<CommunityEvent, 'id' | 'registeredCount' | 'attendees' | 'createdAt'>
  ): Promise<CommunityEvent> {
    const event: CommunityEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      registeredCount: 0,
      attendees: [],
      createdAt: new Date(),
    }

    this.events.set(event.id, event)

    this.emit('eventCreated', event)
    return event
  }

  // 注册事件
  async registerForEvent(userId: string, eventId: string): Promise<boolean> {
    const event = this.events.get(eventId)
    const user = this.users.get(userId)

    if (!event || !user) return false
    if (event.attendees.includes(userId)) return false
    if (event.registeredCount >= event.capacity) return false

    event.attendees.push(userId)
    event.registeredCount++

    this.emit('eventRegistered', { user, event })
    return true
  }

  // 成就系统
  private async checkAchievements(userId: string) {
    const user = this.users.get(userId)
    if (!user) return

    const userAchievements = this.userAchievements.get(userId) || []

    for (const [achievementId, achievement] of this.achievements) {
      if (userAchievements.includes(achievementId)) continue

      if (this.checkAchievementRequirements(user, achievement)) {
        // 解锁成就
        userAchievements.push(achievementId)
        user.badges.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          earnedAt: new Date(),
          rarity: achievement.rarity,
        })

        achievement.unlockedBy++

        this.emit('achievementUnlocked', { user, achievement })
      }
    }

    this.userAchievements.set(userId, userAchievements)
  }

  private checkAchievementRequirements(user: CommunityUser, achievement: Achievement): boolean {
    return achievement.requirements.every((req) => {
      let userValue = 0

      switch (req.type) {
        case 'posts':
          userValue = user.stats.postsCount
          break
        case 'comments':
          userValue = user.stats.commentsCount
          break
        case 'likes':
          userValue = user.stats.likesReceived
          break
        case 'reputation':
          userValue = user.reputation
          break
        case 'streak':
          userValue = user.stats.streakDays
          break
      }

      switch (req.operator) {
        case 'gte':
          return userValue >= req.value
        case 'lte':
          return userValue <= req.value
        case 'eq':
          return userValue === req.value
        default:
          return false
      }
    })
  }

  // 用户统计更新
  private updateUserStats(userId: string, stat: keyof UserStats, delta: number) {
    const user = this.users.get(userId)
    if (!user) return

    if (typeof user.stats[stat] === 'number') {
      ;(user.stats[stat] as number) += delta
      user.reputation = user.stats.reputationPoints
    }
  }

  // 获取社区统计
  getCommunityStats(): CommunityStats {
    const users = Array.from(this.users.values())
    const posts = Array.from(this.posts.values())

    // 活跃用户统计
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const activeUsers = {
      daily: users.filter((u) => u.lastActive >= oneDayAgo).length,
      weekly: users.filter((u) => u.lastActive >= oneWeekAgo).length,
      monthly: users.filter((u) => u.lastActive >= oneMonthAgo).length,
    }

    // 分类统计
    const categoryCount: Record<PostCategory, number> = {} as any
    posts.forEach((post) => {
      categoryCount[post.category] = (categoryCount[post.category] || 0) + 1
    })

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category: category as PostCategory, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 用户增长数据（模拟）
    const userGrowth = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      userGrowth.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(users.length * (0.5 + Math.random() * 0.5)),
      })
    }

    // 参与度指标
    const totalComments = Array.from(this.comments.values()).reduce(
      (sum, comments) => sum + comments.length,
      0
    )

    const engagementMetrics = {
      avgPostsPerUser: users.length > 0 ? posts.length / users.length : 0,
      avgCommentsPerPost: posts.length > 0 ? totalComments / posts.length : 0,
      avgLikesPerPost:
        posts.length > 0 ? posts.reduce((sum, p) => sum + p.likeCount, 0) / posts.length : 0,
      responseTime: 4.2, // 平均回复时间（小时）
    }

    // 内容质量指标
    const contentQuality = {
      avgPostLength:
        posts.length > 0 ? posts.reduce((sum, p) => sum + p.content.length, 0) / posts.length : 0,
      helpfulVotesRate: 0.15, // 有帮助投票率
      flaggedContentRate: 0.02, // 被举报内容率
    }

    return {
      totalUsers: users.length,
      activeUsers,
      totalPosts: posts.length,
      totalComments,
      totalEvents: this.events.size,
      topCategories,
      userGrowth,
      engagementMetrics,
      contentQuality,
    }
  }

  // 获取用户排行榜
  getLeaderboard(type: 'reputation' | 'posts' | 'comments' | 'likes', limit = 10): CommunityUser[] {
    const users = Array.from(this.users.values())

    return users
      .sort((a, b) => {
        switch (type) {
          case 'reputation':
            return b.reputation - a.reputation
          case 'posts':
            return b.stats.postsCount - a.stats.postsCount
          case 'comments':
            return b.stats.commentsCount - a.stats.commentsCount
          case 'likes':
            return b.stats.likesReceived - a.stats.likesReceived
          default:
            return 0
        }
      })
      .slice(0, limit)
  }

  // 搜索功能
  searchPosts(
    query: string,
    filters?: {
      category?: PostCategory
      type?: PostType
      author?: string
      tags?: string[]
      dateRange?: { start: Date; end: Date }
    }
  ): CommunityPost[] {
    let posts = Array.from(this.posts.values())

    // 文本搜索
    if (query) {
      const searchTerm = query.toLowerCase()
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
      )
    }

    // 应用过滤器
    if (filters) {
      if (filters.category) {
        posts = posts.filter((p) => p.category === filters.category)
      }

      if (filters.type) {
        posts = posts.filter((p) => p.type === filters.type)
      }

      if (filters.author) {
        posts = posts.filter((p) => p.author.id === filters.author)
      }

      if (filters.tags && filters.tags.length > 0) {
        posts = posts.filter((p) => filters.tags!.some((tag) => p.tags.includes(tag)))
      }

      if (filters.dateRange) {
        posts = posts.filter(
          (p) => p.createdAt >= filters.dateRange!.start && p.createdAt <= filters.dateRange!.end
        )
      }
    }

    return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // 获取用户资料
  getUserProfile(userId: string): CommunityUser | null {
    return this.users.get(userId) || null
  }

  // 获取用户帖子
  getUserPosts(userId: string): CommunityPost[] {
    return Array.from(this.posts.values())
      .filter((post) => post.author.id === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // 获取帖子详情（包含评论）
  getPostWithComments(postId: string): { post: CommunityPost; comments: Comment[] } | null {
    const post = this.posts.get(postId)
    if (!post) return null

    const comments = this.comments.get(postId) || []
    return { post, comments }
  }
}

// 创建单例实例
export const communityManager = new CommunityManager()
