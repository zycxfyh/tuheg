import { Injectable } from '@nestjs/common'
import { PersonalizationLearner, PersonalizationProfile } from '../personalization-interface'

@Injectable()
export class PersonalizationLearnerImpl implements PersonalizationLearner {
  private profiles = new Map<string, PersonalizationProfile>()

  async learnPreferences(userId: string, interactions: any[]): Promise<PersonalizationProfile> {
    let profile = this.profiles.get(userId)

    if (!profile) {
      profile = {
        userId,
        type: 'user_preferences',
        config: {
          preferences: {},
          behaviorPatterns: [],
          contextRules: [],
          domainKnowledge: [],
        },
        learningData: {
          interactions: [],
          preferences: [],
          performance: {
            accuracy: 0,
            speed: 0,
            satisfaction: 0,
            lastUpdated: new Date(),
          },
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          dataPoints: 0,
        },
      }
    }

    // 分析交互数据学习偏好
    const preferences = this.extractPreferences(interactions)
    const patterns = this.extractBehaviorPatterns(interactions)

    profile.config.preferences = { ...profile.config.preferences, ...preferences }
    profile.config.behaviorPatterns = patterns
    profile.learningData.interactions = interactions
    profile.metadata.dataPoints = interactions.length
    profile.metadata.updatedAt = new Date()

    this.profiles.set(userId, profile)
    return profile
  }

  async updateBehaviorPatterns(userId: string, newPatterns: any[]): Promise<void> {
    const profile = this.profiles.get(userId)
    if (profile) {
      profile.config.behaviorPatterns = [
        ...profile.config.behaviorPatterns,
        ...newPatterns.map(p => ({
          pattern: p.pattern,
          frequency: p.frequency || 1,
          lastObserved: new Date(),
          confidence: p.confidence || 0.8,
        })),
      ]
      profile.metadata.updatedAt = new Date()
      this.profiles.set(userId, profile)
    }
  }

  async adaptToContext(userId: string, context: any): Promise<{
    adaptations: Array<{
      type: string
      change: any
      confidence: number
    }>
    recommendations: string[]
  }> {
    const profile = this.profiles.get(userId)

    if (!profile) {
      return {
        adaptations: [],
        recommendations: ['需要更多用户数据来提供个性化适配'],
      }
    }

    // 基于上下文和用户偏好进行适配
    const adaptations = this.generateAdaptations(profile, context)

    return {
      adaptations,
      recommendations: this.generateRecommendations(profile, context),
    }
  }

  async generatePersonalizedResponse(
    userId: string,
    input: any,
    context: any,
  ): Promise<{
    response: any
    personalizationFactors: string[]
    confidence: number
  }> {
    const profile = this.profiles.get(userId)

    if (!profile) {
      return {
        response: input, // 原样返回
        personalizationFactors: [],
        confidence: 0.5,
      }
    }

    // 基于用户偏好生成个性化响应
    const personalizedResponse = this.personalizeResponse(input, profile, context)

    return {
      response: personalizedResponse,
      personalizationFactors: Object.keys(profile.config.preferences),
      confidence: 0.8,
    }
  }

  async getLearningStats(userId: string): Promise<{
    totalInteractions: number
    learnedPatterns: number
    adaptationSuccessRate: number
    personalizationEffectiveness: number
    lastUpdated: Date
  }> {
    const profile = this.profiles.get(userId)

    if (!profile) {
      return {
        totalInteractions: 0,
        learnedPatterns: 0,
        adaptationSuccessRate: 0,
        personalizationEffectiveness: 0,
        lastUpdated: new Date(),
      }
    }

    return {
      totalInteractions: profile.learningData.interactions.length,
      learnedPatterns: profile.config.behaviorPatterns.length,
      adaptationSuccessRate: 0.85, // 模拟值
      personalizationEffectiveness: profile.learningData.performance.satisfaction,
      lastUpdated: profile.metadata.updatedAt,
    }
  }

  private extractPreferences(interactions: any[]): Record<string, any> {
    const preferences: Record<string, any> = {}

    // 分析交互模式提取偏好
    const responseTypes = interactions.map(i => i.output?.type).filter(Boolean)
    if (responseTypes.length > 0) {
      preferences.preferredResponseType = this.getMostCommon(responseTypes)
    }

    const languages = interactions.map(i => i.context?.language).filter(Boolean)
    if (languages.length > 0) {
      preferences.preferredLanguage = this.getMostCommon(languages)
    }

    return preferences
  }

  private extractBehaviorPatterns(interactions: any[]): any[] {
    // 简化的行为模式提取
    const patterns: any[] = []

    // 分析时间模式
    const hourPatterns = this.analyzeTimePatterns(interactions)
    patterns.push(...hourPatterns)

    // 分析交互频率
    const frequencyPatterns = this.analyzeFrequencyPatterns(interactions)
    patterns.push(...frequencyPatterns)

    return patterns
  }

  private generateAdaptations(profile: PersonalizationProfile, context: any): any[] {
    const adaptations: any[] = []

    // 基于上下文生成适配
    if (context.timeOfDay) {
      adaptations.push({
        type: 'response_style',
        change: context.timeOfDay === 'morning' ? 'energetic' : 'calm',
        confidence: 0.7,
      })
    }

    if (profile.config.preferences.preferredLanguage) {
      adaptations.push({
        type: 'language',
        change: profile.config.preferences.preferredLanguage,
        confidence: 0.9,
      })
    }

    return adaptations
  }

  private generateRecommendations(profile: PersonalizationProfile, context: any): string[] {
    const recommendations: string[] = []

    if (profile.learningData.interactions.length < 10) {
      recommendations.push('建议收集更多用户交互数据以提高个性化效果')
    }

    if (profile.config.behaviorPatterns.length < 5) {
      recommendations.push('建议分析更多行为模式来优化用户体验')
    }

    return recommendations
  }

  private personalizeResponse(input: any, profile: PersonalizationProfile, context: any): any {
    let response = { ...input }

    // 应用个性化偏好
    if (profile.config.preferences.preferredResponseType) {
      response.type = profile.config.preferences.preferredResponseType
    }

    if (profile.config.preferences.preferredLanguage) {
      response.language = profile.config.preferences.preferredLanguage
    }

    // 应用上下文适配
    if (context.urgency === 'high') {
      response.priority = 'high'
    }

    return response
  }

  private getMostCommon(items: any[]): any {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
  }

  private analyzeTimePatterns(interactions: any[]): any[] {
    // 简化的时间模式分析
    const patterns: any[] = []

    const morningInteractions = interactions.filter(i =>
      new Date(i.timestamp).getHours() < 12
    ).length

    if (morningInteractions > interactions.length * 0.6) {
      patterns.push({
        pattern: 'morning_active',
        frequency: morningInteractions / interactions.length,
        lastObserved: new Date(),
        confidence: 0.8,
      })
    }

    return patterns
  }

  private analyzeFrequencyPatterns(interactions: any[]): any[] {
    // 简化的频率模式分析
    const patterns: any[] = []

    const recentInteractions = interactions.filter(i =>
      new Date(i.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length

    if (recentInteractions > 5) {
      patterns.push({
        pattern: 'high_frequency_user',
        frequency: recentInteractions / 7, // 每天平均
        lastObserved: new Date(),
        confidence: 0.7,
      })
    }

    return patterns
  }
}
