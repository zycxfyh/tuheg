'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var DynamicAiSchedulerService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.DynamicAiSchedulerService = void 0
const common_1 = require('@nestjs/common')
const config_1 = require('@nestjs/config')
const prisma_service_1 = require('../prisma/prisma.service')
const ai_provider_factory_1 = require('./ai-provider.factory')
let DynamicAiSchedulerService = (DynamicAiSchedulerService_1 = class DynamicAiSchedulerService {
  prisma
  aiProviderFactory
  configService
  logger = new common_1.Logger(DynamicAiSchedulerService_1.name)
  constructor(prisma, aiProviderFactory, configService) {
    this.prisma = prisma
    this.aiProviderFactory = aiProviderFactory
    this.configService = configService
  }
  async getProviderForRole(user, role) {
    this.logger.debug(`[Scheduler] New request for role: "${role}" from user ${user.id}`)
    const dedicatedConfig = await this.prisma.aiConfiguration.findFirst({
      where: {
        ownerId: user.id,
        roles: {
          some: {
            name: role,
          },
        },
      },
    })
    if (dedicatedConfig) {
      this.logger.log(
        `[Scheduler] Priority 1 (Dedicated): Found dedicated config "${dedicatedConfig.provider}/${dedicatedConfig.modelId}" for role "${role}".`
      )
      return this.aiProviderFactory.createProvider(dedicatedConfig)
    }
    this.logger.debug(
      `[Scheduler] Priority 1 (Dedicated): No dedicated AI found for role "${role}".`
    )
    const anyUserConfig = await this.prisma.aiConfiguration.findFirst({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'asc' },
    })
    if (anyUserConfig) {
      this.logger.log(
        `[Scheduler] Priority 2 (Requisition): Requisitioning general-purpose AI "${anyUserConfig.provider}/${anyUserConfig.modelId}" for role "${role}".`
      )
      return this.aiProviderFactory.createProvider(anyUserConfig)
    }
    this.logger.debug(`[Scheduler] Priority 2 (Requisition): User has no AI configurations at all.`)
    this.logger.warn(
      `[Scheduler] Priority 3 (System Fallback): Falling back to system default AI for role "${role}".`
    )
    try {
      return this.createFallbackProvider()
    } catch (error) {
      this.logger.error(
        `[Scheduler] CRITICAL FAILURE: System fallback AI failed to initialize.`,
        error instanceof Error ? error.stack : undefined
      )
      throw new common_1.InternalServerErrorException(
        'AI processing failed: No AI is available or configured correctly.'
      )
    }
  }
  createFallbackProvider() {
    try {
      const apiKey = this.configService.getOrThrow('FALLBACK_API_KEY')
      const modelId = this.configService.get('FALLBACK_MODEL_ID', 'deepseek-chat')
      const baseUrlFromEnv = this.configService.get('FALLBACK_BASE_URL')
      const fallbackConfig = {
        id: 'system-fallback',
        provider: 'DeepSeek',
        apiKey,
        baseUrl: baseUrlFromEnv ?? null,
        modelId,
        ownerId: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      return this.aiProviderFactory.createProvider(fallbackConfig)
    } catch (error) {
      this.logger.error(
        'System fallback AI configuration is missing or invalid. Check your .env file for FALLBACK_... variables.',
        error
      )
      throw new Error('System default AI is not configured.')
    }
  }
})
exports.DynamicAiSchedulerService = DynamicAiSchedulerService
exports.DynamicAiSchedulerService =
  DynamicAiSchedulerService =
  DynamicAiSchedulerService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [
          prisma_service_1.PrismaService,
          ai_provider_factory_1.AiProviderFactory,
          config_1.ConfigService,
        ]),
      ],
      DynamicAiSchedulerService
    )
//# sourceMappingURL=dynamic-ai-scheduler.service.js.map
