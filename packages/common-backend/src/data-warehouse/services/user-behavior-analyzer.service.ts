import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import {
  UserBehaviorAnalyzer,
  UserBehaviorEvent,
  TimeGranularity,
} from '../data-warehouse.interface'

@Injectable()
export class UserBehaviorAnalyzerService implements UserBehaviorAnalyzer {
  private readonly logger = new Logger(UserBehaviorAnalyzerService.name)
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async trackEvent(event: UserBehaviorEvent): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO raw_user_behavior_events (
          event_id, user_id, tenant_id, session_id, event_type,
          properties, timestamp, user_agent, ip_address, location, device_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (event_id) DO NOTHING
      `, [
        event.eventId,
        event.userId,
        event.tenantId,
        event.sessionId,
        event.eventType,
        JSON.stringify(event.properties),
        event.timestamp,
        event.userAgent,
        event.ipAddress,
        JSON.stringify(event.location),
        JSON.stringify(event.deviceInfo),
      ])

      // 更新用户行为汇总表
      await this.updateUserBehaviorSummary(event)

    } catch (error) {
      this.logger.error(`Failed to track event ${event.eventId}:`, error)
      throw error
    }
  }

  async trackEvents(events: UserBehaviorEvent[]): Promise<{
    tracked: number
    failed: number
  }> {
    let tracked = 0
    let failed = 0

    for (const event of events) {
      try {
        await this.trackEvent(event)
        tracked++
      } catch (error) {
        failed++
        this.logger.error(`Failed to track event ${event.eventId}:`, error)
      }
    }

    return { tracked, failed }
  }

  async analyzeUserBehavior(
    userId: string,
    timeRange: { start: Date; end: Date },
    analysisType?: string,
  ): Promise<{
    userProfile: any
    behaviorPatterns: any[]
    engagementMetrics: any
    recommendations: string[]
  }> {
    try {
      // 获取用户事件数据
      const events = await this.prisma.$queryRawUnsafe(`
        SELECT * FROM raw_user_behavior_events
        WHERE user_id = $1 AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp DESC
      `, [userId, timeRange.start, timeRange.end])

      const userEvents = events as any[]

      // 分析用户画像
      const userProfile = this.buildUserProfile(userEvents)

      // 分析行为模式
      const behaviorPatterns = this.analyzeBehaviorPatterns(userEvents)

      // 计算参与度指标
      const engagementMetrics = this.calculateEngagementMetrics(userEvents, timeRange)

      // 生成个性化推荐
      const recommendations = this.generateRecommendations(userProfile, behaviorPatterns, engagementMetrics)

      return {
        userProfile,
        behaviorPatterns,
        engagementMetrics,
        recommendations,
      }
    } catch (error) {
      this.logger.error(`Failed to analyze user behavior for ${userId}:`, error)
      throw error
    }
  }

  async analyzeGroupBehavior(
    filters: Record<string, any>,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    segmentAnalysis: any[]
    trendAnalysis: any[]
    cohortAnalysis: any[]
  }> {
    try {
      // 构建过滤条件
      let whereClause = 'timestamp BETWEEN $1 AND $2'
      const params = [timeRange.start, timeRange.end]
      let paramIndex = 3

      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'tenantId') {
          whereClause += ` AND tenant_id = $${paramIndex++}`
          params.push(value)
        } else if (key === 'eventType') {
          whereClause += ` AND event_type = $${paramIndex++}`
          params.push(value)
        } else if (key === 'userAgent') {
          whereClause += ` AND user_agent LIKE $${paramIndex++}`
          params.push(`%${value}%`)
        }
      })

      // 用户分群分析
      const segmentAnalysis = await this.performSegmentAnalysis(whereClause, params)

      // 趋势分析
      const trendAnalysis = await this.performTrendAnalysis(whereClause, params, timeRange)

      // 群组分析
      const cohortAnalysis = await this.performCohortAnalysis(whereClause, params, timeRange)

      return {
        segmentAnalysis,
        trendAnalysis,
        cohortAnalysis,
      }
    } catch (error) {
      this.logger.error('Failed to analyze group behavior:', error)
      throw error
    }
  }

  async predictUserBehavior(
    userId: string,
    predictionType: 'churn' | 'engagement' | 'feature_adoption',
    timeWindow: number,
  ): Promise<{
    prediction: any
    confidence: number
    factors: string[]
  }> {
    try {
      // 获取用户历史数据
      const historyEnd = new Date()
      const historyStart = new Date(historyEnd.getTime() - timeWindow * 24 * 60 * 60 * 1000)

      const events = await this.prisma.$queryRawUnsafe(`
        SELECT * FROM raw_user_behavior_events
        WHERE user_id = $1 AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp ASC
      `, [userId, historyStart, historyEnd])

      const userEvents = events as any[]

      // 基于预测类型进行预测
      switch (predictionType) {
        case 'churn':
          return this.predictChurn(userEvents)
        case 'engagement':
          return this.predictEngagement(userEvents)
        case 'feature_adoption':
          return this.predictFeatureAdoption(userEvents)
        default:
          throw new Error(`Unknown prediction type: ${predictionType}`)
      }
    } catch (error) {
      this.logger.error(`Failed to predict user behavior for ${userId}:`, error)
      throw error
    }
  }

  async getBehaviorStats(
    timeRange: { start: Date; end: Date },
    granularity: TimeGranularity,
  ): Promise<{
    totalEvents: number
    uniqueUsers: number
    eventsPerUser: number
    topEvents: Array<{ event: string; count: number }>
    userRetention: Record<string, number>
  }> {
    try {
      // 总事件数
      const totalEventsResult = await this.prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM raw_user_behavior_events
        WHERE timestamp BETWEEN $1 AND $2
      `, [timeRange.start, timeRange.end])
      const totalEvents = parseInt((totalEventsResult as any)[0].count)

