import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiModelService, ModelRecommendation } from './ai-model.service';
import { AgentService } from './agent.service';
import { TaskService } from './task.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface RecommendationContext {
  userId?: string;
  taskType?: string;
  capabilities?: string[];
  constraints?: {
    maxCost?: number;
    maxLatency?: number;
    minAccuracy?: number;
    requiredCapabilities?: string[];
  };
  historicalUsage?: Array<{
    modelId: string;
    performance: number;
    cost: number;
    latency: number;
  }>;
}

export interface PersonalizedRecommendation {
  model: any;
  score: number;
  confidence: number;
  reasons: string[];
  alternatives: any[];
  predictedPerformance: {
    accuracy: number;
    latency: number;
    cost: number;
  };
  adaptation: {
    learningRate: number;
    confidence: number;
  };
}

export interface CollaborativeRecommendation {
  recommendations: PersonalizedRecommendation[];
  groupConsensus: {
    agreedModels: string[];
    disagreedModels: string[];
    consensusScore: number;
  };
  diversity: {
    capabilityCoverage: number;
    costDistribution: number;
    performanceVariance: number;
  };
}

@Injectable()
export class IntelligentRecommendationService {
  constructor(
    private prisma: PrismaService,
    private modelService: AiModelService,
    private agentService: AgentService,
    private taskService: TaskService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== 个性化推荐 ====================

  /**
   * 生成个性化AI模型推荐
   */
  async generatePersonalizedRecommendations(
    context: RecommendationContext
  ): Promise<PersonalizedRecommendation[]> {
    const { userId, capabilities = [], constraints = {} } = context;

    // 获取基础模型推荐
    const baseRecommendations = await this.modelService.getRecommendations({
      capabilities,
      priority: 'balanced',
      maxTokens: constraints.maxTokens,
      userId
    });

    if (baseRecommendations.length === 0) {
      return [];
    }

    // 应用个性化调整
    const personalized = await Promise.all(
      baseRecommendations.map(async (rec) => {
        const personalizedScore = await this.calculatePersonalizedScore(rec, context);
        const confidence = await this.calculateRecommendationConfidence(rec, context);
        const predictedPerformance = await this.predictModelPerformance(rec.model.id, context);
        const adaptation = await this.calculateAdaptationPotential(rec.model.id, userId);

        return {
          model: rec.model,
          score: personalizedScore,
          confidence,
          reasons: await this.generatePersonalizedReasons(rec, context),
          alternatives: rec.alternatives,
          predictedPerformance,
          adaptation
        };
      })
    );

    // 按个性化评分排序
    personalized.sort((a, b) => b.score - a.score);

    this.eventEmitter.emit('ai.recommendations.generated', {
      userId,
      recommendations: personalized,
      context
    });

    return personalized;
  }

  /**
   * 生成协作式推荐
   */
  async generateCollaborativeRecommendations(
    userIds: string[],
    context: RecommendationContext
  ): Promise<CollaborativeRecommendation> {
    // 为每个用户生成个性化推荐
    const userRecommendations = await Promise.all(
      userIds.map(userId =>
        this.generatePersonalizedRecommendations({ ...context, userId })
      )
    );

    // 计算群体共识
    const groupConsensus = this.calculateGroupConsensus(userRecommendations);

    // 计算多样性指标
    const diversity = this.calculateRecommendationDiversity(userRecommendations);

    // 合并推荐
    const mergedRecommendations = this.mergeUserRecommendations(userRecommendations);

    return {
      recommendations: mergedRecommendations,
      groupConsensus,
      diversity
    };
  }

  /**
   * 生成任务导向推荐
   */
  async generateTaskOrientedRecommendations(
    taskId: string,
    context?: RecommendationContext
  ): Promise<ModelRecommendation[]> {
    const task = await this.taskService.getTask(taskId);

    // 基于任务类型和复杂度推荐模型
    const taskContext = {
      capabilities: this.extractTaskCapabilities(task),
      priority: this.determineTaskPriority(task),
      constraints: {
        maxTokens: this.estimateTokenRequirements(task),
        maxLatency: this.determineLatencyRequirements(task.complexity as any)
      },
      ...context
    };

    return this.modelService.getRecommendations(taskContext);
  }

  // ==================== 上下文感知推荐 ====================

  /**
   * 基于使用模式推荐
   */
  async generatePatternBasedRecommendations(userId: string): Promise<ModelRecommendation[]> {
    // 分析用户的使用模式
    const usagePatterns = await this.analyzeUserPatterns(userId);

    // 基于模式生成推荐
    const recommendations = [];

    for (const pattern of usagePatterns) {
      const patternRecommendations = await this.modelService.getRecommendations({
        capabilities: pattern.preferredCapabilities,
        priority: pattern.costPreference,
        constraints: pattern.constraints
      });

      recommendations.push(...patternRecommendations);
    }

    // 去重并排序
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);

    return uniqueRecommendations;
  }

