import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common'
import { MultimodalService } from '../services/multimodal.service'
import { PersonalizationService } from '../services/personalization.service'
import { ReasoningService } from '../services/reasoning.service'
import { ModelFusionService } from '../services/model-fusion.service'
import { ContextLearningService } from '../services/context-learning.service'

@Controller('advanced-ai')
export class AdvancedCapabilitiesController {
  constructor(
    private readonly multimodalService: MultimodalService,
    private readonly personalizationService: PersonalizationService,
    private readonly reasoningService: ReasoningService,
    private readonly modelFusionService: ModelFusionService,
    private readonly contextLearningService: ContextLearningService,
  ) {}

  @Post('multimodal/process')
  async processMultimodal(@Body() input: any) {
    return this.multimodalService.process(input)
  }

  @Post('personalization/:userId/learn')
  async learnFromInteraction(
    @Param('userId') userId: string,
    @Body() interaction: any,
  ) {
    await this.personalizationService.learnFromInteraction(userId, interaction)
    return { success: true }
  }

  @Post('personalization/:userId/generate')
  async generatePersonalizedResponse(
    @Param('userId') userId: string,
    @Body() request: { input: any; context?: any },
  ) {
    return this.personalizationService.generatePersonalizedResponse(
      userId,
      request.input,
      request.context,
    )
  }

  @Post('personalization/:userId/finetune')
  async createFineTuningTask(
    @Param('userId') userId: string,
    @Body() config: {
      baseModel: string
      dataset: any
      strategy: string
      hyperparameters: any
    },
  ) {
    return this.personalizationService.createFineTuningTask(
      userId,
      config.baseModel,
      config.dataset,
      config.strategy as any,
      config.hyperparameters,
    )
  }

  @Post('reasoning/perform')
  async performReasoning(@Body() request: any) {
    return this.reasoningService.performReasoning(
      request.input,
      request.options,
    )
  }

  @Post('reasoning/learn')
  async learnAndAdapt(@Body() experience: any) {
    return this.reasoningService.learnAndAdapt(experience)
  }

  @Post('models/fuse')
  async fuseModels(@Body() request: { models: string[]; strategy: string }) {
    return this.modelFusionService.fuseModels(
      request.models,
      request.strategy as any,
    )
  }

  @Post('models/ensemble')
  async ensembleModels(
    @Body() request: { models: string[]; votingStrategy: string; weights?: number[] },
  ) {
    return this.modelFusionService.ensembleModels(
      request.models,
      request.votingStrategy as any,
      request.weights,
    )
  }

  @Post('context/:userId/learn')
  async learnContext(
    @Param('userId') userId: string,
    @Body() contextData: any,
  ) {
    return this.contextLearningService.learnContextPatterns(userId, [contextData])
  }

  @Get('context/:userId/insights')
  async getContextInsights(@Param('userId') userId: string) {
    return this.contextLearningService.getContextInsights(userId)
  }

  @Get('stats')
  async getStats() {
    return {
      multimodal: this.multimodalService.getServiceStats(),
      reasoning: await this.reasoningService.getReasoningStats(),
    }
  }

  @Get('health')
  async healthCheck() {
    return this.multimodalService.healthCheck()
  }
}
