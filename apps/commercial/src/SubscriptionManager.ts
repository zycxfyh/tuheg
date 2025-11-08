import { EventEmitter } from 'events'

// 订阅计划类型
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
    currency: string
  }
  features: SubscriptionFeature[]
  limits: SubscriptionLimits
  popular?: boolean
  trialDays?: number
}

// 订阅功能
export interface SubscriptionFeature {
  id: string
  name: string
  description: string
  included: boolean
  limit?: number | 'unlimited'
}

// 订阅限制
export interface SubscriptionLimits {
  worldsPerMonth: number | 'unlimited'
  storiesPerMonth: number | 'unlimited'
  charactersPerWorld: number | 'unlimited'
  aiRequestsPerDay: number | 'unlimited'
  storageGB: number
  collaborators: number
  prioritySupport: boolean
  customPlugins: boolean
}

// 用户订阅状态
export interface UserSubscription {
  id: string
  userId: string
  planId: string
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
  cancelAtPeriodEnd: boolean
  usage: SubscriptionUsage
  paymentMethod?: PaymentMethod
  metadata: Record<string, any>
}

// 订阅使用情况
export interface SubscriptionUsage {
  worldsCreated: number
  storiesGenerated: number
  charactersUsed: number
  aiRequestsMade: number
  storageUsedGB: number
  lastResetDate: Date
}

// 支付方式
export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank' | 'crypto'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

// 账单记录
export interface Invoice {
  id: string
  subscriptionId: string
  userId: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  billingPeriod: {
    start: Date
    end: Date
  }
  dueDate: Date
  paidAt?: Date
  paymentIntentId?: string
  items: InvoiceItem[]
  tax?: number
  discount?: number
}

// 账单项目
export interface InvoiceItem {
  id: string
  description: string
  amount: number
  quantity: number
  period: {
    start: Date
    end: Date
  }
}

// 优惠券
export interface Coupon {
  id: string
  code: string
  name: string
  description: string
  discountType: 'percent' | 'amount'
  discountValue: number
  maxRedemptions?: number
  redemptionsCount: number
  validFrom: Date
  validUntil?: Date
  applicablePlans: string[]
}

// 订阅管理器
export class SubscriptionManager extends EventEmitter {
  private plans: Map<string, SubscriptionPlan> = new Map()
  private subscriptions: Map<string, UserSubscription> = new Map()
  private coupons: Map<string, Coupon> = new Map()
  private usageTracker: Map<string, SubscriptionUsage> = new Map()

  constructor() {
    super()
    this.initializePlans()
  }

