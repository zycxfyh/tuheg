import { BadRequestException } from '@nestjs/common'
export interface PromptInjectionDetails {
  score: number
  threshold: number
  preview?: string
  context?: string
  correlationId?: string
  userId?: string
}
export declare class PromptInjectionDetectedException extends BadRequestException {
  readonly details: PromptInjectionDetails
  constructor(message: string, details: PromptInjectionDetails)
}
//# sourceMappingURL=prompt-injection-detected.exception.d.ts.map
