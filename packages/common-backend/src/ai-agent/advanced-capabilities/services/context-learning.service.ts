import { Injectable, Logger } from '@nestjs/common'
import { ContextLearner } from '../personalization-interface'

@Injectable()
export class ContextLearningService {
  private readonly logger = new Logger(ContextLearningService.name)

  constructor(private readonly contextLearner: ContextLearner) {}

  async learnContextPatterns(
    userId: string,
    contexts: Array<{
      situation: any
      response: any
      outcome: any
      timestamp: Date
    }>,
  ): Promise<{
    patterns: Array<{
      pattern: string
      confidence: number
      applicability: string[]
    }>
    insights: string[]
  }> {
    return this.contextLearner.learnContextPatterns(userId, contexts)
  }

  async predictContextNeeds(
    userId: string,
    currentContext: any,
  ): Promise<{
    predictedNeeds: string[]
    confidence: number
    recommendations: Array<{
      action: string
      expectedBenefit: number
      rationale: string
    }>
  }> {
    return this.contextLearner.predictContextNeeds(userId, currentContext)
  }

  async adaptToContextChange(
    userId: string,
    oldContext: any,
    newContext: any,
    feedback?: any,
  ): Promise<{
    adaptations: Array<{
      type: string
      change: any
      expectedImpact: number
    }>
    learning: string[]
  }> {
    return this.contextLearner.adaptToContextChange(
      userId,
      oldContext,
      newContext,
      feedback,
    )
  }

  async getContextInsights(userId: string): Promise<{
    commonPatterns: Array<{
      pattern: string
      frequency: number
      effectiveness: number
    }>
    contextPreferences: Record<string, any>
    adaptationHistory: Array<{
      timestamp: Date
      adaptation: string
      impact: number
    }>
  }> {
    return this.contextLearner.getContextInsights(userId)
  }
}