  /**
   * 实时自适应推荐
   */
  async generateAdaptiveRecommendations(
    userId: string,
    currentTask: any,
    recentPerformance: any[]
  ): Promise<ModelRecommendation[]> {
    // 基于近期表现调整推荐
    const adaptationFactors = this.calculateAdaptationFactors(recentPerformance);

    const context = {
      userId,
      capabilities: currentTask.capabilities,
      constraints: {
        ...currentTask.constraints,
        // 根据适应因子调整约束
        maxLatency: currentTask.constraints.maxLatency * adaptationFactors.latencyMultiplier,
        maxCost: currentTask.constraints.maxCost * adaptationFactors.costMultiplier
      }
    };

    const recommendations = await this.generatePersonalizedRecommendations(context);

    // 应用适应性调整
    return recommendations.map(rec => ({
      ...rec,
      score: rec.score * adaptationFactors.overallMultiplier
    }));
  }

  // ==================== 高级推荐算法 ====================

  /**
   * 基于机器学习的推荐
   */
  async generateMLBasedRecommendations(
    userId: string,
    featureVector: number[]
  ): Promise<ModelRecommendation[]> {
    // 这里可以集成机器学习模型
    // 暂时使用简化的协同过滤算法

    const similarUsers = await this.findSimilarUsers(userId);
    const collaborativeRecommendations = await this.generateCollaborativeFilteringRecommendations(
      similarUsers,
      userId
    );

    return collaborativeRecommendations;
  }

  /**
   * 多目标优化推荐
   */
  async generateMultiObjectiveRecommendations(
    objectives: Array<{
      name: string;
      weight: number;
      target: 'minimize' | 'maximize';
      currentValue?: number;
    }>,
    context: RecommendationContext
  ): Promise<ModelRecommendation[]> {
    const baseRecommendations = await this.modelService.getRecommendations(context);

    // 应用多目标优化
    const optimized = baseRecommendations.map(rec => {
      let totalScore = 0;

      for (const objective of objectives) {
        const value = this.extractObjectiveValue(rec.model, objective.name);
        const normalizedValue = this.normalizeObjectiveValue(value, objective);
        const objectiveScore = objective.weight * normalizedValue;
        totalScore += objective.target === 'maximize' ? objectiveScore : (1 - objectiveScore);
      }

      return {
        ...rec,
        score: totalScore
      };
    });

    optimized.sort((a, b) => b.score - a.score);
    return optimized;
  }

  // ==================== 推荐评估和反馈 ====================

  /**
   * 评估推荐质量
   */
  async evaluateRecommendationQuality(
    recommendationId: string,
    userFeedback: {
      selected: boolean;
      satisfaction: number; // 1-5
      performance: number; // 1-5
      comments?: string;
    }
  ): Promise<void> {
    // 记录反馈用于改进推荐算法
    await this.prisma.recommendationFeedback.create({
      data: {
        recommendationId,
        userId: 'system', // 暂时使用系统用户
        selected: userFeedback.selected,
        satisfaction: userFeedback.satisfaction,
        performance: userFeedback.performance,
        comments: userFeedback.comments
      }
    });

    // 更新推荐模型的准确性指标
    await this.updateRecommendationAccuracy(recommendationId, userFeedback);

    this.eventEmitter.emit('ai.recommendation.feedback', {
      recommendationId,
      feedback: userFeedback
    });
  }

