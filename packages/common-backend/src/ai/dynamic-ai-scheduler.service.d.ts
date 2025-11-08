import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AiProviderFactory } from './ai-provider.factory'
import type { AiProvider, AiRole } from '../types/ai-providers.types'
export declare class DynamicAiSchedulerService {
  private readonly prisma
  private readonly aiProviderFactory
  private readonly configService
  private readonly logger
  constructor(
    prisma: PrismaService,
    aiProviderFactory: AiProviderFactory,
    configService: ConfigService
  )
  getProviderForRole(user: User, role: AiRole): Promise<AiProvider>
  private createFallbackProvider
}
//# sourceMappingURL=dynamic-ai-scheduler.service.d.ts.map