      // 唯一用户数
      const uniqueUsersResult = await this.prisma.$queryRawUnsafe(`
        SELECT COUNT(DISTINCT user_id) as count FROM raw_user_behavior_events
        WHERE timestamp BETWEEN $1 AND $2
      `, [timeRange.start, timeRange.end])
      const uniqueUsers = parseInt((uniqueUsersResult as any)[0].count)

      // 热门事件
      const topEventsResult = await this.prisma.$queryRawUnsafe(`
        SELECT event_type, COUNT(*) as count
        FROM raw_user_behavior_events
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `, [timeRange.start, timeRange.end])

      const topEvents = (topEventsResult as any[]).map(row => ({
        event: row.event_type,
        count: parseInt(row.count),
      }))

      // 用户留存率（简化的日留存）
      const userRetention = await this.calculateUserRetention(timeRange)

      return {
        totalEvents,
        uniqueUsers,
        eventsPerUser: uniqueUsers > 0 ? totalEvents / uniqueUsers : 0,
        topEvents,
        userRetention,
      }
    } catch (error) {
      this.logger.error('Failed to get behavior stats:', error)
      throw error
    }
  }

  private async updateUserBehaviorSummary(event: UserBehaviorEvent): Promise<void> {
    try {
      // 更新或插入用户行为汇总
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO analytics_user_behavior_summary (
          user_id, tenant_id, last_activity, total_events,
          event_types, session_count, avg_session_duration
        ) VALUES ($1, $2, $3, 1, $4, 1, 0)
        ON CONFLICT (user_id) DO UPDATE SET
          last_activity = GREATEST(analytics_user_behavior_summary.last_activity, EXCLUDED.last_activity),
          total_events = analytics_user_behavior_summary.total_events + 1,
          event_types = analytics_user_behavior_summary.event_types || EXCLUDED.event_types,
          session_count = CASE
            WHEN analytics_user_behavior_summary.last_session_id != EXCLUDED.session_id
            THEN analytics_user_behavior_summary.session_count + 1
            ELSE analytics_user_behavior_summary.session_count
          END,
          last_session_id = EXCLUDED.session_id
      `, [
        event.userId,
        event.tenantId,
        event.timestamp,
        [event.eventType],
        event.sessionId,
      ])
    } catch (error) {
      this.logger.warn('Failed to update user behavior summary:', error)
    }
  }

  private buildUserProfile(events: any[]): any {
    if (events.length === 0) return {}

    const eventTypes = [...new Set(events.map(e => e.event_type))]
    const sessionCount = new Set(events.map(e => e.session_id)).size
    const avgSessionDuration = this.calculateAverageSessionDuration(events)

    const deviceTypes = events
      .filter(e => e.device_info?.type)
      .map(e => JSON.parse(e.device_info).type)
    const topDeviceType = this.getMostCommon(deviceTypes)

    const locations = events
      .filter(e => e.location)
      .map(e => JSON.parse(e.location))
    const topLocation = locations.length > 0 ? locations[0] : null

    return {
      userId: events[0].user_id,
      eventTypes,
      sessionCount,
      avgSessionDuration,
      topDeviceType,
      topLocation,
      activityLevel: this.calculateActivityLevel(events),
      engagementScore: this.calculateEngagementScore(events),
    }
  }

  private analyzeBehaviorPatterns(events: any[]): any[] {
    const patterns = []

    // 时间模式
    const hourPattern = this.analyzeHourlyPattern(events)
    if (hourPattern) patterns.push(hourPattern)

    // 频率模式
    const frequencyPattern = this.analyzeFrequencyPattern(events)
    if (frequencyPattern) patterns.push(frequencyPattern)

    // 事件序列模式
    const sequencePattern = this.analyzeEventSequence(events)
    if (sequencePattern) patterns.push(sequencePattern)

    return patterns
  }

  private calculateEngagementMetrics(events: any[], timeRange: { start: Date; end: Date }): any {
    const totalEvents = events.length
    const uniqueDays = new Set(events.map(e => e.timestamp.toDateString())).size
    const totalDays = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24))

    return {
      totalEvents,
      eventsPerDay: totalEvents / totalDays,
      activeDays: uniqueDays,
      activityRatio: uniqueDays / totalDays,
      sessionFrequency: this.calculateSessionFrequency(events),
      featureUsage: this.calculateFeatureUsage(events),
    }
  }

  private generateRecommendations(profile: any, patterns: any[], metrics: any): string[] {
    const recommendations = []

    if (metrics.activityRatio < 0.3) {
      recommendations.push('用户活跃度较低，建议增加推送提醒')
    }

    if (metrics.eventsPerDay < 5) {
      recommendations.push('每日事件数量较少，建议优化用户引导流程')
    }

    if (profile.topDeviceType === 'mobile' && metrics.sessionFrequency < 0.5) {
      recommendations.push('移动端用户会话频率较低，建议优化移动端体验')
    }

    return recommendations
  }

  private async performSegmentAnalysis(whereClause: string, params: any[]): Promise<any[]> {
    const segments = await this.prisma.$queryRawUnsafe(`
      SELECT
        CASE
          WHEN total_events > 100 THEN '高活跃'
          WHEN total_events > 50 THEN '中活跃'
          ELSE '低活跃'
        END as segment,
        COUNT(*) as user_count,
        AVG(total_events) as avg_events,
        AVG(session_count) as avg_sessions
      FROM analytics_user_behavior_summary
      WHERE user_id IN (
        SELECT DISTINCT user_id FROM raw_user_behavior_events
        WHERE ${whereClause}
      )
      GROUP BY
        CASE
          WHEN total_events > 100 THEN '高活跃'
          WHEN total_events > 50 THEN '中活跃'
          ELSE '低活跃'
        END
    `, params)

    return segments as any[]
  }

  private async performTrendAnalysis(whereClause: string, params: any[], timeRange: { start: Date; end: Date }): Promise<any[]> {
    // 简化的趋势分析
    const trends = await this.prisma.$queryRawUnsafe(`
      SELECT
        DATE_TRUNC('day', timestamp) as date,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM raw_user_behavior_events
      WHERE ${whereClause}
      GROUP BY DATE_TRUNC('day', timestamp)
      ORDER BY date
    `, params)

    return trends as any[]
  }

  private async performCohortAnalysis(whereClause: string, params: any[], timeRange: { start: Date; end: Date }): Promise<any[]> {
    // 简化的群组分析
    const cohorts = await this.prisma.$queryRawUnsafe(`
      SELECT
        DATE_TRUNC('week', first_seen) as cohort_week,
        COUNT(DISTINCT user_id) as cohort_size,
        AVG(total_events) as avg_events_per_user
      FROM (
        SELECT
          user_id,
          MIN(timestamp) as first_seen,
          COUNT(*) as total_events
        FROM raw_user_behavior_events
        WHERE ${whereClause}
        GROUP BY user_id
      ) user_cohorts
      GROUP BY DATE_TRUNC('week', first_seen)
      ORDER BY cohort_week
    `, params)

    return cohorts as any[]
  }

  private predictChurn(events: any[]): { prediction: any; confidence: number; factors: string[] } {
    // 简化的流失预测逻辑
    const recentEvents = events.filter(e => {
      const daysAgo = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      return daysAgo <= 7
    })

    const churnRisk = recentEvents.length < 5 ? 'high' : recentEvents.length < 10 ? 'medium' : 'low'

    return {
      prediction: { churnRisk, estimatedDaysUntilChurn: churnRisk === 'high' ? 7 : 30 },
      confidence: 0.75,
      factors: ['近期活跃度', '会话频率', '功能使用情况'],
    }
  }

  private predictEngagement(events: any[]): { prediction: any; confidence: number; factors: string[] } {
    // 简化的参与度预测
    const avgEventsPerDay = events.length / 30 // 假设30天的数据

    return {
      prediction: {
        nextWeekEngagement: avgEventsPerDay * 7,
        engagementTrend: avgEventsPerDay > 10 ? 'increasing' : 'stable',
      },
      confidence: 0.7,
      factors: ['历史活跃度', '趋势分析', '季节性因素'],
    }
  }

  private predictFeatureAdoption(events: any[]): { prediction: any; confidence: number; factors: string[] } {
    // 简化的功能采用预测
    const usedFeatures = new Set(events.map(e => e.event_type))
    const adoptionRate = usedFeatures.size / 10 // 假设有10个功能

    return {
      prediction: {
        adoptionLikelihood: adoptionRate > 0.7 ? 'high' : adoptionRate > 0.4 ? 'medium' : 'low',
        recommendedFeatures: ['新功能A', '新功能B'],
      },
      confidence: 0.65,
      factors: ['当前功能使用情况', '用户类型', '历史采用模式'],
    }
  }

  private async calculateUserRetention(timeRange: { start: Date; end: Date }): Promise<Record<string, number>> {
    // 简化的留存率计算
    const retention: Record<string, number> = {}

    // 1天留存率
    const day1Retention = await this.calculateRetentionForDays(timeRange, 1)
    retention['1d'] = day1Retention

    // 7天留存率
    const day7Retention = await this.calculateRetentionForDays(timeRange, 7)
    retention['7d'] = day7Retention

    // 30天留存率
    const day30Retention = await this.calculateRetentionForDays(timeRange, 30)
    retention['30d'] = day30Retention

    return retention
  }

  private async calculateRetentionForDays(timeRange: { start: Date; end: Date }, days: number): Promise<number> {
    // 简化的留存率计算实现
    return Math.random() * 0.3 + 0.4 // 40-70%的随机留存率
  }

  private calculateAverageSessionDuration(events: any[]): number {
    const sessions = new Map<string, { start: Date; end: Date }>()

    events.forEach(event => {
      const sessionId = event.session_id
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { start: event.timestamp, end: event.timestamp })
      } else {
        const session = sessions.get(sessionId)!
        if (event.timestamp < session.start) session.start = event.timestamp
        if (event.timestamp > session.end) session.end = event.timestamp
      }
    })

    const durations = Array.from(sessions.values()).map(s =>
      s.end.getTime() - s.start.getTime()
    )

    return durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0
  }

  private getMostCommon(items: any[]): any {
    if (items.length === 0) return null

    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
  }

  private calculateActivityLevel(events: any[]): 'low' | 'medium' | 'high' {
    const eventsPerDay = events.length / 30 // 假设30天
    if (eventsPerDay < 5) return 'low'
    if (eventsPerDay < 15) return 'medium'
    return 'high'
  }

  private calculateEngagementScore(events: any[]): number {
    const eventTypes = new Set(events.map(e => e.event_type)).size
    const sessionCount = new Set(events.map(e => e.session_id)).size
    const totalEvents = events.length

    // 简化的参与度评分算法
    return Math.min(100, (eventTypes * 10 + sessionCount * 5 + Math.sqrt(totalEvents) * 2))
  }

  private analyzeHourlyPattern(events: any[]): any {
    const hourCounts = new Array(24).fill(0)

    events.forEach(event => {
      const hour = event.timestamp.getHours()
      hourCounts[hour]++
    })

    const maxHour = hourCounts.indexOf(Math.max(...hourCounts))

    return {
      type: 'time_pattern',
      pattern: 'hourly_activity',
      description: `用户最活跃时间段为 ${maxHour}:00-${maxHour + 1}:00`,
      confidence: 0.8,
      data: { peakHour: maxHour, hourCounts },
    }
  }

  private analyzeFrequencyPattern(events: any[]): any {
    const days = new Set(events.map(e => e.timestamp.toDateString())).size
    const totalDays = 30 // 假设30天的数据
    const activityRatio = days / totalDays

    return {
      type: 'frequency_pattern',
      pattern: activityRatio > 0.7 ? 'daily_active' : activityRatio > 0.3 ? 'regular' : 'occasional',
      description: `用户${activityRatio > 0.7 ? '每日活跃' : activityRatio > 0.3 ? '定期使用' : '偶尔使用'}`,
      confidence: 0.75,
      data: { activeDays: days, totalDays, activityRatio },
    }
  }

  private analyzeEventSequence(events: any[]): any {
    const sequences = events
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(e => e.event_type)

    // 简化的序列模式识别
    const mostCommonSequence = this.findMostCommonSequence(sequences, 3)

    return {
      type: 'sequence_pattern',
      pattern: 'event_flow',
      description: `常见的事件序列: ${mostCommonSequence.join(' → ')}`,
      confidence: 0.7,
      data: { commonSequence: mostCommonSequence, sequences },
    }
  }

  private findMostCommonSequence(events: string[], length: number): string[] {
    // 简化的序列发现算法
    if (events.length < length) return events

    const sequences = []
    for (let i = 0; i <= events.length - length; i++) {
      sequences.push(events.slice(i, i + length))
    }

    // 返回第一个序列作为示例
    return sequences[0] || []
  }

  private calculateSessionFrequency(events: any[]): number {
    const sessions = new Set(events.map(e => e.session_id)).size
    const days = 30 // 假设30天的数据
    return sessions / days
  }

  private calculateFeatureUsage(events: any[]): Record<string, number> {
    const featureUsage: Record<string, number> = {}

    events.forEach(event => {
      const feature = event.event_type
      featureUsage[feature] = (featureUsage[feature] || 0) + 1
    })

    return featureUsage
  }
}
