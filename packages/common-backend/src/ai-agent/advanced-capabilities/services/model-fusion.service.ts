import { Injectable, Logger } from '@nestjs/common'
import { ModelFuser } from '../personalization-interface'

@Injectable()
export class ModelFusionService {
  private readonly logger = new Logger(ModelFusionService.name)

  constructor(private readonly modelFuser: ModelFuser) {}

  async fuseModels(
    models: string[],
    strategy: 'weighted_average' | 'expert_routing' | 'adaptive' | 'custom',
    config?: any,
  ): Promise<{
    fusedModelId: string
    performance: Record<string, number>
  }> {
    this.logger.debug(`Fusing ${models.length} models with strategy: ${strategy}`)

    return this.modelFuser.fuseModels(
      models.map(id => ({
        modelId: id,
        weight: 1.0 / models.length, // 平均权重
        role: 'primary' as const,
      })),
      strategy,
      config,
    )
  }

  async routeToExpert(
    input: any,
    experts: Array<{
      modelId: string
      expertise: string[]
      performance: Record<string, number>
    }>,
  ): Promise<{
    selectedExpert: string
    confidence: number
    reasoning: string
  }> {
    return this.modelFuser.routeToExpert(input, experts)
  }

  async ensembleModels(
    models: string[],
    votingStrategy: 'majority' | 'weighted' | 'ranked' | 'custom',
    weights?: number[],
  ): Promise<{
    ensembleId: string
    performance: Record<string, number>
  }> {
    this.logger.debug(`Creating ensemble of ${models.length} models`)

    return this.modelFuser.ensembleModels(models, votingStrategy, weights)
  }

  async evaluateFusion(
    fusedModelId: string,
    testData: any[],
    metrics: string[],
  ): Promise<{
    scores: Record<string, number>
    comparison: {
      individual: Record<string, Record<string, number>>
      fused: Record<string, number>
      improvement: Record<string, number>
    }
    analysis: string[]
  }> {
    return this.modelFuser.evaluateFusion(fusedModelId, testData, metrics)
  }
}
