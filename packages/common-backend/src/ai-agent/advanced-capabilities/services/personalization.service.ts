import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { DynamicAiSchedulerService } from '../../../ai/dynamic-ai-scheduler.service'
import {
  PersonalizationLearner,
  FineTuningManager,
  ModelFuser,
  ContextLearner,
  PersonalizationProfile,
  FineTuningTask,
  PersonalizationType,
  FineTuningStrategy,
} from '../personalization-interface'

@Injectable()
export class PersonalizationService {
  private readonly logger = new Logger(PersonalizationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiScheduler: DynamicAiSchedulerService,
    private readonly learner: PersonalizationLearner,
    private readonly fineTuningManager: FineTuningManager,
    private readonly modelFuser: ModelFuser,
    private readonly contextLearner: ContextLearner,
  ) {}

  async createPersonalizationProfile(
    userId: string,
    tenantId?: string,
    type: PersonalizationType = PersonalizationType.USER_PREFERENCES,
  ): Promise<PersonalizationProfile> {
    this.logger.debug(`Creating personalization profile for user ${userId}`)

    const profile: PersonalizationProfile = {
      userId,
      tenantId,
      type,
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

    // 存储到数据库
    await this.prisma.userProfile.upsert({
      where: { userId_type: { userId, type } },
      update: {
        config: profile.config,
        learningData: profile.learningData,
        metadata: profile.metadata,
      },
      create: {
        userId,
        tenantId,
        type,
        config: profile.config,
        learningData: profile.learningData,
        metadata: profile.metadata,
      },
    })

    return profile
  }

  async getPersonalizationProfile(
    userId: string,
    type: PersonalizationType,
  ): Promise<PersonalizationProfile | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId_type: { userId, type } },
    })

    if (!profile) {
      return null
    }

    return {
      userId: profile.userId,
      tenantId: profile.tenantId || undefined,
      type: profile.type as PersonalizationType,
      config: profile.config as any,
      learningData: profile.learningData as any,
      metadata: profile.metadata as any,
    }
  }

  async updatePersonalizationProfile(
    userId: string,
    type: PersonalizationType,
    updates: Partial<PersonalizationProfile>,
  ): Promise<PersonalizationProfile> {
    const updated = await this.prisma.userProfile.update({
      where: { userId_type: { userId, type } },
      data: {
        config: updates.config,
        learningData: updates.learningData,
        metadata: {
          ...updates.metadata,
          updatedAt: new Date(),
        },
      },
    })

    return {
      userId: updated.userId,
      tenantId: updated.tenantId || undefined,
      type: updated.type as PersonalizationType,
      config: updated.config as any,
      learningData: updated.learningData as any,
      metadata: updated.metadata as any,
    }
  }

  async learnFromInteraction(
    userId: string,
    interaction: {
      input: any
      output: any
      feedback?: any
      context?: any
    },
  ): Promise<void> {
    this.logger.debug(`Learning from interaction for user ${userId}`)

    // 获取或创建配置文件
    let profile = await this.getPersonalizationProfile(
      userId,
      PersonalizationType.USER_PREFERENCES,
    )

    if (!profile) {
      profile = await this.createPersonalizationProfile(userId)
    }

    // 添加交互数据
    profile.learningData.interactions.push({
      timestamp: new Date(),
      type: 'interaction',
      input: interaction.input,
      output: interaction.output,
      feedback: interaction.feedback,
    })

    // 更新性能指标
    if (interaction.feedback) {
      const feedback = interaction.feedback
      profile.learningData.performance = {
        accuracy: this.calculateAverage([
          profile.learningData.performance.accuracy,
          feedback.accuracy || 0,
        ]),
        speed: this.calculateAverage([
          profile.learningData.performance.speed,
          feedback.speed || 0,
        ]),
        satisfaction: this.calculateAverage([
          profile.learningData.performance.satisfaction,
          feedback.satisfaction || 0,
        ]),
        lastUpdated: new Date(),
      }
    }

    // 更新数据点计数
    profile.metadata.dataPoints = profile.learningData.interactions.length
    profile.metadata.updatedAt = new Date()

    // 保存更新
    await this.updatePersonalizationProfile(userId, profile.type, profile)

    // 触发学习过程
    await this.learner.learnPreferences(userId, profile.learningData.interactions)
  }

  async createFineTuningTask(
    userId: string,
    baseModel: string,
    dataset: any,
    strategy: FineTuningStrategy,
    hyperparameters: any,
  ): Promise<FineTuningTask> {
    this.logger.debug(`Creating fine-tuning task for user ${userId}`)

    return this.fineTuningManager.createFineTuningTask(
      `personalized-${userId}-${Date.now()}`,
      `Personalized fine-tuning for user ${userId}`,
      baseModel,
      dataset,
      strategy,
      hyperparameters,
      userId,
    )
  }

  async generatePersonalizedResponse(
    userId: string,
    input: any,
    context?: any,
  ): Promise<{
    response: any
    personalization: string[]
    confidence: number
  }> {
    // 获取个性化配置
    const profile = await this.getPersonalizationProfile(
      userId,
      PersonalizationType.USER_PREFERENCES,
    )

    if (!profile) {
      // 无个性化配置，使用默认AI
      const provider = await this.aiScheduler.getProviderForRole(
        { id: userId } as any,
        'logic_parsing',
      )
      const response = await provider.model.invoke([
        { role: 'user', content: JSON.stringify(input) },
      ])

      return {
        response: response.content,
        personalization: [],
        confidence: 0.5,
      }
    }

    // 使用个性化学习器生成响应
    return this.learner.generatePersonalizedResponse(userId, input, context)
  }

  async fuseUserModels(
    userId: string,
    modelIds: string[],
    strategy: string,
  ): Promise<{
    fusedModelId: string
    performance: Record<string, number>
  }> {
    this.logger.debug(`Fusing models for user ${userId}: ${modelIds.join(', ')}`)

    return this.modelFuser.fuseModels(
      modelIds.map(id => ({
        modelId: id,
        weight: 1.0,
        role: 'primary' as const,
      })),
      strategy as any,
    )
  }

  async learnContext(
    userId: string,
    contextData: any,
  ): Promise<{
    learned: string[]
    insights: string[]
    recommendations: string[]
  }> {
    return this.contextLearner.learnContextPatterns(userId, [contextData])
  }

  async getPersonalizationStats(userId: string): Promise<{
    totalInteractions: number
    learnedPatterns: number
    adaptationSuccessRate: number
    personalizationEffectiveness: number
    lastUpdated: Date
  }> {
    const profile = await this.getPersonalizationProfile(
      userId,
      PersonalizationType.USER_PREFERENCES,
    )

    if (!profile) {
      return {
        totalInteractions: 0,
        learnedPatterns: 0,
        adaptationSuccessRate: 0,
        personalizationEffectiveness: 0,
        lastUpdated: new Date(),
      }
    }

    const learnerStats = await this.learner.getLearningStats(userId)

    return {
      totalInteractions: profile.learningData.interactions.length,
      learnedPatterns: learnerStats.learnedPatterns,
      adaptationSuccessRate: learnerStats.adaptationSuccessRate,
      personalizationEffectiveness: learnerStats.personalizationEffectiveness,
      lastUpdated: profile.metadata.updatedAt,
    }
  }

  private calculateAverage(values: number[]): number {
    const validValues = values.filter(v => v > 0)
    return validValues.length > 0
      ? validValues.reduce((a, b) => a + b, 0) / validValues.length
      : 0
  }
}
