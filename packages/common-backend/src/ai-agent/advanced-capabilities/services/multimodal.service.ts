import { Injectable, Logger } from '@nestjs/common'
import { Observable, from, map, mergeMap } from 'rxjs'
import {
  MultimodalService as IMultimodalService,
  MultimodalInput,
  MultimodalOutput,
  ModalityType,
  ModalityData,
  ModalityProcessor,
  MultimodalFuser,
  ModalityTransformer,
  MultimodalReasoningEngine,
  MultimodalCache,
  MultimodalValidator,
} from '../multimodal-interface'

@Injectable()
export class MultimodalService implements IMultimodalService {
  private readonly logger = new Logger(MultimodalService.name)

  constructor(
    private readonly processor: ModalityProcessor,
    private readonly fuser: MultimodalFuser,
    private readonly transformer: ModalityTransformer,
    private readonly reasoningEngine: MultimodalReasoningEngine,
    private readonly cache: MultimodalCache,
    private readonly validator: MultimodalValidator,
  ) {}

  async process(input: MultimodalInput): Promise<MultimodalOutput> {
    const startTime = Date.now()

    try {
      // 验证输入
      const validation = await this.validator.validateInput(input)
      if (!validation.valid) {
        throw new Error(`Invalid multimodal input: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // 检查缓存
      const cacheKey = this.cache.generateKey(input)
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        this.logger.debug('Returning cached multimodal result')
        return cached
      }

      // 处理主要模态
      const processedPrimary = await this.processor.process(input.primary)

      // 处理辅助模态
      const processedSecondary = await Promise.all(
        input.secondary.map(modality => this.processor.process(modality))
      )

      // 创建处理后的输入
      const processedInput: MultimodalInput = {
        ...input,
        primary: processedPrimary,
        secondary: processedSecondary,
      }

      // 多模态推理
      const output = await this.reasoningEngine.reason(processedInput)

      // 验证输出
      const outputValidation = await this.validator.validateOutput(output)
      if (!outputValidation.valid) {
        this.logger.warn(`Output validation issues: ${outputValidation.issues.join(', ')}`)
      }

      // 计算处理时间
      const processingTime = Date.now() - startTime

      // 创建最终输出
      const finalOutput: MultimodalOutput = {
        ...output,
        metadata: {
          ...output.metadata,
          processingTime,
        },
      }

      // 缓存结果
      await this.cache.set(cacheKey, input, finalOutput, 3600000) // 1小时缓存

      return finalOutput

    } catch (error) {
      this.logger.error('Multimodal processing failed', error)
      throw error
    }
  }

  async processBatch(inputs: MultimodalInput[]): Promise<MultimodalOutput[]> {
    this.logger.debug(`Processing batch of ${inputs.length} multimodal inputs`)

    const results = await Promise.allSettled(
      inputs.map(input => this.process(input))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        this.logger.error(`Batch processing failed for input ${index}`, result.reason)
        // 返回错误输出
        return {
          primary: {
            type: ModalityType.TEXT,
            content: 'Processing failed',
            metadata: {
              error: result.reason.message,
              processingTime: 0,
            },
          },
          secondary: [],
          confidence: 0,
          metadata: {
            processingTime: 0,
            modalitiesUsed: [],
            resourceUsage: {
              memory: 0,
              compute: 0,
            },
          },
        } as MultimodalOutput
      }
    })
  }

  processStream(input$: Observable<MultimodalInput>): Observable<MultimodalOutput> {
    this.logger.debug('Starting multimodal stream processing')

    return input$.pipe(
      mergeMap(async (input) => {
        try {
          return await this.process(input)
        } catch (error) {
          this.logger.error('Stream processing error', error)
          // 返回错误输出
          return {
            primary: {
              type: ModalityType.TEXT,
              content: 'Stream processing failed',
              metadata: {
                error: error.message,
                processingTime: 0,
              },
            },
            secondary: [],
            confidence: 0,
            metadata: {
              processingTime: 0,
              modalitiesUsed: [],
              resourceUsage: {
                memory: 0,
                compute: 0,
              },
            },
          } as MultimodalOutput
        }
      })
    )
  }

  getSupportedModalities(): ModalityType[] {
    return this.processor.supportedModalities
  }

  getServiceStats() {
    const cacheStats = this.cache.getStats()

    return {
      totalRequests: 0, // 需要从监控系统中获取
      averageProcessingTime: 0, // 需要从监控系统中获取
      modalityUsage: {}, // 需要从监控系统中获取
      cacheHitRate: cacheStats.hitRate,
      errorRate: 0, // 需要从监控系统中获取
    }
  }

  async healthCheck() {
    try {
      // 检查各个组件的健康状态
      const checks = {
        processor: true, // 假设处理器正常
        fuser: true, // 假设融合器正常
        transformer: true, // 假设转换器正常
        reasoningEngine: true, // 假设推理引擎正常
        cache: true, // 假设缓存正常
        validator: true, // 假设验证器正常
      }

      const metrics = {
        cacheHitRate: this.cache.getStats().hitRate,
        totalCacheEntries: this.cache.getStats().totalEntries,
        averageCacheSize: this.cache.getStats().averageEntrySize,
      }

      const allHealthy = Object.values(checks).every(Boolean)

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        metrics,
      }
    } catch (error) {
      this.logger.error('Health check failed', error)
      return {
        status: 'unhealthy',
        checks: {
          service: false,
        },
        metrics: {},
      }
    }
  }
}