  /**
   * 获取推荐统计
   */
  async getRecommendationStats(userId: string, period: 'day' | 'week' | 'month' = 'month') {
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const [totalRecommendations, acceptedRecommendations, satisfactionStats] = await Promise.all([
      this.prisma.recommendationFeedback.count({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      this.prisma.recommendationFeedback.count({
        where: {
          userId,
          selected: true,
          createdAt: { gte: startDate }
        }
      }),
      this.prisma.recommendationFeedback.aggregate({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        _avg: {
          satisfaction: true,
          performance: true
        }
      })
    ]);

    return {
      period,
      totalRecommendations,
      acceptanceRate: totalRecommendations > 0 ? acceptedRecommendations / totalRecommendations : 0,
      averageSatisfaction: satisfactionStats._avg.satisfaction || 0,
      averagePerformance: satisfactionStats._avg.performance || 0
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 计算个性化评分
   */
  private async calculatePersonalizedScore(
    recommendation: ModelRecommendation,
    context: RecommendationContext
  ): Promise<number> {
    let score = recommendation.score;

    // 用户偏好调整
    if (context.userId) {
      const userPreference = await this.calculateUserPreference(recommendation.model.id, context.userId);
      score += userPreference * 10;
    }

    // 历史表现调整
    if (context.historicalUsage) {
      const historicalAdjustment = this.calculateHistoricalAdjustment(
        recommendation.model.id,
        context.historicalUsage
      );
      score += historicalAdjustment * 5;
    }

    // 约束符合度
    if (context.constraints) {
      const constraintScore = this.calculateConstraintScore(recommendation.model, context.constraints);
      score *= constraintScore;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算推荐置信度
   */
  private async calculateRecommendationConfidence(
    recommendation: ModelRecommendation,
    context: RecommendationContext
  ): Promise<number> {
    let confidence = 0.5; // 基础置信度

    // 数据完整性
    const model = recommendation.model;
    if (model.performance && model.latency && model.accuracy) {
      confidence += 0.2;
    }

    // 用户历史数据
    if (context.userId) {
      const usageCount = await this.prisma.modelUsage.count({
        where: { userId: context.userId }
      });
      confidence += Math.min(0.2, usageCount / 100); // 最多增加20%
    }

    // 实时指标
    const recentMetrics = await this.prisma.modelMetrics.findFirst({
      where: { modelId: model.id },
      orderBy: { timestamp: 'desc' }
    });
    if (recentMetrics) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * 预测模型性能
   */
  private async predictModelPerformance(
    modelId: string,
    context: RecommendationContext
  ): Promise<{
    accuracy: number;
    latency: number;
    cost: number;
  }> {
    // 获取历史性能数据
    const recentMetrics = await this.prisma.modelMetrics.findMany({
      where: { modelId },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    if (recentMetrics.length === 0) {
      return { accuracy: 0.5, latency: 2000, cost: 0.01 };
    }

    // 计算平均值作为预测
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / recentMetrics.length;
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.avgLatency, 0) / recentMetrics.length;

    // 估算成本
    const model = await this.modelService.getModel(modelId);
    const pricing = model.pricing as any;
    const cost = pricing?.input || 0.01;

    return {
      accuracy: avgAccuracy,
      latency: avgLatency,
      cost
    };
  }

  /**
   * 计算适应性潜力
   */
  private async calculateAdaptationPotential(
    modelId: string,
    userId?: string
  ): Promise<{
    learningRate: number;
    confidence: number;
  }> {
    if (!userId) {
      return { learningRate: 0.5, confidence: 0.5 };
    }

    // 基于用户使用此模型的历史计算适应性
    const usageHistory = await this.prisma.modelUsage.findMany({
      where: {
        modelId,
        userId,
        status: 'SUCCESS'
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (usageHistory.length < 5) {
      return { learningRate: 0.3, confidence: 0.3 };
    }

    // 计算性能趋势
    const recentPerformance = usageHistory.slice(0, 5);
    const olderPerformance = usageHistory.slice(5, 10);

    const recentAvgLatency = recentPerformance.reduce((sum, u) => sum + u.latency, 0) / recentPerformance.length;
    const olderAvgLatency = olderPerformance.reduce((sum, u) => sum + u.latency, 0) / olderPerformance.length;

    const learningRate = olderAvgLatency > 0 ? Math.max(0, (olderAvgLatency - recentAvgLatency) / olderAvgLatency) : 0.5;
    const confidence = Math.min(1, usageHistory.length / 20);

    return { learningRate, confidence };
  }

  /**
   * 生成个性化推荐理由
   */
  private async generatePersonalizedReasons(
    recommendation: ModelRecommendation,
    context: RecommendationContext
  ): Promise<string[]> {
    const reasons = [...recommendation.reasons];

    if (context.userId) {
      const usageCount = await this.prisma.modelUsage.count({
        where: {
          modelId: recommendation.model.id,
          userId: context.userId,
          status: 'SUCCESS'
        }
      });

      if (usageCount > 0) {
        reasons.push(`您已成功使用过 ${usageCount} 次`);
      }
    }

    return reasons;
  }

  /**
   * 计算用户偏好
   */
  private async calculateUserPreference(modelId: string, userId: string): Promise<number> {
    const usageCount = await this.prisma.modelUsage.count({
      where: {
        modelId,
        userId,
        status: 'SUCCESS'
      }
    });

    return Math.min(1, usageCount / 10); // 最多增加1分
  }

  /**
   * 计算历史调整
   */
  private calculateHistoricalAdjustment(
    modelId: string,
    historicalUsage: Array<{
      modelId: string;
      performance: number;
      cost: number;
      latency: number;
    }>
  ): number {
    const modelHistory = historicalUsage.find(h => h.modelId === modelId);
    if (!modelHistory) return 0;

    // 基于历史表现调整评分
    return (modelHistory.performance - 0.5) * 0.5; // -0.25 到 +0.25
  }

  /**
   * 计算约束评分
   */
  private calculateConstraintScore(model: any, constraints: any): number {
    let score = 1;

    if (constraints.maxCost && model.pricing?.input > constraints.maxCost) {
      score *= 0.5;
    }

    if (constraints.maxLatency && model.latency > constraints.maxLatency) {
      score *= 0.7;
    }

    if (constraints.minAccuracy && model.accuracy < constraints.minAccuracy) {
      score *= 0.6;
    }

    return score;
  }

  // 其他私有方法的实现可以根据需要添加...
}