  // 初始化订阅计划
  private initializePlans() {
    const plans: SubscriptionPlan[] = [
      {
        id: 'free',
        name: '免费版',
        description: '体验创世星环的基本功能',
        price: {
          monthly: 0,
          yearly: 0,
          currency: 'CNY',
        },
        features: [
          {
            id: 'basic_world',
            name: '基础世界构建',
            description: '创建简单的游戏世界',
            included: true,
          },
          {
            id: 'basic_story',
            name: '基础故事生成',
            description: '生成简短的故事',
            included: true,
          },
          {
            id: 'character_basic',
            name: '基础角色创建',
            description: '创建简单角色',
            included: true,
          },
          { id: 'export_basic', name: '基础导出', description: '导出为JSON格式', included: true },
        ],
        limits: {
          worldsPerMonth: 3,
          storiesPerMonth: 10,
          charactersPerWorld: 5,
          aiRequestsPerDay: 50,
          storageGB: 1,
          collaborators: 0,
          prioritySupport: false,
          customPlugins: false,
        },
        trialDays: 0,
      },
      {
        id: 'creator',
        name: '创作者',
        description: '适合独立游戏开发者',
        price: {
          monthly: 29,
          yearly: 290,
          currency: 'CNY',
        },
        features: [
          {
            id: 'advanced_world',
            name: '高级世界构建',
            description: '复杂的世界设定和规则',
            included: true,
          },
          {
            id: 'branching_story',
            name: '分支叙事',
            description: '创建多结局故事',
            included: true,
          },
          {
            id: 'character_advanced',
            name: '高级角色系统',
            description: '复杂角色关系和背景',
            included: true,
          },
          { id: 'export_advanced', name: '高级导出', description: '多种格式导出', included: true },
          {
            id: 'collaboration',
            name: '协作功能',
            description: '多人协作创作',
            included: true,
            limit: 2,
          },
          { id: 'priority_support', name: '优先支持', description: '快速技术支持', included: true },
        ],
        limits: {
          worldsPerMonth: 50,
          storiesPerMonth: 200,
          charactersPerWorld: 50,
          aiRequestsPerDay: 1000,
          storageGB: 10,
          collaborators: 2,
          prioritySupport: true,
          customPlugins: false,
        },
        trialDays: 14,
      },
      {
        id: 'studio',
        name: '工作室',
        description: '适合小型游戏工作室',
        price: {
          monthly: 99,
          yearly: 990,
          currency: 'CNY',
        },
        features: [
          {
            id: 'unlimited_worlds',
            name: '无限世界',
            description: '不受限制的世界创建',
            included: true,
          },
          {
            id: 'unlimited_stories',
            name: '无限故事',
            description: '不受限制的故事生成',
            included: true,
          },
          {
            id: 'advanced_collaboration',
            name: '高级协作',
            description: '完整团队协作功能',
            included: true,
            limit: 10,
          },
          {
            id: 'custom_plugins',
            name: '自定义插件',
            description: '开发和使用自定义插件',
            included: true,
          },
          { id: 'api_access', name: 'API访问', description: '完整的API访问权限', included: true },
          { id: 'white_label', name: '白牌服务', description: '去除品牌标识', included: true },
          {
            id: 'premium_support',
            name: '高级支持',
            description: '7*24小时专属支持',
            included: true,
          },
        ],
        limits: {
          worldsPerMonth: 'unlimited',
          storiesPerMonth: 'unlimited',
          charactersPerWorld: 'unlimited',
          aiRequestsPerDay: 'unlimited',
          storageGB: 100,
          collaborators: 10,
          prioritySupport: true,
          customPlugins: true,
        },
        trialDays: 30,
        popular: true,
      },
      {
        id: 'enterprise',
        name: '企业版',
        description: '适合大型企业和定制需求',
        price: {
          monthly: 299,
          yearly: 2990,
          currency: 'CNY',
        },
        features: [
          { id: 'all_features', name: '全部功能', description: '所有可用功能', included: true },
          {
            id: 'unlimited_everything',
            name: '完全无限',
            description: '无任何使用限制',
            included: true,
          },
          {
            id: 'custom_integrations',
            name: '自定义集成',
            description: '定制系统集成',
            included: true,
          },
          {
            id: 'dedicated_instance',
            name: '专属实例',
            description: '独立的云实例',
            included: true,
          },
          { id: 'sla_guarantee', name: 'SLA保证', description: '99.9%可用性保证', included: true },
          { id: 'custom_training', name: '定制培训', description: '专属团队培训', included: true },
        ],
        limits: {
          worldsPerMonth: 'unlimited',
          storiesPerMonth: 'unlimited',
          charactersPerWorld: 'unlimited',
          aiRequestsPerDay: 'unlimited',
          storageGB: 1000,
          collaborators: 100,
          prioritySupport: true,
          customPlugins: true,
        },
      },
    ]

    plans.forEach((plan) => this.plans.set(plan.id, plan))
  }

  // 获取所有订阅计划
  getPlans(): SubscriptionPlan[] {
    return Array.from(this.plans.values())
  }

  // 获取单个计划
  getPlan(planId: string): SubscriptionPlan | null {
    return this.plans.get(planId) || null
  }

