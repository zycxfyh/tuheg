import { OnModuleInit } from '@nestjs/common'
export declare class PromptManagerService implements OnModuleInit {
  private readonly logger
  private readonly promptCache
  private readonly promptsDir
  onModuleInit(): Promise<void>
  getPrompt(filename: string): string
  private loadAllPrompts
}
//# sourceMappingURL=prompt-manager.service.d.ts.map