  // 创建用户订阅
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethod?: PaymentMethod,
    couponCode?: string
  ): Promise<UserSubscription> {
    const plan = this.getPlan(planId)
    if (!plan) {
      throw new Error(`Plan ${planId} not found`)
    }

    // 验证优惠券
    let coupon: Coupon | null = null
    if (couponCode) {
      coupon = this.validateCoupon(couponCode, planId)
    }

    const now = new Date()
    const subscription: UserSubscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      planId,
      status: plan.trialDays ? 'trialing' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30天
      trialEnd: plan.trialDays
        ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
        : undefined,
      cancelAtPeriodEnd: false,
      usage: this.initializeUsage(),
      paymentMethod,
      metadata: {
        couponApplied: coupon?.id,
        createdAt: now.toISOString(),
      },
    }

    this.subscriptions.set(subscription.id, subscription)
    this.usageTracker.set(userId, subscription.usage)

    this.emit('subscriptionCreated', { subscription, plan, coupon })

    return subscription
  }

  // 更新订阅
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<UserSubscription>
  ): Promise<UserSubscription> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`)
    }

    const updatedSubscription = { ...subscription, ...updates }
    this.subscriptions.set(subscriptionId, updatedSubscription)

    this.emit('subscriptionUpdated', { subscription: updatedSubscription, changes: updates })

    return updatedSubscription
  }

  // 取消订阅
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true
  ): Promise<UserSubscription> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`)
    }

    subscription.cancelAtPeriodEnd = cancelAtPeriodEnd
    if (!cancelAtPeriodEnd) {
      subscription.status = 'cancelled'
    }

    this.emit('subscriptionCancelled', { subscription, immediate: !cancelAtPeriodEnd })

    return subscription
  }

  // 检查用户权限
  checkPermission(
    userId: string,
    featureId: string
  ): { allowed: boolean; limit?: number; remaining?: number } {
    const subscription = this.getUserActiveSubscription(userId)
    if (!subscription) {
      // 免费用户
      const freePlan = this.getPlan('free')
      if (!freePlan) return { allowed: false }

      const feature = freePlan.features.find((f) => f.id === featureId)
      return {
        allowed: feature?.included || false,
        limit: typeof feature?.limit === 'number' ? feature.limit : undefined,
      }
    }

    const plan = this.getPlan(subscription.planId)
    if (!plan) return { allowed: false }

    const feature = plan.features.find((f) => f.id === featureId)
    if (!feature?.included) return { allowed: false }

    const usage = this.getCurrentUsage(userId)
    const limit = this.getFeatureLimit(plan.limits, featureId)

    if (limit === 'unlimited') {
      return { allowed: true }
    }

    const used = this.getFeatureUsage(usage, featureId)
    const remaining = Math.max(0, limit - used)

    return {
      allowed: remaining > 0,
      limit,
      remaining,
    }
  }

  // 记录功能使用
  recordUsage(userId: string, featureId: string, amount = 1): void {
    const usage = this.usageTracker.get(userId) || this.initializeUsage()

    switch (featureId) {
      case 'world_created':
        usage.worldsCreated += amount
        break
      case 'story_generated':
        usage.storiesGenerated += amount
        break
      case 'character_used':
        usage.charactersUsed += amount
        break
      case 'ai_request':
        usage.aiRequestsMade += amount
        break
      case 'storage_used':
        usage.storageUsedGB += amount
        break
    }

    this.usageTracker.set(userId, usage)

    // 检查是否超过限制
    const permission = this.checkPermission(userId, featureId)
    if (!permission.allowed) {
      this.emit('limitExceeded', { userId, featureId, usage, limit: permission.limit })
    }
  }

  // 获取用户活跃订阅
  getUserActiveSubscription(userId: string): UserSubscription | null {
    for (const subscription of this.subscriptions.values()) {
      if (
        subscription.userId === userId &&
        (subscription.status === 'active' || subscription.status === 'trialing')
      ) {
        return subscription
      }
    }
    return null
  }

  // 获取当前使用情况
  getCurrentUsage(userId: string): SubscriptionUsage {
    return this.usageTracker.get(userId) || this.initializeUsage()
  }

  // 创建优惠券
  createCoupon(coupon: Omit<Coupon, 'id' | 'redemptionsCount'>): Coupon {
    const newCoupon: Coupon = {
      ...coupon,
      id: `coupon-${Date.now()}`,
      redemptionsCount: 0,
    }

    this.coupons.set(newCoupon.code, newCoupon)
    return newCoupon
  }

  // 验证优惠券
  validateCoupon(code: string, planId: string): Coupon | null {
    const coupon = this.coupons.get(code)
    if (!coupon) return null

    const now = new Date()
    if (now < coupon.validFrom || (coupon.validUntil && now > coupon.validUntil)) {
      return null
    }

    if (coupon.maxRedemptions && coupon.redemptionsCount >= coupon.maxRedemptions) {
      return null
    }

    if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planId)) {
      return null
    }

    return coupon
  }

  // 应用优惠券
  applyCoupon(code: string, planId: string): { discount: number; finalPrice: number } {
    const coupon = this.validateCoupon(code, planId)
    if (!coupon) throw new Error('Invalid coupon')

    const plan = this.getPlan(planId)
    if (!plan) throw new Error('Invalid plan')

    const originalPrice = plan.price.monthly
    let discount = 0

    if (coupon.discountType === 'percent') {
      discount = originalPrice * (coupon.discountValue / 100)
    } else {
      discount = Math.min(coupon.discountValue, originalPrice)
    }

    const finalPrice = Math.max(0, originalPrice - discount)

    coupon.redemptionsCount++

    return { discount, finalPrice }
  }

  // 生成账单
  generateInvoice(subscription: UserSubscription): Invoice {
    const plan = this.getPlan(subscription.planId)
    if (!plan) throw new Error('Plan not found')

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      subscriptionId: subscription.id,
      userId: subscription.userId,
      amount: plan.price.monthly,
      currency: plan.price.currency,
      status: 'draft',
      billingPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      },
      dueDate: new Date(subscription.currentPeriodEnd.getTime() + 7 * 24 * 60 * 60 * 1000), // 7天宽限期
      items: [
        {
          id: `item-${Date.now()}`,
          description: `${plan.name}订阅费用`,
          amount: plan.price.monthly,
          quantity: 1,
          period: {
            start: subscription.currentPeriodStart,
            end: subscription.currentPeriodEnd,
          },
        },
      ],
    }

    return invoice
  }

  // 私有辅助方法
  private initializeUsage(): SubscriptionUsage {
    return {
      worldsCreated: 0,
      storiesGenerated: 0,
      charactersUsed: 0,
      aiRequestsMade: 0,
      storageUsedGB: 0,
      lastResetDate: new Date(),
    }
  }

  private getFeatureLimit(limits: SubscriptionLimits, featureId: string): number | 'unlimited' {
    switch (featureId) {
      case 'world_created':
        return limits.worldsPerMonth
      case 'story_generated':
        return limits.storiesPerMonth
      case 'character_used':
        return limits.charactersPerWorld
      case 'ai_request':
        return limits.aiRequestsPerDay
      case 'storage_used':
        return limits.storageGB
      case 'collaboration':
        return limits.collaborators
      default:
        return 0
    }
  }

  private getFeatureUsage(usage: SubscriptionUsage, featureId: string): number {
    switch (featureId) {
      case 'world_created':
        return usage.worldsCreated
      case 'story_generated':
        return usage.storiesGenerated
      case 'character_used':
        return usage.charactersUsed
      case 'ai_request':
        return usage.aiRequestsMade
      case 'storage_used':
        return usage.storageUsedGB
      default:
        return 0
    }
  }
}

// 创建单例实例
export const subscriptionManager = new SubscriptionManager()
